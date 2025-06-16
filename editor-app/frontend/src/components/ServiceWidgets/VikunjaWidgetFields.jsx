import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function VikunjaWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [enableTaskList, setEnableTaskList] = useState(initialData?.enableTaskList || false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setKey(initialData.key || '');
      setEnableTaskList(initialData.enableTaskList || false);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setKey('');
      setEnableTaskList(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'vikunja',
      url: url || undefined,
      key: key || undefined,
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
  }, [url, key, enableTaskList, parentOnChange]);

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
    enableTaskList: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

VikunjaWidgetFields.defaultProps = {
  initialData: null,
};

export default VikunjaWidgetFields;