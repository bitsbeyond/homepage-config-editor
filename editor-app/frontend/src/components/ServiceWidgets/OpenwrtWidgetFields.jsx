import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function OpenwrtWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [interfaceName, setInterfaceName] = useState(initialData?.interfaceName || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setInterfaceName(initialData.interfaceName || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setInterfaceName('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'openwrt',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      interfaceName: interfaceName || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for OpenWrt widget.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'openwrt' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'openwrt';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, interfaceName, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, Username, Interface Name)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="OpenWrt URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your OpenWrt instance (e.g., http://192.168.1.1)"}
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
        helperText={fieldErrors.username || "Requires specific user/ACL setup in OpenWrt"}
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
        helperText={fieldErrors.password || "OpenWrt password. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        fullWidth
        name="interfaceName"
        label="Interface Name (Optional)"
        value={interfaceName} // Use individual state
        onChange={handleTextFieldChange(setInterfaceName)} // Use specific handler with setter
        helperText="e.g., eth0. Leave blank for general system info"
      />
    </Box>
  );
}

OpenwrtWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    interfaceName: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

OpenwrtWidgetFields.defaultProps = {
  initialData: null,
};

export default OpenwrtWidgetFields;