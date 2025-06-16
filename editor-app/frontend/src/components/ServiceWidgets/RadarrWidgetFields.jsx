import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function RadarrWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [enableQueue, setEnableQueue] = useState(initialData?.enableQueue || false);
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setEnableQueue(initialData.enableQueue || false);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setEnableQueue(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'radarr',
      url: url || undefined,
      key: apiKey || undefined,
      enableQueue: enableQueue || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Radarr widget.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'radarr' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        // Only include enableQueue if it's true (not default)
        if (k === 'enableQueue' && currentWidgetData[k] === false) {
          return; // Skip false values for enableQueue
        }
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'radarr';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, enableQueue, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Key)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  // Handle changes for Switch (Enable Queue)
  const handleSwitchChange = (setter) => (event) => {
      setter(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Radarr URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Radarr instance (e.g., http://radarr.host.or.ip:7878)"}
        type="url"
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Key"
        type="password" // Enables visibility toggle
        value={apiKey} // Use individual state
        onChange={handleAutocompleteChange(setApiKey)} // Use specific handler with setter
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Found in Radarr under Settings > General > API Key. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControlLabel
        control={
          <Switch
            checked={enableQueue}
            onChange={handleSwitchChange(setEnableQueue)}
            name="enableQueue"
          />
        }
        label="Enable Detailed Queue Listing"
        sx={{ mt: 1 }}
      />
    </Box>
  );
}

RadarrWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    enableQueue: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

RadarrWidgetFields.defaultProps = {
  initialData: null,
};

export default RadarrWidgetFields;