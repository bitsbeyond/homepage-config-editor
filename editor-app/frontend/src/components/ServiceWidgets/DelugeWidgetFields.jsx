import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box, FormControlLabel, Switch } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function DelugeWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [enableLeechProgress, setEnableLeechProgress] = useState(initialData?.enableLeechProgress || false);

  useEffect(() => {
    setUrl(initialData?.url || '');
    setPassword(initialData?.password || '');
    setEnableLeechProgress(initialData?.enableLeechProgress || false);
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'deluge',
      url: url || undefined,
      password: password || undefined,
      enableLeechProgress: enableLeechProgress || undefined, // Keep if true, remove if false later
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Deluge URL is required.';
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
    // Remove enableLeechProgress if it's false (default value)
    if (dataForParent.enableLeechProgress === false) {
        delete dataForParent.enableLeechProgress;
    }
    dataForParent.type = 'deluge';


    parentOnChange(dataForParent, validationErrors);
  }, [url, password, enableLeechProgress, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleLeechProgressChange = (event) => setEnableLeechProgress(event.target.checked);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Deluge URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        helperText={!url?.trim() ? 'Deluge URL is required.' : "Base URL of your Deluge instance (e.g., http://deluge.host:8112)"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        type="password" // Enable visibility toggle
        required // Password is required for Deluge widget
        helperText={!password?.trim() ? 'Password is required.' : "Password for Deluge web interface."}
        error={!password?.trim()}
      />
      <FormControlLabel
        control={
          <Switch
            checked={enableLeechProgress}
            onChange={handleLeechProgressChange}
            name="enableLeechProgress"
          />
        }
        label="Enable Leech Progress"
        sx={{ mt: 1 }} // Add some top margin
      />
    </Box>
  );
}

DelugeWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    password: PropTypes.string,
    enableLeechProgress: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

DelugeWidgetFields.defaultProps = {
  initialData: null,
};

export default DelugeWidgetFields;