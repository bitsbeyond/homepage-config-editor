import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Typography,
  Box,
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'kopia';
const ALLOWED_FIELDS_OPTIONS = [
  "status",
  "size",
  "lastrun",
  "nextrun",
];

function KopiaWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [snapshotHost, setSnapshotHost] = useState(initialData?.snapshotHost || '');
  const [snapshotPath, setSnapshotPath] = useState(initialData?.snapshotPath || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setSnapshotHost(initialData.snapshotHost || '');
      setSnapshotPath(initialData.snapshotPath || '');
      setSelectedFields(initialData.fields || []);
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
      setSnapshotHost('');
      setSnapshotPath('');
      setSelectedFields([]);
    }
    // setFieldErrors({}); // DO NOT reset errors here, let the validation effect handle it.
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      snapshotHost: snapshotHost || undefined,
      snapshotPath: snapshotPath || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const calculatedErrors = {};
    if (!url?.trim()) {
      calculatedErrors.url = 'URL is required.';
    }
    if (!username?.trim()) {
      calculatedErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      calculatedErrors.password = 'Password is required.';
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
  }, [url, username, password, snapshotHost, snapshotPath, JSON.stringify(selectedFields), parentOnChange]);

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        return [...prevFields, name];
      } else {
        return prevFields.filter((field) => field !== name);
      }
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Kopia Specific Fields
      </Typography>
      <TextField
        label="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        // margin="normal" // Using Box gap
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://kopia.host:port"}
        type="url"
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        // margin="normal"
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || ""}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        // margin="normal"
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || ""}
      />
      <TextField
        label="Snapshot Host (Optional)"
        value={snapshotHost}
        onChange={(e) => setSnapshotHost(e.target.value)}
        fullWidth
        margin="normal"
        helperText="Filter by specific backup source host"
      />
      <TextField
        label="Snapshot Path (Optional)"
        value={snapshotPath}
        onChange={(e) => setSnapshotPath(e.target.value)}
        fullWidth
        margin="normal"
        helperText="Filter by specific backup source path"
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional)</FormLabel>
        <FormGroup>
          {ALLOWED_FIELDS_OPTIONS.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldChange}
                  name={field}
                />
              }
              label={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
        </FormGroup>
        <FormHelperText>Select which stats to show.</FormHelperText>
      </FormControl>
    </Box>
  );
}

KopiaWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    snapshotHost: PropTypes.string,
    snapshotPath: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

KopiaWidgetFields.defaultProps = {
  initialData: null,
};

export default KopiaWidgetFields;