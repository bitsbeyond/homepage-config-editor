import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box, MenuItem } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function ProxmoxvmWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [node, setNode] = useState(initialData?.node || '');
  const [vmid, setVmid] = useState(initialData?.vmid || '');
  const [type, setType] = useState(initialData?.vmtype || 'qemu'); // Read from 'vmtype', not 'type'
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      const newUsername = initialData.username || '';
      const newPassword = initialData.password || '';
      const newNode = initialData.node || '';
      const newVmid = initialData.vmid || '';
      const newType = initialData.vmtype || 'qemu'; // Read from 'vmtype', not 'type'

      if (newUrl !== url) setUrl(newUrl);
      if (newUsername !== username) setUsername(newUsername);
      if (newPassword !== password) setPassword(newPassword);
      if (newNode !== node) setNode(newNode);
      if (newVmid !== vmid) setVmid(newVmid);
      if (newType !== type) setType(newType);
    } else {
      // Reset to defaults
      setUrl('');
      setUsername('');
      setPassword('');
      setNode('');
      setVmid('');
      setType('qemu');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    // Don't include 'type' in currentWidgetData to avoid confusion with widget type
    const widgetFields = {
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      node: node || undefined,
      vmid: vmid || undefined,
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
    if (!node?.trim()) {
      errors.node = 'Node name is required.';
    }
    if (!vmid?.trim()) {
      errors.vmid = 'VM/Container ID is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from widgetFields before sending to parent
    const dataForParent = { type: 'proxmoxvm' };
    Object.keys(widgetFields).forEach(k => {
      if (widgetFields[k] !== undefined) {
        dataForParent[k] = widgetFields[k];
      }
    });

    // Add VM/container type if not default
    if (type && type !== 'qemu') {
      dataForParent.vmtype = type;
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, node, vmid, type, parentOnChange]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleUrlChange = useCallback((event) => setUrl(event.target.value), []);
  const handleUsernameChange = useCallback((event) => setUsername(event.target.value), []);
  const handlePasswordChange = useCallback((event) => setPassword(event.target.value), []);
  const handleNodeChange = useCallback((event) => setNode(event.target.value), []);
  const handleVmidChange = useCallback((event) => setVmid(event.target.value), []);
  const handleTypeChange = useCallback((event) => setType(event.target.value), []);

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
        label="Node Name"
        name="node"
        value={node}
        onChange={handleNodeChange}
        fullWidth
        required
        error={!!fieldErrors.node}
        helperText={fieldErrors.node || "Proxmox node name (e.g., pve-1)"}
      />
      <TextField
        label="VM/Container ID"
        name="vmid"
        value={vmid}
        onChange={handleVmidChange}
        fullWidth
        required
        error={!!fieldErrors.vmid}
        helperText={fieldErrors.vmid || "ID of the VM or container (e.g., 100, 101)"}
      />
      <TextField
        select
        label="Type"
        name="type"
        value={type}
        onChange={handleTypeChange}
        fullWidth
        helperText="Type of virtual machine (QEMU VM or LXC container). Default: qemu"
      >
        <MenuItem value="qemu">QEMU (Virtual Machine)</MenuItem>
        <MenuItem value="lxc">LXC (Container)</MenuItem>
      </TextField>
    </Box>
  );
}

ProxmoxvmWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    node: PropTypes.string,
    vmid: PropTypes.string,
    vmtype: PropTypes.string, // VM type (qemu/lxc), not widget type
  }),
  onChange: PropTypes.func.isRequired,
};

ProxmoxvmWidgetFields.defaultProps = {
  initialData: null,
};

export default ProxmoxvmWidgetFields;
