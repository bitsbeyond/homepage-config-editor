import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function PeanutWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [upsName, setUpsName] = useState(initialData?.key || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUpsName(initialData.key || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUpsName('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'peanut',
      url: url || undefined,
      key: upsName || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for PeaNUT widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'peanut' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'peanut';
    }

    parentOnChange(dataForParent, errors);
  }, [url, upsName, username, password, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, UPS Name)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Username, Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="PeaNUT URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your PeaNUT instance (e.g., http://peanut.local:8080)"}
        type="url"
      />
      
      <TextField
        fullWidth
        name="key"
        label="UPS Name (Key)"
        value={upsName} // Use individual state
        onChange={handleTextFieldChange(setUpsName)} // Use specific handler with setter
        helperText="Name of the UPS configured in PeaNUT (optional, defaults to 'ups')"
      />

      {/* Optional Authentication */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
        Authentication (Optional - Only if set in PeaNUT)
      </Typography>
      
      <EnvVarAutocompleteInput
        fullWidth
        name="username" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Username"
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        helperText="Username for PeaNUT authentication. Can be a {{HOMEPAGE_VAR_...}}"
      />
      
      <EnvVarAutocompleteInput
        fullWidth
        name="password" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Password"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        helperText="Password for PeaNUT authentication. Can be a {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

PeanutWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

PeanutWidgetFields.defaultProps = {
  initialData: null,
};

export default PeanutWidgetFields;