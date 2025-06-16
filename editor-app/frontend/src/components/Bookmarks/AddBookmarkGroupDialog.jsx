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

function AddBookmarkGroupDialog({ open, onClose, onAddGroup }) {
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setGroupName('');
            setError('');
        }
    }, [open]);

    const handleInputChange = (event) => {
        setGroupName(event.target.value);
        if (error && event.target.value.trim()) {
            setError(''); // Clear error when user starts typing valid input
        }
    };

    const handleAddClick = () => {
        const trimmedName = groupName.trim();
        if (!trimmedName) {
            setError('Group name cannot be empty.');
            return;
        }
        // TODO: Add validation for duplicate group names if needed
        onAddGroup(trimmedName); // Pass the new group name back
        onClose(); // Close the dialog
    };

    const handleCancelClick = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Bookmark Group</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Enter the name for the new bookmark group.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="group-name"
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
                            handleAddClick();
                            ev.preventDefault();
                        }
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleCancelClick} color="inherit">Cancel</Button>
                <Button onClick={handleAddClick} variant="contained">Add Group</Button>
            </DialogActions>
        </Dialog>
    );
}

AddBookmarkGroupDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAddGroup: PropTypes.func.isRequired,
};

export default AddBookmarkGroupDialog;