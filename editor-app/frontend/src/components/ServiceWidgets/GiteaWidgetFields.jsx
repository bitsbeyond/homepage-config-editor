import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';
import PropTypes from 'prop-types'; // Added PropTypes import

function GiteaWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');

  // Effect to update local state if initialData changes
  useEffect(() => {
    setUrl(initialData?.url || '');
    setApiKey(initialData?.key || '');
  }, [initialData]);

  // Update parent component when local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'gitea',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Gitea URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'API Token is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'gitea';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Gitea URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        helperText={!url?.trim() ? 'Gitea URL is required.' : "Base URL of your Gitea instance (e.g., http://gitea.host:3000)"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="API Token"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password" // Mask the token & enable visibility toggle
        helperText={!apiKey?.trim() ? 'API Token is required.' : "Gitea API Token with notifications, repository, and issue permissions."}
        error={!apiKey?.trim()}
      />
    </Box>
  );
}

GiteaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

GiteaWidgetFields.defaultProps = {
    initialData: null,
};

export default GiteaWidgetFields;