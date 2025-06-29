import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

const WIDGET_TYPE = 'swagdashboard';

function SwagdashboardWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for SWAG Dashboard widget.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = WIDGET_TYPE;
    }

    parentOnChange(dataForParent, errors);
  }, [url, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="SWAG Dashboard URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your SWAG Dashboard instance (e.g., http://swagdashboard.host:81)"}
      />
    </Box>
  );
}

SwagdashboardWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

SwagdashboardWidgetFields.defaultProps = {
  initialData: null,
};

export default SwagdashboardWidgetFields;