import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Paper, Divider, Button, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, ListItemIcon
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle'; // Added
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchWidgetsApi, apiRequest } from '../../utils/api'; // Changed saveWidgetsApi to apiRequest for PUT
import AddWidgetForm from './AddWidgetForm';
import EditWidgetForm from './EditWidgetForm';

// Sortable Item Component for Widgets
function SortableWidgetListItem({ widgetObject, index, onEdit, onDelete }) {
  const widgetType = Object.keys(widgetObject)[0];
  const widgetDetails = widgetObject[widgetType] || {};
  const widgetLabel = widgetDetails.label || widgetType || 'Unknown Widget';
  // Use a stable ID for dnd-kit, widgetType should be unique if widgets are distinct types
  // If multiple widgets of the same type can exist, a more robust ID is needed (e.g., index or a generated UUID)
  // For now, assuming widgetType is sufficient as an ID for ordering.
  const id = widgetType;


  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'action.selected' : 'transparent',
    // py: 1, // Add some padding
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      {...attributes} // Spread attributes for sortable
      // Removed {...listeners} from ListItem itself to only allow drag via handle
      secondaryAction={
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
           <ListItemIcon sx={{ minWidth: 'auto', cursor: 'grab', mr: 1 }} {...listeners}> {/* Drag handle */}
            <DragHandleIcon />
          </ListItemIcon>
          <IconButton edge="end" aria-label="edit" sx={{ mr: 0.5 }} onClick={() => onEdit(index, widgetObject)}>
            <EditIcon />
          </IconButton>
          <IconButton edge="end" aria-label="delete" onClick={() => onDelete(index)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      }
      sx={{ pl: 2 }} // Keep left padding for list item content
    >
      <ListItemText
        primary={widgetLabel}
        secondary={renderWidgetDetails(widgetDetails)}
        sx={{ pr: '100px' }} // Adjust right padding to accommodate actions + handle
      />
    </ListItem>
  );
}


// Helper to display widget properties more clearly
function renderWidgetDetails(widgetDetails) { // Accept the inner details object
    // No need to exclude 'type' or 'label' anymore as they are handled outside
    // We might still want to exclude 'label' if it's present in the details object itself
    const excludedKeys = ['label'];
    const details = Object.entries(widgetDetails)
        .filter(([key]) => !excludedKeys.includes(key))
        .map(([key, value]) => {
            let displayValue = value;
            if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
            } else if (Array.isArray(value)) {
                 displayValue = value.join(', ');
            } else if (typeof value === 'boolean') {
                 displayValue = value ? 'true' : 'false'; // Display booleans nicely
            }
            return (
                <Typography component="span" variant="body2" display="block" key={key} sx={{ ml: 1 }}>
                    <strong>{key}:</strong> {String(displayValue)}
                </Typography>
            );
        });
    return details.length > 0 ? details : <Typography component="span" variant="body2" sx={{ ml: 1 }}>No specific properties configured</Typography>;
}

