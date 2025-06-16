import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the FreshRSS widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function FreshrssWidgetFields({ initialData, onChange: parentOnChange }) {
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
      type: 'freshrss',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    if (!username?.trim()) {
      validationErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      validationErrors.password = 'API Password is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'freshrss';

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
        helperText={!url?.trim() ? 'URL is required.' : "e.g., http://freshrss.host.or.ip:port"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        required
        helperText={!username?.trim() ? 'Username is required.' : ""}
        error={!username?.trim()}
      />
      <EnvVarAutocompleteInput
        label="API Password"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        type="password" // Enable visibility toggle
        required
        helperText={!password?.trim() ? 'API Password is required.' : "Enable API and set password in FreshRSS settings."}
        error={!password?.trim()}
      />
    </Box>
  );
}

FreshrssWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

FreshrssWidgetFields.defaultProps = {
    initialData: null,
};

export default FreshrssWidgetFields;