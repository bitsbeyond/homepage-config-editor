import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import YAML from 'js-yaml';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';
import PropTypes from 'prop-types';

// Helper to check if a string is valid YAML (specifically an array for custom)
const isValidYamlArray = (str) => {
    if (!str || !str.trim()) return true; // Optional, so empty is valid
    try {
        const parsed = YAML.load(str);
        return Array.isArray(parsed);
    } catch (e) {
        return false;
    }
};

// Function to safely dump YAML, returning an empty string for null/undefined or errors
const safeYamlDump = (data) => {
    if (data === null || typeof data === 'undefined') return '';
    try {
        return YAML.dump(data);
    } catch (e) {
        console.error("Error dumping YAML:", e);
        return ''; // Return empty string on error to avoid breaking the form
    }
};


function HomeassistantWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [customYaml, setCustomYaml] = useState(initialData?.custom ? safeYamlDump(initialData.custom) : '');
  const [fieldErrors, setFieldErrors] = useState({}); // Local state for displaying field-specific errors

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    const newUrl = initialData?.url || '';
    const newApiKey = initialData?.key || '';
    const newCustomYaml = initialData?.custom ? safeYamlDump(initialData.custom) : '';

    // Only reset fields and errors if the core data has actually changed,
    // or if initialData itself becomes null/undefined (signifying deselection or new item).
    if (initialData === null || initialData === undefined) {
      setUrl('');
      setApiKey('');
      setCustomYaml('');
      setFieldErrors({});
    } else if (newUrl !== url || newApiKey !== apiKey || newCustomYaml !== customYaml) {
      setUrl(newUrl);
      setApiKey(newApiKey);
      setCustomYaml(newCustomYaml);
      setFieldErrors({}); // Reset errors only when initialData's content truly changes
    }
    // If initialData reference changes but content is the same, this avoids resetting fields/errors.
  }, [initialData]); // Reverted: Only initialData should be in deps for prop syncing

  // Effect to call parentOnChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'homeassistant',
      url: url || undefined,
      key: apiKey || undefined,
      // custom will be handled below after validation
    };

    const calculatedValidationErrors = {}; // Renamed to avoid conflict with state
    if (!url?.trim()) {
      calculatedValidationErrors.url = 'Home Assistant URL is required.';
    }
    if (!apiKey?.trim()) {
      calculatedValidationErrors.key = 'Long-Lived Access Token is required.';
    }

    let customIsValid = isValidYamlArray(customYaml);
    if (!customIsValid && customYaml && customYaml.trim()) { // Only error if not valid AND not empty
      calculatedValidationErrors.custom = 'Invalid YAML array format for Custom States/Templates.';
    }
    
    setFieldErrors(calculatedValidationErrors); // Update local error display state

    // Prepare dataForParent
    const dataForParent = { ...currentWidgetData };

    if (customIsValid && customYaml && customYaml.trim()) {
        try {
            dataForParent.custom = YAML.load(customYaml);
        } catch (e) {
            console.error("Error parsing custom YAML for parent:", e);
            // calculatedValidationErrors.custom might already be set, or set it here
            if (!calculatedValidationErrors.custom) calculatedValidationErrors.custom = 'Error parsing custom YAML.';
            // Do not include dataForParent.custom if it's unparsable
        }
    } else if (!customYaml || !customYaml.trim()) {
        delete dataForParent.custom; // Remove if empty or only whitespace
    }


    // Clean up other undefined fields from dataForParent before sending
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    // Ensure 'type' is always present, even if all other fields are cleared
    dataForParent.type = 'homeassistant';


    parentOnChange(dataForParent, calculatedValidationErrors); // Pass calculated errors
  }, [url, apiKey, customYaml, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleCustomYamlChange = (event) => {
    setCustomYaml(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Home Assistant URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Home Assistant instance (e.g., http://homeassistant.local:8123)"}
      />
      <EnvVarAutocompleteInput
        label="Long-Lived Access Token"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password" // Mask the token & enable visibility toggle
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Generate via your Home Assistant profile page. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        label="Custom States/Templates (YAML Array)"
        name="custom"
        value={customYaml}
        onChange={handleCustomYamlChange}
        fullWidth
        multiline
        rows={8}
        error={!!fieldErrors.custom}
        helperText={
          fieldErrors.custom || "Optional. Define custom entities/templates to display. See Homepage docs."
        }
        sx={{ fontFamily: 'monospace' }}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
}

HomeassistantWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    custom: PropTypes.oneOfType([PropTypes.array, PropTypes.object]), // custom can be array or object
  }),
  onChange: PropTypes.func.isRequired,
};

HomeassistantWidgetFields.defaultProps = {
    initialData: null,
};

export default HomeassistantWidgetFields;