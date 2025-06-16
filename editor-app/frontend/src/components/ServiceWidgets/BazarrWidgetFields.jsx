import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function BazarrWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'bazarr',
      url: url || undefined,
      key: apiKey || undefined, // Maps to 'key' in YAML
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Bazarr URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'bazarr' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === 'bazarr') {
        // All fields are empty or undefined
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextField (URL)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Token)
  const handleApiKeyChange = (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setApiKey(event.target.value);
  };

  return (
    <Grid container spacing={2} sx={{ paddingTop: 2 }}>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          name="url"
          label="Bazarr URL"
          value={url} // Use individual state
          onChange={handleUrlChange} // Use specific handler
          helperText="The base URL of your Bazarr instance (e.g., http://192.168.1.100:6767)."
        />
      </Grid>
      <Grid item xs={12}>
        <EnvVarAutocompleteInput
          required
          fullWidth
          name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
          label="API Key"
          type="password"
          value={apiKey} // Use individual state
          onChange={handleApiKeyChange} // Use specific handler
          helperText="Find in Bazarr under Settings > General. Can use {{HOMEPAGE_VAR_...}}"
        />
      </Grid>
    </Grid>
  );
}

BazarrWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

BazarrWidgetFields.defaultProps = {
  initialData: null,
};

export default BazarrWidgetFields;