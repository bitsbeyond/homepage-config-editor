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
  Box,
} from '@mui/material';

const allowedFields = [
  "connectionStatus",
  "uptime",
  "maxDown",
  "maxUp",
  "down",
  "up",
  "received",
  "sent",
  "externalIPAddress",
  "externalIPv6Address",
  "externalIPv6Prefix",
];

function FritzboxWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setSelectedFields(initialData.fields || []);
    } else {
      // Reset to defaults if initialData becomes null
      setUrl('');
      setSelectedFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'fritzbox',
      url: url || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Fritzbox URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'fritzbox' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'fritzbox';
    }

    parentOnChange(dataForParent, errors);
  }, [url, selectedFields]); // Removed parentOnChange from dependencies

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        return prevFields.length < 4 ? [...prevFields, name] : prevFields;
      } else {
        return prevFields.filter((field) => field !== name);
      }
    });
  };

  const isFieldLimitReached = selectedFields.length >= 4;

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Fritzbox URL"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://192.168.178.1"}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Max 4)</FormLabel>
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
              label={field}
            />
          ))}
        </FormGroup>
        {isFieldLimitReached && (
          <FormHelperText error>Maximum of 4 fields selected.</FormHelperText>
        )}
        <FormHelperText>
          Application access & UPnP must be activated on your device. Credentials are not needed. Using http is faster.
        </FormHelperText>
      </FormControl>
    </Box>
  );
}

FritzboxWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

FritzboxWidgetFields.defaultProps = {
  initialData: null,
};

export default FritzboxWidgetFields;