import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function PortainerWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [envId, setEnvId] = useState(initialData?.env?.toString() || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setEnvId(initialData.env?.toString() || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setEnvId('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'portainer',
      url: url || undefined,
      env: envId ? parseInt(envId, 10) : undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Portainer widget.';
    }
    if (!envId?.trim()) {
      errors.env = 'Environment ID is required.';
    } else {
      const numEnv = parseInt(envId, 10);
      if (isNaN(numEnv) || numEnv < 0) {
        errors.env = 'Environment ID must be a valid positive number.';
      }
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'portainer' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'portainer';
    }

    parentOnChange(dataForParent, errors);
  }, [url, envId, apiKey, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, Environment ID)
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
        label="Portainer URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Portainer instance (e.g., https://portainer.host:9443)"}
        type="url"
      />
      <TextField
        required
        fullWidth
        name="env"
        label="Environment ID"
        value={envId} // Use individual state
        onChange={handleTextFieldChange(setEnvId)} // Use specific handler with setter
        error={!!fieldErrors.env}
        helperText={fieldErrors.env || "The numeric ID of the environment (e.g., 1 from #!/endpoints/1)"}
        type="number"
        inputProps={{ min: 0 }}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Key"
        type="password" // Enables visibility toggle
        value={apiKey} // Use individual state
        onChange={handleAutocompleteChange(setApiKey)} // Use specific handler with setter
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Portainer Access Token (Settings > Authentication > API Keys). Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

PortainerWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    env: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

PortainerWidgetFields.defaultProps = {
  initialData: null,
};

export default PortainerWidgetFields;