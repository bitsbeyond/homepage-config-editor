import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function PlexWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'plex',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Plex widget.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key (X-Plex-Token) is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'plex' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'plex';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Key)
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
        label="Plex URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Plex instance (e.g., http://plex.host.or.ip:32400)"}
        type="url"
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Key (X-Plex-Token)"
        type="password" // Enables visibility toggle
        value={apiKey} // Use individual state
        onChange={handleAutocompleteChange(setApiKey)} // Use specific handler with setter
        error={!!fieldErrors.key}
        helperText={
          fieldErrors.key || (
            <Typography variant="caption">
              See{' '}
              <Link
                href="https://www.plexopedia.com/plex-media-server/general/plex-token/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Plexopedia
              </Link>{' '}
              for instructions on how to find your token. Can be a {'{'}HOMEPAGE_VAR_...{'}'}
            </Typography>
          )
        }
      />
    </Box>
  );
}

PlexWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

PlexWidgetFields.defaultProps = {
  initialData: null,
};

export default PlexWidgetFields;