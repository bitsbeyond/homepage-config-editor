import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the ESPHome widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function EsphomeWidgetFields({ initialData, onChange: parentOnChange }) {
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
      type: 'esphome',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    // Username and password are not strictly required by the form,
    // but if one is provided, the other might be expected by the ESPHome device.
    // For now, only URL is enforced by the form.

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'esphome';

    parentOnChange(dataForParent, validationErrors);
  }, [url, username, password, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'URL is required.' : "e.g., http://esphome.host.or.ip:port"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Username (Optional)"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        helperText="Only required if ESPHome authentication is enabled."
      />
      <EnvVarAutocompleteInput
        label="Password (Optional)"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        type="password" // Enable visibility toggle
        helperText="Only required if ESPHome authentication is enabled."
      />
    </Box>
  );
}

EsphomeWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

EsphomeWidgetFields.defaultProps = {
    initialData: null,
};

export default EsphomeWidgetFields;