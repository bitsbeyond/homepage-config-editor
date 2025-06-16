import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box'; // Added Box for consistent layout
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the Gotify widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function GotifyWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');

  useEffect(() => {
    setUrl(initialData?.url || '');
    setApiKey(initialData?.key || '');
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'gotify',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Gotify URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'Client Token (Key) is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'gotify';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Gotify URL"
        variant="outlined" // Retained variant from original
        fullWidth
        name="url"
        value={url}
        onChange={handleUrlChange}
        helperText={!url?.trim() ? 'Gotify URL is required.' : "e.g., http://gotify.local or https://gotify.example.com"}
        required
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Client Token (Key)"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        type="password" // Treat token as sensitive & enable visibility toggle
        helperText={!apiKey?.trim() ? 'Client Token (Key) is required.' : "Gotify Client Token"}
        required
        error={!apiKey?.trim()}
      />
    </Box>
  );
}

GotifyWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

GotifyWidgetFields.defaultProps = {
  initialData: null,
};

export default GotifyWidgetFields;