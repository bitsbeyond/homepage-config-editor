import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'technitium';

// Allowed fields from the documentation
const allowedFields = [
  "totalQueries", "totalNoError", "totalServerFailure", "totalNxDomain",
  "totalRefused", "totalAuthoritative", "totalRecursive", "totalCached",
  "totalBlocked", "totalDropped", "totalClients"
];

// Allowed range values
const allowedRanges = ['LastHour', 'LastDay', 'LastWeek', 'LastMonth', 'LastYear'];

function TechnitiumWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [range, setRange] = useState(initialData?.range || 'LastHour');
  const [fields, setFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newApiKey = initialData.key || '';
      if (newApiKey !== apiKey) {
        setApiKey(newApiKey);
      }
      const newRange = initialData.range || 'LastHour';
      if (newRange !== range) {
        setRange(newRange);
      }
      const newFields = initialData.fields || [];
      if (JSON.stringify(newFields) !== JSON.stringify(fields)) {
        setFields(newFields);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setRange('LastHour');
      setFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      key: apiKey || undefined,
      range: range !== 'LastHour' ? range : undefined,
      fields: fields.length > 0 ? fields : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Technitium widget.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required for Technitium widget.';
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
  }, [url, apiKey, range, fields, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleRangeChange = (event) => {
    setRange(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleApiKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setApiKey(event.target.value);
  };

  // Handle changes for checkbox fields
  const handleFieldsChange = (event) => {
    const { name, checked } = event.target;
    let updatedFields;

    if (checked) {
      updatedFields = [...fields, name];
    } else {
      updatedFields = fields.filter(field => field !== name);
    }

    setFields(updatedFields);
  };

  const currentFieldsSet = new Set(fields);

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Technitium DNS URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Technitium DNS instance (e.g., http://technitium.host.or.ip)"}
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
        helperText={fieldErrors.key || "Generate from Technitium DNS Dashboard (API specific user). Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControl fullWidth>
        <InputLabel id="technitium-range-label">Statistics Range (Optional)</InputLabel>
        <Select
          labelId="technitium-range-label"
          name="range"
          value={range}
          label="Statistics Range (Optional)"
          onChange={handleRangeChange}
        >
          {allowedRanges.map((rangeOption) => (
            <MenuItem key={rangeOption} value={rangeOption}>
              {rangeOption} {rangeOption === 'LastHour' ? '(Default)' : ''}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Determines how far back statistics are pulled.</FormHelperText>
      </FormControl>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormHelperText>Select up to 4 fields. Defaults shown if none selected.</FormHelperText>
        <FormGroup row>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={currentFieldsSet.has(field)}
                  onChange={handleFieldsChange}
                  name={field}
                />
              }
              label={field}
              sx={{ width: { xs: '100%', sm: '50%', md: '33%' } }}
            />
          ))}
        </FormGroup>
      </FormControl>
    </Box>
  );
}

TechnitiumWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    range: PropTypes.oneOf(allowedRanges),
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

TechnitiumWidgetFields.defaultProps = {
  initialData: null,
};

export default TechnitiumWidgetFields;