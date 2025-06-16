import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Typography,
  Box,
} from '@mui/material';

const allowedFields = [
  "channels",
  "hd",
  "tunerCount",
  "channelNumber",
  "channelNetwork",
  "signalStrength",
  "signalQuality",
  "symbolQuality",
  "networkRate",
  "clientIP",
];

function HdhomerunWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [tuner, setTuner] = useState(initialData?.tuner?.toString() || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      const newTuner = initialData.tuner?.toString() || '';
      const newSelectedFields = initialData.fields || [];

      if (newUrl !== url) setUrl(newUrl);
      if (newTuner !== tuner) setTuner(newTuner);
      if (JSON.stringify(newSelectedFields) !== JSON.stringify(selectedFields)) {
        setSelectedFields(newSelectedFields);
      }
    } else {
      // Reset to defaults
      setUrl('');
      setTuner('');
      setSelectedFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'hdhomerun',
      url: url || undefined,
      tuner: tuner !== '' && !isNaN(parseInt(tuner, 10)) ? parseInt(tuner, 10) : undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (tuner && isNaN(parseInt(tuner, 10))) {
      errors.tuner = 'Tuner must be a valid number.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'hdhomerun' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, tuner, JSON.stringify(selectedFields), parentOnChange]);

  // Handle changes for individual fields
  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleTunerChange = (event) => setTuner(event.target.value);

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      const currentFields = checked
        ? [...prevFields, name]
        : prevFields.filter((field) => field !== name);

      // Limit to max 4 fields
      return currentFields.slice(0, 4);
    });
  };

  const isFieldLimitReached = selectedFields.length >= 4;

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        HDHomeRun Specific Fields
      </Typography>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://hdhomerun.host.or.ip"}
      />
      <TextField
        label="Tuner Index (Optional)"
        name="tuner"
        value={tuner}
        onChange={handleTunerChange}
        fullWidth
        type="number"
        inputProps={{ min: 0 }}
        error={!!fieldErrors.tuner}
        helperText={fieldErrors.tuner || "Defaults to 0. Used for tuner-specific fields."}
      />

      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional, Max 4)</FormLabel>
        <FormGroup>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldChange}
                  name={field}
                  disabled={!selectedFields.includes(field) && isFieldLimitReached}
                />
              }
              // Simple label formatting
              label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            />
          ))}
        </FormGroup>
        {isFieldLimitReached && (
          <FormHelperText error>Maximum of 4 fields selected.</FormHelperText>
        )}
        <FormHelperText>Default fields are shown if none are selected.</FormHelperText>
      </FormControl>
    </Box>
  );
}

HdhomerunWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    tuner: PropTypes.number,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

HdhomerunWidgetFields.defaultProps = {
  initialData: null,
};

export default HdhomerunWidgetFields;