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

const ALLOWED_FIELDS = [
  'running', 'stopped', 'total', 'images',
  'images_used', 'images_unused', 'image_updates',
];

function ArcaneWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [env, setEnv] = useState(initialData?.env !== undefined ? String(initialData.env) : '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setEnv(initialData.env !== undefined ? String(initialData.env) : '');
      setSelectedFields(initialData.fields || []);
    } else {
      setUrl('');
      setApiKey('');
      setEnv('');
      setSelectedFields([]);
    }
  }, [initialData]);

  useEffect(() => {
    const envInt = env?.trim() ? parseInt(env, 10) : undefined;

    const currentWidgetData = {
      type: 'arcane',
      url: url || undefined,
      key: apiKey || undefined,
      env: !isNaN(envInt) ? envInt : undefined,
      fields: selectedFields && selectedFields.length > 0 ? selectedFields : undefined,
    };

    const errors = {};
    if (!url?.trim()) errors.url = 'URL is required.';
    if (!apiKey?.trim()) errors.key = 'API Key is required.';
    if (!env?.trim()) {
      errors.env = 'Environment ID is required.';
    } else if (isNaN(parseInt(env, 10))) {
      errors.env = 'Environment ID must be a number.';
    }
    if (selectedFields.length > 4) errors.fields = 'Maximum 4 fields allowed.';
    setFieldErrors(errors);

    const dataForParent = { type: 'arcane' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, env, JSON.stringify(selectedFields), parentOnChange]);

  const handleTextFieldChange = useCallback((setter) => (event) => setter(event.target.value), []);
  const handleAutocompleteChange = useCallback((setter) => (event) => setter(event.target.value), []);

  const handleFieldsCheckboxChange = useCallback((event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        if (prevFields.length < 4) return [...prevFields, name];
        return prevFields;
      }
      return prevFields.filter((field) => field !== name);
    });
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Arcane URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://arcane.host:port"}
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
        helperText={fieldErrors.key || "Arcane API Key. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        label="Environment ID"
        name="env"
        value={env}
        onChange={handleTextFieldChange(setEnv)}
        fullWidth
        required
        type="number"
        error={!!fieldErrors.env}
        helperText={fieldErrors.env || "Numeric environment ID from Arcane."}
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
              label={field.replace(/_/g, ' ')}
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

ArcaneWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    env: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

ArcaneWidgetFields.defaultProps = {
  initialData: null,
};

export default ArcaneWidgetFields;
