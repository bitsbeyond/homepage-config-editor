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

function OpenmediavaultWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [method, setMethod] = useState(initialData?.method || 'services.getStatus');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setMethod(initialData.method || 'services.getStatus');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setMethod('services.getStatus');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'openmediavault',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      method: method || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for OpenMediaVault widget.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    if (!method?.trim()) {
      errors.method = 'Data method is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'openmediavault' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'openmediavault';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, method, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, Username)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  // Handle changes for Select (Method)
  const handleSelectChange = (setter) => (event) => {
      setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="OpenMediaVault URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your OpenMediaVault instance"}
        type="url"
      />
      <TextField
        required
        fullWidth
        name="username"
        label="Username"
        value={username} // Use individual state
        onChange={handleTextFieldChange(setUsername)} // Use specific handler with setter
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "OMV username"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Password"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "OMV password. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControl fullWidth required error={!!fieldErrors.method}>
        <InputLabel id="omv-method-label">Data Method</InputLabel>
        <Select
          labelId="omv-method-label"
          id="omv-method-select"
          name="method"
          value={method}
          label="Data Method"
          onChange={handleSelectChange(setMethod)}
        >
          <MenuItem value="services.getStatus">Service Status</MenuItem>
          <MenuItem value="smart.getListBg">S.M.A.R.T. Status</MenuItem>
          <MenuItem value="downloader.getDownloadList">Downloader Tasks</MenuItem>
        </Select>
        <FormHelperText>{fieldErrors.method || "Select the type of data to display"}</FormHelperText>
      </FormControl>
    </Box>
  );
}

OpenmediavaultWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    method: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

OpenmediavaultWidgetFields.defaultProps = {
  initialData: null,
};

export default OpenmediavaultWidgetFields;