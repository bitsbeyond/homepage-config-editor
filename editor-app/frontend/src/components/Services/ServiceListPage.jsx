import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Paper, Divider, Button, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Chip, ListItemIcon } from '@mui/material'; // Added ListItemIcon
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle'; // Added for DND
import WidgetIcon from '@mui/icons-material/Widgets';
import { fetchServicesApi, saveServicesApi, saveServiceGroupOrderApi } from '../../utils/api'; // Added saveServiceGroupOrderApi
import AddServiceForm from './AddServiceForm';
import EditServiceForm from './EditServiceForm';
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


// Helper function to transform API data into a more usable format for DND
// Input: [{ "Group Name": [ { "Item 1": {...} }, { "Item 2": {...} } ] }, ...]
// Output: { "Group Name": [ { id: "unique-id-Item 1", name: "Item 1", originalData: { "Item 1": {...} } }, ... ] }
const transformDataForDnd = (data, groupNamePrefix = '') => {
    const structuredData = {};
    if (!Array.isArray(data)) return structuredData;

    data.forEach(groupObject => {
        if (typeof groupObject !== 'object' || groupObject === null) return;
        const groupName = Object.keys(groupObject)[0];
        if (!groupName) return;

        const items = groupObject[groupName];
        if (!Array.isArray(items)) return;

        structuredData[groupName] = items.map((itemObject, index) => {
            if (typeof itemObject !== 'object' || itemObject === null) return null;
            const itemName = Object.keys(itemObject)[0];
            if (!itemName) return null;
            
            // Ensure unique ID across all groups if groupNamePrefix is used, or at least within a group
            const itemId = `${groupNamePrefix}${groupName}-${itemName}-${index}`;

            return {
                id: itemId, // Unique ID for dnd-kit
                name: itemName, // The actual item name
                originalData: itemObject, // Keep the original structure for saving
                details: itemObject[itemName], // Keep details for rendering
            };
        }).filter(item => item !== null);
    });
    return structuredData;
};


// --- Sortable Service Item Component ---
import ServiceIcon from './ServiceIcon'; // Import the new ServiceIcon component

function SortableServiceItem({ id, name, details, groupName, onEdit, onDelete }) {
  const {
    attributes,
    listeners, // listeners for the drag handle
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    backgroundColor: isDragging ? 'action.selected' : 'transparent',
  };

  return (
    <ListItem
        ref={setNodeRef}
        style={style}
        {...attributes} // Spread attributes for sortable item
        disablePadding
        secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon sx={{ minWidth: 'auto', cursor: 'grab', mr: 0.5 }} {...listeners}> {/* Drag handle listeners here */}
                    <DragHandleIcon />
                </ListItemIcon>
                <IconButton edge={false} aria-label="edit" sx={{ p: 1 }} onClick={() => onEdit(groupName, name, details)}>
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton edge={false} aria-label="delete" sx={{ p: 1 }} onClick={() => onDelete(groupName, name)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        }
        sx={{ display: 'flex', alignItems: 'center', pl: 1, pr: '120px' }} // Ensure flex display for icon alignment
    >
        <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, display: 'flex', alignItems: 'center' }}> {/* Container for the icon */}
          <ServiceIcon iconName={details?.icon} serviceName={name} size={28} />
        </ListItemIcon>
        <ListItemText
            primary={name}
            secondary={
                <>
                    <Typography component="span" variant="body2" color="text.primary" sx={{ mr: 0.5, display: 'inline' }}>
                        {details.href || 'No URL'}
                    </Typography>
                    {details.description &&
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'inline' }}>
                            {` — ${details.description}`}
                        </Typography>
                    }
                    {details.widget && details.widget.type && (
                        <Chip
                            label={`Widget: ${details.widget.type}`}
                            size="small"
                            variant="outlined"
                            icon={<WidgetIcon fontSize="small" />}
                            sx={{ ml: 0.5, verticalAlign: 'middle' }}
                        />
                    )}
                </>
            }
            primaryTypographyProps={{ noWrap: true }}
            secondaryTypographyProps={{
                component: 'div', // Allow multiple spans within secondary
                noWrap: true,
                sx: { overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.5 } // Add a little margin-top if needed
            }}
            // sx={{ flexGrow: 1, minWidth: 0, mr: 1 }} // ListItemText will grow by default
        />
    </ListItem>
  );
}


