import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function HeadscaleWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [nodeId, setNodeId] = useState(initialData?.nodeId || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setNodeId(initialData.nodeId || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null
      setUrl('');
      setNodeId('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'headscale',
      url: url || undefined,
      nodeId: nodeId || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Headscale URL is required.';
    }
    if (!nodeId?.trim()) {
      errors.nodeId = 'Node ID is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'headscale' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, nodeId, apiKey]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleAutocompleteChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Headscale URL"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://headscale.host:port"}
      />
      <TextField
        required
        fullWidth
        name="nodeId"
        label="Node ID"
        value={nodeId}
        onChange={handleTextFieldChange(setNodeId)}
        error={!!fieldErrors.nodeId}
        helperText={fieldErrors.nodeId || "Find using 'headscale nodes list' command"}
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
        helperText={fieldErrors.key || "Generate using 'headscale apikeys create'. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

HeadscaleWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    nodeId: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

HeadscaleWidgetFields.defaultProps = {
  initialData: null,
};

export default HeadscaleWidgetFields;