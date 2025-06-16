import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';
import PropTypes from 'prop-types'; // Added PropTypes

function GitlabWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [userIdStr, setUserIdStr] = useState(initialData?.user_id?.toString() || ''); // Keep as string for TextField

  // Effect to update local state if initialData changes
  useEffect(() => {
    setUrl(initialData?.url || '');
    setApiKey(initialData?.key || '');
    setUserIdStr(initialData?.user_id?.toString() || '');
  }, [initialData]);

  // Update parent component when local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'gitlab',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Gitlab URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'Personal Access Token is required.';
    }
    
    const numUserId = parseInt(userIdStr, 10);
    if (!userIdStr?.trim() || isNaN(numUserId) || numUserId < 0) {
      validationErrors.user_id = 'User ID is required and must be a non-negative number.';
    } else {
      currentWidgetData.user_id = numUserId;
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'gitlab';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, userIdStr, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);
  const handleUserIdChange = (event) => setUserIdStr(event.target.value);

  const userIdError = !userIdStr?.trim() || isNaN(parseInt(userIdStr, 10)) || parseInt(userIdStr, 10) < 0;

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Gitlab URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        helperText={!url?.trim() ? 'Gitlab URL is required.' : "URL of your Gitlab instance (e.g., https://gitlab.com or http://gitlab.local)"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="Personal Access Token"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password" // Mask the token & enable visibility toggle
        helperText={!apiKey?.trim() ? 'Personal Access Token is required.' : "Token with read_api or api scope."}
        error={!apiKey?.trim()}
      />
      <TextField
        label="User ID"
        name="user_id"
        value={userIdStr}
        onChange={handleUserIdChange}
        fullWidth
        required
        type="number" // Use number type for input validation, but state is string
        inputProps={{ min: 0 }} // Basic validation
        helperText={userIdError ? 'User ID is required and must be a non-negative number.' : "Your numeric Gitlab User ID (find on profile page)."}
        error={userIdError}
      />
    </Box>
  );
}

GitlabWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

GitlabWidgetFields.defaultProps = {
    initialData: null,
};

export default GitlabWidgetFields;