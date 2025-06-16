import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';

const WIDGET_TYPE = 'mjpeg';

function MjpegWidgetFields({ initialData, onChange: parentOnChange }) {
  const [streamUrl, setStreamUrl] = useState(initialData?.stream || '');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setStreamUrl(initialData.stream || '');
    } else {
      setStreamUrl('');
    }
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      stream: streamUrl || undefined,
    };

    const errors = {};
    if (!streamUrl?.trim()) {
      errors.stream = 'Stream URL is required.';
    }
    setFieldErrors(errors);

    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     if (Object.keys(dataForParent).length === 0) {
       dataForParent.type = WIDGET_TYPE;
     }

    parentOnChange(dataForParent, errors);
  }, [streamUrl, parentOnChange]);

  const handleStreamUrlChange = (event) => {
    setStreamUrl(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="MJPEG Stream URL"
        name="stream"
        value={streamUrl}
        onChange={handleStreamUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.stream}
        helperText={fieldErrors.stream || "URL of the MJPEG stream (e.g., http://camera.host/stream)"}
      />
    </Box>
  );
}

MjpegWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    stream: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

MjpegWidgetFields.defaultProps = {
  initialData: null,
};

export default MjpegWidgetFields;