function WidgetListPage() {
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [widgetToEdit, setWidgetToEdit] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [widgetToDeleteIndex, setWidgetToDeleteIndex] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const sensors = useSensors( // Added sensors for dnd-kit
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadWidgets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWidgetsApi();
            setWidgets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching widgets:", err);
            setError(err.message || 'Failed to load widgets.');
            setWidgets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWidgets();
    }, [loadWidgets, refreshKey]);

    // --- Modal Handlers ---
    const handleAddWidgetClick = () => setIsAddFormOpen(true);
    const handleCloseAddForm = () => setIsAddFormOpen(false);

    const handleEditWidgetClick = (index, widgetObject) => {
        // Extract type and details from the object { type: { details } }
        const widgetType = Object.keys(widgetObject)[0];
        const widgetDetails = widgetObject[widgetType] || {};
        // Pass the extracted type and details to the edit form
        setWidgetToEdit({ index: index, type: widgetType, details: widgetDetails });
        setIsEditFormOpen(true);
    };
    const handleCloseEditForm = () => {
        setIsEditFormOpen(false);
        setWidgetToEdit(null);
    };

    // --- Delete Handlers ---
    const handleDeleteClick = (index) => {
        setWidgetToDeleteIndex(index);
        setIsDeleteDialogOpen(true);
    };
    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setWidgetToDeleteIndex(null);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (widgetToDeleteIndex === null || widgetToDeleteIndex < 0) return;
        setDeleteError(null);
        const updatedWidgets = widgets.filter((_, index) => index !== widgetToDeleteIndex);
        // Extract type from the widget object being deleted
        const widgetToDelete = widgets[widgetToDeleteIndex];
        const deletedWidgetType = widgetToDelete ? Object.keys(widgetToDelete)[0] : 'Unknown Widget'; // Ensure widgetToDelete is not null
        const deletedWidgetLabel = widgetToDelete && widgetToDelete[deletedWidgetType]?.label ? ` (${widgetToDelete[deletedWidgetType].label})` : '';

        try {
            // Using apiRequest directly for POST to /api/widgets as saveWidgetsApi is generic
            await apiRequest('/api/widgets', { method: 'POST', body: JSON.stringify(updatedWidgets) });
            setSnackbarMessage(`Widget '${deletedWidgetType}${deletedWidgetLabel}' deleted successfully.`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            handleCloseDeleteDialog();
            refreshList();
        } catch (err) {
            console.error("Error deleting widget:", err);
            setSnackbarMessage(`Failed to delete widget: ${err.message || 'Unknown error'}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            handleCloseDeleteDialog();
        }
    };

     // --- Snackbar Handler ---
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // --- Refresh Handlers ---
     const refreshList = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };
    const handleWidgetAdded = () => refreshList();
    const handleWidgetUpdated = () => refreshList();

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }

        // active.id and over.id are widget types (e.g., "datetime")
        const oldIndex = widgets.findIndex(w => Object.keys(w)[0] === active.id);
        const newIndex = widgets.findIndex(w => Object.keys(w)[0] === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            console.error("Error finding widget indices for drag and drop.");
            setSnackbarMessage('Error reordering widgets: Could not find items.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        const reorderedWidgets = arrayMove(widgets, oldIndex, newIndex);
        setWidgets(reorderedWidgets); // Optimistic update

        try {
            await apiRequest('/api/widgets/order', { method: 'PUT', body: JSON.stringify(reorderedWidgets) });
            setSnackbarMessage('Widget order saved successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (err) {
            console.error("Error saving widget order:", err);
            setSnackbarMessage(`Error saving order: ${err.message || 'Unknown error'}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            loadWidgets(); // Revert to original order from server on error
        }
    }, [widgets, loadWidgets]);


    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }

     if (!loading && widgets.length === 0 && !error) {
        return (
            // Add padding to the empty state container as well
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ mb: 2 }}>No Info Widgets configured yet.</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddWidgetClick}>
                    Add First Widget
                </Button>
                 <AddWidgetForm
                    open={isAddFormOpen}
                    onClose={handleCloseAddForm}
                    onWidgetAdded={handleWidgetAdded}
                    currentWidgets={widgets}
                 />
            </Box>
        );
    }

    return (
        // Add padding to the main container Box
        <Box sx={{ width: '100%', p: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Info Widgets
                </Typography>
                 <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddWidgetClick}>
                    Add Widget
                </Button>
            </Box>

             <Paper elevation={2} sx={{ mb: 3 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={widgets.map(w => Object.keys(w)[0])} // Use widget type as ID
                        strategy={verticalListSortingStrategy}
                    >
                        <List dense disablePadding>
                            {widgets.map((widgetObject, index) => (
                                <React.Fragment key={Object.keys(widgetObject)[0] + '-' + index}> {/* Ensure key is stable and unique */}
                                    <SortableWidgetListItem
                                        widgetObject={widgetObject}
                                        index={index}
                                        onEdit={handleEditWidgetClick}
                                        onDelete={handleDeleteClick}
                                    />
                                    {index < widgets.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </SortableContext>
                </DndContext>
            </Paper>
             <AddWidgetForm
                 open={isAddFormOpen}
                 onClose={handleCloseAddForm}
                 onWidgetAdded={handleWidgetAdded}
                 currentWidgets={widgets}
             />
             <EditWidgetForm
                 open={isEditFormOpen}
                 onClose={handleCloseEditForm}
                 onWidgetUpdated={handleWidgetUpdated}
                 widgetToEdit={widgetToEdit}
                 currentWidgets={widgets}
             />
            <Dialog
                open={isDeleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the widget "{widgets[widgetToDeleteIndex]?.type || 'this widget'}"? This action cannot be undone.
                    </DialogContentText>
                    {deleteError && (
                        <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default WidgetListPage;