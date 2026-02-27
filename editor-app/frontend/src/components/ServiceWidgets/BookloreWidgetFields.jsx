import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function BookloreWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'booklore',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Booklore URL is required.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);

    const dataForParent = { type: 'booklore' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, username, password, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleAutocompleteChange = (setter) => (event) => setter(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Booklore URL"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "The URL of your Booklore instance (e.g., http://booklore.host:8080)."}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username"
        label="Username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Booklore username. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Booklore password. Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

BookloreWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

BookloreWidgetFields.defaultProps = {
  initialData: null,
};

export default BookloreWidgetFields;
