import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

function UptimekumaWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setSlug(initialData.slug || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setSlug('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'uptime-kuma',
      url: url || undefined,
      slug: slug || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!slug?.trim()) {
      errors.slug = 'Status Page Slug is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'uptime-kuma' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'uptime-kuma';
    }

    parentOnChange(dataForParent, errors);
  }, [url, slug, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Uptime Kuma URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Uptime Kuma instance (e.g., http://uptimekuma.host.or.ip:port)"}
      />
      <TextField
        label="Status Page Slug"
        name="slug"
        value={slug}
        onChange={handleTextFieldChange(setSlug)}
        fullWidth
        required
        error={!!fieldErrors.slug}
        helperText={fieldErrors.slug || "The slug of the status page to display (e.g., 'statuspageslug' from /status/statuspageslug)"}
      />
    </Box>
  );
}

UptimekumaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    slug: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

UptimekumaWidgetFields.defaultProps = {
  initialData: null,
};

export default UptimekumaWidgetFields;