import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function TautulliWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [enableUser, setEnableUser] = useState(initialData?.enableUser || false);
  const [showEpisodeNumber, setShowEpisodeNumber] = useState(initialData?.showEpisodeNumber || false);
  const [expandOneStreamToTwoRows, setExpandOneStreamToTwoRows] = useState(
    initialData?.expandOneStreamToTwoRows === undefined ? true : initialData.expandOneStreamToTwoRows
  );
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setEnableUser(initialData.enableUser || false);
      setShowEpisodeNumber(initialData.showEpisodeNumber || false);
      setExpandOneStreamToTwoRows(
        initialData.expandOneStreamToTwoRows === undefined ? true : initialData.expandOneStreamToTwoRows
      );
    } else {
      // Reset to defaults if initialData becomes null
      setUrl('');
      setApiKey('');
      setEnableUser(false);
      setShowEpisodeNumber(false);
      setExpandOneStreamToTwoRows(true);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'tautulli',
      url: url || undefined,
      key: apiKey || undefined,
      enableUser: enableUser || undefined,
      showEpisodeNumber: showEpisodeNumber || undefined,
      expandOneStreamToTwoRows: expandOneStreamToTwoRows === true ? undefined : expandOneStreamToTwoRows, // Only include if not default
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Tautulli URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'tautulli' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, enableUser, showEpisodeNumber, expandOneStreamToTwoRows, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
    setter(event.target.value);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (setter) => (event) => {
    setter(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Tautulli URL"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://tautulli.local"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key"
        label="API Key"
        type="password"
        value={apiKey}
        onChange={handleAutocompleteChange(setApiKey)}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Found in Tautulli Settings > Web Interface > API. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
        Optional Display Settings
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={enableUser}
              onChange={handleCheckboxChange(setEnableUser)}
              name="enableUser"
            />
          }
          label="Enable User?"
        />
        <Typography variant="caption" display="block" sx={{ pl: 4, mt: -1 }}>Defaults to false</Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={showEpisodeNumber}
              onChange={handleCheckboxChange(setShowEpisodeNumber)}
              name="showEpisodeNumber"
            />
          }
          label="Show Episode #"
        />
        <Typography variant="caption" display="block" sx={{ pl: 4, mt: -1 }}>Defaults to false</Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={expandOneStreamToTwoRows}
              onChange={handleCheckboxChange(setExpandOneStreamToTwoRows)}
              name="expandOneStreamToTwoRows"
            />
          }
          label="Expand One Stream?"
        />
        <Typography variant="caption" display="block" sx={{ pl: 4, mt: -1 }}>Defaults to true</Typography>
      </Box>
    </Box>
  );
}

TautulliWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    enableUser: PropTypes.bool,
    showEpisodeNumber: PropTypes.bool,
    expandOneStreamToTwoRows: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

TautulliWidgetFields.defaultProps = {
  initialData: null,
};

export default TautulliWidgetFields;