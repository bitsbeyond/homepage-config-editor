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
  Typography,
  Box,
  Link,
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // Added import

const allowedFields = [
  "public_ip",
  "region",
  "country",
];

function GluetunWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);

  useEffect(() => {
    // Only update from initialData if it's truly different or a reset
    if (!initialData) {
        setUrl('');
        setApiKey('');
        setSelectedFields([]);
    } else {
        if (initialData.url !== undefined && initialData.url !== url) {
            setUrl(initialData.url || '');
        }
        if (initialData.key !== undefined && initialData.key !== apiKey) {
            setApiKey(initialData.key || '');
        }
        // For arrays, a simple comparison might not be enough if the parent reconstructs the array.
        // However, if initialData.fields is undefined (e.g. after an invalid intermediate state),
        // we should not clear selectedFields if the user is typing.
        // A more robust check might involve deep comparison or checking if initialData itself is a new object instance.
        // For now, let's only update if initialData.fields is actually provided and different.
        if (initialData.fields !== undefined && JSON.stringify(initialData.fields) !== JSON.stringify(selectedFields)) {
            setSelectedFields(initialData.fields || []);
        }
    }
  }, [initialData]); // Keep dependencies minimal to avoid unintended resets. Add back url, apiKey, selectedFields if needed for specific logic.

  useEffect(() => {
    const currentWidgetData = {
      type: 'gluetun',
      url: url || undefined,
      key: apiKey || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    // apiKey and selectedFields are optional

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
     if (dataForParent.fields && dataForParent.fields.length === 0) {
        delete dataForParent.fields;
    }
     if (dataForParent.key === '') { // Ensure empty optional key is not sent
        delete dataForParent.key;
    }
    dataForParent.type = 'gluetun';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, selectedFields, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);
  const handleFieldCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      } else {
        return prevFields.filter((field) => field !== name);
      }
    });
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Gluetun Specific Fields
      </Typography>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'URL is required.' : "e.g., http://gluetun.host:8000 (Requires HTTP control server enabled)"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="API Key (key)"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        type="password" // Enable visibility toggle
        helperText={
          <>
            Optional. See{' '}
            <Link href="https://github.com/qdm12/gluetun-wiki/blob/main/setup/advanced/control-server.md#authentication" target="_blank" rel="noopener noreferrer">
              Gluetun Docs
            </Link> for setup. Not required if endpoint auth is 'none'.
          </>
        }
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldCheckboxChange}
                  name={field}
                />
              }
              label={field.replace(/_/g, ' ')} // Make labels more readable
            />
          ))}
        </FormGroup>
        <FormHelperText>Select which stats to show.</FormHelperText>
      </FormControl>
    </Box>
  );
}

GluetunWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

GluetunWidgetFields.defaultProps = {
  initialData: null,
};

export default GluetunWidgetFields;