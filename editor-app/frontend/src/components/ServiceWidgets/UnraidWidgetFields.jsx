import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function UnraidWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [pool1, setPool1] = useState(initialData?.pool1 || '');
  const [pool2, setPool2] = useState(initialData?.pool2 || '');
  const [pool3, setPool3] = useState(initialData?.pool3 || '');
  const [pool4, setPool4] = useState(initialData?.pool4 || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setPool1(initialData.pool1 || '');
      setPool2(initialData.pool2 || '');
      setPool3(initialData.pool3 || '');
      setPool4(initialData.pool4 || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setPool1('');
      setPool2('');
      setPool3('');
      setPool4('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'unraid',
      url: url || undefined,
      key: apiKey || undefined,
      pool1: pool1 || undefined,
      pool2: pool2 || undefined,
      pool3: pool3 || undefined,
      pool4: pool4 || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key with ADMIN role is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'unraid' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'unraid';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, pool1, pool2, pool3, pool4, parentOnChange]);

  // Helper functions (memoized to prevent flickering)
  const handleTextFieldChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleAutocompleteChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Unraid Configuration
      </Typography>

      <TextField
        label="Unraid URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., https://unraid.host.or.ip"}
      />

      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleAutocompleteChange(setApiKey)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "API Key with ADMIN role. Requires Unraid 7.2+ or Unraid Connect plugin. Can use {{HOMEPAGE_VAR_...}}"}
      />

      <Typography variant="caption" sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
        Optional Pool Configuration (only needed if using pool metrics):
      </Typography>

      <TextField
        label="Pool 1 Name (optional)"
        name="pool1"
        value={pool1}
        onChange={handleTextFieldChange(setPool1)}
        fullWidth
        helperText="Pool name for pool-specific metrics (e.g., cache)"
      />

      <TextField
        label="Pool 2 Name (optional)"
        name="pool2"
        value={pool2}
        onChange={handleTextFieldChange(setPool2)}
        fullWidth
        helperText="Pool name for pool-specific metrics"
      />

      <TextField
        label="Pool 3 Name (optional)"
        name="pool3"
        value={pool3}
        onChange={handleTextFieldChange(setPool3)}
        fullWidth
        helperText="Pool name for pool-specific metrics"
      />

      <TextField
        label="Pool 4 Name (optional)"
        name="pool4"
        value={pool4}
        onChange={handleTextFieldChange(setPool4)}
        fullWidth
        helperText="Pool name for pool-specific metrics"
      />
    </Box>
  );
}

UnraidWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    pool1: PropTypes.string,
    pool2: PropTypes.string,
    pool3: PropTypes.string,
    pool4: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

UnraidWidgetFields.defaultProps = {
  initialData: null,
};

export default UnraidWidgetFields;
