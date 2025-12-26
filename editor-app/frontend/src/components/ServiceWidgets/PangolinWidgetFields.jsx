import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const ALLOWED_FIELDS = ['sites', 'resources', 'targets', 'traffic', 'in', 'out'];

function PangolinWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [org, setOrg] = useState(initialData?.org || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setOrg(initialData.org || '');
      setSelectedFields(initialData.fields || []);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setOrg('');
      setSelectedFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'pangolin',
      url: url || undefined,
      key: apiKey || undefined,
      org: org || undefined,
      fields: selectedFields && selectedFields.length > 0 ? selectedFields : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    if (!org?.trim()) {
      errors.org = 'Organization ID is required.';
    }
    if (selectedFields.length > 4) {
      errors.fields = 'Maximum 4 fields allowed.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'pangolin' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'pangolin';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, org, JSON.stringify(selectedFields), parentOnChange]);

  // Helper functions (memoized to prevent flickering)
  const handleTextFieldChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleAutocompleteChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleFieldsCheckboxChange = useCallback((event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        // Only add if we haven't reached max of 4
        if (prevFields.length < 4) {
          return [...prevFields, name];
        }
        return prevFields;
      }
      return prevFields.filter((field) => field !== name);
    });
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Pangolin URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., https://api.pangolin.net"}
      />

      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleAutocompleteChange(setApiKey)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "API Key (requires 'List Sites' and 'List Resources' permissions). Can use {{HOMEPAGE_VAR_...}}"}
      />

      <TextField
        label="Organization ID"
        name="org"
        value={org}
        onChange={handleTextFieldChange(setOrg)}
        fullWidth
        required
        error={!!fieldErrors.org}
        helperText={fieldErrors.org || "Your organization ID (found in dashboard URL)"}
      />

      <FormControl component="fieldset" fullWidth error={!!fieldErrors.fields}>
        <FormLabel component="legend">Fields to Display (optional, max 4)</FormLabel>
        <FormGroup>
          {ALLOWED_FIELDS.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldsCheckboxChange}
                  name={field}
                  disabled={!selectedFields.includes(field) && selectedFields.length >= 4}
                />
              }
              label={field}
            />
          ))}
        </FormGroup>
        <FormHelperText>
          {fieldErrors.fields || `Select up to 4 fields to display. ${selectedFields.length}/4 selected.`}
        </FormHelperText>
      </FormControl>
    </Box>
  );
}

PangolinWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    org: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

PangolinWidgetFields.defaultProps = {
  initialData: null,
};

export default PangolinWidgetFields;
