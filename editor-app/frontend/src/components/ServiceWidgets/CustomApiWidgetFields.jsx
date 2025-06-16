import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    TextField, Box, FormControl, InputLabel, Select, MenuItem, FormHelperText,
} from '@mui/material';
import YAML from 'js-yaml';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

// Helper to check if a string is valid JSON
const isValidJson = (str) => {
    if (!str || !str.trim()) return true; // Empty is valid for optional fields
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

// Helper to check if a string is valid YAML (specifically an array for mappings)
const isValidYamlArray = (str) => {
    if (!str || !str.trim()) return false; // Mappings are required, so empty string is invalid.
    try {
        const parsed = YAML.load(str);
        return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
        return false;
    }
};

// Function to safely stringify JSON for display
const safeJsonStringifyDisplay = (data) => {
    if (data === null || typeof data === 'undefined') return '';
    if (typeof data === 'string') return data; // Already a string
    try {
        return JSON.stringify(data, null, 2);
    } catch (e) {
        console.error("Error stringifying JSON for display:", e);
        return ''; // Or some error placeholder string
    }
};

// Function to safely dump YAML for display
const safeYamlDumpDisplay = (data) => {
    if (data === null || typeof data === 'undefined') return '';
    if (typeof data === 'string') return data; // Already a string
    try {
        return YAML.dump(data);
    } catch (e) {
        console.error("Error dumping YAML for display:", e);
        return ''; // Or some error placeholder string
    }
};


function CustomApiWidgetFields({ initialData, onChange: parentOnChange }) {
    const [url, setUrl] = useState(initialData?.url || '');
    const [refreshInterval, setRefreshInterval] = useState(initialData?.refreshInterval?.toString() || '');
    const [username, setUsername] = useState(initialData?.username || '');
    const [password, setPassword] = useState(initialData?.password || '');
    const [method, setMethod] = useState(initialData?.method || 'GET');
    const [headersStr, setHeadersStr] = useState(safeJsonStringifyDisplay(initialData?.headers));
    const [requestBodyStr, setRequestBodyStr] = useState(safeJsonStringifyDisplay(initialData?.requestBody));
    const [display, setDisplay] = useState(initialData?.display || 'block');
    const [mappingsStr, setMappingsStr] = useState(safeYamlDumpDisplay(initialData?.mappings));

    useEffect(() => {
        setUrl(initialData?.url || '');
        setRefreshInterval(initialData?.refreshInterval?.toString() || '');
        setUsername(initialData?.username || '');
        setPassword(initialData?.password || '');
        setMethod(initialData?.method || 'GET');
        setDisplay(initialData?.display || 'block');

        // Handle complex string fields carefully to avoid clearing user input
        if (initialData && typeof initialData.headers !== 'undefined') {
            const newHeadersDisplayStr = safeJsonStringifyDisplay(initialData.headers);
            if (newHeadersDisplayStr !== headersStr) {
                setHeadersStr(newHeadersDisplayStr);
            }
        } else if (!initialData && headersStr !== '') {
            setHeadersStr('');
        }

        if (initialData && typeof initialData.requestBody !== 'undefined') {
            const newBodyDisplayStr = safeJsonStringifyDisplay(initialData.requestBody);
            if (newBodyDisplayStr !== requestBodyStr) {
                setRequestBodyStr(newBodyDisplayStr);
            }
        } else if (!initialData && requestBodyStr !== '') {
            setRequestBodyStr('');
        }

        if (initialData && typeof initialData.mappings !== 'undefined') {
            const newMappingsDisplayStr = safeYamlDumpDisplay(initialData.mappings);
            if (newMappingsDisplayStr !== mappingsStr) {
                setMappingsStr(newMappingsDisplayStr);
            }
        } else if (!initialData && mappingsStr !== '') {
            setMappingsStr('');
        }
    }, [initialData]);

    useEffect(() => {
        const validationErrors = {};
        if (!url?.trim()) {
            validationErrors.url = 'API URL is required.';
        }
        if (!isValidJson(headersStr)) {
            validationErrors.headers = 'Invalid JSON format for Headers.';
        }
        // For requestBody, only validate if it's not empty and looks like JSON but isn't.
        // Empty or plain string is considered valid for requestBody.
        const trimmedBody = requestBodyStr.trim();
        if (trimmedBody && ((trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) || (trimmedBody.startsWith('[') && trimmedBody.endsWith(']'))) && !isValidJson(requestBodyStr)) {
            validationErrors.requestBody = 'Invalid JSON format for Request Body (if using object/array).';
        }
        if (!isValidYamlArray(mappingsStr)) {
            validationErrors.mappings = 'Mappings are required and must be a valid non-empty YAML array.';
        }
        if (refreshInterval && (isNaN(parseInt(refreshInterval, 10)) || parseInt(refreshInterval, 10) < 0)) {
            validationErrors.refreshInterval = 'Refresh Interval must be a non-negative number.';
        }


        const currentWidgetData = { type: 'customapi' };
        if (url?.trim()) currentWidgetData.url = url.trim();
        if (username) currentWidgetData.username = username;
        if (password) currentWidgetData.password = password;
        currentWidgetData.method = method; // Always has a default
        currentWidgetData.display = display; // Always has a default

        if (refreshInterval) {
            const numInterval = parseInt(refreshInterval, 10);
            if (!isNaN(numInterval) && numInterval >= 0) {
                currentWidgetData.refreshInterval = numInterval;
            }
        }

        if (headersStr.trim() && isValidJson(headersStr)) {
            try { currentWidgetData.headers = JSON.parse(headersStr); } catch (e) { /* already handled by validationErrors */ }
        }

        if (requestBodyStr.trim()) {
            if (isValidJson(requestBodyStr)) { // If it's valid JSON (or empty, which is fine for JSON.parse)
                try { currentWidgetData.requestBody = JSON.parse(requestBodyStr); } catch (e) { /* ignore, might be plain string */ }
            } else { // If not valid JSON, treat as plain string
                 const trimmedReqBody = requestBodyStr.trim();
                 if (!((trimmedReqBody.startsWith('{') && trimmedReqBody.endsWith('}')) || (trimmedReqBody.startsWith('[') && trimmedReqBody.endsWith(']')))) {
                    currentWidgetData.requestBody = requestBodyStr;
                 }
            }
        }


        if (mappingsStr.trim() && isValidYamlArray(mappingsStr)) {
            try { currentWidgetData.mappings = YAML.load(mappingsStr); } catch (e) { /* already handled by validationErrors */ }
        }
        
        // Clean up undefined/empty optional fields that were not set or invalid
        Object.keys(currentWidgetData).forEach(key => {
            if (currentWidgetData[key] === undefined || currentWidgetData[key] === '') {
                // Keep method and display as they have defaults
                if (key !== 'method' && key !== 'display' && key !== 'url' && key !== 'mappings') {
                     delete currentWidgetData[key];
                }
            }
        });
        // Ensure type is always present
        currentWidgetData.type = 'customapi';


        parentOnChange(currentWidgetData, validationErrors);
    }, [url, refreshInterval, username, password, method, headersStr, requestBodyStr, display, mappingsStr, parentOnChange]);


    const handleUrlChange = (event) => setUrl(event.target.value);
    const handleRefreshChange = (event) => setRefreshInterval(event.target.value);
    const handleUsernameChange = (event) => setUsername(event.target.value);
    const handlePasswordChange = (event) => setPassword(event.target.value);
    const handleMethodChange = (event) => setMethod(event.target.value);
    const handleHeadersChange = (event) => setHeadersStr(event.target.value);
    const handleBodyChange = (event) => setRequestBodyStr(event.target.value);
    const handleDisplayChange = (event) => setDisplay(event.target.value);
    const handleMappingsChange = (event) => setMappingsStr(event.target.value);

    // Determine error states for fields based on the validation logic in useEffect
    // This is a simplified way; for more complex scenarios, errors might be passed down or managed in a separate state
    const urlError = !url?.trim();
    const headersError = !isValidJson(headersStr);
    const trimmedBodyForErrorCheck = requestBodyStr.trim();
    const requestBodyError = trimmedBodyForErrorCheck && ((trimmedBodyForErrorCheck.startsWith('{') && trimmedBodyForErrorCheck.endsWith('}')) || (trimmedBodyForErrorCheck.startsWith('[') && trimmedBodyForErrorCheck.endsWith(']'))) && !isValidJson(requestBodyStr);
    const mappingsError = !isValidYamlArray(mappingsStr);
    const refreshIntervalError = refreshInterval && (isNaN(parseInt(refreshInterval, 10)) || parseInt(refreshInterval, 10) < 0);


    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="API URL" name="url" value={url} onChange={handleUrlChange}
                fullWidth required type="url" helperText={urlError ? "API URL is required." : "Full URL to the API endpoint"}
                error={urlError}
            />
            <TextField
                label="Refresh Interval (ms)" name="refreshInterval" value={refreshInterval} onChange={handleRefreshChange}
                fullWidth type="number" inputProps={{ min: 0 }}
                helperText={refreshIntervalError ? "Must be a non-negative number." : "Optional. e.g., 10000 for 10s."}
                error={refreshIntervalError}
            />
            <EnvVarAutocompleteInput
                label="Username" name="username" value={username} onChange={handleUsernameChange}
                fullWidth helperText="Optional. For Basic Authentication."
            />
            <EnvVarAutocompleteInput
                label="Password" name="password" value={password} onChange={handlePasswordChange}
                fullWidth type="password" helperText="Optional. For Basic Authentication."
            />
            <FormControl fullWidth>
                <InputLabel id="customapi-method-label">HTTP Method</InputLabel>
                <Select labelId="customapi-method-label" id="customapi-method-select" name="method"
                    value={method} label="HTTP Method" onChange={handleMethodChange} >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="PATCH">PATCH</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
                <FormHelperText>Optional. Defaults to GET.</FormHelperText>
            </FormControl>
            <TextField
                label="Headers (JSON)" name="headers" value={headersStr} onChange={handleHeadersChange}
                fullWidth multiline rows={3} error={headersError}
                helperText={headersError ? "Invalid JSON format" : "Optional. Enter as a valid JSON object."}
                sx={{ fontFamily: 'monospace' }} InputLabelProps={{ shrink: !!headersStr }}
            />
            <TextField
                label="Request Body (JSON or String)" name="requestBody" value={requestBodyStr} onChange={handleBodyChange}
                fullWidth multiline rows={3} error={requestBodyError}
                helperText={requestBodyError ? "Invalid JSON format (if using object/array)" : "Optional. Enter as JSON object or plain string."}
                sx={{ fontFamily: 'monospace' }} InputLabelProps={{ shrink: !!requestBodyStr }}
            />
            <FormControl fullWidth>
                <InputLabel id="customapi-display-label">Display Mode</InputLabel>
                <Select labelId="customapi-display-label" id="customapi-display-select" name="display"
                    value={display} label="Display Mode" onChange={handleDisplayChange} >
                    <MenuItem value="block">Block (Default)</MenuItem>
                    <MenuItem value="list">List</MenuItem>
                    <MenuItem value="dynamic-list">Dynamic List</MenuItem>
                </Select>
                <FormHelperText>Optional. How to display the mapped fields.</FormHelperText>
            </FormControl>
            <TextField
                label="Mappings (YAML Array)" name="mappings" value={mappingsStr} onChange={handleMappingsChange}
                fullWidth required multiline rows={5}
                error={mappingsError} helperText={mappingsError ? "Required. Invalid or empty YAML array format." : "Required. Enter as a valid YAML array."}
                sx={{ fontFamily: 'monospace' }} InputLabelProps={{ shrink: !!mappingsStr }}
            />
        </Box>
    );
}

CustomApiWidgetFields.propTypes = {
    initialData: PropTypes.shape({
        type: PropTypes.string,
        url: PropTypes.string,
        refreshInterval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        username: PropTypes.string,
        password: PropTypes.string,
        method: PropTypes.string,
        headers: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
        requestBody: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.array]),
        display: PropTypes.string,
        mappings: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    }),
    onChange: PropTypes.func.isRequired,
};

CustomApiWidgetFields.defaultProps = {
    initialData: null,
};

export default CustomApiWidgetFields;