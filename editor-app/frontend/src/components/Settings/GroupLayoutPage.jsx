import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Container, Typography, List, ListItem, ListItemText, Paper, Box, CircularProgress, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import { fetchSettingsApi, saveSettingsApi, renameGroupApi, deleteGroupApi, fetchBookmarksApi, fetchServicesApi, saveBookmarkGroupsOrderApi } from '../../utils/api';
import ConfirmationDialog from '../ConfirmationDialog';

// Sortable Item Component
function SortableItem({ id, name, onRenameClick, onDeleteClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const sxStyles = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 'auto',
    marginBottom: '8px',
    backgroundColor: (theme) => theme.palette.background.paper,
    color: (theme) => theme.palette.text.primary,
  };

  return (
    <Paper ref={setNodeRef} sx={sxStyles} elevation={isDragging ? 4 : 1} {...attributes} >
       <ListItem>
         <IconButton {...listeners} aria-label="drag handle" sx={{ cursor: 'grab', mr: 1, color: 'text.secondary' }}>
            <DragHandleIcon />
         </IconButton>
         <ListItemText primary={name} sx={{ flexGrow: 1 }} />
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
  const [layoutGroups, setLayoutGroups] = useState([]); // This will remain the single source of truth for DND order
  const [serviceGroupNames, setServiceGroupNames] = useState(new Set()); // To identify service groups
  const [bookmarkGroupNamesState, setBookmarkGroupNamesState] = useState(new Set()); // To identify bookmark groups
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

      console.log("GroupLayoutPage - Fetched settingsDataResponse:", JSON.stringify(settingsDataResponse, null, 2));
      console.log("GroupLayoutPage - Fetched bookmarksData:", JSON.stringify(bookmarksData, null, 2));
      console.log("GroupLayoutPage - Fetched servicesData:", JSON.stringify(servicesData, null, 2));

      const currentSettings = settingsDataResponse?.settings || {};
      let layoutFromSettings = Array.isArray(currentSettings.layout) ? [...currentSettings.layout] : [];
      console.log("GroupLayoutPage - Initial layoutFromSettings:", JSON.stringify(layoutFromSettings, null, 2));

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
      console.log("GroupLayoutPage - Extracted serviceGroupNames:", Array.from(localServiceGroupNames));

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
      console.log("GroupLayoutPage - Extracted bookmarkGroupNamesState:", Array.from(localBookmarkGroupNames));
      
      const existingLayoutGroupNames = new Set(layoutFromSettings.map(g => g.name));
      console.log("GroupLayoutPage - Existing layout group names from settings:", Array.from(existingLayoutGroupNames));
      
      const allKnownGroupNames = new Set([...localServiceGroupNames, ...localBookmarkGroupNames]);

      allKnownGroupNames.forEach(knownGroupName => {
        if (!existingLayoutGroupNames.has(knownGroupName)) {
          layoutFromSettings.push({
            name: knownGroupName,
            header: true,
            style: "row",
            columns: 4
          });
          console.log(`GroupLayoutPage - Added default layout for new group: ${knownGroupName}`);
        }
      });
      
      // Optional: Filter layoutFromSettings to only include groups that currently exist in services or bookmarks
      // layoutFromSettings = layoutFromSettings.filter(lg => allKnownGroupNames.has(lg.name));
      // console.log("GroupLayoutPage - Layout after filtering non-existent groups:", JSON.stringify(layoutFromSettings, null, 2));


      setLayoutGroups(layoutFromSettings);
      const updatedSettingsForState = { ...currentSettings, layout: layoutFromSettings };
      setSettings(updatedSettingsForState);
      console.log("GroupLayoutPage - Final layoutGroups state set:", JSON.stringify(layoutFromSettings, null, 2));
      console.log("GroupLayoutPage - Final settings state set:", JSON.stringify(updatedSettingsForState, null, 2));

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
        console.log("Constructed updatedSettings for saving:", updatedSettings); 

        try {
          console.log("Attempting to save new layout order (array) to settings.yaml:", newOrder);
          await saveSettingsApi(updatedSettings);
          setSettings(prevSettings => ({
              ...(prevSettings || {}),
              ...otherSettings,
              layout: newOrder
          }));
          enqueueSnackbar('Group order saved to settings.yaml successfully!', { variant: 'success' });

          // Now, also save the order of bookmark groups to bookmarks.yaml
          const orderedBookmarkGroupNames = newOrder
            .filter(group => bookmarkGroupNamesState.has(group.name))
            .map(group => group.name);

          if (orderedBookmarkGroupNames.length > 0) {
            console.log("Attempting to save bookmark groups order to bookmarks.yaml:", orderedBookmarkGroupNames);
            await saveBookmarkGroupsOrderApi(orderedBookmarkGroupNames);
            enqueueSnackbar('Bookmark group order saved to bookmarks.yaml successfully!', { variant: 'success' });
          }

        } catch (saveError) {
          console.error("Failed to save settings or bookmark group order:", saveError);
          let userMessage = 'Failed to save the new group order. Reverting local changes.';
          if (saveError.message.includes('bookmarks.yaml')) {
            userMessage = 'Failed to save bookmark group order to bookmarks.yaml. Settings order might be saved. Reverting local changes.';
          } else if (saveError.message.includes('settings.yaml')) {
             userMessage = 'Failed to save group order to settings.yaml. Reverting local changes.';
          }
          setError(userMessage);
          enqueueSnackbar(userMessage.replace(' Reverting local changes.', ''), { variant: 'error' });
          fetchLayout(); // Revert UI to last known good state
        }
      } else {
         console.warn("Drag end event had invalid indices:", { activeId: active.id, overId: over.id, oldIndex, newIndex });
      }
    }
  }, [layoutGroups, settings, enqueueSnackbar, fetchLayout]);

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
    <Container maxWidth="lg"> {/* Changed maxWidth to lg for wider layout */}
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Reorder Groups in Settings
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Drag and drop the groups below to change their display order on the homepage. Changes are saved automatically.
      </Typography>

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
          {/* Changed Box to a two-column grid for medium screens and up */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* 
              For now, all groups will render in the first column due to the single SortableContext and List.
              To truly split into two columns for DND, we'd need two separate SortableContexts 
              and logic to divide layoutGroups into two arrays (e.g., serviceGroups, bookmarkGroups)
              and then render them into separate Paper components within this grid.
              This change just sets up the grid structure.
            */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Service Groups</Typography>
              <SortableContext
                items={layoutGroups.filter(g => serviceGroupNames.has(g.name)).map(group => group.name)}
                strategy={verticalListSortingStrategy}
              >
                <List>
                  {layoutGroups
                    .filter(group => serviceGroupNames.has(group.name))
                    .map((group) => (
                    typeof group.name === 'string' ? (
                       <SortableItem
                         key={group.name}
                         id={group.name}
                         name={group.name}
                         onRenameClick={handleRenameClick}
                         onDeleteClick={handleDeleteClick}
                       />
                    ) : (
                       console.warn("Skipping service group with invalid name:", group),
                       null
                    )
                  ))}
                </List>
              </SortableContext>
            </Paper>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Bookmark Groups</Typography>
              <SortableContext
                items={layoutGroups.filter(g => bookmarkGroupNamesState.has(g.name) && !serviceGroupNames.has(g.name)).map(group => group.name)}
                strategy={verticalListSortingStrategy}
              >
                <List>
                  {layoutGroups
                    .filter(group => bookmarkGroupNamesState.has(group.name) && !serviceGroupNames.has(group.name)) // Show only if NOT already in service groups
                    .map((group) => (
                    typeof group.name === 'string' ? (
                       <SortableItem
                         key={group.name}
                         id={group.name}
                         name={group.name}
                         onRenameClick={handleRenameClick}
                         onDeleteClick={handleDeleteClick}
                       />
                    ) : (
                       console.warn("Skipping bookmark group with invalid name:", group),
                       null
                    )
                  ))}
                </List>
              </SortableContext>
            </Paper>
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