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

const allowedFields = [
  "items",
  "totalWithWarranty",
  "locations",
  "labels",
  "users",
  "totalValue",
];
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // Added import

function HomeboxWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for URL and Username
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);

  // Effect to update local state if initialData changes
  useEffect(() => {
    const newUrl = initialData?.url || '';
    const newUsername = initialData?.username || '';
    const newPassword = initialData?.password || '';
    const newSelectedFields = initialData?.fields || [];

    if (newUrl !== url) setUrl(newUrl);
    if (newUsername !== username) setUsername(newUsername);
    if (newPassword !== password) setPassword(newPassword);

    // Only update selectedFields if its content has actually changed
    if (JSON.stringify(newSelectedFields) !== JSON.stringify(selectedFields)) {
      setSelectedFields(newSelectedFields);
    }

    // Reset errors if initialData itself is new (signified by being null or different content)
    // This part might need refinement if initialData reference changes too often without content change.
    // For now, let's assume initialData changes meaningfully.
    if (!initialData) { // Handles case where widget is deselected
        setUrl('');
        setUsername('');
        setPassword('');
        setSelectedFields([]);
    }
  }, [initialData]); // Revert to only initialData as dependency

  // Effect to call parentOnChange with validation status
  useEffect(() => {
    const calculatedValidationErrors = {};
    if (!url?.trim()) {
      calculatedValidationErrors.url = 'URL is required.';
    }
    if (!username?.trim()) {
      calculatedValidationErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      calculatedValidationErrors.password = 'Password is required.';
    }

    const dataToParent = {
      type: 'homebox',
      url: url,
      username: username,
      password: password,
    };

    if (selectedFields && selectedFields.length > 0) {
      dataToParent.fields = selectedFields;
    }
    
    parentOnChange(dataToParent, calculatedValidationErrors);
  }, [url, username, password, JSON.stringify(selectedFields), parentOnChange]); // Use stringified selectedFields for dep array

  // Handlers for individual fields
  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        if (prevFields.length < 4) {
          return [...prevFields, name];
        }
        return prevFields; // Limit reached
      }
      return prevFields.filter((field) => field !== name);
    });
  };

  const isFieldLimitReached = selectedFields.length >= 4;

  // Calculate error states directly for rendering
  const isUrlError = !url?.trim();
  const isUsernameError = !username?.trim();
  const isPasswordError = !password?.trim();

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Homebox Specific Fields
      </Typography>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        error={isUrlError}
        helperText={isUrlError ? 'URL is required.' : "e.g., http://homebox.host:port"}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        required
        error={isUsernameError}
        helperText={isUsernameError ? 'Username is required.' : "Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        required
        type="password"
        error={isPasswordError}
        helperText={isPasswordError ? 'Password is required.' : "Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional, Max 4)</FormLabel>
        <FormGroup>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleCheckboxChange}
                  name={field}
                  disabled={!selectedFields.includes(field) && isFieldLimitReached}
                />
              }
              label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            />
          ))}
        </FormGroup>
        {isFieldLimitReached && !selectedFields.some(sf => !allowedFields.includes(sf)) && (
          <FormHelperText error>Maximum of 4 fields selected.</FormHelperText>
        )}
         <FormHelperText>Default fields are shown if none are selected.</FormHelperText>
      </FormControl>
    </Box>
  );
}

HomeboxWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

HomeboxWidgetFields.defaultProps = {
  initialData: null,
};

export default HomeboxWidgetFields;