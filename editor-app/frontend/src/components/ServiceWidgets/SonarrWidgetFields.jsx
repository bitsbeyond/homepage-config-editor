import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'sonarr';

function SonarrWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [enableQueue, setEnableQueue] = useState(initialData?.enableQueue || false);
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
      const newEnableQueue = initialData.enableQueue || false;
      if (newEnableQueue !== enableQueue) {
        setEnableQueue(newEnableQueue);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setEnableQueue(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
      enableQueue: enableQueue || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Sonarr widget.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required for Sonarr widget.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Remove enableQueue if false (default)
    if (dataForParent.enableQueue === false) {
      delete dataForParent.enableQueue;
    }
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = WIDGET_TYPE;
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, enableQueue, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleApiKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setApiKey(event.target.value);
  };

  // Handle changes for Switch
  const handleEnableQueueChange = (event) => {
    setEnableQueue(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Sonarr URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Sonarr instance (e.g., http://sonarr.host:8989)"}
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
        helperText={fieldErrors.key || "Found in Sonarr under Settings > General > API Key. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControlLabel
        control={
          <Switch
            checked={enableQueue}
            onChange={handleEnableQueueChange}
            name="enableQueue"
          />
        }
        label="Enable Detailed Queue Listing"
        sx={{ mt: 1 }}
      />
    </Box>
  );
}

SonarrWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    enableQueue: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

SonarrWidgetFields.defaultProps = {
  initialData: null,
};

export default SonarrWidgetFields;