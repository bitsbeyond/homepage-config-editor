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
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'immich';
const ALLOWED_FIELDS_OPTIONS = [
  "users",
  "photos",
  "videos",
  "storage",
];

function ImmichWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [version, setVersion] = useState(initialData?.version !== undefined ? String(initialData.version) : '');
  const [fieldsToDisplay, setFieldsToDisplay] = useState(initialData?.fields || []); // Renamed for clarity
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setVersion(initialData.version !== undefined ? String(initialData.version) : '');
      setFieldsToDisplay(initialData.fields || []);
    } else {
      setUrl('');
      setApiKey('');
      setVersion('');
      setFieldsToDisplay([]);
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
      // version handled below
      fields: fieldsToDisplay && fieldsToDisplay.length > 0 ? fieldsToDisplay : undefined,
    };

    // Handle version: convert to number if selected, otherwise undefined
    if (version === '') {
      currentWidgetData.version = undefined; // Or delete if preferred by backend
    } else {
      const numVersion = parseInt(version, 10);
      if (!isNaN(numVersion)) {
        currentWidgetData.version = numVersion;
      } else {
        currentWidgetData.version = undefined; // Invalid selection, treat as default
      }
    }

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      calculatedErrors.key = 'Admin API Key is required.';
    }
    setFieldErrors(calculatedErrors);

    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === WIDGET_TYPE) { // Check if only type is present
        // If only type is present, it means all other fields are undefined (empty or invalid)
        // The parent form expects an object, so an object with only type is fine.
    }


    parentOnChange(dataForParent, calculatedErrors);
  }, [url, apiKey, version, JSON.stringify(fieldsToDisplay), parentOnChange]);

  const handleFieldsCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFieldsToDisplay((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      }
      return prevFields.filter((field) => field !== name);
    });
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Immich Specific Fields
      </Typography>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://immich.host"}
        type="url"
      />
      <EnvVarAutocompleteInput
        label="Admin API Key (key)"
        name="key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Find under Account Settings > API Keys (must be admin user)"}
      />
      <FormControl fullWidth>
        <InputLabel id="immich-version-label">API Version (Optional)</InputLabel>
        <Select
          labelId="immich-version-label"
          name="version"
          value={version}
          label="API Version (Optional)"
          onChange={(e) => setVersion(e.target.value)}
        >
          <MenuItem value=""><em>Default (1)</em></MenuItem>
          <MenuItem value="1">1 (&lt; v1.118)</MenuItem>
          <MenuItem value="2">2 (&gt;= v1.118)</MenuItem>
        </Select>
        <FormHelperText>Select based on your Immich server version.</FormHelperText>
      </FormControl>

      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {ALLOWED_FIELDS_OPTIONS.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={fieldsToDisplay.includes(field)}
                  onChange={handleFieldsCheckboxChange}
                  name={field}
                />
              }
              label={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
        </FormGroup>
        <FormHelperText>Select which stats to show.</FormHelperText>
      </FormControl>
    </Box>
  );
}

ImmichWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

ImmichWidgetFields.defaultProps = {
  initialData: null,
};

export default ImmichWidgetFields;