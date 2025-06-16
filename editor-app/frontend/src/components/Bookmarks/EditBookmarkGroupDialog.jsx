import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Box,
} from '@mui/material';

function EditBookmarkGroupDialog({ open, onClose, onSaveGroup, currentGroupName }) {
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');

    // Pre-fill form when dialog opens or currentGroupName changes
    useEffect(() => {
        if (open) {
            setGroupName(currentGroupName || ''); // Pre-fill with current name
            setError(''); // Reset error
        }
        // Reset if closed
        if (!open) {
             setGroupName('');
             setError('');
        }
    }, [open, currentGroupName]);

    const handleInputChange = (event) => {
        setGroupName(event.target.value);
        if (error && event.target.value.trim()) {
            setError(''); // Clear error when user starts typing valid input
        }
    };

    const handleSaveClick = () => {
        const trimmedName = groupName.trim();
        if (!trimmedName) {
            setError('Group name cannot be empty.');
            return;
        }
        // Pass the potentially updated group name back
        // The parent component will handle checking for duplicates if the name changed
        onSaveGroup(trimmedName);
        onClose(); // Close the dialog
    };

    const handleCancelClick = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Bookmark Group "{currentGroupName}"</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Enter the new name for the bookmark group.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="edit-group-name"
                    label="Group Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={groupName}
                    onChange={handleInputChange}
                    error={!!error}
                    helperText={error}
                    onKeyPress={(ev) => { // Allow submitting with Enter key
                        if (ev.key === 'Enter') {
                            handleSaveClick();
                            ev.preventDefault();
                        }
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleCancelClick} color="inherit">Cancel</Button>
                <Button onClick={handleSaveClick} variant="contained">Save Changes</Button>
            </DialogActions>
        </Dialog>
    );
}

EditBookmarkGroupDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSaveGroup: PropTypes.func.isRequired,
    currentGroupName: PropTypes.string, // The current name of the group being edited
};

export default EditBookmarkGroupDialog;