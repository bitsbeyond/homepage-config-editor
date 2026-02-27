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
  'running', 'stopped', 'paused', 'total', 'cpu', 'memory',
  'images', 'volumes', 'events_today', 'pending_updates', 'stacks',
];

function DockhandWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [environment, setEnvironment] = useState(initialData?.environment || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setEnvironment(initialData.environment || '');
      setSelectedFields(initialData.fields || []);
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
      setEnvironment('');
      setSelectedFields([]);
    }
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'dockhand',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      environment: environment || undefined,
      fields: selectedFields && selectedFields.length > 0 ? selectedFields : undefined,
    };

    const errors = {};
    if (!url?.trim()) errors.url = 'URL is required.';
    if (!username?.trim()) errors.username = 'Username is required.';
    if (!password?.trim()) errors.password = 'Password is required.';
    if (selectedFields.length > 4) errors.fields = 'Maximum 4 fields allowed.';
    setFieldErrors(errors);

    const dataForParent = { type: 'dockhand' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, username, password, environment, JSON.stringify(selectedFields), parentOnChange]);

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
        label="Dockhand URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://dockhand.host:port"}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Dockhand username. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Dockhand password. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        label="Environment (Optional)"
        name="environment"
        value={environment}
        onChange={handleTextFieldChange(setEnvironment)}
        fullWidth
        helperText="Optional environment identifier."
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

DockhandWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    environment: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

DockhandWidgetFields.defaultProps = {
  initialData: null,
};

export default DockhandWidgetFields;
