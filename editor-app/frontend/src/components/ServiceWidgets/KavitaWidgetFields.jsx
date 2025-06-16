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
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'kavita';
const ALLOWED_FIELDS_OPTIONS = [
  "seriesCount",
  "totalFiles",
];

function KavitaWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setApiKey(initialData.key || '');
      setSelectedFields(initialData.fields || []);
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
      setApiKey('');
      setSelectedFields([]);
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      key: apiKey || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'URL is required.';
    }
    const hasUsername = username?.trim();
    const hasPassword = password?.trim();
    const hasApiKey = apiKey?.trim();

    if (!hasApiKey && !(hasUsername && hasPassword)) {
      if (!hasApiKey) calculatedErrors.key = 'API Key is required if Username/Password are not provided.';
      if (!hasUsername) calculatedErrors.username = 'Username is required if API Key is not provided.';
      if (!hasPassword) calculatedErrors.password = 'Password is required if API Key is not provided.';
    }
    setFieldErrors(calculatedErrors);

    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === WIDGET_TYPE) {
        // Only type is present
    }

    parentOnChange(dataForParent, calculatedErrors);
  }, [url, username, password, apiKey, JSON.stringify(selectedFields), parentOnChange]);

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      }
      return prevFields.filter((field) => field !== name);
    });
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Kavita Specific Fields
      </Typography>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        // margin="normal" // Using Box gap
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://kavita.host:port"}
        type="url"
      />
      <EnvVarAutocompleteInput
        label="Admin Username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        // margin="normal"
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Required if not using API Key"}
      />
      <EnvVarAutocompleteInput
        label="Admin Password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        // margin="normal"
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Required if not using API Key"}
      />
       <EnvVarAutocompleteInput
        label="API Key (key)"
        name="key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        fullWidth
        // margin="normal"
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Optional alternative to username/password. Can use {{HOMEPAGE_VAR_...}}"}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {ALLOWED_FIELDS_OPTIONS.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldChange}
                  name={field}
                />
              }
              label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            />
          ))}
        </FormGroup>
        <FormHelperText>Select which stats to show.</FormHelperText>
      </FormControl>
    </Box>
  );
}

KavitaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    key: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

KavitaWidgetFields.defaultProps = {
  initialData: null,
};

export default KavitaWidgetFields;