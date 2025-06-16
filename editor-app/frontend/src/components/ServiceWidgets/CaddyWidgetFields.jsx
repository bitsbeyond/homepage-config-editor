import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

function CaddyWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
    } else {
      // Reset to defaults if initialData becomes null
      setUrl('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'caddy',
      url: url || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Caddy Admin URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'caddy' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Caddy Admin URL"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "The URL of your Caddy admin API (e.g., http://192.168.1.100:2019)."}
      />
    </Box>
  );
}

CaddyWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

CaddyWidgetFields.defaultProps = {
  initialData: null,
};

export default CaddyWidgetFields;