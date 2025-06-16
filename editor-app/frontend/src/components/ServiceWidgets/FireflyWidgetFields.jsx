import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the Firefly widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function FireflyWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');

  useEffect(() => {
    setUrl(initialData?.url || '');
    setApiKey(initialData?.key || '');
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'firefly',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'Personal Access Token (key) is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'firefly';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'URL is required.' : "e.g., https://firefly.host.or.ip"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Personal Access Token (key)"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        type="password" // Enable visibility toggle
        required
        helperText={!apiKey?.trim() ? 'Personal Access Token (key) is required.' : "Find under Options > Profile > OAuth > Personal Access Tokens"}
        error={!apiKey?.trim()}
      />
    </Box>
  );
}

FireflyWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

FireflyWidgetFields.defaultProps = {
    initialData: null,
};

export default FireflyWidgetFields;