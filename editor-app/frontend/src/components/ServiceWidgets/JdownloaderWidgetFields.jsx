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

const WIDGET_TYPE = 'jdownloader';
const ALLOWED_FIELDS_OPTIONS = [
  "downloadCount",
  "downloadTotalBytes",
  "downloadBytesRemaining",
  "downloadSpeed",
];
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function JdownloaderWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [client, setClient] = useState(initialData?.client || '');
  const [fieldsToDisplay, setFieldsToDisplay] = useState(initialData?.fields || []); // Renamed for clarity
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setClient(initialData.client || '');
      setFieldsToDisplay(initialData.fields || []);
    } else {
      setUsername('');
      setPassword('');
      setClient('');
      setFieldsToDisplay([]);
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      username: username || undefined,
      password: password || undefined,
      client: client || undefined,
      fields: fieldsToDisplay && fieldsToDisplay.length > 0 ? fieldsToDisplay : undefined,
    };

    const calculatedErrors = {};
    if (!username?.trim()) {
      calculatedErrors.username = 'MyJDownloader Username is required.';
    }
    if (!password?.trim()) {
      calculatedErrors.password = 'MyJDownloader Password is required.';
    }
    if (!client?.trim()) {
      calculatedErrors.client = 'Client Name is required.';
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
  }, [username, password, client, JSON.stringify(fieldsToDisplay), parentOnChange]);

  const handleFieldsCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFieldsToDisplay((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      }
      return prevFields.filter((field) => field !== name);
    });
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        JDownloader Specific Fields
      </Typography>
      <FormHelperText sx={{ mb: 1 }}>
        Uses MyJDownloader account credentials.
      </FormHelperText>
      <EnvVarAutocompleteInput
        label="MyJDownloader Username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || ''}
      />
      <EnvVarAutocompleteInput
        label="MyJDownloader Password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        required
        type="password" // Enable visibility toggle
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || ''}
      />
      <TextField
        label="Client Name"
        name="client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
        fullWidth
        // margin="normal" // Using Box gap for spacing
        required
        error={!!fieldErrors.client}
        helperText={fieldErrors.client || "The name of your JDownloader instance as shown in MyJDownloader"}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {ALLOWED_FIELDS_OPTIONS.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={fieldsToDisplay.includes(field)}
                  onChange={handleFieldsCheckboxChange}
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

JdownloaderWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    client: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

JdownloaderWidgetFields.defaultProps = {
 initialData: null,
};

export default JdownloaderWidgetFields;