import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    CircularProgress,
    Snackbar,
    Alert,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper,
    Divider,
    Grid,
    ListItemIcon,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchBookmarksApi, saveBookmarksApi, saveBookmarkGroupOrderApi } from '../../utils/api';
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
import AddBookmarkGroupDialog from './AddBookmarkGroupDialog';
import AddBookmarkDialog from './AddBookmarkDialog';
import EditBookmarkDialog from './EditBookmarkDialog';
import EditBookmarkGroupDialog from './EditBookmarkGroupDialog';
import ConfirmationDialog from '../ConfirmationDialog';
import ServiceIcon from '../Services/ServiceIcon'; // Import ServiceIcon

// Helper function to transform API data into a more usable format for DND
const transformDataForDnd = (data) => {
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
            
            const itemId = `${groupName}-${itemName}-${index}`; 

            let itemDetails = itemObject[itemName];
            // Homepage stores bookmark details in an array, even if single.
            if (Array.isArray(itemDetails) && itemDetails.length > 0 && typeof itemDetails[0] === 'object') {
                itemDetails = itemDetails[0]; 
            } else if (typeof itemDetails !== 'object' || itemDetails === null) { // If not an array or not an object after potential unwrap
                console.warn(`Bookmark '${itemName}' in group '${groupName}' has unexpected details structure:`, itemObject[itemName]);
                itemDetails = { href: 'Error: Invalid data' };
            }


            return {
                id: itemId,
                name: itemName,
                originalData: itemObject, 
                details: itemDetails,    
            };
        }).filter(item => item !== null);
    });
    return structuredData;
};

