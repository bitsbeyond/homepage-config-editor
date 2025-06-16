import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack'; // Import useSnackbar
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
// import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // No longer needed for href

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};


function EditBookmarkDialog({ open, onClose, onSaveBookmark, bookmarkToEdit, groupName }) {
    const [name, setName] = useState('');
    const [href, setHref] = useState('');
    const [description, setDescription] = useState('');
    const [abbr, setAbbr] = useState(''); // Add state for abbreviation
    const [icon, setIcon] = useState(''); // Add state for icon
    const [originalName, setOriginalName] = useState(''); // To track the original name for potential renaming logic
    const [errors, setErrors] = useState({});
    const { enqueueSnackbar } = useSnackbar(); // Get snackbar function

    // Pre-fill form when dialog opens or bookmarkData changes
    useEffect(() => {
        if (open && bookmarkToEdit && bookmarkToEdit.data) { // Use bookmarkToEdit.data
            const bookmarkDataFromProp = bookmarkToEdit.data;
            const currentName = Object.keys(bookmarkDataFromProp)[0];
            let currentDetails = bookmarkDataFromProp[currentName];

            // --- Handle potential array wrapping ---
            if (Array.isArray(currentDetails) && currentDetails.length === 1 && typeof currentDetails[0] === 'object') {
                console.warn(`EditBookmarkDialog received bookmark '${currentName}' with details wrapped in an array. Using the first element.`);
                currentDetails = currentDetails[0];
            } else if (Array.isArray(currentDetails) || typeof currentDetails !== 'object' || currentDetails === null) {
                 console.error(`EditBookmarkDialog received bookmark '${currentName}' with invalid data structure:`, bookmarkDataFromProp[currentName]);
                 currentDetails = {}; // Use empty object to avoid further errors
            }
            // --- End Handle potential array wrapping ---

            const currentData = currentDetails || {};
            setName(currentName);
            setOriginalName(currentName);
            setHref(currentData.href || '');
            setDescription(currentData.description || '');
            setAbbr(currentData.abbr || '');
            setIcon(currentData.icon || '');
            setErrors({});
        }
        // Reset form if dialog is closed or no data
        if (!open) {
            setName('');
            setOriginalName('');
            setHref('');
            setDescription('');
            setAbbr('');
            setIcon('');
            setErrors({});
        }
    }, [open, bookmarkToEdit]);

    // Combined validation and error setting
    const validateAndSetErrors = useCallback(() => {
        const newErrors = {};
        if (!name.trim()) {
            newErrors.name = 'Bookmark name cannot be empty.';
        }
        if (!href.trim()) {
            newErrors.href = 'URL cannot be empty.';
        } else if (!isValidUrl(href.trim())) {
            newErrors.href = 'Please enter a valid URL (e.g., https://example.com).';
        }
        if (!abbr.trim()) {
            newErrors.abbr = 'Abbreviation cannot be empty.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [name, href, abbr]); // Dependencies for useCallback

    // Effect to re-validate whenever relevant fields change
    useEffect(() => {
        if (open) { // Only validate if the dialog is open
            validateAndSetErrors();
        }
    }, [name, href, abbr, open, validateAndSetErrors]);

    const handleInputChange = (event) => {
        const { name: fieldName, value } = event.target;
        if (fieldName === 'name') setName(value);
        else if (fieldName === 'href') setHref(value);
        else if (fieldName === 'description') setDescription(value);
        else if (fieldName === 'abbr') setAbbr(value);
        else if (fieldName === 'icon') setIcon(value);

        // Errors are now handled by the useEffect hook
    };

    const handleSaveClick = async () => {
        if (!validateAndSetErrors()) { // Ensure errors are up-to-date
            return;
        }

        const updatedBookmark = {
            // Structure based on Homepage config: { "Bookmark Name": [ { href: "...", ... } ] }
            [name.trim()]: [ // Wrap details in an array
                {
                    href: href.trim(),
                    // Only include description if it's not empty
                    ...(description.trim() && { description: description.trim() }),
                    abbr: abbr.trim(), // Add abbr
                    ...(icon.trim() && { icon: icon.trim() }), // Add icon if present
                }
            ]
        };
        // Pass both the updated bookmark and the original name in case the name changed
        try {
            // Assume onSaveBookmark triggers the API call and throws on failure
            await onSaveBookmark(updatedBookmark, originalName);
            enqueueSnackbar('Bookmark saved successfully!', { variant: 'success' });
            onClose(); // Close the dialog only on success
        } catch (error) {
            console.error("Failed to save bookmark:", error);
            // Check if it's the specific missing env var error
            const errorData = error?.response?.data || {};
             if (errorData.error === 'Missing environment variables' && Array.isArray(errorData.missing)) {
                 const missingVarsList = errorData.missing.join(', ');
                 enqueueSnackbar(
                    `Warning: Missing environment variables: ${missingVarsList}. Please define them in .env.`,
                    {
                        variant: 'warning',
                        persist: true, // Keep the message until dismissed
                    }
                );
            } else {
                // Generic error
                enqueueSnackbar(error.message || 'Failed to save bookmark. Please try again.', { variant: 'error' });
            }
             // Do not close the dialog on error
        }
    };

    const handleCancelClick = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {/* Use originalName in title in case user is editing the name */}
            <DialogTitle>Edit Bookmark "{originalName}" in "{groupName}"</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Update the details for the bookmark. Name, URL and Abbreviation are required.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="edit-bookmark-name"
                    label="Bookmark Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    name="name"
                    value={name}
                    onChange={handleInputChange}
                    error={!!errors.name}
                    helperText={errors.name || "Name of the bookmark (required)"}
                    required
                    sx={{ mb: 2 }}
                />
                <TextField
                    margin="dense"
                    id="edit-bookmark-href"
                    label="URL (href)"
                    type="text"
                    fullWidth
                    variant="outlined"
                    name="href"
                    value={href}
                    onChange={handleInputChange}
                    error={!!errors.href}
                    helperText={errors.href || 'Example: https://www.google.com (required)'}
                    required
                    sx={{ mb: 2 }}
                />
                <TextField
                    margin="dense"
                    id="edit-bookmark-description"
                    label="Description (Optional)"
                    type="text"
                    fullWidth
                    variant="outlined"
                    name="description"
                    value={description}
                    onChange={handleInputChange}
                    sx={{ mb: 2 }}
                />
                 <TextField
                    margin="dense"
                    id="edit-bookmark-abbr"
                    label="Abbreviation"
                    type="text"
                    fullWidth
                    variant="outlined"
                    name="abbr"
                    value={abbr}
                    onChange={handleInputChange}
                    error={!!errors.abbr}
                    helperText={errors.abbr || "Short text displayed on the button (required)"}
                    required
                    sx={{ mb: 2 }}
                />
                 <TextField
                    margin="dense"
                    id="edit-bookmark-icon"
                    label="Icon (Optional)"
                    type="text"
                    fullWidth
                    variant="outlined"
                    name="icon"
                    value={icon}
                    onChange={handleInputChange}
                    helperText="e.g., 'fas fa-book', 'si-github', 'github.png'"
                />

            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={handleCancelClick} color="inherit">Cancel</Button>
                <Button
                    onClick={handleSaveClick}
                    variant="contained"
                    disabled={!name.trim() || !href.trim() || !abbr.trim() || !isValidUrl(href.trim()) || Object.keys(errors).some(key => errors[key])}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

EditBookmarkDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSaveBookmark: PropTypes.func.isRequired,
    bookmarkToEdit: PropTypes.shape({ // Updated prop type
        groupName: PropTypes.string,
        name: PropTypes.string,
        data: PropTypes.object, // This is the { "Name": [{details}] }
    }),
    groupName: PropTypes.string.isRequired,
};

export default EditBookmarkDialog;