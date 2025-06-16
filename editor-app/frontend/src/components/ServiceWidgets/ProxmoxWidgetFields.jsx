import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function ProxmoxWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [node, setNode] = useState(initialData?.node || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      const newUsername = initialData.username || '';
      const newPassword = initialData.password || '';
      const newNode = initialData.node || '';

      if (newUrl !== url) setUrl(newUrl);
      if (newUsername !== username) setUsername(newUsername);
      if (newPassword !== password) setPassword(newPassword);
      if (newNode !== node) setNode(newNode);
    } else {
      // Reset to defaults
      setUrl('');
      setUsername('');
      setPassword('');
      setNode('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'proxmox',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      node: node || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Proxmox URL is required.';
    }
    if (!username?.trim()) {
      errors.username = 'API Token User is required.';
    }
    if (!password?.trim()) {
      errors.password = 'API Token Secret is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'proxmox' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, username, password, node, parentOnChange]);

  // Handle changes for individual fields
  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleNodeChange = (event) => setNode(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Proxmox URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Proxmox instance (e.g., https://proxmox.host:8006)"}
      />
      <EnvVarAutocompleteInput
        label="API Token User"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Format: user@realm!tokenid (e.g., api@pam!homepage). Can use {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        label="API Token Secret"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "The secret value generated for the API Token. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        label="Node Name (Optional)"
        name="node"
        value={node}
        onChange={handleNodeChange}
        fullWidth
        helperText="Optional. Specify a node name to show its metrics (e.g., pve-1). Defaults to cluster average."
      />
    </Box>
  );
}

ProxmoxWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    node: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ProxmoxWidgetFields.defaultProps = {
  initialData: null,
};

export default ProxmoxWidgetFields;