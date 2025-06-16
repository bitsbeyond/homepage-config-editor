import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'medusa';

function MedusaWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
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
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) errors.url = 'URL is required.';
    if (!apiKey?.trim()) errors.key = 'API Key is required.';
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
        label="Medusa URL"
        name="url"
        value={url}
        onChange={handleInputChange(setUrl)}
        fullWidth
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://medusa.example.com:8081"}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        type="password"
        value={apiKey}
        onChange={handleInputChange(setApiKey)}
        fullWidth
        required
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Your Medusa API Key"}
      />
    </Box>
  );
}

MedusaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

MedusaWidgetFields.defaultProps = {
  initialData: null,
};

export default MedusaWidgetFields;