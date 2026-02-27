import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, FormControlLabel, Switch, Box, Typography } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function DispatcharrWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [enableActiveStreams, setEnableActiveStreams] = useState(initialData?.enableActiveStreams || false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setEnableActiveStreams(initialData.enableActiveStreams || false);
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
      setEnableActiveStreams(false);
    }
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'dispatcharr',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      enableActiveStreams: enableActiveStreams === false ? undefined : enableActiveStreams,
    };

    const errors = {};
    if (!url?.trim()) errors.url = 'URL is required.';
    if (!username?.trim()) errors.username = 'Username is required.';
    if (!password?.trim()) errors.password = 'Password is required.';
    setFieldErrors(errors);

    const dataForParent = { type: 'dispatcharr' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, username, password, enableActiveStreams, parentOnChange]);

  const handleAutocompleteChange = (setter) => (event) => setter(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Dispatcharr URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://dispatcharr.host:port"}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Dispatcharr username. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Dispatcharr password. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Optional Settings</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enableActiveStreams}
              onChange={(e) => setEnableActiveStreams(e.target.checked)}
              name="enableActiveStreams"
            />
          }
          label="Enable Active Streams Display"
        />
      </Box>
    </Box>
  );
}

DispatcharrWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    enableActiveStreams: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

DispatcharrWidgetFields.defaultProps = {
  initialData: null,
};

export default DispatcharrWidgetFields;
