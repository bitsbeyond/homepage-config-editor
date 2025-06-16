import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the Beszel widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function BeszelWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [systemId, setSystemId] = useState(initialData?.systemId || '');
  const [version, setVersion] = useState(initialData?.version || '');

  useEffect(() => {
    setUrl(initialData?.url || '');
    setUsername(initialData?.username || '');
    setPassword(initialData?.password || '');
    setSystemId(initialData?.systemId || '');
    setVersion(initialData?.version || '');
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'beszel',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      systemId: systemId || undefined,
      version: version || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Beszel URL is required.';
    }
    if (!username?.trim()) {
      validationErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      validationErrors.password = 'Password is required.';
    }
    // systemId and version are optional

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'beszel';
    // Ensure optional fields that have a default (like version if it was '1' by default in Homepage) are handled
    // Here, if version is empty string (meaning user selected "Default (1)"), we remove it so Homepage uses its default.
    if (dataForParent.version === '') {
        delete dataForParent.version;
    }


    parentOnChange(dataForParent, validationErrors);
  }, [url, username, password, systemId, version, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleSystemIdChange = (event) => setSystemId(event.target.value);
  const handleVersionChange = (event) => setVersion(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Beszel URL"
        value={url}
        onChange={handleUrlChange}
        helperText={!url?.trim() ? 'Beszel URL is required.' : "The base URL of your Beszel instance."}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username"
        label="Username (Email)"
        value={username}
        onChange={handleUsernameChange}
        helperText={!username?.trim() ? 'Username is required.' : "Beszel superuser email."}
        error={!username?.trim()}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password"
        label="Password"
        type="password" // Enable visibility toggle
        value={password}
        onChange={handlePasswordChange}
        helperText={!password?.trim() ? 'Password is required.' : "Beszel superuser password."}
        error={!password?.trim()}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          name="systemId"
          label="System ID (Optional)"
          value={systemId}
          onChange={handleSystemIdChange}
          helperText="Leave empty for overview, or provide ID/name for single system."
        />
        <FormControl fullWidth>
          <InputLabel id="beszel-version-label">API Version (Optional)</InputLabel>
          <Select
            labelId="beszel-version-label"
            name="version"
            value={version}
            label="API Version (Optional)"
            onChange={handleVersionChange}
          >
            <MenuItem value=""><em>Default (1)</em></MenuItem>
            <MenuItem value={1}>{'1 (< 0.9.0)'}</MenuItem>
            <MenuItem value={2}>{'2 (>= 0.9.0)'}</MenuItem>
          </Select>
          <FormHelperText>Select based on your Beszel version.</FormHelperText>
        </FormControl>
      </Box>
    </Box>
  );
}

BeszelWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    systemId: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

BeszelWidgetFields.defaultProps = {
  initialData: null,
};

export default BeszelWidgetFields;