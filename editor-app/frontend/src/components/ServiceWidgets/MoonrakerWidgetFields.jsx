import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'moonraker';

function MoonrakerWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // Optional
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
    } else {
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined, // Optional
    };

    const errors = {};
    if (!url?.trim()) errors.url = 'URL is required.';
    // API key is optional, so no validation error if empty
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
  }, [url, apiKey, parentOnChange]);

  const handleInputChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Moonraker URL"
        name="url"
        value={url}
        onChange={handleInputChange(setUrl)}
        fullWidth
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://moonraker.local:7125"}
      />
      <EnvVarAutocompleteInput
        label="API Key (Optional)"
        name="key"
        type="password"
        value={apiKey}
        onChange={handleInputChange(setApiKey)}
        fullWidth
        // Not required
        error={!!fieldErrors.key} // Though optional, can still show error if backend validation fails later
        helperText={fieldErrors.key || "Required if authorization is enabled and Homepage IP isn't whitelisted"}
      />
    </Box>
  );
}

MoonrakerWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

MoonrakerWidgetFields.defaultProps = {
  initialData: null,
};

export default MoonrakerWidgetFields;