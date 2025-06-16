import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, FormControlLabel, Switch, Box, Typography } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

/**
 * Fields specific to the Emby widget type.
 * @param {object} props - Component props.
 * @param {object} props.initialData - The current widget data object.
 * @param {function} props.onChange - Function to call when the widget data changes.
 */
function EmbyWidgetFields({ initialData, onChange: parentOnChange }) {
  const defaults = {
    enableBlocks: false,
    enableNowPlaying: true,
    enableUser: false,
    showEpisodeNumber: false,
    expandOneStreamToTwoRows: true,
  };

  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [enableBlocks, setEnableBlocks] = useState(initialData?.enableBlocks ?? defaults.enableBlocks);
  const [enableNowPlaying, setEnableNowPlaying] = useState(initialData?.enableNowPlaying ?? defaults.enableNowPlaying);
  const [enableUser, setEnableUser] = useState(initialData?.enableUser ?? defaults.enableUser);
  const [showEpisodeNumber, setShowEpisodeNumber] = useState(initialData?.showEpisodeNumber ?? defaults.showEpisodeNumber);
  const [expandOneStreamToTwoRows, setExpandOneStreamToTwoRows] = useState(initialData?.expandOneStreamToTwoRows ?? defaults.expandOneStreamToTwoRows);


  useEffect(() => {
    setUrl(initialData?.url || '');
    setApiKey(initialData?.key || '');
    setEnableBlocks(initialData?.enableBlocks ?? defaults.enableBlocks);
    setEnableNowPlaying(initialData?.enableNowPlaying ?? defaults.enableNowPlaying);
    setEnableUser(initialData?.enableUser ?? defaults.enableUser);
    setShowEpisodeNumber(initialData?.showEpisodeNumber ?? defaults.showEpisodeNumber);
    setExpandOneStreamToTwoRows(initialData?.expandOneStreamToTwoRows ?? defaults.expandOneStreamToTwoRows);
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: 'emby',
      url: url || undefined,
      key: apiKey || undefined,
      enableBlocks,
      enableNowPlaying,
      enableUser,
      showEpisodeNumber,
      expandOneStreamToTwoRows,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'URL is required.';
    }
    if (!apiKey?.trim()) {
      validationErrors.key = 'API Key is required.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });

    // Remove optional boolean fields if they match their default value
    Object.keys(defaults).forEach(key => {
        if (dataForParent[key] === defaults[key]) {
            delete dataForParent[key];
        }
    });
    dataForParent.type = 'emby';

    parentOnChange(dataForParent, validationErrors);
  }, [url, apiKey, enableBlocks, enableNowPlaying, enableUser, showEpisodeNumber, expandOneStreamToTwoRows, parentOnChange]);

  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);
  const handleEnableBlocksChange = (event) => setEnableBlocks(event.target.checked);
  const handleEnableNowPlayingChange = (event) => setEnableNowPlaying(event.target.checked);
  const handleEnableUserChange = (event) => setEnableUser(event.target.checked);
  const handleShowEpisodeNumberChange = (event) => setShowEpisodeNumber(event.target.checked);
  const handleExpandStreamChange = (event) => setExpandOneStreamToTwoRows(event.target.checked);


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        helperText={!url?.trim() ? 'URL is required.' : "e.g., http://emby.host.or.ip"}
        error={!url?.trim()}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        type="password" // Enable visibility toggle for API keys
        required
        helperText={!apiKey?.trim() ? 'API Key is required.' : "Create in Emby: Settings > Advanced > Api Keys"}
        error={!apiKey?.trim()}
      />
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="subtitle2" gutterBottom>Optional Settings</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enableBlocks}
              onChange={handleEnableBlocksChange}
              name="enableBlocks"
            />
          }
          label="Enable Library Blocks (Movies, Series, etc.)"
        />
        <FormControlLabel
          control={
            <Switch
              checked={enableNowPlaying}
              onChange={handleEnableNowPlayingChange}
              name="enableNowPlaying"
            />
          }
          label="Enable 'Now Playing' Section"
        />
         <FormControlLabel
          control={
            <Switch
              checked={enableUser}
              onChange={handleEnableUserChange}
              name="enableUser"
            />
          }
          label="Enable User Display in 'Now Playing'"
        />
         <FormControlLabel
          control={
            <Switch
              checked={showEpisodeNumber}
              onChange={handleShowEpisodeNumberChange}
              name="showEpisodeNumber"
            />
          }
          label="Show Episode Number in 'Now Playing'"
        />
         <FormControlLabel
          control={
            <Switch
              checked={expandOneStreamToTwoRows}
              onChange={handleExpandStreamChange}
              name="expandOneStreamToTwoRows"
            />
          }
          label="Expand Single Stream to Two Rows"
        />
      </Box>
    </Box>
  );
}

EmbyWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    enableBlocks: PropTypes.bool,
    enableNowPlaying: PropTypes.bool,
    enableUser: PropTypes.bool,
    showEpisodeNumber: PropTypes.bool,
    expandOneStreamToTwoRows: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

EmbyWidgetFields.defaultProps = {
    initialData: null,
};

export default EmbyWidgetFields;