// --- Sortable Bookmark Item Component ---
function SortableBookmarkItem({ id, name, details, groupName, onEditClick, onDeleteClick }) {
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
    opacity: isDragging ? 0.7 : 1,
    backgroundColor: isDragging ? 'action.selected' : 'transparent',
  };

  return (
    <ListItem
        ref={setNodeRef}
        style={style}
        {...attributes}
        disablePadding
        secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ListItemIcon sx={{ minWidth: 'auto', cursor: 'grab', mr: 0.5 }} {...listeners}>
                    <DragHandleIcon />
                </ListItemIcon>
                <IconButton 
                    edge={false} 
                    aria-label="edit bookmark" 
                    sx={{ p: 1 }} 
                    onClick={() => onEditClick(groupName, name, details)}
                    title="Edit Bookmark"
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                    edge={false} 
                    aria-label="delete bookmark" 
                    sx={{ p: 1 }} 
                    onClick={() => onDeleteClick(groupName, name)}
                    title="Delete Bookmark"
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        }
        sx={{ display: 'flex', alignItems: 'center', pl: 1, pr: '120px' }}
    >
        <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, display: 'flex', alignItems: 'center' }}>
            <ServiceIcon iconName={details?.icon} serviceName={name || details?.abbr} size={28} />
        </ListItemIcon>
        <ListItemText
            primary={name}
            secondary={details?.href || 'No URL'}
            primaryTypographyProps={{ sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
            secondaryTypographyProps={{ sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
        />
    </ListItem>
  );
}

function BookmarkListPage() {
    const [bookmarkGroupsData, setBookmarkGroupsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
    const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
    const [isEditBookmarkDialogOpen, setIsEditBookmarkDialogOpen] = useState(false);
    const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [isConfirmDeleteGroupDialogOpen, setIsConfirmDeleteGroupDialogOpen] = useState(false);
    const [currentEditingGroupName, setCurrentEditingGroupName] = useState(null);
    const [bookmarkToDelete, setBookmarkToDelete] = useState(null); 
    const [bookmarkToEdit, setBookmarkToEdit] = useState(null); 
    const [groupToEdit, setGroupToEdit] = useState(null); 
    const [groupToDelete, setGroupToDelete] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadBookmarks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchBookmarksApi();
            setBookmarkGroupsData(transformDataForDnd(data));
        } catch (err) {
            console.error("Failed to fetch bookmarks:", err);
            setError(err.message || 'Failed to fetch bookmarks. Please try again.');
            setBookmarkGroupsData({});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        let activeGroupName = null;
        for (const groupKey in bookmarkGroupsData) {
            if (bookmarkGroupsData[groupKey].some(item => item.id === active.id)) {
                activeGroupName = groupKey;
                break;
            }
        }

        if (!activeGroupName || !bookmarkGroupsData[activeGroupName]?.some(item => item.id === over.id)) {
            setSnackbar({ open: true, message: 'Bookmarks can only be reordered within the same group.', severity: 'warning' });
            return;
        }
        
        const groupName = activeGroupName;
        const currentItemsInGroup = bookmarkGroupsData[groupName];
        const oldIndex = currentItemsInGroup.findIndex((item) => item.id === active.id);
        const newIndex = currentItemsInGroup.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            setSnackbar({ open: true, message: 'Error reordering bookmark: Item not found.', severity: 'error' });
            return;
        }

        const reorderedItemsInGroup = arrayMove(currentItemsInGroup, oldIndex, newIndex);
        setBookmarkGroupsData(prevData => ({
            ...prevData,
            [groupName]: reorderedItemsInGroup,
        }));

        const itemsToSave = reorderedItemsInGroup.map(item => item.originalData);

        try {
            await saveBookmarkGroupOrderApi(groupName, itemsToSave);
            setSnackbar({ open: true, message: `Order saved for group "${groupName}"`, severity: 'success' });
        } catch (err) {
            console.error(`Error saving order for group ${groupName}:`, err);
            setSnackbar({ open: true, message: `Error saving order: ${err.message || 'Unknown error'}`, severity: 'error' });
            loadBookmarks(); 
        }
    }, [bookmarkGroupsData, loadBookmarks]);

    const convertToApiFormat = (dataObject) => {
        return Object.entries(dataObject).map(([key, value]) => ({
             [key]: value.map(item => item.originalData) 
        }));
    };

    const handleOpenAddGroupDialog = () => setIsAddGroupDialogOpen(true);
    const handleCloseAddGroupDialog = () => setIsAddGroupDialogOpen(false);

    const handleOpenAddBookmarkDialog = (groupName) => {
        setCurrentEditingGroupName(groupName);
        setIsAddBookmarkDialogOpen(true);
    };
    const handleCloseAddBookmarkDialog = () => {
        setIsAddBookmarkDialogOpen(false);
        setCurrentEditingGroupName(null);
    };

    const handleOpenEditBookmarkDialog = (groupName, bookmarkName, bookmarkDetails) => {
        const group = bookmarkGroupsData[groupName];
        const bookmarkItem = group?.find(bm => bm.name === bookmarkName);
        if (bookmarkItem) {
             // Pass the originalData structure expected by EditBookmarkDialog
            setBookmarkToEdit({ 
                groupName, 
                name: bookmarkName, 
                // EditBookmarkDialog expects data in { "Bookmark Name": [{details}] } or { "Bookmark Name": {details} }
                // originalData is already in the correct { "Bookmark Name": [{details}] } format
                data: bookmarkItem.originalData 
            });
            setIsEditBookmarkDialogOpen(true);
        } else {
            console.error("Could not find bookmark to edit:", groupName, bookmarkName);
            setSnackbar({ open: true, message: 'Error: Could not find bookmark data to edit.', severity: 'error' });
        }
    };
    const handleCloseEditBookmarkDialog = () => {
        setIsEditBookmarkDialogOpen(false);
        setBookmarkToEdit(null);
    };

    const handleOpenEditGroupDialog = (groupName) => {
        setGroupToEdit({ currentName: groupName });
        setIsEditGroupDialogOpen(true);
    };
    const handleCloseEditGroupDialog = () => {
        setIsEditGroupDialogOpen(false);
        setGroupToEdit(null);
    };

    const handleOpenConfirmDeleteDialog = (groupName, bookmarkName) => {
        setBookmarkToDelete({ groupName, name: bookmarkName });
        setIsConfirmDeleteDialogOpen(true);
    };
    const handleCloseConfirmDeleteDialog = () => {
        setIsConfirmDeleteDialogOpen(false);
        setBookmarkToDelete(null);
    };

    const handleOpenConfirmDeleteGroupDialog = (groupName) => {
        setGroupToDelete({ name: groupName });
        setIsConfirmDeleteGroupDialogOpen(true);
    };
    const handleCloseConfirmDeleteGroupDialog = () => {
        setIsConfirmDeleteGroupDialogOpen(false);
        setGroupToDelete(null);
    };

    const handleConfirmAddGroup = async (newGroupName) => {
        if (Object.keys(bookmarkGroupsData).some(key => key.toLowerCase() === newGroupName.toLowerCase())) {
            setSnackbar({ open: true, message: `Group "${newGroupName}" already exists.`, severity: 'error' });
            return;
        }
        const updatedGroupsData = { ...bookmarkGroupsData, [newGroupName]: [] };
        try {
            setLoading(true);
            await saveBookmarksApi(convertToApiFormat(updatedGroupsData));
            setBookmarkGroupsData(updatedGroupsData);
            setSnackbar({ open: true, message: `Group "${newGroupName}" added successfully.`, severity: 'success' });
        } catch (err) {
            console.error("Failed to add bookmark group:", err);
            setSnackbar({ open: true, message: `Error adding group: ${err.message || 'Unknown error'}`, severity: 'error' });
        } finally {
            setLoading(false);
            handleCloseAddGroupDialog();
        }
    };

    const handleConfirmAddBookmark = async (newBookmarkDataFromDialog) => { 
        if (!currentEditingGroupName) return;
        const targetGroupName = currentEditingGroupName;

        const newBookmarkName = Object.keys(newBookmarkDataFromDialog)[0];
        if (bookmarkGroupsData[targetGroupName]?.some(bm => bm.name.toLowerCase() === newBookmarkName.toLowerCase())) {
            setSnackbar({ open: true, message: `Bookmark "${newBookmarkName}" already exists in this group.`, severity: 'error' });
            return;
        }

        const updatedGroupsData = JSON.parse(JSON.stringify(bookmarkGroupsData));
        const newItemId = `${targetGroupName}-${newBookmarkName}-${updatedGroupsData[targetGroupName]?.length || 0}`;
        
        let newBookmarkDetails = newBookmarkDataFromDialog[newBookmarkName];
        if (Array.isArray(newBookmarkDetails) && newBookmarkDetails.length > 0) {
            newBookmarkDetails = newBookmarkDetails[0];
        } else if (Array.isArray(newBookmarkDetails)) { // Empty array
            newBookmarkDetails = {};
        }


        const transformedNewBookmark = {
            id: newItemId,
            name: newBookmarkName,
            originalData: newBookmarkDataFromDialog, // This is { "Name": [{details}] }
            details: newBookmarkDetails,
        };
        if (!updatedGroupsData[targetGroupName]) updatedGroupsData[targetGroupName] = [];
        updatedGroupsData[targetGroupName].push(transformedNewBookmark);
        
        try {
            setLoading(true);
            await saveBookmarksApi(convertToApiFormat(updatedGroupsData));
            setBookmarkGroupsData(updatedGroupsData);
            setSnackbar({ open: true, message: `Bookmark "${newBookmarkName}" added successfully.`, severity: 'success' });
        } catch (err) {
            console.error("Failed to add bookmark:", err);
            setSnackbar({ open: true, message: `Error adding bookmark: ${err.message || 'Unknown error'}`, severity: 'error' });
        } finally {
            setLoading(false);
            handleCloseAddBookmarkDialog();
        }
    };

    const handleConfirmEditBookmark = async (updatedBookmarkFromDialog, originalBookmarkNameFromDialog) => {
        if (!bookmarkToEdit) return;
        const { groupName } = bookmarkToEdit; 
        const newBookmarkName = Object.keys(updatedBookmarkFromDialog)[0];
        
        let newBookmarkDetails = updatedBookmarkFromDialog[newBookmarkName];
        if (Array.isArray(newBookmarkDetails) && newBookmarkDetails.length > 0) {
            newBookmarkDetails = newBookmarkDetails[0];
        } else if (Array.isArray(newBookmarkDetails)) {
            newBookmarkDetails = {};
        }


        const updatedGroupsData = JSON.parse(JSON.stringify(bookmarkGroupsData));
        if (!updatedGroupsData[groupName]) {
             setSnackbar({ open: true, message: `Original group "${groupName}" not found.`, severity: 'error' });
             setLoading(false);
             return;
        }
        const itemIndex = updatedGroupsData[groupName].findIndex(item => item.name === originalBookmarkNameFromDialog);

        if (itemIndex === -1) {
            setSnackbar({ open: true, message: `Original bookmark "${originalBookmarkNameFromDialog}" not found.`, severity: 'error' });
            setLoading(false);
            return;
        }
        
        if (newBookmarkName.toLowerCase() !== originalBookmarkNameFromDialog.toLowerCase()) {
            if (updatedGroupsData[groupName].some((item, idx) => idx !== itemIndex && item.name.toLowerCase() === newBookmarkName.toLowerCase())) {
                 setSnackbar({ open: true, message: `Bookmark name "${newBookmarkName}" already exists.`, severity: 'error' });
                 setLoading(false);
                 return;
            }
        }
        
        updatedGroupsData[groupName][itemIndex] = {
            ...updatedGroupsData[groupName][itemIndex],
            name: newBookmarkName,
            originalData: updatedBookmarkFromDialog, 
            details: newBookmarkDetails
        };
        
        try {
            setLoading(true);
            await saveBookmarksApi(convertToApiFormat(updatedGroupsData));
            setBookmarkGroupsData(updatedGroupsData);
            setSnackbar({ open: true, message: `Bookmark "${newBookmarkName}" updated.`, severity: 'success' });
        } catch (err) {
            console.error("Failed to edit bookmark:", err);
            setSnackbar({ open: true, message: `Error updating bookmark: ${err.message || 'Unknown error'}`, severity: 'error' });
        } finally {
            setLoading(false);
            handleCloseEditBookmarkDialog();
        }
    };

    const handleConfirmEditGroup = async (newGroupName) => {
        if (!groupToEdit) return;
        const oldGroupName = groupToEdit.currentName;
        if (newGroupName === oldGroupName) {
            handleCloseEditGroupDialog();
            return;
        }
        if (Object.keys(bookmarkGroupsData).some(key => key.toLowerCase() === newGroupName.toLowerCase() && key.toLowerCase() !== oldGroupName.toLowerCase())) {
            setSnackbar({ open: true, message: `Group name "${newGroupName}" already exists.`, severity: 'error' });
            return;
        }

        const updatedGroupsData = JSON.parse(JSON.stringify(bookmarkGroupsData));
        if (updatedGroupsData[oldGroupName]) {
            const groupItems = updatedGroupsData[oldGroupName];
            delete updatedGroupsData[oldGroupName];
            updatedGroupsData[newGroupName] = groupItems.map((item, index) => ({
                ...item,
                id: `${newGroupName}-${item.name}-${index}` 
            }));
        } else {
             setSnackbar({ open: true, message: `Original group "${oldGroupName}" not found.`, severity: 'error' });
             setLoading(false);
             return;
        }
        
        try {
            setLoading(true);
            await saveBookmarksApi(convertToApiFormat(updatedGroupsData));
            setBookmarkGroupsData(updatedGroupsData);
            setSnackbar({ open: true, message: `Group renamed to "${newGroupName}".`, severity: 'success' });
        } catch (err) {
            console.error("Failed to rename group:", err);
            setSnackbar({ open: true, message: `Error renaming group: ${err.message || 'Unknown error'}`, severity: 'error' });
        } finally {
            setLoading(false);
            handleCloseEditGroupDialog();
        }
    };

    const handleConfirmDeleteBookmark = async () => {
        if (!bookmarkToDelete) return;
        const { groupName, name: bookmarkName } = bookmarkToDelete;
        const updatedGroupsData = JSON.parse(JSON.stringify(bookmarkGroupsData));

        if (updatedGroupsData[groupName]) {
            updatedGroupsData[groupName] = updatedGroupsData[groupName].filter(item => item.name !== bookmarkName);
            if (updatedGroupsData[groupName].length === 0 && groupName !== "") { 
                delete updatedGroupsData[groupName];
            }
        } else {
            setSnackbar({ open: true, message: `Group "${groupName}" not found.`, severity: 'error' });
            handleCloseConfirmDeleteDialog();
            return;
        }
        
        try {
            setLoading(true);
            await saveBookmarksApi(convertToApiFormat(updatedGroupsData));
            setBookmarkGroupsData(updatedGroupsData);
            setSnackbar({ open: true, message: `Bookmark "${bookmarkName}" deleted.`, severity: 'success' });
        } catch (err) {
            console.error("Failed to delete bookmark:", err);
            setSnackbar({ open: true, message: `Error deleting bookmark: ${err.message || 'Unknown error'}`, severity: 'error' });
        } finally {
            setLoading(false);
            handleCloseConfirmDeleteDialog();
        }
    };

    const handleConfirmDeleteGroup = async () => {
        if (!groupToDelete) return;
        const groupName = groupToDelete.name;
        const updatedGroupsData = JSON.parse(JSON.stringify(bookmarkGroupsData));
        if (updatedGroupsData[groupName]) {
            delete updatedGroupsData[groupName];
        } else {
            setSnackbar({ open: true, message: `Group "${groupName}" not found.`, severity: 'error' });
            handleCloseConfirmDeleteGroupDialog();
            return;
        }
        
        try {
            setLoading(true);
            await saveBookmarksApi(convertToApiFormat(updatedGroupsData));
            setBookmarkGroupsData(updatedGroupsData);
            setSnackbar({ open: true, message: `Group "${groupName}" deleted.`, severity: 'success' });
        } catch (err) {
            console.error("Failed to delete group:", err);
            setSnackbar({ open: true, message: `Error deleting group: ${err.message || 'Unknown error'}`, severity: 'error' });
        } finally {
            setLoading(false);
            handleCloseConfirmDeleteGroupDialog();
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Bookmarks</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddGroupDialog} disabled={loading}>
                    Add Group
                </Button>
            </Box>

            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
            {error && !loading && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
            {!loading && !error && Object.keys(bookmarkGroupsData).length === 0 && (
                 <Typography sx={{ textAlign: 'center', mt: 4 }}>No bookmark groups found.</Typography>
            )}

            {!loading && !error && Object.keys(bookmarkGroupsData).length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Removed Grid container, groups will stack vertically */}
                {Object.entries(bookmarkGroupsData).map(([groupName, bookmarksInGroup]) => (
                    // Each group is a Paper component, taking full width by default within a block context
                    <Paper sx={{ mb: 3, width: '100%' }} key={groupName}>
                        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" component="h2">
                                {groupName}
                            </Typography>
                            <Box sx={{ flexShrink: 0 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditGroupDialog(groupName)}
                                    aria-label="edit group"
                                    title="Edit Group"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenConfirmDeleteGroupDialog(groupName)}
                                    aria-label="delete group"
                                    title="Delete Group"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenAddBookmarkDialog(groupName)}
                                    sx={{ ml: 1 }}
                                    title="Add Bookmark to this Group"
                                >
                                    Add Bookmark
                                </Button>
                            </Box>
                        </Box>
                        <SortableContext items={bookmarksInGroup.map(item => item.id)} strategy={verticalListSortingStrategy}>
                            <List dense disablePadding>
                                {bookmarksInGroup.map((bookmark, bookmarkIndex) => (
                                    <React.Fragment key={bookmark.id}>
                                        <SortableBookmarkItem
                                            id={bookmark.id}
                                            name={bookmark.name}
                                            details={bookmark.details}
                                            groupName={groupName}
                                            onEditClick={handleOpenEditBookmarkDialog}
                                            onDeleteClick={handleOpenConfirmDeleteDialog}
                                        />
                                        {bookmarkIndex < bookmarksInGroup.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                                {bookmarksInGroup.length === 0 && (
                                    <ListItem sx={{ pl: 2 }}> {/* Adjusted padding to match items if needed */}
                                        <ListItemText primary="No bookmarks in this group." />
                                    </ListItem>
                                )}
                            </List>
                        </SortableContext>
                    </Paper>
                ))}
            </DndContext>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>

            <AddBookmarkGroupDialog open={isAddGroupDialogOpen} onClose={handleCloseAddGroupDialog} onAddGroup={handleConfirmAddGroup} />
            <AddBookmarkDialog
                open={isAddBookmarkDialogOpen}
                onClose={handleCloseAddBookmarkDialog}
                onAddBookmark={handleConfirmAddBookmark}
                groupName={currentEditingGroupName || ''}
            />
            <EditBookmarkDialog
                open={isEditBookmarkDialogOpen}
                onClose={handleCloseEditBookmarkDialog}
                onSaveBookmark={handleConfirmEditBookmark}
                bookmarkToEdit={bookmarkToEdit} // Pass the whole object: { groupName, name, data: originalData }
            />
            <EditBookmarkGroupDialog
                open={isEditGroupDialogOpen}
                onClose={handleCloseEditGroupDialog}
                onSaveGroup={handleConfirmEditGroup}
                currentGroupName={groupToEdit?.currentName}
            />
            <ConfirmationDialog
                open={isConfirmDeleteDialogOpen}
                onClose={handleCloseConfirmDeleteDialog}
                onConfirm={handleConfirmDeleteBookmark}
                title="Confirm Bookmark Deletion"
                message={`Are you sure you want to delete the bookmark "${bookmarkToDelete?.name || ''}"?`}
                confirmText="Delete Bookmark"
            />
            <ConfirmationDialog
                open={isConfirmDeleteGroupDialogOpen}
                onClose={handleCloseConfirmDeleteGroupDialog}
                onConfirm={handleConfirmDeleteGroup}
                title="Confirm Group Deletion"
                message={`Are you sure you want to delete the group "${groupToDelete?.name || ''}" and all its bookmarks?`}
                confirmText="Delete Group"
            />
        </Container>
    );
}

export default BookmarkListPage;