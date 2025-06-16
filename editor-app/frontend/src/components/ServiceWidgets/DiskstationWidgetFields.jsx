import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function DiskstationWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [volume, setVolume] = useState(initialData?.volume || '');

  useEffect(() => {
    setUrl(initialData?.url || '');
    setUsername(initialData?.username || '');
    setPassword(initialData?.password || '');
    setVolume(initialData?.volume || '');
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'diskstation',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      volume: volume || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    if (!username?.trim()) {
      validationErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      validationErrors.password = 'Password is required.';
    }
    // volume is optional

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'diskstation';

    parentOnChange(dataForParent, validationErrors);
  }, [url, username, password, volume, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleVolumeChange = (event) => setVolume(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'URL is required.' : "e.g., http://diskstation.host.or.ip:port"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        required
        helperText={!username?.trim() ? 'Username is required.' : "Admin user required for system metrics."}
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
        helperText={!password?.trim() ? 'Password is required.' : "2FA is not supported."}
        error={!password?.trim()}
      />
      <TextField
        label="Volume (Optional)"
        name="volume"
        value={volume}
        onChange={handleVolumeChange}
        fullWidth
        helperText="e.g., volume_1, volume_2. Defaults to first available."
      />
    </Box>
  );
}

DiskstationWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    volume: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

DiskstationWidgetFields.defaultProps = {
    initialData: null,
};

export default DiskstationWidgetFields;