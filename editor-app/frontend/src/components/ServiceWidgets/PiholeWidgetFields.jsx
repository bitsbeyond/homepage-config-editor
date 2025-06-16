import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function PiholeWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [version, setVersion] = useState(initialData?.version?.toString() || '5');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setVersion(initialData.version?.toString() || '5');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setVersion('5');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'pihole',
      url: url || undefined,
      version: version !== '5' ? parseInt(version, 10) : undefined, // Only include version if not default
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Pi-hole widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'pihole' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'pihole';
    }

    parentOnChange(dataForParent, errors);
  }, [url, version, apiKey, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Key)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  // Handle changes for Select (Version)
  const handleSelectChange = (setter) => (event) => {
      setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Pi-hole URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Pi-hole instance (e.g., http://pi.hole or http://192.168.1.11)"}
        type="url"
      />
      
      <FormControl fullWidth>
        <InputLabel id="pihole-version-label">Version</InputLabel>
        <Select
          labelId="pihole-version-label"
          id="pihole-version-select"
          name="version"
          value={version}
          label="Version"
          onChange={handleSelectChange(setVersion)}
        >
          <MenuItem value="5">v5 (Default)</MenuItem>
          <MenuItem value="6">v6+</MenuItem>
        </Select>
        <FormHelperText>Required only if running Pi-hole v6 or higher</FormHelperText>
      </FormControl>

      <EnvVarAutocompleteInput
        fullWidth
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Key / Password"
        type="password" // Enables visibility toggle
        value={apiKey} // Use individual state
        onChange={handleAutocompleteChange(setApiKey)} // Use specific handler with setter
        helperText="Optional. Found in Settings > API / Web interface > Show API token. For v6+, can also be web password. Can be a {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

PiholeWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

PiholeWidgetFields.defaultProps = {
  initialData: null,
};

export default PiholeWidgetFields;