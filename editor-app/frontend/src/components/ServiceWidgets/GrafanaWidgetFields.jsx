import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box'; // Added Box for consistent layout
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the Grafana widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function GrafanaWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');

  useEffect(() => {
    setUrl(initialData?.url || '');
    setUsername(initialData?.username || '');
    setPassword(initialData?.password || '');
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'grafana',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Grafana URL is required.';
    }
    if (!username?.trim()) {
      validationErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      validationErrors.password = 'Password is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'grafana';

    parentOnChange(dataForParent, validationErrors);
  }, [url, username, password, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Grafana URL"
        variant="outlined" // Retained variant
        fullWidth
        name="url"
        value={url}
        onChange={handleUrlChange}
        helperText={!url?.trim() ? 'Grafana URL is required.' : "e.g., http://grafana.local:3000"}
        required
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        required
        helperText={!username?.trim() ? 'Username is required.' : "Grafana Username"}
        error={!username?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        type="password" // Enable visibility toggle
        required
        helperText={!password?.trim() ? 'Password is required.' : "Grafana Password"}
        error={!password?.trim()}
      />
    </Box>
  );
}

GrafanaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

GrafanaWidgetFields.defaultProps = {
  initialData: null,
};

export default GrafanaWidgetFields;