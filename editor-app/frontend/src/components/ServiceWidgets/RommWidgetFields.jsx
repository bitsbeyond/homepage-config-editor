import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

function RommWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [fieldsString, setFieldsString] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      // Convert fields array to string for display
      const defaultFields = ["platforms", "totalRoms", "saves", "states"];
      const fieldsStr = initialData.fields?.join(', ') || defaultFields.join(', ');
      setFieldsString(fieldsStr);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      const defaultFields = ["platforms", "totalRoms", "saves", "states"];
      setFieldsString(defaultFields.join(', '));
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    // Convert fields string to array
    const fieldsArray = fieldsString.split(',').map(f => f.trim()).filter(f => f);
    
    const currentWidgetData = {
      type: 'romm',
      url: url || undefined,
      fields: fieldsArray.length > 0 ? fieldsArray : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for ROMM widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'romm' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'romm';
    }

    parentOnChange(dataForParent, errors);
  }, [url, fieldsString, parentOnChange]); // Depend on individual states and parentOnChange

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
        label="ROMM URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your ROMM instance (e.g., http://romm.local)"}
        type="url"
      />
      <TextField
        fullWidth
        name="fields"
        label="Fields to Display (Optional)"
        value={fieldsString} // Use individual state
        onChange={handleTextFieldChange(setFieldsString)} // Use specific handler with setter
        helperText="Comma-separated field names. Max 4. Available: platforms, totalRoms, saves, states, screenshots, totalfilesize"
        placeholder="platforms, totalRoms, saves, states"
      />
    </Box>
  );
}

RommWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

RommWidgetFields.defaultProps = {
  initialData: null,
};

export default RommWidgetFields;