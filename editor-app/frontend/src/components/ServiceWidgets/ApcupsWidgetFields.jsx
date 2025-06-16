import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';

const WIDGET_TYPE = 'apcupsd'; // Common type for APC UPS Daemon in Homepage

/**
 * Fields specific to the APC UPS (apcupsd) widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function ApcupsWidgetFields({ initialData, onChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
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
    // Do not reset fieldErrors here; validation useEffect handles it.
  }, [initialData]); // Removed 'url' from dependencies to prevent potential loops

  // Effect to call onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
    };

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'APCUPSD URL is required.';
    }
    // Add more specific URL validation if needed (e.g., regex for tcp://host:port)

    setFieldErrors(calculatedErrors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // 'type' is initialized in dataForParent, so this check is redundant.
    // if (Object.keys(dataForParent).length === 0 && WIDGET_TYPE) {
    //     dataForParent.type = WIDGET_TYPE;
    // }

    onChange(dataForParent, calculatedErrors);
  }, [url, onChange]);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  return (
    <Grid container spacing={2} sx={{ paddingTop: 2 }}>
      <Grid item xs={12}>
        <TextField
          label="APCUPSD URL"
          name="url"
          value={url}
          onChange={handleUrlChange}
          required
          fullWidth
          error={!!fieldErrors.url}
          helperText={fieldErrors.url || 'Example: tcp://your.apcupsd.host:3551'}
        />
      </Grid>
    </Grid>
  );
}

ApcupsWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ApcupsWidgetFields.defaultProps = {
  initialData: null,
};

export default ApcupsWidgetFields;