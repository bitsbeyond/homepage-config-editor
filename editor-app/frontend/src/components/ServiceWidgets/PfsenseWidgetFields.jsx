import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function PfsenseWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [wan, setWan] = useState(initialData?.wan || '');
  const [version, setVersion] = useState(initialData?.version || 1);
  const [fieldsString, setFieldsString] = useState(
    initialData?.fields_string || (initialData?.fields?.join(', ') || '')
  );
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [apiKey, setApiKey] = useState(initialData?.['X-API-Key'] || '');
  const [clientId, setClientId] = useState(initialData?.client_id || '');
  const [clientToken, setClientToken] = useState(initialData?.client_token || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) setUrl(newUrl);

      const newWan = initialData.wan || '';
      if (newWan !== wan) setWan(newWan);

      const newVersion = initialData.version || 1;
      if (newVersion !== version) setVersion(newVersion);

      const newFieldsString = initialData.fields_string || (initialData.fields?.join(', ') || '');
      if (newFieldsString !== fieldsString) setFieldsString(newFieldsString);

      const newUsername = initialData.username || '';
      if (newUsername !== username) setUsername(newUsername);

      const newPassword = initialData.password || '';
      if (newPassword !== password) setPassword(newPassword);

      const newApiKey = initialData['X-API-Key'] || '';
      if (newApiKey !== apiKey) setApiKey(newApiKey);

      const newClientId = initialData.client_id || '';
      if (newClientId !== clientId) setClientId(newClientId);

      const newClientToken = initialData.client_token || '';
      if (newClientToken !== clientToken) setClientToken(newClientToken);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      if ('' !== url) setUrl('');
      if ('' !== wan) setWan('');
      if (1 !== version) setVersion(1);
      if ('' !== fieldsString) setFieldsString('');
      if ('' !== username) setUsername('');
      if ('' !== password) setPassword('');
      if ('' !== apiKey) setApiKey('');
      if ('' !== clientId) setClientId('');
      if ('' !== clientToken) setClientToken('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'pfsense',
      url: url || undefined,
      wan: wan || undefined,
      version: version !== 1 ? version : undefined, // Only include if not default (1)
    };

    // Handle fields array conversion
    const fieldsArray = fieldsString.split(',').map(f => f.trim()).filter(f => f);
    if (fieldsArray.length > 0) {
      currentWidgetData.fields = fieldsArray;
      // We also keep fields_string for consistency if the user edited it directly,
      // though 'fields' array is what Homepage primarily uses.
      currentWidgetData.fields_string = fieldsString;
    }

    let apiKeyAuthUsed = false;
    const headers = {};

    if (version === 2 && apiKey?.trim()) {
      headers['X-API-Key'] = apiKey;
      currentWidgetData['X-API-Key'] = apiKey; // Store the key directly as per docs
      apiKeyAuthUsed = true;
    } else if (version === 1 && clientId?.trim() && clientToken?.trim()) {
      headers['Authorization'] = `${clientId} ${clientToken}`;
      currentWidgetData.client_id = clientId; // Store client_id
      currentWidgetData.client_token = clientToken; // Store client_token
      apiKeyAuthUsed = true;
    }

    if (apiKeyAuthUsed) {
      // If API key auth is used, ensure username/password are not part of the data
      // and add headers if they were constructed.
      if (Object.keys(headers).length > 0) {
        currentWidgetData.headers = headers;
      }
      // Explicitly remove username/password from the object to be sent
      delete currentWidgetData.username;
      delete currentWidgetData.password;
    } else {
      // API key auth is NOT used, so use username/password if provided
      if (username?.trim()) {
        currentWidgetData.username = username;
      }
      if (password?.trim()) {
        currentWidgetData.password = password;
      }
      // Ensure API key/token specific fields are not present
      delete currentWidgetData['X-API-Key'];
      delete currentWidgetData.client_id;
      delete currentWidgetData.client_token;
      delete currentWidgetData.headers; // Also remove headers if username/password is the mode
    }

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'pfSense URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'pfsense' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, wan, version, fieldsString, username, password, apiKey, clientId, clientToken]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setter(event.target.value);
  };

  // Special handler for version change
  const handleVersionChange = (event) => {
    const newVersion = event.target.value;
    setVersion(newVersion);
    // Clear incompatible auth fields when version changes
    if (newVersion === 1) {
      setApiKey('');
    } else if (newVersion === 2) {
      setClientId('');
      setClientToken('');
    }
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="pfSense URL"
        variant="outlined"
        fullWidth
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your pfSense instance (e.g., https://pfsense.local)"}
      />
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="WAN Interface Name"
          variant="outlined"
          fullWidth
          name="wan"
          value={wan}
          onChange={handleTextFieldChange(setWan)}
          helperText="Optional. Interface name (e.g., igb0)"
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel id="pfsense-version-label">API Version</InputLabel>
          <Select
            labelId="pfsense-version-label"
            id="pfsense-version-select"
            name="version"
            value={version}
            label="API Version"
            onChange={handleVersionChange}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
          </Select>
          <Typography variant="caption" sx={{ pl: 1.5 }}>Defaults to 1</Typography>
        </FormControl>
      </Box>

      <TextField
        label="Fields to Display"
        variant="outlined"
        fullWidth
        name="fields_string"
        value={fieldsString}
        onChange={handleTextFieldChange(setFieldsString)}
        helperText="Optional. Comma-separated (e.g., load,memory,temp,wanStatus). Max 4."
      />

      {/* --- Authentication --- */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
        Authentication (Optional - Use API Key/Token OR Username/Password)
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        API Key/Token (Headers) takes precedence if provided.
      </Typography>

      {/* v2 Auth */}
      {version === 2 && (
        <EnvVarAutocompleteInput
          label="API Key (v2)"
          name="X-API-Key"
          value={apiKey}
          onChange={handleAutocompleteChange(setApiKey)}
          fullWidth
          type="password"
          helperText="pfSense API Key (for API v2). Can use {{HOMEPAGE_VAR_...}}"
        />
      )}

      {/* v1 Auth */}
      {version === 1 && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <EnvVarAutocompleteInput
            label="Client ID (v1)"
            name="client_id"
            value={clientId}
            onChange={handleAutocompleteChange(setClientId)}
            fullWidth
            helperText="pfSense API Client ID (for API v1). Can use {{HOMEPAGE_VAR_...}}"
          />
          <EnvVarAutocompleteInput
            label="Client Token (v1)"
            name="client_token"
            value={clientToken}
            onChange={handleAutocompleteChange(setClientToken)}
            fullWidth
            type="password"
            helperText="pfSense API Client Token (for API v1). Can use {{HOMEPAGE_VAR_...}}"
          />
        </Box>
      )}

      {/* Separator */}
      <Box sx={{ textAlign: 'center', my: 1 }}>
        <Typography variant="overline">OR</Typography>
      </Box>

      {/* Username/Password Auth */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <EnvVarAutocompleteInput
          label="Username"
          name="username"
          value={username}
          onChange={handleAutocompleteChange(setUsername)}
          fullWidth
          helperText="pfSense Admin Username. Can use {{HOMEPAGE_VAR_...}}"
        />
        <EnvVarAutocompleteInput
          label="Password"
          name="password"
          value={password}
          onChange={handleAutocompleteChange(setPassword)}
          fullWidth
          type="password"
          helperText="pfSense Admin Password. Can use {{HOMEPAGE_VAR_...}}"
        />
      </Box>
    </Box>
  );
}

PfsenseWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    wan: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fields: PropTypes.arrayOf(PropTypes.string),
    fields_string: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    headers: PropTypes.object,
    'X-API-Key': PropTypes.string,
    client_id: PropTypes.string,
    client_token: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

PfsenseWidgetFields.defaultProps = {
  initialData: null,
};

export default PfsenseWidgetFields;