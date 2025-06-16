import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function NextdnsWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [profile, setProfile] = useState(initialData?.profile || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newProfile = initialData.profile || '';
      if (newProfile !== profile) {
        setProfile(newProfile);
      }
      const newKey = initialData.key || '';
      if (newKey !== key) {
        setKey(newKey);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setProfile('');
      setKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'nextdns',
      profile: profile || undefined,
      key: key || undefined,
    };

    const errors = {};
    if (!profile?.trim()) {
      errors.profile = 'Profile ID is required for NextDNS widget.';
    }
    if (!key?.trim()) {
      errors.key = 'API Key is required for NextDNS widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'nextdns' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'nextdns';
    }

    parentOnChange(dataForParent, errors);
  }, [profile, key, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for EnvVarAutocompleteInput (Profile, API Key)
  const handleProfileChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setProfile(event.target.value);
  };

  const handleKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setKey(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="profile"
        label="Profile ID"
        value={profile}
        onChange={handleProfileChange}
        error={!!fieldErrors.profile}
        helperText={fieldErrors.profile || "Found under Setup > Endpoints > ID. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key"
        label="API Key"
        type="password" // Enables visibility toggle
        value={key}
        onChange={handleKeyChange}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Found under Account > API. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

NextdnsWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    profile: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

NextdnsWidgetFields.defaultProps = {
  initialData: null,
};

export default NextdnsWidgetFields;