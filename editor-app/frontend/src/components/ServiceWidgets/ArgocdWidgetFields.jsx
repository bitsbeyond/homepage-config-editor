import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function ArgocdWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');

  useEffect(() => {
    setUrl(initialData?.url || '');
    setApiKey(initialData?.key || '');
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'argocd',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'ArgoCD URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'API Key is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'argocd';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="ArgoCD URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'ArgoCD URL is required.' : "Example: http://argocd.host.or.ip:port"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        type="password" // To enable visibility toggle
        fullWidth
        required
        helperText={!apiKey?.trim() ? 'API Key is required.' : "Generated ArgoCD API Key (see documentation)"}
        error={!apiKey?.trim()}
      />
      {/* Note: 'fields' array is not implemented in this basic form */}
    </Box>
  );
}

ArgocdWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ArgocdWidgetFields.defaultProps = {
  initialData: null,
};

export default ArgocdWidgetFields;