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

function NetalertxWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [version, setVersion] = useState(initialData?.version ? String(initialData.version) : '1');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newKey = initialData.key || '';
      if (newKey !== key) {
        setKey(newKey);
      }
      const newVersion = initialData.version ? String(initialData.version) : '1';
      if (newVersion !== version) setVersion(newVersion);
    } else {
      setUrl('');
      setKey('');
      setVersion('1');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'netalertx',
      url: url || undefined,
      key: key || undefined,
      version: version !== '1' ? parseInt(version, 10) : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for NetAlertX widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'netalertx' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'netalertx';
    }

    parentOnChange(dataForParent, errors);
  }, [url, key, version, parentOnChange]);

  // Handle changes for standard TextFields (URL)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Key)
  const handleKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setKey(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="NetAlertX URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your NetAlertX instance (e.g., http://192.168.1.100:20211)"}
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="key"
        label="SYNC API Token (Optional)"
        type="password" // Enables visibility toggle
        value={key}
        onChange={handleKeyChange}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Required only if password protection is enabled in NetAlertX. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControl fullWidth>
        <InputLabel id="netalertx-version-label">Widget Version</InputLabel>
        <Select
          labelId="netalertx-version-label"
          id="netalertx-version-select"
          name="version"
          value={version}
          label="Widget Version"
          onChange={(e) => setVersion(e.target.value)}
        >
          <MenuItem value="1">v1 (&lt; 26.1.17, Default)</MenuItem>
          <MenuItem value="2">v2 (&gt;= 26.1.17)</MenuItem>
        </Select>
        <FormHelperText>Use v2 for NetAlertX &gt;= 26.1.17. Use the backend port for v2.</FormHelperText>
      </FormControl>
    </Box>
  );
}

NetalertxWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

NetalertxWidgetFields.defaultProps = {
  initialData: null,
};

export default NetalertxWidgetFields;