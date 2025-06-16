import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

const WIDGET_TYPE = 'lubelogger';

function LubeLoggerWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [vehicleID, setVehicleID] = useState(initialData?.vehicleID || '');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setVehicleID(initialData.vehicleID || '');
    } else {
      setUrl('');
      setUsername('');
      setPassword('');
      setVehicleID('');
    }
  }, [initialData]);

  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      vehicleID: vehicleID || undefined,
    };

    const errors = {};
    if (!url?.trim()) errors.url = 'URL is required.';
    if (!username?.trim()) errors.username = 'Username is required.';
    if (!password?.trim()) errors.password = 'Password is required.';
    setFieldErrors(errors);

    const dataForParent = { type: WIDGET_TYPE };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     if (Object.keys(dataForParent).length === 0) {
       dataForParent.type = WIDGET_TYPE;
     }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, vehicleID, parentOnChange]);

  const handleInputChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="LubeLogger URL"
        name="url"
        value={url}
        onChange={handleInputChange(setUrl)}
        fullWidth
        required
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., https://lubelogger.example.com"}
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleInputChange(setUsername)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Your LubeLogger username"}
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={handleInputChange(setPassword)}
        fullWidth
        required
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Your LubeLogger password"}
      />
      <TextField
        label="Vehicle ID (Optional)"
        name="vehicleID"
        type="number"
        value={vehicleID}
        onChange={handleInputChange(setVehicleID)}
        fullWidth
        helperText="Leave blank for all vehicles, enter ID for a specific vehicle."
      />
    </Box>
  );
}

LubeLoggerWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    vehicleID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

LubeLoggerWidgetFields.defaultProps = {
  initialData: null,
};

export default LubeLoggerWidgetFields;