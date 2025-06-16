import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // Added import

function AuthentikWidgetFields({ initialData, onChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'authentik',
      url: url || undefined,
      key: apiKey || undefined, // Maps to 'key' in YAML
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Authentik URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Token (key) is required.';
    }

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'authentik' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     // Ensure 'type' is always present, even if all other fields are cleared by user
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === 'authentik') {
        // If only type is present, it means all fields were empty or undefined.
        // Parent form will still receive this, and errors object will reflect missing mandatory fields.
    }


    onChange(dataForParent, errors);
  }, [url, apiKey, onChange]); // Depend on individual states and onChange

  // Handle changes for standard TextField (URL)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Token)
  const handleApiKeyChange = (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setApiKey(event.target.value);
  };


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Authentik URL"
        name="url"
        value={url} // Use individual state
        onChange={handleUrlChange} // Use specific handler
        fullWidth
        required
        type="url"
        helperText="Base URL of your Authentik instance (e.g., https://auth.example.com)"
      />
      <EnvVarAutocompleteInput
        label="API Token"
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        value={apiKey} // Use individual state
        onChange={handleApiKeyChange} // Use specific handler
        fullWidth
        required
        type="password" // Enables visibility toggle
        helperText="Authentik API Token (Intent: API Token, Permissions: View User, View Event). Can use {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

export default AuthentikWidgetFields;