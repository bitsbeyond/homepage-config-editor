import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'tailscale';

function TailscaleWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [deviceId, setDeviceId] = useState(initialData?.deviceid || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newDeviceId = initialData.deviceid || '';
      if (newDeviceId !== deviceId) {
        setDeviceId(newDeviceId);
      }
      const newApiKey = initialData.key || '';
      if (newApiKey !== apiKey) {
        setApiKey(newApiKey);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setDeviceId('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      deviceid: deviceId || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!deviceId?.trim()) {
      errors.deviceid = 'Device ID is required for Tailscale widget.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required for Tailscale widget.';
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
  }, [deviceId, apiKey, parentOnChange]);

  // Handle changes for EnvVarAutocompleteInput
  const handleDeviceIdChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setDeviceId(event.target.value);
  };

  const handleApiKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setApiKey(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="deviceid"
        label="Device ID"
        value={deviceId}
        onChange={handleDeviceIdChange}
        error={!!fieldErrors.deviceid}
        helperText={fieldErrors.deviceid || "Find on Tailscale machine details page (ends with CNTRL). Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="key"
        label="API Key"
        type="password"
        value={apiKey}
        onChange={handleApiKeyChange}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Generate from Tailscale admin settings > keys. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

TailscaleWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    deviceid: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

TailscaleWidgetFields.defaultProps = {
  initialData: null,
};

export default TailscaleWidgetFields;