import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';

function IframeWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [name, setName] = useState(initialData?.name || '');
  const [src, setSrc] = useState(initialData?.src || '');
  const [classes, setClasses] = useState(initialData?.classes || '');
  const [referrerPolicy, setReferrerPolicy] = useState(initialData?.referrerPolicy || '');
  const [allowPolicy, setAllowPolicy] = useState(initialData?.allowPolicy || '');
  const [allowFullscreen, setAllowFullscreen] = useState(initialData?.allowFullscreen === undefined ? true : initialData.allowFullscreen);
  const [loadingStrategy, setLoadingStrategy] = useState(initialData?.loadingStrategy || 'eager');
  const [allowScrolling, setAllowScrolling] = useState(initialData?.allowScrolling || 'yes');
  const [refreshInterval, setRefreshInterval] = useState(initialData?.refreshInterval || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newName = initialData.name || '';
      const newSrc = initialData.src || '';
      const newClasses = initialData.classes || '';
      const newReferrerPolicy = initialData.referrerPolicy || '';
      const newAllowPolicy = initialData.allowPolicy || '';
      const newAllowFullscreen = initialData.allowFullscreen === undefined ? true : initialData.allowFullscreen;
      const newLoadingStrategy = initialData.loadingStrategy || 'eager';
      const newAllowScrolling = initialData.allowScrolling || 'yes';
      const newRefreshInterval = initialData.refreshInterval || '';

      if (newName !== name) setName(newName);
      if (newSrc !== src) setSrc(newSrc);
      if (newClasses !== classes) setClasses(newClasses);
      if (newReferrerPolicy !== referrerPolicy) setReferrerPolicy(newReferrerPolicy);
      if (newAllowPolicy !== allowPolicy) setAllowPolicy(newAllowPolicy);
      if (newAllowFullscreen !== allowFullscreen) setAllowFullscreen(newAllowFullscreen);
      if (newLoadingStrategy !== loadingStrategy) setLoadingStrategy(newLoadingStrategy);
      if (newAllowScrolling !== allowScrolling) setAllowScrolling(newAllowScrolling);
      if (newRefreshInterval !== refreshInterval) setRefreshInterval(newRefreshInterval);
    } else {
      // Reset to defaults
      setName('');
      setSrc('');
      setClasses('');
      setReferrerPolicy('');
      setAllowPolicy('');
      setAllowFullscreen(true);
      setLoadingStrategy('eager');
      setAllowScrolling('yes');
      setRefreshInterval('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'iframe',
      name: name || undefined,
      src: src || undefined,
      classes: classes || undefined,
      referrerPolicy: referrerPolicy || undefined,
      allowPolicy: allowPolicy || undefined,
      allowFullscreen: allowFullscreen === true ? undefined : allowFullscreen,
      loadingStrategy: loadingStrategy === 'eager' ? undefined : loadingStrategy,
      allowScrolling: allowScrolling === 'yes' ? undefined : allowScrolling,
      refreshInterval: refreshInterval ? parseInt(refreshInterval, 10) || undefined : undefined,
    };

    const errors = {};
    if (!name?.trim()) {
      errors.name = 'iFrame Name is required.';
    }
    if (!src?.trim()) {
      errors.src = 'Source URL is required.';
    }
    if (refreshInterval && (isNaN(parseInt(refreshInterval, 10)) || parseInt(refreshInterval, 10) <= 0)) {
      errors.refreshInterval = 'Refresh interval must be a positive number.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'iframe' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [name, src, classes, referrerPolicy, allowPolicy, allowFullscreen, loadingStrategy, allowScrolling, refreshInterval, parentOnChange]);

  // Handle changes for individual fields
  const handleNameChange = (event) => setName(event.target.value);
  const handleSrcChange = (event) => setSrc(event.target.value);
  const handleClassesChange = (event) => setClasses(event.target.value);
  const handleReferrerPolicyChange = (event) => setReferrerPolicy(event.target.value);
  const handleAllowPolicyChange = (event) => setAllowPolicy(event.target.value);
  const handleAllowFullscreenChange = (event) => setAllowFullscreen(event.target.checked);
  const handleLoadingStrategyChange = (event) => setLoadingStrategy(event.target.value);
  const handleAllowScrollingChange = (event) => setAllowScrolling(event.target.value);
  const handleRefreshIntervalChange = (event) => setRefreshInterval(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="iFrame Name"
        name="name"
        value={name}
        onChange={handleNameChange}
        fullWidth
        required
        error={!!fieldErrors.name}
        helperText={fieldErrors.name || "An identifier for the iframe element."}
      />
      <TextField
        label="Source URL"
        name="src"
        value={src}
        onChange={handleSrcChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.src}
        helperText={fieldErrors.src || "The URL of the page to embed."}
      />
      <TextField
        label="CSS Classes (Optional)"
        name="classes"
        value={classes}
        onChange={handleClassesChange}
        fullWidth
        helperText="Optional. Tailwind height classes (e.g., h-60 sm:h-72)."
      />
      <TextField
        label="Referrer Policy (Optional)"
        name="referrerPolicy"
        value={referrerPolicy}
        onChange={handleReferrerPolicyChange}
        fullWidth
        helperText="Optional. E.g., 'no-referrer', 'same-origin'."
      />
      <TextField
        label="Allow Policy (Optional)"
        name="allowPolicy"
        value={allowPolicy}
        onChange={handleAllowPolicyChange}
        fullWidth
        helperText="Optional. Semicolon-separated features (e.g., 'autoplay; fullscreen')."
      />
      <FormControl fullWidth>
        <InputLabel id="iframe-loading-label">Loading Strategy</InputLabel>
        <Select
          labelId="iframe-loading-label"
          id="iframe-loading-select"
          name="loadingStrategy"
          value={loadingStrategy}
          label="Loading Strategy"
          onChange={handleLoadingStrategyChange}
        >
          <MenuItem value="eager">Eager (Default)</MenuItem>
          <MenuItem value="lazy">Lazy</MenuItem>
        </Select>
        <FormHelperText>Optional. Controls when the iframe loads.</FormHelperText>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="iframe-scrolling-label">Allow Scrolling</InputLabel>
        <Select
          labelId="iframe-scrolling-label"
          id="iframe-scrolling-select"
          name="allowScrolling"
          value={allowScrolling}
          label="Allow Scrolling"
          onChange={handleAllowScrollingChange}
        >
          <MenuItem value="yes">Yes (Default)</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </Select>
        <FormHelperText>Optional. Whether scrolling is allowed within the iframe.</FormHelperText>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={allowFullscreen} onChange={handleAllowFullscreenChange} name="allowFullscreen" />}
        label="Allow Fullscreen"
      />
      <TextField
        label="Refresh Interval (ms)"
        name="refreshInterval"
        value={refreshInterval}
        onChange={handleRefreshIntervalChange}
        fullWidth
        type="number"
        inputProps={{ min: 0 }}
        error={!!fieldErrors.refreshInterval}
        helperText={fieldErrors.refreshInterval || "Optional. Refresh the iframe content periodically (e.g., 60000 for 1 min)."}
      />
    </Box>
  );
}

IframeWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    name: PropTypes.string,
    src: PropTypes.string,
    classes: PropTypes.string,
    referrerPolicy: PropTypes.string,
    allowPolicy: PropTypes.string,
    allowFullscreen: PropTypes.bool,
    loadingStrategy: PropTypes.string,
    allowScrolling: PropTypes.string,
    refreshInterval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

IframeWidgetFields.defaultProps = {
  initialData: null,
};

export default IframeWidgetFields;