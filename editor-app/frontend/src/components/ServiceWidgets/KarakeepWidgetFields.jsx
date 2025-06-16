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

const allowedFields = [
  "bookmarks",
  "favorites",
  "archived",
  "highlights",
  "lists",
  "tags",
];

const WIDGET_TYPE = 'karakeep';

function KarakeepWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setSelectedFields(initialData.fields || []);
    } else {
      setUrl('');
      setApiKey('');
      setSelectedFields([]);
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);


  // Update parent component when local state changes
  useEffect(() => {
    const currentWidgetData = { // Renamed from updatedData for clarity
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const calculatedErrors = {}; // Renamed from errors
    if (!url?.trim()) {
      calculatedErrors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      calculatedErrors.key = 'API Key (key) is required.';
    }
    setFieldErrors(calculatedErrors); // Update local error state

    // Prepare dataForParent by removing undefined values, except for 'type'
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     if (Object.keys(dataForParent).length === 1 && dataForParent.type === WIDGET_TYPE) {
        // Only type is present
    }

    parentOnChange(dataForParent, calculatedErrors);
  }, [url, apiKey, JSON.stringify(selectedFields), parentOnChange]); // Added JSON.stringify for selectedFields

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      const currentFields = checked
        ? [...prevFields, name]
        : prevFields.filter((field) => field !== name);

      // Limit to max 4 fields
      return currentFields.slice(0, 4);
    });
  };

  const isFieldLimitReached = selectedFields.length >= 4;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Karakeep Specific Fields
      </Typography>
      <TextField
        label="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        margin="normal"
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://karakeep.host:port"}
        type="url"
      />
      <EnvVarAutocompleteInput
        label="API Key (key)"
        name="key" // name prop for EnvVarAutocompleteInput
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)} // EnvVarAutocompleteInput provides { target: { name, value } }
        fullWidth
        margin="normal"
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Generate via User Settings > API Keys. Can be a {{HOMEPAGE_VAR_...}} or {{HOMEPAGE_FILE_...}}"}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional, Max 4)</FormLabel>
        <FormGroup>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldChange}
                  name={field}
                  disabled={!selectedFields.includes(field) && isFieldLimitReached}
                />
              }
              label={field.charAt(0).toUpperCase() + field.slice(1)} // Capitalize label
            />
          ))}
        </FormGroup>
        {isFieldLimitReached && (
          <FormHelperText error>Maximum of 4 fields selected.</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}

KarakeepWidgetFields.propTypes = {
  initialData: PropTypes.shape({ // Changed from widgetData to initialData
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

KarakeepWidgetFields.defaultProps = {
  initialData: null, // Changed from widgetData object to null
};

export default KarakeepWidgetFields;