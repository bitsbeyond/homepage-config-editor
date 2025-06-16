import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function UptimerobotWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [key, setKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'uptimerobot',
      url: 'https://api.uptimerobot.com', // Fixed URL
      key: key || undefined,
    };

    const errors = {};
    if (!key?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = {
      type: 'uptimerobot',
      url: 'https://api.uptimerobot.com' // Always include fixed URL
    };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && k !== 'url' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [key, parentOnChange]);

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        URL is fixed to `https://api.uptimerobot.com` for this widget.
      </Typography>
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key"
        label="API Key"
        type="password"
        value={key}
        onChange={handleAutocompleteChange(setKey)}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Read-Only or Monitor-Specific API Key from UptimeRobot settings. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

UptimerobotWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

UptimerobotWidgetFields.defaultProps = {
  initialData: null,
};

export default UptimerobotWidgetFields;