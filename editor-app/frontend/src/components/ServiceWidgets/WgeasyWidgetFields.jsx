import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function WgeasyWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [threshold, setThreshold] = useState(initialData?.threshold !== undefined ? String(initialData.threshold) : '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setPassword(initialData.password || '');
      setThreshold(initialData.threshold !== undefined ? String(initialData.threshold) : '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setPassword('');
      setThreshold('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    // Convert threshold to number if valid, otherwise undefined
    const thresholdNum = threshold ? parseInt(threshold, 10) : undefined;
    const isThresholdValid = !threshold || (!isNaN(thresholdNum) && thresholdNum >= 0);

    const currentWidgetData = {
      type: 'wgeasy',
      url: url || undefined,
      password: password || undefined,
      threshold: isThresholdValid ? thresholdNum : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    if (threshold && (!isThresholdValid || thresholdNum < 0)) {
      errors.threshold = 'Threshold must be a valid positive number.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'wgeasy' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'wgeasy';
    }

    parentOnChange(dataForParent, errors);
  }, [url, password, threshold, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Wg-Easy URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://192.168.1.100:51821"}
      />
      <EnvVarAutocompleteInput
        label="Wg-Easy Password"
        name="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Password for Wg-Easy. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        label="Threshold (minutes, optional)"
        name="threshold"
        value={threshold}
        onChange={handleTextFieldChange(setThreshold)}
        fullWidth
        type="number"
        error={!!fieldErrors.threshold}
        helperText={fieldErrors.threshold || "Time since last handshake to consider connected (default: 2)"}
        inputProps={{ min: "0", step: "1" }}
      />
    </Box>
  );
}

WgeasyWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    password: PropTypes.string,
    threshold: PropTypes.number,
  }),
  onChange: PropTypes.func.isRequired,
};

WgeasyWidgetFields.defaultProps = {
  initialData: null,
};

export default WgeasyWidgetFields;