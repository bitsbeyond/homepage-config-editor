import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useSnackbar } from 'notistack';
import { fetchEnvKeysApi } from '../../utils/api';

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function EnvVarAutocompleteInput({ label, name, value: propValue, onChange, type, ...otherProps }) { // Extract type separately
    const [selectedValue, setSelectedValue] = useState(propValue || null); // State for the selected value (can be null)
    const [inputValue, setInputValue] = useState(propValue || ''); // State for the text input
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [showValue, setShowValue] = useState(false); // State for visibility toggle
    const { enqueueSnackbar } = useSnackbar();

    // Determine if this is a password field (stable reference)
    const isPasswordField = type === 'password';

    // Track if we've already fetched options (prevents re-fetch loops)
    const hasFetchedRef = useRef(false);

    // Toggle visibility state (memoized to prevent flickering)
    const handleClickShowValue = useCallback(() => {
        setShowValue((show) => !show);
    }, []);

    const handleMouseDownPassword = useCallback((event) => {
        event.preventDefault(); // Prevent blur on icon click
    }, []);

    // Fetch options function (stable reference prevents re-render loops)
    const fetchOptions = useCallback(async () => {
        if (hasFetchedRef.current) return; // Only fetch once
        hasFetchedRef.current = true;
        setLoading(true);
        try {
            const data = await fetchEnvKeysApi();
            setOptions(data.keys || []);
        } catch (error) {
            console.error("Failed to fetch env keys for autocomplete:", error);
            enqueueSnackbar('Failed to load environment variable suggestions', { variant: 'error' });
            setOptions([]); // Clear options on error
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]); // Only depend on enqueueSnackbar (stable)

    // Effect to sync internal state with prop value
    useEffect(() => {
        setSelectedValue(propValue || null);
        setInputValue(propValue || '');
    }, [propValue]);

    // Effect to fetch options on mount
    useEffect(() => {
      fetchOptions();
    }, [fetchOptions]); // fetchOptions is memoized with useCallback

    const handleInputChange = (event, newInputValue) => {
        setInputValue(newInputValue); // Update the input text state immediately
        // Let MUI Autocomplete handle filtering based on options
    };

    const handleChange = (event, newValue) => { // newValue is the selected option or typed string
        const finalValue = newValue || '';
        // Update internal states
        setInputValue(finalValue);
        setSelectedValue(newValue); // Keep selectedValue aligned with Autocomplete's value

        // Propagate change immediately to parent, mimicking a basic input event
        // Formatting and validation will still happen on blur
        onChange({ target: { name, value: finalValue } });
    };

    const handleBlur = async () => {
         setOpen(false); // Close dropdown on blur
         let currentValue = inputValue; // Start with the current input text

         // Apply formatting if needed
         if (typeof currentValue === 'string' &&
             (currentValue.startsWith('HOMEPAGE_VAR_') || currentValue.startsWith('HOMEPAGE_FILE_')) &&
             !currentValue.startsWith('{{')) {
             currentValue = `{{${currentValue}}}`;
             setInputValue(currentValue); // Update input state visually
         }

         // Update the selected value state to match the final input value
         setSelectedValue(currentValue);

         // Propagate the final value (formatted or not) to the parent form
         onChange({ target: { name, value: currentValue } });

         // Check for missing variables using the final value
         if (typeof currentValue === 'string' && currentValue.startsWith('{{')) {
            const varName = currentValue.substring(2, currentValue.length - 2);
            // Ensure options are loaded before checking
            let currentOptions = options;
            if (currentOptions.length === 0 && !loading) {
                try {
                    setLoading(true); // Show loading indicator while fetching for validation
                    const data = await fetchEnvKeysApi(); // Fetch directly
                    currentOptions = data.keys || [];
                    setOptions(currentOptions); // Update state
                    setLoading(false);
                } catch (error) {
                     console.error("Failed to fetch env keys for blur validation:", error);
                     enqueueSnackbar('Could not verify environment variable existence', { variant: 'error' });
                     setLoading(false);
                     return; // Exit if fetch failed
                }
            }
            // Perform check with potentially updated options
            if (currentOptions.length > 0 && !currentOptions.includes(varName)) {
                enqueueSnackbar(`Warning: Variable "${varName}" not found in .env file.`, { variant: 'warning' });
            }
         }
    };

    // Memoize callbacks to prevent flickering in React 19
    const handleOpen = useCallback(() => {
        setOpen(true);
        fetchOptions(); // Will only fetch once due to hasFetchedRef
    }, [fetchOptions]);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    // Memoize getOptionLabel to prevent re-renders
    const getOptionLabel = useCallback((option) => option, []);

    // Memoize the entire endAdornment to prevent flickering
    const endAdornment = useMemo(() => {
        return (
            <>
                {isPasswordField && (
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowValue}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                            size="small"
                        >
                            {showValue ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                )}
                {loading && <CircularProgress color="inherit" size={20} />}
            </>
        );
    }, [isPasswordField, showValue, loading, handleClickShowValue, handleMouseDownPassword]);

    // Don't memoize renderInput - MUI Autocomplete handles it
    const renderInput = (params) => {
        return (
            <TextField
                {...params}
                label={label}
                variant="outlined"
                fullWidth
                inputProps={{
                    ...params.inputProps,
                    type: (isPasswordField && !showValue) ? 'password' : 'text',
                }}
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                        <>
                            {endAdornment}
                            {params.InputProps.endAdornment}
                        </>
                    ),
                }}
                {...otherProps}
            />
        );
    };

    // Memoize renderOption to prevent re-renders
    const renderOption = useCallback((props, option) => (
        <Box component="li" {...props} key={option}>
            {option}
        </Box>
    ), []);

    // Restore original Autocomplete code:
    return (
        <Autocomplete
            freeSolo // Allows typing values not in the list
            options={options}
            value={selectedValue} // Bind to the selected value state
            inputValue={inputValue} // Bind to the input text state
            onInputChange={handleInputChange} // Handles typing
            onChange={handleChange} // Handles selection or freeSolo confirmation
            onBlur={handleBlur} // Handle formatting and closing
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            loading={loading}
            getOptionLabel={getOptionLabel}
            renderInput={renderInput}
            renderOption={renderOption}
            // Disable default filtering, we show all fetched options
            filterOptions={(x) => x}
        />
    );
}

export default EnvVarAutocompleteInput;
