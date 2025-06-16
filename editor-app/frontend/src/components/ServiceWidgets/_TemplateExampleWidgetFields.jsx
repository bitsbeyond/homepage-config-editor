import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Box,
  Typography,
  // Import other MUI components as needed (e.g., Checkbox, Select)
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

// This is an example template. Real widgets would get their specific details
// from Homepage documentation.
const WIDGET_TYPE = '_templateexample';

function TemplateExampleWidgetFields({ initialData, onChange }) {
  // --- State for each field ---
  // Mandatory fields
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML for API Key
  const [username, setUsername] = useState(initialData?.username || '');

  // Optional fields (examples)
  const [apiToken, setApiToken] = useState(initialData?.apiToken || ''); // Example optional secret
  const [password, setPassword] = useState(initialData?.password || ''); // Example optional secret
  const [accountId, setAccountId] = useState(initialData?.accountId || ''); // Example optional plain text
  const [tunnelId, setTunnelId] = useState(initialData?.tunnelId || '');   // Example optional plain text
  const [someOtherOptionalField, setSomeOtherOptionalField] = useState(initialData?.someOtherOptionalField || '');


  // --- Effect to update parent and validate ---
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined, // Maps to 'key' in YAML
      username: username || undefined,
      apiToken: apiToken || undefined,
      password: password || undefined,
      accountId: accountId || undefined,
      tunnelId: tunnelId || undefined,
      someOtherOptionalField: someOtherOptionalField || undefined,
    };

    const validationErrors = {};

    // --- Mandatory field checks ---
    if (!url?.trim()) {
      validationErrors.url = 'Service URL is required.';
    }
    if (!apiKey?.trim()) {
      // 'key' is the field name in the YAML/data object
      validationErrors.key = 'API Key is required.';
    }
    if (!username?.trim()) {
      validationErrors.username = 'Username is required.';
    }
    // Add more mandatory checks as needed for a real widget

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === WIDGET_TYPE) {
        // If only type is present, pass null or an empty object for data to signify no data
        // However, parent forms expect an object, so an object with only type is fine.
        // Or, if it's truly "empty" and widget should be removed, parent form handles that.
        // For now, always pass the object with type.
    }


    onChange(dataForParent, validationErrors);
  }, [
    url,
    apiKey,
    username,
    apiToken,
    password,
    accountId,
    tunnelId,
    someOtherOptionalField,
    onChange,
  ]);

  // --- Initialize state from initialData (e.g., when editing) ---
  // This useEffect handles updates if initialData itself changes instance
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setUsername(initialData.username || '');
      setApiToken(initialData.apiToken || '');
      setPassword(initialData.password || '');
      setAccountId(initialData.accountId || '');
      setTunnelId(initialData.tunnelId || '');
      setSomeOtherOptionalField(initialData.someOtherOptionalField || '');
    } else {
        // Reset to defaults if initialData becomes null (e.g. widget deselected)
        setUrl('');
        setApiKey('');
        setUsername('');
        setApiToken('');
        setPassword('');
        setAccountId('');
        setTunnelId('');
        setSomeOtherOptionalField('');
    }
  }, [initialData]);


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Example Widget Configuration ({WIDGET_TYPE})
      </Typography>

      {/* Mandatory Fields Examples */}
      <TextField
        label="Service URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        type="url"
        helperText="e.g., http://example-service.com"
        // Example of showing error directly (optional, parent handles save disabling)
        // error={!!(validationErrorsFromParent?.url)}
        // helperText={validationErrorsFromParent?.url || "e.g., http://example-service.com"}
      />

      <EnvVarAutocompleteInput
        label="API Key (mandatory)"
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)} // e.target.value comes from EnvVarInput
        fullWidth
        required
        type="password"
        helperText="The main API Key for the service. Can use {{HOMEPAGE_VAR_...}} or {{HOMEPAGE_FILE_...}}"
      />

      <EnvVarAutocompleteInput
        label="Username (mandatory)"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        required
        helperText="Service username. Can use {{HOMEPAGE_VAR_...}} or {{HOMEPAGE_FILE_...}}"
      />

      {/* Optional Fields Examples */}
      <EnvVarAutocompleteInput
        label="API Token (optional)"
        name="apiToken"
        value={apiToken}
        onChange={(e) => setApiToken(e.target.value)}
        fullWidth
        type="password"
        helperText="An optional secondary API Token. Can use {{HOMEPAGE_VAR_...}} or {{HOMEPAGE_FILE_...}}"
      />

      <EnvVarAutocompleteInput
        label="Password (optional)"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        type="password"
        helperText="An optional password. Can use {{HOMEPAGE_VAR_...}} or {{HOMEPAGE_FILE_...}}"
      />

      <TextField
        label="Account ID (optional)"
        name="accountId"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        fullWidth
        helperText="e.g., 123456789"
      />

      <TextField
        label="Tunnel ID (optional)"
        name="tunnelId"
        value={tunnelId}
        onChange={(e) => setTunnelId(e.target.value)}
        fullWidth
        helperText="e.g., abcdef-1234-5678-..."
      />
      <TextField
        label="Some Other Optional Field"
        name="someOtherOptionalField"
        value={someOtherOptionalField}
        onChange={(e) => setSomeOtherOptionalField(e.target.value)}
        fullWidth
      />
    </Box>
  );
}

TemplateExampleWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    username: PropTypes.string,
    apiToken: PropTypes.string,
    password: PropTypes.string,
    accountId: PropTypes.string,
    tunnelId: PropTypes.string,
    someOtherOptionalField: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

TemplateExampleWidgetFields.defaultProps = {
  initialData: null, // Parent form should provide { type: WIDGET_TYPE } at minimum if widget selected
};

export default TemplateExampleWidgetFields;
