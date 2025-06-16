import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function TransmissionWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [rpcUrl, setRpcUrl] = useState(initialData?.rpcUrl || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setRpcUrl(initialData.rpcUrl || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setRpcUrl('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'transmission',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      rpcUrl: rpcUrl || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Transmission URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'transmission' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'transmission';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, rpcUrl, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
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
        label="Transmission URL"
        type="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Transmission instance (e.g., http://transmission.host:9091)"}
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="username"
        label="Username (Optional)"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        helperText="Optional. Username for Transmission web interface. Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password"
        label="Password (Optional)"
        type="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        helperText="Optional. Password for Transmission web interface. Can be a {{HOMEPAGE_VAR_...}}"
      />
      <TextField
        fullWidth
        name="rpcUrl"
        label="RPC URL Path (Optional)"
        value={rpcUrl}
        onChange={handleTextFieldChange(setRpcUrl)}
        helperText="Optional. Path for RPC, e.g., /transmission/. Matches 'rpc-url' in settings.json."
      />
    </Box>
  );
}

TransmissionWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    rpcUrl: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

TransmissionWidgetFields.defaultProps = {
  initialData: null,
};

export default TransmissionWidgetFields;