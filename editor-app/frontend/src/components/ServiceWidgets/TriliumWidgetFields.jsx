import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function TriliumWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

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
      type: 'trilium',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'ETAPI token is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'trilium' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'trilium';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, parentOnChange]);

  // Individual memoized handlers (prevent flickering in React 19)
  const handleUrlChange = useCallback((event) => {
    setUrl(event.target.value);
  }, []);

  const handleApiKeyChange = useCallback((event) => {
    setApiKey(event.target.value);
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Trilium URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., https://trilium.host.or.ip"}
      />

      <EnvVarAutocompleteInput
        label="ETAPI Token"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "ETAPI token (Options > ETAPI > Create new ETAPI token in TriliumNext 0.94.0+). Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

TriliumWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

TriliumWidgetFields.defaultProps = {
  initialData: null,
};

export default TriliumWidgetFields;
