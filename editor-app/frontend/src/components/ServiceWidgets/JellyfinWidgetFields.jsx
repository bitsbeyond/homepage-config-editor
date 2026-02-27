import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box, FormControlLabel, Switch, FormGroup, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'jellyfin';

// Default values for boolean fields
const defaultEnableBlocks = false;
const defaultEnableNowPlaying = true;
const defaultEnableUser = false;
const defaultShowEpisodeNumber = false;
const defaultExpandOneStreamToTwoRows = true;
const defaultEnableMediaControl = true;


function JellyfinWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [version, setVersion] = useState(initialData?.version ? String(initialData.version) : '1');
  const [enableBlocks, setEnableBlocks] = useState(initialData?.enableBlocks === undefined ? defaultEnableBlocks : initialData.enableBlocks);
  const [enableNowPlaying, setEnableNowPlaying] = useState(initialData?.enableNowPlaying === undefined ? defaultEnableNowPlaying : initialData.enableNowPlaying);
  const [enableUser, setEnableUser] = useState(initialData?.enableUser === undefined ? defaultEnableUser : initialData.enableUser);
  const [showEpisodeNumber, setShowEpisodeNumber] = useState(initialData?.showEpisodeNumber === undefined ? defaultShowEpisodeNumber : initialData.showEpisodeNumber);
  const [expandOneStreamToTwoRows, setExpandOneStreamToTwoRows] = useState(initialData?.expandOneStreamToTwoRows === undefined ? defaultExpandOneStreamToTwoRows : initialData.expandOneStreamToTwoRows);
  const [enableMediaControl, setEnableMediaControl] = useState(initialData?.enableMediaControl === undefined ? defaultEnableMediaControl : initialData.enableMediaControl);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setVersion(initialData.version ? String(initialData.version) : '1');
      setEnableBlocks(initialData.enableBlocks === undefined ? defaultEnableBlocks : initialData.enableBlocks);
      setEnableNowPlaying(initialData.enableNowPlaying === undefined ? defaultEnableNowPlaying : initialData.enableNowPlaying);
      setEnableUser(initialData.enableUser === undefined ? defaultEnableUser : initialData.enableUser);
      setShowEpisodeNumber(initialData.showEpisodeNumber === undefined ? defaultShowEpisodeNumber : initialData.showEpisodeNumber);
      setExpandOneStreamToTwoRows(initialData.expandOneStreamToTwoRows === undefined ? defaultExpandOneStreamToTwoRows : initialData.expandOneStreamToTwoRows);
      setEnableMediaControl(initialData.enableMediaControl === undefined ? defaultEnableMediaControl : initialData.enableMediaControl);
    } else {
      setUrl('');
      setApiKey('');
      setVersion('1');
      setEnableBlocks(defaultEnableBlocks);
      setEnableNowPlaying(defaultEnableNowPlaying);
      setEnableUser(defaultEnableUser);
      setShowEpisodeNumber(defaultShowEpisodeNumber);
      setExpandOneStreamToTwoRows(defaultExpandOneStreamToTwoRows);
      setEnableMediaControl(defaultEnableMediaControl);
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
      version: version !== '1' ? parseInt(version, 10) : undefined,
      enableBlocks: enableBlocks === defaultEnableBlocks ? undefined : enableBlocks,
      enableNowPlaying: enableNowPlaying === defaultEnableNowPlaying ? undefined : enableNowPlaying,
      enableUser: enableUser === defaultEnableUser ? undefined : enableUser,
      showEpisodeNumber: showEpisodeNumber === defaultShowEpisodeNumber ? undefined : showEpisodeNumber,
      expandOneStreamToTwoRows: expandOneStreamToTwoRows === defaultExpandOneStreamToTwoRows ? undefined : expandOneStreamToTwoRows,
      enableMediaControl: enableMediaControl === defaultEnableMediaControl ? undefined : enableMediaControl,
    };

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'Jellyfin URL is required.';
    }
    if (!apiKey?.trim()) {
      calculatedErrors.key = 'API Key is required.';
    }
    setFieldErrors(calculatedErrors);

    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     if (Object.keys(dataForParent).length === 1 && dataForParent.type === WIDGET_TYPE) {
        // Only type is present
    }

    parentOnChange(dataForParent, calculatedErrors);
  }, [url, apiKey, version, enableBlocks, enableNowPlaying, enableUser, showEpisodeNumber, expandOneStreamToTwoRows, enableMediaControl, parentOnChange]);


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Jellyfin URL"
        name="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Jellyfin instance (e.g., http://jellyfin.host:8096)"}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        fullWidth
        required
        type="password" // Enables visibility toggle and masking
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Found in Jellyfin under Settings > Advanced > API Keys. Can be a {{HOMEPAGE_VAR_...}} or {{HOMEPAGE_FILE_...}}"}
      />
      <FormControl fullWidth>
        <InputLabel id="jellyfin-version-label">Widget Version</InputLabel>
        <Select
          labelId="jellyfin-version-label"
          id="jellyfin-version-select"
          name="version"
          value={version}
          label="Widget Version"
          onChange={(e) => setVersion(e.target.value)}
        >
          <MenuItem value="1">v1 (Jellyfin &lt; 10.12, Default)</MenuItem>
          <MenuItem value="2">v2 (Jellyfin &gt;= 10.12)</MenuItem>
        </Select>
        <FormHelperText>Use v2 for Jellyfin 10.12 and newer.</FormHelperText>
      </FormControl>
      <FormGroup sx={{ pl: 1 }}>
        <FormControlLabel
            control={<Switch checked={enableBlocks} onChange={(e) => setEnableBlocks(e.target.checked)} name="enableBlocks" />}
            label="Enable Library Blocks (Movies, Series, etc.)"
        />
        <FormControlLabel
            control={<Switch checked={enableNowPlaying} onChange={(e) => setEnableNowPlaying(e.target.checked)} name="enableNowPlaying" />}
            label="Enable 'Now Playing' Display"
        />
         <FormControlLabel
            control={<Switch checked={enableUser} onChange={(e) => setEnableUser(e.target.checked)} name="enableUser" />}
            label="Enable User Display in 'Now Playing'"
        />
         <FormControlLabel
            control={<Switch checked={showEpisodeNumber} onChange={(e) => setShowEpisodeNumber(e.target.checked)} name="showEpisodeNumber" />}
            label="Show Episode Number in 'Now Playing'"
        />
         <FormControlLabel
            control={<Switch checked={expandOneStreamToTwoRows} onChange={(e) => setExpandOneStreamToTwoRows(e.target.checked)} name="expandOneStreamToTwoRows" />}
            label="Expand Single Stream to Two Rows"
        />
        <FormControlLabel
            control={<Switch checked={enableMediaControl} onChange={(e) => setEnableMediaControl(e.target.checked)} name="enableMediaControl" />}
            label="Enable Media Control (v2 only)"
        />
      </FormGroup>
    </Box>
  );
}

JellyfinWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enableBlocks: PropTypes.bool,
    enableNowPlaying: PropTypes.bool,
    enableUser: PropTypes.bool,
    showEpisodeNumber: PropTypes.bool,
    expandOneStreamToTwoRows: PropTypes.bool,
    enableMediaControl: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

JellyfinWidgetFields.defaultProps = {
  initialData: null,
};

export default JellyfinWidgetFields;