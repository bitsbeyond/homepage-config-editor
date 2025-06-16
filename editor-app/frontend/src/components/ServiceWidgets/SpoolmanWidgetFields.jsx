import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

const WIDGET_TYPE = 'spoolman';

function SpoolmanWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [spoolIds, setSpoolIds] = useState(initialData?.spoolIds || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newSpoolIds = initialData.spoolIds || [];
      if (JSON.stringify(newSpoolIds) !== JSON.stringify(spoolIds)) {
        setSpoolIds(newSpoolIds);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setSpoolIds([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      spoolIds: spoolIds.length > 0 ? spoolIds : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Spoolman widget.';
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
  }, [url, spoolIds, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for spoolIds (comma-separated string to array conversion)
  const handleSpoolIdsChange = (event) => {
    const { value } = event.target;
    // Convert comma-separated string to array of numbers, filtering out non-numbers
    const ids = value.split(',')
                     .map(id => parseInt(id.trim(), 10))
                     .filter(id => !isNaN(id));
    setSpoolIds(ids);
  };

  // Convert array back to comma-separated string for display
  const spoolIdsString = spoolIds.length > 0 ? spoolIds.join(', ') : '';

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Spoolman URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Spoolman instance (e.g., http://spoolman.host.or.ip)"}
      />
      <TextField
        fullWidth
        name="spoolIds"
        label="Spool IDs (Optional)"
        value={spoolIdsString}
        onChange={handleSpoolIdsChange}
        helperText="Comma-separated list of spool IDs to display (e.g., 1, 2, 3, 4). Displays first 4 by default if empty."
      />
    </Box>
  );
}

SpoolmanWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    spoolIds: PropTypes.arrayOf(PropTypes.number),
  }),
  onChange: PropTypes.func.isRequired,
};

SpoolmanWidgetFields.defaultProps = {
  initialData: null,
};

export default SpoolmanWidgetFields;