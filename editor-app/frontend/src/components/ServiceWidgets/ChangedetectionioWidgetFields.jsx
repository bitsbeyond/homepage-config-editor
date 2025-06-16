import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function ChangedetectionioWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
    } else {
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: 'changedetectionio',
      url: url || undefined,
      key: apiKey || undefined, // Maps to 'key' in YAML
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Changedetection.io URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }

    const dataForParent = { type: 'changedetectionio' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === 'changedetectionio') {
       // All fields are empty or undefined
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, parentOnChange]);

  // Specific handlers for each input type
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  return (
    <Grid container spacing={2} sx={{ paddingTop: 2 }}>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          name="url"
          label="Changedetection.io URL"
          value={url}
          onChange={handleUrlChange}
          helperText="The base URL of your Changedetection.io instance (e.g., http://192.168.1.102:5000)."
        />
      </Grid>
      <Grid item xs={12}>
        <EnvVarAutocompleteInput
          required
          fullWidth
          name="key"
          label="API Key"
          type="password" // Enables visibility toggle
          value={apiKey}
          onChange={handleApiKeyChange}
          helperText="Find in Changedetection.io under Settings > API. Can use {{HOMEPAGE_VAR_...}}"
        />
      </Grid>
    </Grid>
  );
}

ChangedetectionioWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ChangedetectionioWidgetFields.defaultProps = {
  initialData: null,
};

export default ChangedetectionioWidgetFields;