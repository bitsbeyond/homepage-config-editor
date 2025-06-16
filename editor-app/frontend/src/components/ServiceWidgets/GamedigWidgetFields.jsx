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
  Link,
} from '@mui/material';

const allowedFields = [
  "status",
  "name",
  "map",
  "currentPlayers",
  "players",
  "maxPlayers",
  "bots",
  "ping",
];

function GamedigWidgetFields({ initialData, onChange: parentOnChange }) {
  const [serverType, setServerType] = useState(initialData?.serverType || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [selectedFields, setSelectedFields] = useState(initialData?.fields || []);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setServerType(initialData.serverType || '');
      setUrl(initialData.url || '');
      setSelectedFields(initialData.fields || []);
    } else {
      // Reset to defaults if initialData becomes null
      setServerType('');
      setUrl('');
      setSelectedFields([]);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'gamedig',
      serverType: serverType || undefined,
      url: url || undefined,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    };

    const errors = {};
    if (!serverType?.trim()) {
      errors.serverType = 'Server Type is required.';
    }
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'gamedig' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [serverType, url, selectedFields, parentOnChange]);

  const handleFieldChange = (event) => {
    const { name, checked } = event.target;
    setSelectedFields((prevFields) => {
      if (checked) {
        return prevFields.length < 4 ? [...prevFields, name] : prevFields;
      } else {
        return prevFields.filter((field) => field !== name);
      }
    });
  };

  const isFieldLimitReached = selectedFields.length >= 4;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Gamedig Specific Fields
      </Typography>
      <TextField
        required
        fullWidth
        label="Server Type"
        value={serverType}
        onChange={(e) => setServerType(e.target.value)}
        error={!!fieldErrors.serverType}
        helperText={fieldErrors.serverType || (
          <>
            See{' '}
            <Link href="https://github.com/gamedig/node-gamedig#games-list" target="_blank" rel="noopener noreferrer">
              Gamedig Games List
            </Link>{' '}
            for supported types (e.g., csgo, minecraft).
          </>
        )}
        sx={{ mb: 2 }}
      />
      <TextField
        required
        fullWidth
        label="Server URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., udp://server.host.or.ip:port"}
        sx={{ mb: 2 }}
      />

      <FormControl component="fieldset" margin="normal" fullWidth>
        <FormLabel component="legend">Fields to Display (Optional, Max 4)</FormLabel>
        <FormGroup>
          {allowedFields.map((field) => (
            <FormControlLabel
              key={field}
              control={
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onChange={handleFieldChange}
                  name={field}
                  disabled={!selectedFields.includes(field) && isFieldLimitReached}
                />
              }
              label={field}
            />
          ))}
        </FormGroup>
        {isFieldLimitReached && (
          <FormHelperText error>Maximum of 4 fields selected.</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}

GamedigWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    serverType: PropTypes.string,
    url: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.string),
  }),
  onChange: PropTypes.func.isRequired,
};

GamedigWidgetFields.defaultProps = {
  initialData: null,
};

export default GamedigWidgetFields;