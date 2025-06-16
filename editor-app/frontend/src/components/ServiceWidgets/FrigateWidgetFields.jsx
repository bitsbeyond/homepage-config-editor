import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, FormControlLabel, Switch, Box, Typography } from '@mui/material';

function FrigateWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [enableRecentEvents, setEnableRecentEvents] = useState(initialData?.enableRecentEvents || false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      const newEnableRecentEvents = initialData.enableRecentEvents || false;

      if (newUrl !== url) setUrl(newUrl);
      if (newEnableRecentEvents !== enableRecentEvents) setEnableRecentEvents(newEnableRecentEvents);
    } else {
      // Reset to defaults
      setUrl('');
      setEnableRecentEvents(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'frigate',
      url: url || undefined,
      enableRecentEvents: enableRecentEvents === false ? undefined : enableRecentEvents,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'frigate' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, enableRecentEvents, parentOnChange]);

  // Handle changes for individual fields
  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleEnableRecentEventsChange = (event) => setEnableRecentEvents(event.target.checked);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://frigate.host.or.ip:port"}
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Optional Settings</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enableRecentEvents}
              onChange={handleEnableRecentEventsChange}
              name="enableRecentEvents"
            />
          }
          label="Enable Recent Events Listing"
        />
      </Box>
    </Box>
  );
}

FrigateWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    enableRecentEvents: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

FrigateWidgetFields.defaultProps = {
  initialData: null,
};

export default FrigateWidgetFields;