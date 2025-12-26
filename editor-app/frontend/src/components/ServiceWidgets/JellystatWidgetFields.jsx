import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function JellystatWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [days, setDays] = useState(initialData?.days !== undefined ? String(initialData.days) : '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setDays(initialData.days !== undefined ? String(initialData.days) : '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setDays('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    // Convert days to number if valid, otherwise undefined
    const daysNum = days ? parseInt(days, 10) : undefined;
    const isDaysValid = !days || (!isNaN(daysNum) && daysNum > 0);

    const currentWidgetData = {
      type: 'jellystat',
      url: url || undefined,
      key: apiKey || undefined,
      days: isDaysValid ? daysNum : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    if (days && (!isDaysValid || daysNum <= 0)) {
      errors.days = 'Days must be a valid positive number.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'jellystat' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'jellystat';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, days, parentOnChange]);

  // Helper functions (memoized to prevent flickering)
  const handleTextFieldChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleAutocompleteChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Jellystat URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://jellystat.host.or.ip"}
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
        helperText={fieldErrors.key || "Generated from Jellystat settings (Settings > API Key). Can use {{HOMEPAGE_VAR_...}}"}
      />

      <TextField
        label="Days (optional)"
        name="days"
        value={days}
        onChange={handleTextFieldChange(setDays)}
        fullWidth
        type="number"
        error={!!fieldErrors.days}
        helperText={fieldErrors.days || "Number of days for statistics (default: 30)"}
        inputProps={{ min: "1", step: "1" }}
      />
    </Box>
  );
}

JellystatWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    days: PropTypes.number,
  }),
  onChange: PropTypes.func.isRequired,
};

JellystatWidgetFields.defaultProps = {
  initialData: null,
};

export default JellystatWidgetFields;
