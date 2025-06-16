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
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'suwayomi';

// Allowed fields from the documentation
const allowedFields = [
  "download", "nondownload", "read", "unread", "downloadedread",
  "downloadedunread", "nondownloadedread", "nondownloadedunread"
];

function SuwayomiWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [category, setCategory] = useState(initialData?.category?.toString() || '');
  const [fields, setFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newUsername = initialData.username || '';
      if (newUsername !== username) {
        setUsername(newUsername);
      }
      const newPassword = initialData.password || '';
      if (newPassword !== password) {
        setPassword(newPassword);
      }
      const newCategory = initialData.category?.toString() || '';
      if (newCategory !== category) {
        setCategory(newCategory);
      }
      const newFields = initialData.fields || [];
      if (JSON.stringify(newFields) !== JSON.stringify(fields)) {
        setFields(newFields);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setCategory('');
      setFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      category: category ? parseInt(category, 10) : undefined,
      fields: fields.length > 0 ? fields : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Suwayomi widget.';
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
  }, [url, username, password, category, fields, parentOnChange]);

  // Handle changes for standard TextFields
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
  const handleUsernameChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setPassword(event.target.value);
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
        label="Suwayomi URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Suwayomi instance (e.g., http://suwayomi.host.or.ip)"}
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="username"
        label="Username (Optional)"
        value={username}
        onChange={handleUsernameChange}
        helperText="Optional username for authentication. Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password"
        label="Password (Optional)"
        type="password"
        value={password}
        onChange={handlePasswordChange}
        helperText="Optional password for authentication. Can be a {{HOMEPAGE_VAR_...}}"
      />
      <TextField
        fullWidth
        name="category"
        label="Category ID (Optional)"
        type="number"
        value={category}
        onChange={handleCategoryChange}
        inputProps={{ min: 0 }}
        helperText="Defaults to 0 (All Categories). Find ID in URL (?tab=ID)."
      />
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
              sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}
            />
          ))}
        </FormGroup>
      </FormControl>
    </Box>
  );
}

SuwayomiWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    category: PropTypes.number,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

SuwayomiWidgetFields.defaultProps = {
  initialData: null,
};

export default SuwayomiWidgetFields;