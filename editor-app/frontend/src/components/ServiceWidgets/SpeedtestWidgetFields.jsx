import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'speedtest-tracker';

function SpeedtestWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [version, setVersion] = useState(initialData?.version?.toString() || '1');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [bitratePrecision, setBitratePrecision] = useState(initialData?.bitratePrecision?.toString() || '0');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newVersion = initialData.version?.toString() || '1';
      if (newVersion !== version) {
        setVersion(newVersion);
      }
      const newApiKey = initialData.key || '';
      if (newApiKey !== apiKey) {
        setApiKey(newApiKey);
      }
      const newBitratePrecision = initialData.bitratePrecision?.toString() || '0';
      if (newBitratePrecision !== bitratePrecision) {
        setBitratePrecision(newBitratePrecision);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setVersion('1');
      setApiKey('');
      setBitratePrecision('0');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      version: version !== '1' ? parseInt(version, 10) : undefined,
      key: apiKey || undefined,
      bitratePrecision: bitratePrecision !== '0' ? parseInt(bitratePrecision, 10) : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Speedtest widget.';
    }
    // API Key is required for version 2
    if (version === '2' && !apiKey?.trim()) {
      errors.key = 'API Key is required for Speedtest API Version 2.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = WIDGET_TYPE;
    }

    parentOnChange(dataForParent, errors);
  }, [url, version, apiKey, bitratePrecision, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleVersionChange = (event) => {
    setVersion(event.target.value);
  };

  const handleBitratePrecisionChange = (event) => {
    setBitratePrecision(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleApiKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setApiKey(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Speedtest Tracker URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Speedtest Tracker instance"}
      />
      <FormControl fullWidth>
        <InputLabel id="speedtest-version-label">API Version</InputLabel>
        <Select
          labelId="speedtest-version-label"
          id="speedtest-version-select"
          name="version"
          value={version}
          label="API Version"
          onChange={handleVersionChange}
        >
          <MenuItem value="1">v1 (Default)</MenuItem>
          <MenuItem value="2">v2 (alexjustesen only)</MenuItem>
        </Select>
        <FormHelperText>Select v2 only for alexjustesen/speedtest-tracker ≥ 1.2.1</FormHelperText>
      </FormControl>
      <EnvVarAutocompleteInput
        required={version === '2'}
        fullWidth
        name="key"
        label={version === '2' ? "API Key" : "API Key (Optional)"}
        type="password"
        value={apiKey}
        onChange={handleApiKeyChange}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || (version === '2' ? "Required for API Version 2. Can be a {{HOMEPAGE_VAR_...}}" : "Optional. Required for API Version 2. Can be a {{HOMEPAGE_VAR_...}}")}
      />
      <TextField
        fullWidth
        name="bitratePrecision"
        label="Bitrate Precision (Optional)"
        type="number"
        value={bitratePrecision}
        onChange={handleBitratePrecisionChange}
        inputProps={{ min: 0, step: 1 }}
        helperText="Number of decimal places for bitrate (default: 0)"
      />
    </Box>
  );
}

SpeedtestWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    key: PropTypes.string,
    bitratePrecision: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

SpeedtestWidgetFields.defaultProps = {
  initialData: null,
};

export default SpeedtestWidgetFields;