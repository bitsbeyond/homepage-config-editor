import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // Added import
import PropTypes from 'prop-types'; // Added import

const WIDGET_TYPE = 'jackett';

function JackettWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [password, setPassword] = useState(initialData?.password || ''); // Optional
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setPassword(initialData.password || '');
    } else {
      // Reset to defaults
      setUrl('');
      setPassword('');
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      password: password || undefined, // Password is optional
    };

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'Jackett URL is required.';
    }
    setFieldErrors(calculatedErrors);

    // Prepare data for parent, removing empty optional fields
    const dataForParent = { type: WIDGET_TYPE };
    if (url?.trim()) { // Only include url if it has a value
        dataForParent.url = url.trim();
    }
    if (password) { // Only include password if it has a value
      dataForParent.password = password;
    }
    
    // If only type is present, it means URL (mandatory) is missing or empty
    // The parent form will disable save based on calculatedErrors

    parentOnChange(dataForParent, calculatedErrors);
  }, [url, password, parentOnChange]);


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Jackett URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Jackett instance (e.g., http://jackett.host:9117)"}
      />
      <EnvVarAutocompleteInput
        label="Password (Optional)"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        type="password" // Enable visibility toggle
        helperText="Optional. Admin password if set in Jackett."
      />
    </Box>
  );
}

JackettWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

JackettWidgetFields.defaultProps = {
    initialData: null,
};

export default JackettWidgetFields;