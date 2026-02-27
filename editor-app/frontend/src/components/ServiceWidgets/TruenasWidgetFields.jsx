import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function TruenasWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [enablePools, setEnablePools] = useState(initialData?.enablePools || false);
  const [nasType, setNasType] = useState(initialData?.nasType || 'scale');
  const [version, setVersion] = useState(initialData?.version ? String(initialData.version) : '1');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setKey(initialData.key || '');
      setEnablePools(initialData.enablePools || false);
      setNasType(initialData.nasType || 'scale');
      setVersion(initialData.version ? String(initialData.version) : '1');
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
      setKey('');
      setEnablePools(false);
      setNasType('scale');
      setVersion('1');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'truenas',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      key: key || undefined,
      enablePools: enablePools || undefined,
      nasType: nasType !== 'scale' ? nasType : undefined,
      version: version !== '1' ? parseInt(version, 10) : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'TrueNAS URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'truenas' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'truenas';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, key, enablePools, nasType, version, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  // Handle changes for Switch
  const handleSwitchChange = (setter) => (event) => {
      setter(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="TrueNAS URL"
        type="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your TrueNAS instance (e.g., http://truenas.local)"}
      />
      <Typography variant="caption" sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
        Authentication (use Username/Password OR API Key):
      </Typography>
      <EnvVarAutocompleteInput
        fullWidth
        name="username"
        label="Username (Optional)"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        helperText="Optional. TrueNAS username (if not using API Key). Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password"
        label="Password (Optional)"
        type="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        helperText="Optional. TrueNAS password (if not using API Key). Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="key"
        label="API Key (Optional)"
        type="password"
        value={key}
        onChange={handleAutocompleteChange(setKey)}
        helperText="Optional. API Key (takes precedence over username/password). Can be a {{HOMEPAGE_VAR_...}}"
      />
      <FormControl fullWidth>
        <InputLabel id="truenas-nastype-label">NAS Type</InputLabel>
        <Select
          labelId="truenas-nastype-label"
          id="truenas-nastype-select"
          name="nasType"
          value={nasType}
          label="NAS Type"
          onChange={handleTextFieldChange(setNasType)}
        >
          <MenuItem value="scale">Scale (Default)</MenuItem>
          <MenuItem value="core">Core</MenuItem>
        </Select>
        <FormHelperText>Required if 'Enable Pools' is checked for TrueNAS Core.</FormHelperText>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="truenas-version-label">Widget Version</InputLabel>
        <Select
          labelId="truenas-version-label"
          id="truenas-version-select"
          name="version"
          value={version}
          label="Widget Version"
          onChange={handleTextFieldChange(setVersion)}
        >
          <MenuItem value="1">v1 (&lt;= 25.04, Default)</MenuItem>
          <MenuItem value="2">v2 (&gt; 25.04, WebSocket API)</MenuItem>
        </Select>
        <FormHelperText>Use v2 for TrueNAS versions after 25.04 (uses WebSocket API).</FormHelperText>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={enablePools} onChange={handleSwitchChange(setEnablePools)} name="enablePools" />}
        label="Enable Pool Listing"
      />
    </Box>
  );
}

TruenasWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    key: PropTypes.string,
    enablePools: PropTypes.bool,
    nasType: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

TruenasWidgetFields.defaultProps = {
  initialData: null,
};

export default TruenasWidgetFields;