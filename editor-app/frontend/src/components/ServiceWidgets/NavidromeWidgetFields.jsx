import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function NavidromeWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [user, setUser] = useState(initialData?.user || '');
  const [token, setToken] = useState(initialData?.token || '');
  const [salt, setSalt] = useState(initialData?.salt || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newUser = initialData.user || '';
      if (newUser !== user) {
        setUser(newUser);
      }
      const newToken = initialData.token || '';
      if (newToken !== token) {
        setToken(newToken);
      }
      const newSalt = initialData.salt || '';
      if (newSalt !== salt) {
        setSalt(newSalt);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUser('');
      setToken('');
      setSalt('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'navidrome',
      url: url || undefined,
      user: user || undefined,
      token: token || undefined,
      salt: salt || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Navidrome widget.';
    }
    if (!user?.trim()) {
      errors.user = 'Username is required for Navidrome widget.';
    }
    if (!token?.trim()) {
      errors.token = 'Token is required for Navidrome widget.';
    }
    if (!salt?.trim()) {
      errors.salt = 'Salt is required for Navidrome widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'navidrome' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'navidrome';
    }

    parentOnChange(dataForParent, errors);
  }, [url, user, token, salt, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, Username)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleUserChange = (event) => {
    setUser(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Token, Salt)
  const handleTokenChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setToken(event.target.value);
  };

  const handleSaltChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setSalt(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Navidrome URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Navidrome instance (e.g., http://navidrome.host:4533)"}
      />
      <TextField
        required
        fullWidth
        name="user"
        label="Username"
        value={user}
        onChange={handleUserChange}
        error={!!fieldErrors.user}
        helperText={fieldErrors.user || "Navidrome username"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="token"
        label="Token"
        type="password" // Enables visibility toggle
        value={token}
        onChange={handleTokenChange}
        error={!!fieldErrors.token}
        helperText={fieldErrors.token || "Subsonic API token: md5(password + salt). Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="salt"
        label="Salt"
        type="password" // Enables visibility toggle
        value={salt}
        onChange={handleSaltChange}
        error={!!fieldErrors.salt}
        helperText={fieldErrors.salt || "Random salt used for generating the token. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

NavidromeWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    user: PropTypes.string,
    token: PropTypes.string,
    salt: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

NavidromeWidgetFields.defaultProps = {
  initialData: null,
};

export default NavidromeWidgetFields;