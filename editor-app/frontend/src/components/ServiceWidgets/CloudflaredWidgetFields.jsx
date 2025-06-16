import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box'; // Changed from Grid
import Alert from '@mui/material/Alert';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function CloudflaredWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [accountId, setAccountId] = useState(initialData?.accountid || '');
  const [tunnelId, setTunnelId] = useState(initialData?.tunnelid || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setAccountId(initialData.accountid || '');
      setTunnelId(initialData.tunnelid || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setAccountId('');
      setTunnelId('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'cloudflared',
      accountid: accountId || undefined,
      tunnelid: tunnelId || undefined,
      key: apiKey || undefined, // Maps to 'key' in YAML
    };

    const errors = {};
    if (!accountId?.trim()) {
      errors.accountid = 'Account ID is required.';
    }
    if (!tunnelId?.trim()) {
      errors.tunnelid = 'Tunnel ID is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Token (key) is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'cloudflared' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'cloudflared';
    }


    parentOnChange(dataForParent, errors);
  }, [accountId, tunnelId, apiKey, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (Account ID, Tunnel ID)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Token)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };


  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ mb: 0 }}> {/* Adjusted margin for Box gap */}
        Requires an API Token with 'Account.Cloudflare Tunnel:Read' permission.
      </Alert>
      <TextField
        required
        fullWidth
        name="accountid"
        label="Account ID"
        value={accountId} // Use individual state
        onChange={handleTextFieldChange(setAccountId)} // Use specific handler with setter
        error={!!fieldErrors.accountid}
        helperText={fieldErrors.accountid || "Found in your Zero Trust dashboard URL."}
      />
      <TextField
        required
        fullWidth
        name="tunnelid"
        label="Tunnel ID"
        value={tunnelId} // Use individual state
        onChange={handleTextFieldChange(setTunnelId)} // Use specific handler with setter
        error={!!fieldErrors.tunnelid}
        helperText={fieldErrors.tunnelid || "Found in the Tunnels dashboard under the tunnel name."}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Token"
        type="password" // Enables visibility toggle
        value={apiKey} // Use individual state
        onChange={handleAutocompleteChange(setApiKey)} // Use specific handler with setter
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Create at dash.cloudflare.com/profile/api-tokens. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

CloudflaredWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    accountid: PropTypes.string,
    tunnelid: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

CloudflaredWidgetFields.defaultProps = {
  initialData: null,
};

export default CloudflaredWidgetFields;