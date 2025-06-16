import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function QnapWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [volume, setVolume] = useState(initialData?.volume || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setVolume(initialData.volume || '');
    } else {
      // Reset to defaults if initialData becomes null
      setUrl('');
      setUsername('');
      setPassword('');
      setVolume('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'qnap',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      volume: volume || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'QNAP URL is required.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'qnap' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, username, password, volume, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="QNAP URL"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://qnap.local:8080"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username"
        label="Username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "QNAP Username. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "QNAP Password. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        fullWidth
        name="volume"
        label="Volume Name (Optional)"
        value={volume}
        onChange={handleTextFieldChange(setVolume)}
        helperText="Specify a single volume name to track its usage"
      />
    </Box>
  );
}

QnapWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    volume: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

QnapWidgetFields.defaultProps = {
  initialData: null,
};

export default QnapWidgetFields;