import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function CrowdsecWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'crowdsec',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'CrowdSec LAPI URL is required.';
    }
    if (!username?.trim()) {
      errors.username = 'Machine ID / Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'crowdsec' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'crowdsec';
    }


    parentOnChange(dataForParent, errors);
  }, [url, username, password, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextField (URL)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Username, Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="CrowdSec LAPI URL"
        value={url} // Use individual state
        onChange={handleUrlChange} // Use specific handler
        helperText="The URL of your CrowdSec Local API (e.g., http://192.168.1.104:8080)."
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username"
        label="Machine ID / Username"
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        helperText="Usually 'localhost' or the machine_id from credentials file."
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password"
        label="Password"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        helperText="Password from local_api_credentials.yaml."
      />
    </Box>
  );
}

CrowdsecWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

CrowdsecWidgetFields.defaultProps = {
  initialData: null,
};

export default CrowdsecWidgetFields;