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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
// import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // No longer needed for href

// Basic URL validation (can be improved)
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

function AddBookmarkDialog({ open, onClose, onAddBookmark, groupName }) {
    const [name, setName] = useState('');
    const [href, setHref] = useState('');
    const [description, setDescription] = useState('');
    const [abbr, setAbbr] = useState(''); // Add state for abbreviation
    const [icon, setIcon] = useState(''); // Add state for icon
    const [errors, setErrors] = useState({});

    // Reset state when dialog opens/closes or group changes
    useEffect(() => {
        if (open) {
            setName('');
            setHref('');
            setDescription('');
            setAbbr(''); // Reset abbr
            setIcon(''); // Reset icon
            setErrors({});
        }
    }, [open]);

    // Combined validation and error setting, to be called on input change and before save
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
        else if (fieldName === 'href') setHref(value); // Use else if for clarity
        else if (fieldName === 'description') setDescription(value);
        else if (fieldName === 'abbr') setAbbr(value);
        else if (fieldName === 'icon') setIcon(value);

        // No need to clear specific errors here, as the useEffect above will re-validate all.
    };

    const handleAddClick = async () => {
        if (!validateAndSetErrors()) { // Ensure errors are up-to-date before checking
            return;
        }

        const newBookmark = {
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

        try {
            // onAddBookmark likely triggers the API call in the parent component.
            // We assume it throws an error if the API call fails.
            await onAddBookmark(newBookmark);
            enqueueSnackbar('Bookmark added successfully!', { variant: 'success' });
            onClose(); // Close the dialog only on success
        } catch (error) {
            console.error("Failed to add bookmark:", error);
            // Check if it's the specific missing env var error
            // The exact structure depends on how the error is propagated from the API call
            // Assuming the error object might have a response property from axios/fetch
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
                enqueueSnackbar(error.message || 'Failed to add bookmark. Please try again.', { variant: 'error' });
            }
            // Do not close the dialog on error
        }
    };

    const handleCancelClick = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Bookmark to "{groupName}"</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Enter the details for the new bookmark. Name, URL and Abbreviation are required.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="bookmark-name"
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
                    id="bookmark-href"
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
                    id="bookmark-description"
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
                    id="bookmark-abbr"
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
                    id="bookmark-icon"
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
                    onClick={handleAddClick}
                    variant="contained"
                    disabled={!name.trim() || !href.trim() || !abbr.trim() || !isValidUrl(href.trim()) || Object.keys(errors).some(key => errors[key])}
                >
                    Add Bookmark
                </Button>
            </DialogActions>
        </Dialog>
    );
}

AddBookmarkDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAddBookmark: PropTypes.func.isRequired,
    groupName: PropTypes.string.isRequired, // Pass the group name for the title
};

export default AddBookmarkDialog;