function ServiceListPage() {
    const [serviceGroupsData, setServiceGroupsData] = useState({}); // Changed to object for DND
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false); // State for modal visibility
    const [refreshKey, setRefreshKey] = useState(0); // State to trigger refresh
    const [isEditFormOpen, setIsEditFormOpen] = useState(false); // State for edit modal
    const [serviceToEdit, setServiceToEdit] = useState(null); // State for service being edited
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
    const [serviceToDelete, setServiceToDelete] = useState(null); // State for service targeted for deletion { groupName, serviceName }
    const [deleteError, setDeleteError] = useState(null); // State for delete operation errors
    const [snackbarOpen, setSnackbarOpen] = useState(false); // State for success/error messages
    const [snackbarMessage, setSnackbarMessage] = useState(''); // Message for snackbar
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' or 'error'
    // Function to load services, wrapped in useCallback if needed elsewhere, but fine here for useEffect
    const loadServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchServicesApi();
            // Transform data for DND, ensuring unique IDs if items could have same name across groups
            // For ServiceListPage, we'll manage groups separately, so prefix isn't strictly needed here
            // but the transformDataForDnd function expects the raw array of groups.
            setServiceGroupsData(transformDataForDnd(data));
        } catch (err) {
            console.error("Error fetching services:", err);
            setError(err.message || 'Failed to load services.');
            setServiceGroupsData({}); // Set empty on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadServices();
    }, [loadServices, refreshKey]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback(async (event) => {
        const { active, over, collisions } = event;

        if (!over || active.id === over.id) {
            return; // No movement or dropped on itself
        }
        
        // Determine the group the item belongs to and was dragged within
        // The active.id and over.id are unique item IDs like "GroupName-ItemName-Index"
        const activeIdParts = active.id.split('-');
        const overIdParts = over.id.split('-');

        // Infer group name from the ID structure. This assumes group names don't contain '-'.
        // A more robust way might be to store group context with the draggable item or find it via collisions.
        // For now, let's assume the first part of the ID (before the first dash if multiple) is the group name.
        // Example: "My Group-Service A-0" -> groupName = "My Group"
        // Example: "Ungrouped-Service B-1" -> groupName = "Ungrouped"
        
        let activeGroupName = null;
        let overGroupName = null;

        // Find the group for the active item
        for (const groupKey in serviceGroupsData) {
            if (serviceGroupsData[groupKey].some(item => item.id === active.id)) {
                activeGroupName = groupKey;
                break;
            }
        }
        // Find the group for the over item
        for (const groupKey in serviceGroupsData) {
            if (serviceGroupsData[groupKey].some(item => item.id === over.id)) {
                overGroupName = groupKey;
                break;
            }
        }

        if (!activeGroupName || !overGroupName || activeGroupName !== overGroupName) {
            // console.warn("Item dragged outside its group or group not found. Active Group:", activeGroupName, "Over Group:", overGroupName);
            // For now, we only allow reordering within the same group.
            // If you want to allow dragging between groups, this logic needs to be more complex.
            // For this task, we restrict to same-group reordering.
            // Check if the 'over' element is a droppable group container if implementing cross-group DND.
            // For now, if groups don't match, it's an invalid drop for reordering *items*.
            setSnackbarMessage('Services can only be reordered within the same group.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }
        
        const groupName = activeGroupName; // Since they must be the same
        const currentItemsInGroup = serviceGroupsData[groupName];

        const oldIndex = currentItemsInGroup.findIndex((item) => item.id === active.id);
        const newIndex = currentItemsInGroup.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            console.error("Could not find dragged item indices in group:", groupName);
            setSnackbarMessage('Error reordering service: Item not found.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        const reorderedItemsInGroup = arrayMove(currentItemsInGroup, oldIndex, newIndex);

        // Optimistically update the UI state for that specific group
        setServiceGroupsData(prevData => ({
            ...prevData,
            [groupName]: reorderedItemsInGroup,
        }));

        // Prepare data for API (use originalData)
        const itemsToSave = reorderedItemsInGroup.map(item => item.originalData);

        try {
            await saveServiceGroupOrderApi(groupName, itemsToSave);
            setSnackbarMessage(`Order saved for group "${groupName}"`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (err) {
            console.error(`Error saving order for group ${groupName}:`, err);
            setSnackbarMessage(`Error saving order: ${err.message || 'Unknown error'}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            // Revert UI state on error by reloading
            loadServices();
        }
    }, [serviceGroupsData, loadServices]); // Added dependencies

    // --- Modal Handlers ---
    const handleAddServiceClick = () => {
        setIsAddFormOpen(true);
    };

    const handleCloseAddForm = () => {
        setIsAddFormOpen(false);
    };

    const handleEditServiceClick = (groupName, serviceName, serviceDetails) => {
        setServiceToEdit({ group: groupName, name: serviceName, details: serviceDetails });
        setIsEditFormOpen(true);
    };

    const handleCloseEditForm = () => {
        setIsEditFormOpen(false);
        setServiceToEdit(null); // Clear the service being edited
    };

    // --- Delete Handlers ---
    const handleDeleteClick = (groupName, serviceName) => {
        setServiceToDelete({ groupName, serviceName });
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setServiceToDelete(null); // Clear target on close
        setDeleteError(null); // Clear previous delete errors
    };

    const handleConfirmDelete = async () => {
        if (!serviceToDelete) return;

        setDeleteError(null); // Clear previous errors
        const { groupName, serviceName } = serviceToDelete;

        // Create a deep copy to avoid mutating state directly
        const updatedGroups = JSON.parse(JSON.stringify(Object.values(serviceGroupsData).flatMap(groupItems => {
            // This reconstructs the original array of group objects format if needed by saveServicesApi
            // For delete, we need to find the group by name from the original structure.
            // Let's find the group from the current serviceGroupsData (which is an object)
            const groupObject = {};
            // Find the group that contains the serviceToDelete.groupName
            // This part is tricky because serviceGroupsData is { groupName: [items] }
            // and serviceGroups (original) was [ {groupName: [items]} ]
            // For deletion, we need to reconstruct the original array format to send to saveServicesApi
            // This might be simpler if saveServicesApi could take the object format or if we fetch fresh before delete.
            // For now, let's assume we need to reconstruct.
            // This reconstruction is complex here. Let's simplify: fetch fresh data or adapt saveServicesApi.
            // For now, we'll operate on a copy of the *original* array structure if we had it.
            // Since we switched serviceGroups to serviceGroupsData (object), this delete logic needs adjustment.

            // Let's try to rebuild the array of group objects for saving
            const allGroupsArray = [];
            for (const [key, value] of Object.entries(serviceGroupsData)) {
                allGroupsArray.push({ [key]: value.map(v => v.originalData) });
            }
            return allGroupsArray;
        }).flat())); // This is not quite right for deletion logic below.

        // The delete logic needs to operate on the serviceGroupsData (object map)
        // and then convert back to array of objects for saving.

        const currentServiceGroupsObject = JSON.parse(JSON.stringify(serviceGroupsData));

        // Find the group index
        if (!currentServiceGroupsObject[groupName]) {
            console.error("Group not found for deletion:", groupName);
            setDeleteError("Group not found. Cannot delete service.");
            // setSnackbar...
            setIsDeleteDialogOpen(false);
            setServiceToDelete(null);
            return;
        }

        // Filter out the service to be deleted from the specific group
        const groupItems = currentServiceGroupsObject[groupName];
        const updatedGroupItems = groupItems.filter(item => item.name !== serviceName);

        if (updatedGroupItems.length === 0) {
            // If group becomes empty, remove the group key from the object
            delete currentServiceGroupsObject[groupName];
        } else {
            // Otherwise, update the items in the group
            currentServiceGroupsObject[groupName] = updatedGroupItems;
        }

        // Convert the modified object back to an array of group objects for the API
        const finalDataToSave = Object.entries(currentServiceGroupsObject).map(([key, value]) => ({
            [key]: value.map(item => item.originalData) // Use originalData for saving
        }));

        try {
            // Call the API to save the updated configuration
            await saveServicesApi(finalDataToSave);
            setSnackbarMessage(`Service '${serviceName}' deleted successfully.`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            handleCloseDeleteDialog(); // Close dialog on success
            refreshList(); // Refresh the list to show changes
        } catch (err) {
            console.error("Error deleting service:", err);
            setSnackbarMessage(`Failed to delete service: ${err.message || 'Unknown error'}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            // Keep dialog open on error? Or close? Closing for now.
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

    const handleServiceAdded = () => refreshList();
    const handleServiceUpdated = () => refreshList();


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

    // Check if serviceGroupsData is empty
    if (!loading && Object.keys(serviceGroupsData).length === 0 && !error) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography sx={{ mb: 2 }}>No services configured yet.</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddServiceClick}>
                    Add First Service
                </Button>
                <AddServiceForm
                    open={isAddFormOpen}
                    onClose={handleCloseAddForm}
                    onServiceAdded={handleServiceAdded}
                    // Pass the object format if AddServiceForm can handle it, or convert back to array
                    // For now, assuming AddServiceForm might expect the array of groups.
                    // This needs to be consistent. Let's assume AddServiceForm is adapted or expects the object.
                    currentServiceGroupsData={serviceGroupsData} // Pass the object
                />
            </Box>
        );
    }

    return (
        // Add padding to the main container Box
        <Box sx={{ width: '100%', p: 3 }}> {/* Added p: 3 for padding */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Services
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddServiceClick}>
                    Add Service
                </Button>
            </Box>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {Object.entries(serviceGroupsData).map(([groupName, servicesInGroup]) => {
                    // servicesInGroup is now an array of { id, name, originalData, details }

                    if (!servicesInGroup || servicesInGroup.length === 0) {
                        return null; // Skip rendering empty groups if they somehow occur
                    }

                    return (
                        <Paper elevation={2} sx={{ mb: 3 }} key={groupName}>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6" component="h2">
                                    {groupName || 'Ungrouped'}
                                </Typography>
                            </Box>
                            <SortableContext items={servicesInGroup.map(item => item.id)} strategy={verticalListSortingStrategy}>
                                <List dense disablePadding>
                                    {servicesInGroup.map((service, serviceIndex) => (
                                        <React.Fragment key={service.id}>
                                            <SortableServiceItem
                                                id={service.id}
                                                name={service.name}
                                                details={service.details}
                                                groupName={groupName}
                                                onEdit={handleEditServiceClick}
                                                onDelete={handleDeleteClick}
                                            />
                                            {serviceIndex < servicesInGroup.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </SortableContext>
                        </Paper>
                    );
                })}
            </DndContext>

            {/* Render the Add Service Form Modal */}
            <AddServiceForm
                open={isAddFormOpen}
                onClose={handleCloseAddForm}
                onServiceAdded={handleServiceAdded}
                currentServiceGroupsData={serviceGroupsData} // Pass the object map
            />
        {/* Render the Edit Service Form Modal */}
        <EditServiceForm
            open={isEditFormOpen}
            onClose={handleCloseEditForm}
            onServiceUpdated={handleServiceUpdated}
            serviceToEdit={serviceToEdit}
            currentServiceGroupsData={serviceGroupsData} // Pass the object map
            />

        {/* Delete Confirmation Dialog */}
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
                    Are you sure you want to delete the service "{serviceToDelete?.serviceName}" from group "{serviceToDelete?.groupName}"? This action cannot be undone.
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

         {/* Snackbar for feedback */}
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

export default ServiceListPage;