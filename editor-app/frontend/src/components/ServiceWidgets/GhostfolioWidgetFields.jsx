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
  Link,
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const allowedFields = [
  "gross_percent_today",
  "gross_percent_1y",
  "gross_percent_max",
  "net_worth",
];

function GhostfolioWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);

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
  }, [initialData]);

  // Update parent component when local state changes
  useEffect(() => {
    const widgetUpdate = {
      type: 'ghostfolio',
      url: url || undefined,
      key: apiKey || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'Bearer Token (key) is required.';
    }

    // Clean up undefined fields
    const dataForParent = { type: 'ghostfolio' };
    Object.keys(widgetUpdate).forEach(k => {
      if (k !== 'type' && widgetUpdate[k] !== undefined) {
        dataForParent[k] = widgetUpdate[k];
      }
    });

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, JSON.stringify(selectedFields), parentOnChange]);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      } else {
        return prevFields.filter((field) => field !== name);
      }
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Ghostfolio Specific Fields
      </Typography>
      <TextField
        label="URL"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        margin="normal"
        required
        helperText={!url?.trim() ? 'URL is required.' : "e.g., http://ghostfolio.host:port"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Bearer Token (key)"
        name="key" // Name for the EnvVarAutocompleteInput, maps to apiKey state
        value={apiKey}
        onChange={handleApiKeyChange} // Directly update apiKey state
        fullWidth
        type="password" // Enable visibility toggle
        required
        helperText={!apiKey?.trim() ? 'Bearer Token (key) is required.' : "Obtain via API POST request. Token is valid for 6 months."}
        error={!apiKey?.trim()}
      />

      <FormControl component="fieldset" margin="normal" fullWidth sx={{ mt: 2, gap: 0 }}>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldChange}
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

GhostfolioWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string, // 'key' in YAML
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

GhostfolioWidgetFields.defaultProps = {
  initialData: null,
};

export default GhostfolioWidgetFields;