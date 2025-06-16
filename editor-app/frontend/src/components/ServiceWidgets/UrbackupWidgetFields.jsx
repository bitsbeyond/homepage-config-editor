import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

// Allowed fields from the documentation
const allowedFields = ["ok", "errored", "noRecent", "totalUsed"];

function UrbackupWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [maxDays, setMaxDays] = useState(initialData?.maxDays || '');
  const [fields, setFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setMaxDays(initialData.maxDays || '');
      const newFields = initialData.fields || [];
      if (JSON.stringify(newFields) !== JSON.stringify(fields)) {
        setFields(newFields);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setMaxDays('');
      setFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'urbackup',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      maxDays: maxDays && maxDays.toString().trim() !== '' ? parseInt(maxDays, 10) : undefined,
      fields: fields.length > 0 ? fields : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'urbackup' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'urbackup';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, maxDays, JSON.stringify(fields), parentOnChange]); // Use JSON.stringify for fields array

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  const handleFieldsChange = (event) => {
    const { name, checked } = event.target;
    let updatedFields;

    if (checked) {
      updatedFields = [...fields, name];
    } else {
      updatedFields = fields.filter(field => field !== name);
    }

    setFields(updatedFields);
  };

  const currentFieldsSet = new Set(fields);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="UrBackup URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your UrBackup instance (e.g., http://urbackup.host.or.ip:55414)"}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "UrBackup username. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        fullWidth
        required
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "UrBackup password. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        label="Max Days Out of Date (Optional)"
        name="maxDays"
        type="number"
        value={maxDays}
        onChange={handleTextFieldChange(setMaxDays)}
        fullWidth
        helperText="Days before a client is marked 'Out of Date'. Defaults to 3."
        inputProps={{ min: 1 }}
      />
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormHelperText>Select fields to show. 'totalUsed' requires explicit selection.</FormHelperText>
        <FormGroup row>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={currentFieldsSet.has(field)}
                  onChange={handleFieldsChange}
                  name={field}
                />
              }
              label={field}
              sx={{ width: { xs: '50%', sm: '25%' } }}
            />
          ))}
        </FormGroup>
      </FormControl>
    </Box>
  );
}

UrbackupWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    maxDays: PropTypes.number,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

UrbackupWidgetFields.defaultProps = {
  initialData: null,
};

export default UrbackupWidgetFields;