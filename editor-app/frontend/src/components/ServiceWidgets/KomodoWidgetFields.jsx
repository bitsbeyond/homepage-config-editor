import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function KomodoWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [secret, setSecret] = useState(initialData?.secret || '');
  const [showSummary, setShowSummary] = useState(initialData?.showSummary || false);
  const [showStacks, setShowStacks] = useState(initialData?.showStacks || false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setSecret(initialData.secret || '');
      setShowSummary(initialData.showSummary || false);
      setShowStacks(initialData.showStacks || false);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setSecret('');
      setShowSummary(false);
      setShowStacks(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'komodo',
      url: url || undefined,
      key: apiKey || undefined,
      secret: secret || undefined,
      showSummary: showSummary || undefined,
      showStacks: showStacks || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required (format: K-xxxxxx...).';
    }
    if (!secret?.trim()) {
      errors.secret = 'API Secret is required (format: S-xxxxxx...).';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'komodo' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Remove boolean defaults (false) from YAML
    if (dataForParent.showSummary === false) {
      delete dataForParent.showSummary;
    }
    if (dataForParent.showStacks === false) {
      delete dataForParent.showStacks;
    }

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'komodo';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, secret, showSummary, showStacks, parentOnChange]);

  // Helper functions (memoized to prevent flickering)
  const handleTextFieldChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleAutocompleteChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleSwitchChange = useCallback((setter) => (event) => {
    setter(event.target.checked);
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Komodo Configuration
      </Typography>

      <TextField
        label="Komodo URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://komodo.hostname.or.ip:port"}
      />

      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleAutocompleteChange(setApiKey)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "API Key (format: K-xxxxxx...). Can use {{HOMEPAGE_VAR_...}}"}
      />

      <EnvVarAutocompleteInput
        label="API Secret"
        name="secret"
        value={secret}
        onChange={handleAutocompleteChange(setSecret)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.secret}
        helperText={fieldErrors.secret || "API Secret (format: S-xxxxxx...). Can use {{HOMEPAGE_VAR_...}}"}
      />

      <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
        Display Options:
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={showSummary}
            onChange={handleSwitchChange(setShowSummary)}
            name="showSummary"
          />
        }
        label="Show Summary (servers, stacks, containers)"
        sx={{ mt: 0 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={showStacks}
            onChange={handleSwitchChange(setShowStacks)}
            name="showStacks"
          />
        }
        label="Show Stack Details (instead of container details)"
        sx={{ mt: 0 }}
      />
    </Box>
  );
}

KomodoWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    secret: PropTypes.string,
    showSummary: PropTypes.bool,
    showStacks: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

KomodoWidgetFields.defaultProps = {
  initialData: null,
};

export default KomodoWidgetFields;
