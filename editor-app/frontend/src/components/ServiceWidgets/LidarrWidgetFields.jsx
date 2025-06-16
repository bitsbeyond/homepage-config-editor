import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'lidarr';

function LidarrWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults
      setUrl('');
      setApiKey('');
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
    };

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'Lidarr URL is required.';
    }
    if (!apiKey?.trim()) {
      calculatedErrors.key = 'API Key is required.';
    }
    setFieldErrors(calculatedErrors);

    const dataForParent = { type: WIDGET_TYPE };
    if (url?.trim()) {
        dataForParent.url = url.trim();
    }
    if (apiKey?.trim()) {
      dataForParent.key = apiKey.trim();
    }
    
    parentOnChange(dataForParent, calculatedErrors);
  }, [url, apiKey, parentOnChange]);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Lidarr URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Lidarr instance (e.g., http://lidarr.host.or.ip:8686)"}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        fullWidth
        required
        type="password" // Mask the key & enable visibility toggle
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Found in Lidarr under Settings > General > API Key. Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

LidarrWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

LidarrWidgetFields.defaultProps = {
  initialData: null,
};

export default LidarrWidgetFields;