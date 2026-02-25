import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Container, Typography, List, ListItem, ListItemText, Paper, Box, CircularProgress, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Chip } from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import { fetchSettingsApi, saveSettingsApi, renameGroupApi, deleteGroupApi, fetchBookmarksApi, fetchServicesApi, saveBookmarkGroupsOrderApi, saveServiceGroupsOrderApi } from '../../utils/api';
import ConfirmationDialog from '../ConfirmationDialog';

const SERVICE_COLOR = '#2196f3';
const BOOKMARK_COLOR = '#ff9800';

function SortableItem({ id, name, groupType, onRenameClick, onDeleteClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const borderColor = groupType === 'service' ? SERVICE_COLOR : groupType === 'bookmark' ? BOOKMARK_COLOR : 'transparent';
  const chipLabel = groupType === 'service' ? 'Service' : groupType === 'bookmark' ? 'Bookmark' : 'Layout';
  const chipColor = groupType === 'service' ? SERVICE_COLOR : groupType === 'bookmark' ? BOOKMARK_COLOR : '#9e9e9e';

  const sxStyles = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 'auto',
    marginBottom: '8px',
    backgroundColor: (theme) => theme.palette.background.paper,
    color: (theme) => theme.palette.text.primary,
    borderLeft: `4px solid ${borderColor}`,
  };

  return (
    <Paper ref={setNodeRef} sx={sxStyles} elevation={isDragging ? 4 : 1} {...attributes} >
       <ListItem>
         <IconButton {...listeners} aria-label="drag handle" sx={{ cursor: 'grab', mr: 1, color: 'text.secondary' }}>
            <DragHandleIcon />
         </IconButton>
         <ListItemText primary={name} sx={{ flexGrow: 1 }} />
         <Chip
           label={chipLabel}
           size="small"
           sx={{
             backgroundColor: chipColor,
             color: '#fff',
             fontWeight: 500,
             mr: 1,
           }}
         />
         <IconButton
           aria-label="rename group"
           onClick={() => onRenameClick(id)}
           sx={{ ml: 1, color: 'text.secondary' }}
         >
           <EditIcon />
         </IconButton>
         <IconButton
           aria-label="delete group"
           onClick={() => onDeleteClick(id)}
           sx={{ ml: 1, color: 'error.main' }}
         >
           <DeleteIcon />
         </IconButton>
       </ListItem>
    </Paper>
  );
}


