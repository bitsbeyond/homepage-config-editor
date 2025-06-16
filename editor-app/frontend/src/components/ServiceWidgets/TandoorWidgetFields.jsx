import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'tandoor';

function TandoorWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newApiKey = initialData.key || '';
      if (newApiKey !== apiKey) {
        setApiKey(newApiKey);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Tandoor widget.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required for Tandoor widget.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = WIDGET_TYPE;
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleApiKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setApiKey(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Tandoor URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Tandoor instance (e.g., http://tandoor-frontend.host.or.ip)"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key"
        label="API Key"
        type="password"
        value={apiKey}
        onChange={handleApiKeyChange}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Generate a 'read' scope API key from Tandoor settings. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

TandoorWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

TandoorWidgetFields.defaultProps = {
  initialData: null,
};

export default TandoorWidgetFields;