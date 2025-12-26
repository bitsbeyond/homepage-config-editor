import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const INTERVAL_OPTIONS = ['day', 'week', 'month', 'year', 'all'];

function YourspotifyWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [interval, setInterval] = useState(initialData?.interval || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setInterval(initialData.interval || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setInterval('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'yourspotify',
      url: url || undefined,
      key: apiKey || undefined,
      interval: interval || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'yourspotify' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'yourspotify';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, interval, parentOnChange]);

  // Individual memoized handlers (prevent flickering in React 19)
  const handleUrlChange = useCallback((event) => {
    setUrl(event.target.value);
  }, []);

  const handleApiKeyChange = useCallback((event) => {
    setApiKey(event.target.value);
  }, []);

  const handleIntervalChange = useCallback((event) => {
    setInterval(event.target.value);
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Your Spotify URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://your-spotify-server.host.or.ip (include /api/ if using lsio image)"}
      />

      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "From Your Spotify settings. Can use {{HOMEPAGE_VAR_...}}"}
      />

      <FormControl fullWidth>
        <InputLabel id="yourspotify-interval-label">Time Interval (optional)</InputLabel>
        <Select
          labelId="yourspotify-interval-label"
          name="interval"
          value={interval}
          label="Time Interval (optional)"
          onChange={handleIntervalChange}
        >
          <MenuItem value=""><em>Default (week)</em></MenuItem>
          {INTERVAL_OPTIONS.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Time period for data (default: week). Note: "week" means past 7 days, not from start of week.
        </FormHelperText>
      </FormControl>
    </Box>
  );
}

YourspotifyWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    interval: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

YourspotifyWidgetFields.defaultProps = {
  initialData: null,
};

export default YourspotifyWidgetFields;