function GroupLayoutPage() {
  const [layoutGroups, setLayoutGroups] = useState([]);
  const [serviceGroupNames, setServiceGroupNames] = useState(new Set());
  const [bookmarkGroupNamesState, setBookmarkGroupNamesState] = useState(new Set());
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsDataResponse, bookmarksData, servicesData] = await Promise.all([
        fetchSettingsApi(),
        fetchBookmarksApi(),
        fetchServicesApi()
      ]);

      const currentSettings = settingsDataResponse?.settings || {};
      let layoutFromSettings = Array.isArray(currentSettings.layout) ? [...currentSettings.layout] : [];

      const localServiceGroupNames = new Set();
      if (Array.isArray(servicesData)) {
        servicesData.forEach(groupObj => {
          if (typeof groupObj === 'object' && groupObj !== null) {
            const groupName = Object.keys(groupObj)[0];
            if (groupName) localServiceGroupNames.add(groupName);
          }
        });
      }
      setServiceGroupNames(localServiceGroupNames);

      const localBookmarkGroupNames = new Set();
      if (Array.isArray(bookmarksData)) {
        bookmarksData.forEach(groupObj => {
          if (typeof groupObj === 'object' && groupObj !== null) {
            const groupName = Object.keys(groupObj)[0];
            if (groupName) localBookmarkGroupNames.add(groupName);
          }
        });
      }
      setBookmarkGroupNamesState(localBookmarkGroupNames);

      // Add groups from services/bookmarks that aren't yet in settings layout
      const existingLayoutGroupNames = new Set(layoutFromSettings.map(g => g.name));
      const allKnownGroupNames = new Set([...localServiceGroupNames, ...localBookmarkGroupNames]);

      allKnownGroupNames.forEach(knownGroupName => {
        if (!existingLayoutGroupNames.has(knownGroupName)) {
          layoutFromSettings.push({
            name: knownGroupName,
            header: true,
            style: "row",
            columns: 4
          });
        }
      });

      setLayoutGroups(layoutFromSettings);
      const updatedSettingsForState = { ...currentSettings, layout: layoutFromSettings };
      setSettings(updatedSettingsForState);

    } catch (err) {
      console.error("Failed to fetch settings or bookmarks for layout:", err);
      setError('Failed to load group layout. Please try again.');
      enqueueSnackbar('Failed to load group layout', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  // Determine the type of a group by name
  const getGroupType = useCallback((groupName) => {
    if (serviceGroupNames.has(groupName)) return 'service';
    if (bookmarkGroupNamesState.has(groupName)) return 'bookmark';
    return 'layout-only';
  }, [serviceGroupNames, bookmarkGroupNamesState]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = layoutGroups.findIndex((group) => group.name === active.id);
      const newIndex = layoutGroups.findIndex((group) => group.name === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(layoutGroups, oldIndex, newIndex);
        setLayoutGroups(newOrder);

        const { layout: _, ...otherSettings } = settings || {};
        const updatedSettings = {
          ...otherSettings,
          layout: newOrder,
        };

        try {
          // Save layout order to settings.yaml
          await saveSettingsApi(updatedSettings);
          setSettings(prevSettings => ({
              ...(prevSettings || {}),
              ...otherSettings,
              layout: newOrder
          }));
          enqueueSnackbar('Group order saved to settings.yaml', { variant: 'success' });

          // Save bookmark group order to bookmarks.yaml
          const orderedBookmarkGroupNames = newOrder
            .filter(group => bookmarkGroupNamesState.has(group.name))
            .map(group => group.name);

          if (orderedBookmarkGroupNames.length > 0) {
            await saveBookmarkGroupsOrderApi(orderedBookmarkGroupNames);
          }

          // Save service group order to services.yaml
          const orderedServiceGroupNames = newOrder
            .filter(group => serviceGroupNames.has(group.name))
            .map(group => group.name);

          if (orderedServiceGroupNames.length > 0) {
            await saveServiceGroupsOrderApi(orderedServiceGroupNames);
          }

          enqueueSnackbar('All config files synced successfully!', { variant: 'success' });

        } catch (saveError) {
          console.error("Failed to save group order:", saveError);
          const userMessage = 'Failed to save the new group order. Reverting.';
          setError(userMessage);
          enqueueSnackbar('Failed to save group order', { variant: 'error' });
          fetchLayout();
        }
      }
    }
  }, [layoutGroups, settings, serviceGroupNames, bookmarkGroupNamesState, enqueueSnackbar, fetchLayout]);

  const handleRenameClick = (groupName) => {
    setGroupToRename(groupName);
    setNewGroupName(groupName);
    setRenameDialogOpen(true);
  };

  const handleRenameClose = () => {
    setRenameDialogOpen(false);
    setGroupToRename(null);
    setNewGroupName('');
    setRenameLoading(false);
  };

  const handleRenameSubmit = async () => {
    if (!newGroupName || newGroupName.trim() === '' || newGroupName === groupToRename) {
      enqueueSnackbar('Please enter a valid and different new group name.', { variant: 'warning' });
      return;
    }
    setRenameLoading(true);
    setError(null);

    try {
      await renameGroupApi(groupToRename, newGroupName.trim());
      enqueueSnackbar(`Group "${groupToRename}" renamed to "${newGroupName.trim()}" successfully!`, { variant: 'success' });
      handleRenameClose();
      await fetchLayout();
    } catch (renameError) {
      console.error("Failed to rename group:", renameError);
      const errorMsg = renameError?.data?.error || renameError?.message || 'Failed to rename group.';
      setError(`Rename failed: ${errorMsg}`);
      enqueueSnackbar(`Rename failed: ${errorMsg}`, { variant: 'error' });
      setRenameLoading(false);
    }
  };

  const handleDeleteClick = (groupName) => {
    setGroupToDelete(groupName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
    setDeleteLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteGroupApi(groupToDelete);
      enqueueSnackbar(`Group "${groupToDelete}" deleted successfully!`, { variant: 'success' });
      handleDeleteCancel();
      await fetchLayout();
    } catch (deleteError) {
      console.error("Failed to delete group:", deleteError);
      const errorMsg = deleteError?.data?.error || deleteError?.message || 'Failed to delete group.';
      setError(`Delete failed: ${errorMsg}`);
      enqueueSnackbar(`Delete failed: ${errorMsg}`, { variant: 'error' });
      setDeleteLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Reorder Groups in Settings
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 1 }}>
        Drag and drop the groups below to change their display order on the homepage. Changes are saved automatically to settings.yaml, services.yaml, and bookmarks.yaml.
      </Typography>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: SERVICE_COLOR, borderRadius: '2px' }} />
          <Typography variant="body2" color="text.secondary">Service Group</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: BOOKMARK_COLOR, borderRadius: '2px' }} />
          <Typography variant="body2" color="text.secondary">Bookmark Group</Typography>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <SortableContext
              items={layoutGroups.map(group => group.name)}
              strategy={verticalListSortingStrategy}
            >
              <List>
                {layoutGroups.map((group) => (
                  typeof group.name === 'string' ? (
                    <SortableItem
                      key={group.name}
                      id={group.name}
                      name={group.name}
                      groupType={getGroupType(group.name)}
                      onRenameClick={handleRenameClick}
                      onDeleteClick={handleDeleteClick}
                    />
                  ) : null
                ))}
              </List>
            </SortableContext>
          </Box>
        </DndContext>
      )}
      {!loading && !error && layoutGroups.length === 0 && (
        <Typography sx={{ mt: 2 }}>No layout groups found in settings.yaml or the layout section is empty/invalid.</Typography>
      )}

     <Dialog open={renameDialogOpen} onClose={handleRenameClose} aria-labelledby="rename-group-dialog-title">
       <DialogTitle id="rename-group-dialog-title">Rename Group "{groupToRename}"</DialogTitle>
       <DialogContent>
         <TextField
           autoFocus
           margin="dense"
           id="newGroupName"
           label="New Group Name"
           type="text"
           fullWidth
           variant="standard"
           value={newGroupName}
           onChange={(e) => setNewGroupName(e.target.value)}
           disabled={renameLoading}
         />
       </DialogContent>
       <DialogActions>
         <Button onClick={handleRenameClose} disabled={renameLoading}>Cancel</Button>
         <Button onClick={handleRenameSubmit} disabled={renameLoading}>
           {renameLoading ? <CircularProgress size={24} /> : 'Rename'}
         </Button>
       </DialogActions>
     </Dialog>

     <ConfirmationDialog
       open={deleteDialogOpen}
       onClose={handleDeleteCancel}
       onConfirm={handleDeleteConfirm}
       title="Confirm Group Deletion"
       contentText={`Are you sure you want to delete the group "${groupToDelete}"? This will remove the group layout settings from settings.yaml. Any services or bookmarks within this group will be moved to an "Uncategorized" group in their respective files.`}
       confirmText={deleteLoading ? <CircularProgress size={24} /> : "Delete"}
       cancelText="Cancel"
       confirmButtonProps={{ color: 'error', disabled: deleteLoading }}
       cancelButtonProps={{ disabled: deleteLoading }}
     />

    </Container>
  );
}

export default GroupLayoutPage;
