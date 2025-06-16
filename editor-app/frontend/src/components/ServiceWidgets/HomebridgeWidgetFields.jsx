import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Typography,
  Box,
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'homebridge';
const ALLOWED_FIELDS_OPTIONS = [ // Renamed for clarity
  "updates",
  "child_bridges",
];

function HomebridgeWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fields, setFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({}); // State for local field errors

  // Effect to update local state if initialData changes (e.g., when editing or widget type changes)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setFields(initialData.fields || []);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setFields([]);
      setFieldErrors({}); // Reset errors when initialData changes
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      fields: fields && fields.length > 0 ? fields : undefined,
    };

    const calculatedErrors = {}; // Renamed to avoid confusion
    if (!url?.trim()) {
      calculatedErrors.url = 'URL is required.';
    }
    if (!username?.trim()) {
      calculatedErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      calculatedErrors.password = 'Password is required.';
    }
    setFieldErrors(calculatedErrors); // Update local error state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     // Ensure 'type' is always present, even if all other fields are undefined
    if (Object.keys(dataForParent).length === 0) { // Should be 1 if only type is present
        dataForParent.type = WIDGET_TYPE;
    }


    parentOnChange(dataForParent, calculatedErrors); // Pass calculatedErrors to parent
  }, [url, username, password, JSON.stringify(fields), parentOnChange]); // Depend on individual states and parentOnChange

  const handleFieldsChange = (event) => {
    const { name, checked } = event.target;
    setFields((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      }
      return prevFields.filter((field) => field !== name);
    });
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Homebridge Specific Fields
      </Typography>
      <FormHelperText sx={{ mb: 1 }}>
        Requires the Homebridge Config UI X plugin to be installed.
      </FormHelperText>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://homebridge.host:port"}
        type="url"
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Service username"}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        type="password" // Enable visibility toggle
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Service password"}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {ALLOWED_FIELDS_OPTIONS.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={fields.includes(field)}
                  onChange={handleFieldsChange}
                  name={field}
                />
              }
              label={field.replace(/_/g, ' ')} // Make labels more readable
            />
          ))}
        </FormGroup>
        <FormHelperText>Select which stats to show.</FormHelperText>
      </FormControl>
    </Box>
  );
}

HomebridgeWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

HomebridgeWidgetFields.defaultProps = {
  initialData: null, // Parent form will provide { type: WIDGET_TYPE } if widget is selected
};

export default HomebridgeWidgetFields;