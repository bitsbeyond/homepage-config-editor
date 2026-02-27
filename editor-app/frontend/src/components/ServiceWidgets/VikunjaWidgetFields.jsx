import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function VikunjaWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [version, setVersion] = useState(initialData?.version ? String(initialData.version) : '1');
  const [enableTaskList, setEnableTaskList] = useState(initialData?.enableTaskList || false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setKey(initialData.key || '');
      setVersion(initialData.version ? String(initialData.version) : '1');
      setEnableTaskList(initialData.enableTaskList || false);
    } else {
      setUrl('');
      setKey('');
      setVersion('1');
      setEnableTaskList(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'vikunja',
      url: url || undefined,
      key: key || undefined,
      version: version !== '1' ? parseInt(version, 10) : undefined,
      enableTaskList: enableTaskList || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Vikunja API URL is required.';
    }
    if (!key?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'vikunja' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'vikunja';
    }

    parentOnChange(dataForParent, errors);
  }, [url, key, version, enableTaskList, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  // Handle changes for Checkbox
  const handleCheckboxChange = (setter) => (event) => {
      setter(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Vikunja API URL"
        type="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Vikunja API (e.g., https://vikunja.host.or.ip/api/v1)"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key"
        label="API Key"
        type="password"
        value={key}
        onChange={handleAutocompleteChange(setKey)}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Generate from Vikunja frontend settings. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControl fullWidth>
        <InputLabel id="vikunja-version-label">Widget Version</InputLabel>
        <Select
          labelId="vikunja-version-label"
          id="vikunja-version-select"
          name="version"
          value={version}
          label="Widget Version"
          onChange={handleTextFieldChange(setVersion)}
        >
          <MenuItem value="1">v1 (&lt; 1.0.0-rc4, Default)</MenuItem>
          <MenuItem value="2">v2 (&gt;= 1.0.0-rc4)</MenuItem>
        </Select>
        <FormHelperText>Use v2 for Vikunja 1.0.0-rc4 and newer.</FormHelperText>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={enableTaskList}
            onChange={handleCheckboxChange(setEnableTaskList)}
            name="enableTaskList"
          />
        }
        label="Enable Task List (Optional)"
      />
    </Box>
  );
}

VikunjaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enableTaskList: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

VikunjaWidgetFields.defaultProps = {
  initialData: null,
};

export default VikunjaWidgetFields;