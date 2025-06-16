import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function AtsumeruWidgetFields({ initialData, onChange: parentOnChange }) {
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
      type: 'atsumeru',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Atsumeru URL is required.';
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
    dataForParent.type = 'atsumeru';

    parentOnChange(dataForParent, validationErrors);
  }, [url, username, password, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Atsumeru URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'Atsumeru URL is required.' : "Example: http://atsumeru.host.or.ip:port"}
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
        label="Password"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        type="password" // Enable visibility toggle
        fullWidth
        required
        helperText={!password?.trim() ? 'Password is required.' : ""}
        error={!password?.trim()}
      />
      {/* Note: 'fields' array is not implemented in this basic form */}
    </Box>
  );
}

AtsumeruWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

AtsumeruWidgetFields.defaultProps = {
  initialData: null,
};

export default AtsumeruWidgetFields;