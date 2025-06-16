import React, { useState, useEffect } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Box, Typography, Alert, Select, MenuItem, FormControl, InputLabel, Grid, Divider, Switch, FormControlLabel, Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { saveWidgetsApi } from '../../utils/api';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; // Import the new component

// Updated list of widget types based on documentation review
const WIDGET_TYPES = [
    'datetime', 'glances', 'greeting', 'kubernetes', 'logo', 'longhorn',
    'openmeteo', 'openweathermap', 'resources', 'search', 'stocks', 'unifi_console' // Removed weatherapi
];
const SEARCH_PROVIDERS = ['google', 'duckduckgo', 'bing', 'qwant', 'custom'];
const TEXT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
const DATE_TIME_STYLES = ['short', 'medium', 'long', 'full'];
const WEATHER_UNITS = ['metric', 'imperial']; // Still needed for openweathermap, resources
const LINK_TARGETS = ['_blank', '_self', '_top', '_parent'];
const DISK_UNITS = ['bytes', 'bbytes'];

// Basic validation (can be expanded)
const validateWidget = (widget) => {
    if (!widget.type) return "Widget type is required.";
    if (widget.type === 'glances' && !widget.url) return "Glances URL is required.";
    if (widget.type === 'search' && widget.provider === 'custom' && !widget.customUrl) return "Custom Search URL is required for custom provider.";
    // Removed weatherapi validation
    if (widget.type === 'openweathermap') {
        // if (!widget.apiKey) return "OpenWeatherMap API Key is required."; // Optional in edit
        if ((widget.latitude && isNaN(parseFloat(widget.latitude))) || (widget.longitude && isNaN(parseFloat(widget.longitude)))) {
            return "Latitude and Longitude must be valid numbers.";
        }
        if (widget.cache && isNaN(parseInt(widget.cache, 10))) {
             return "Cache time must be a valid number (minutes).";
        }
    }
     if (widget.type === 'openmeteo') {
        if ((widget.latitude && isNaN(parseFloat(widget.latitude))) || (widget.longitude && isNaN(parseFloat(widget.longitude)))) {
            return "Latitude and Longitude must be valid numbers.";
        }
        if (widget.cache && isNaN(parseInt(widget.cache, 10))) {
             return "Cache time must be a valid number (minutes).";
        }
        if (widget.timezone && !/^[A-Za-z_]+\/[A-Za-z_]+$/.test(widget.timezone)) {
            return "Timezone should be in Olson format (e.g., Europe/London)";
        }
    }
    // Logo icon/url is optional
    if (widget.type === 'text' && !widget.content) return "Content is required for text widget.";
    if (widget.type === 'greeting' && !widget.text) return "Greeting Text is required.";
    if (widget.type === 'resources') {
        if (widget.refresh && isNaN(parseInt(widget.refresh, 10))) return "Refresh rate must be a valid number (milliseconds).";
        if (widget.tempmin && isNaN(parseFloat(widget.tempmin))) return "Min Temp must be a valid number.";
        if (widget.tempmax && isNaN(parseFloat(widget.tempmax))) return "Max Temp must be a valid number.";
    }
    if (widget.type === 'stocks' && !widget.watchlist) return "Watchlist symbols are required.";
    if (widget.type === 'unifi_console') {
        if (!widget.url) return "UniFi Controller URL is required.";
        if (!widget.key && (!widget.username || !widget.password)) {
            return "Either API Key or Username/Password is required for UniFi Controller.";
        }
    }
    return null;
};

function EditWidgetForm({ open, onClose, onWidgetUpdated, widgetToEdit, currentWidgets }) {
    const initialWidgetState = {
        type: '',
        label: '',
        // datetime specific
        text_size: '',
        locale: '',
        format: { dateStyle: '', timeStyle: '', hourCycle: '', hour12: undefined, maximumFractionDigits: '' },
        // glances specific
        url: '', username: '', password: '', version: '', cpu: true, mem: true, cputemp: false, uptime: false, disk: '', diskUnits: '', expanded: false,
        // search specific
        provider: '', target: '', customUrl: '', suggestionUrl: '', focus: false, showSearchSuggestions: false,
        // openweathermap specific
        apiKey: '', latitude: '', longitude: '', cache: '', units: '',
        // logo specific
        icon: '', href: '',
        // text specific
        content: '',
        // greeting specific
        text: '',
        // resources specific
        tempmin: '', tempmax: '', refresh: '', network: false,
        // longhorn specific
        total: false, labels: false, nodes: false,
        // stocks specific
        watchlist: '', color: true,
        // unifi_console specific
        site: '', key: '',
        // kubernetes specific (nested)
        cluster: { show: true, cpu: true, memory: true, showLabel: false, label: 'cluster' },
        k8sNodes: { show: true, cpu: true, memory: true, showLabel: true },
        // openmeteo specific
        timezone: '',
    };
    const [editedWidget, setEditedWidget] = useState(initialWidgetState);
    const [originalIndex, setOriginalIndex] = useState(-1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (widgetToEdit && widgetToEdit.type && widgetToEdit.details) {
            const { type, details, index } = widgetToEdit; // Destructure the passed props
            setEditedWidget({
                type: type, // Use the passed type
                label: details.label || '',
                // datetime specific
                text_size: details.text_size || '',
                locale: details.locale || '',
                format: {
                    dateStyle: details.format?.dateStyle || '',
                    timeStyle: details.format?.timeStyle || '',
                    hourCycle: details.format?.hourCycle || '',
                    hour12: details.format?.hour12,
                    maximumFractionDigits: details.format?.maximumFractionDigits ?? '',
                },
                // glances specific
                url: details.url || '',
                username: details.username || '',
                password: '', // Always clear password field on edit
                version: details.version !== undefined ? String(details.version) : '',
                cpu: details.cpu !== undefined ? details.cpu : true,
                mem: details.memory !== undefined ? details.memory : true, // Use 'memory' from config for display state
                cputemp: details.cputemp !== undefined ? details.cputemp : false,
                uptime: details.uptime !== undefined ? details.uptime : false,
                disk: details.disk || '',
                diskUnits: details.diskUnits || '',
                expanded: details.expanded !== undefined ? details.expanded : false,
                // search specific
                provider: details.provider || '',
                target: details.target || '',
                customUrl: details.provider === 'custom' ? details.url || '' : '', // Populate customUrl if provider is custom
                suggestionUrl: details.suggestionUrl || '',
                focus: details.focus !== undefined ? details.focus : false,
                showSearchSuggestions: details.showSearchSuggestions !== undefined ? details.showSearchSuggestions : false,
                // openweathermap specific
                apiKey: details.apiKey || '', // Initialize with the existing apiKey
                latitude: details.latitude !== undefined ? String(details.latitude) : '',
                longitude: details.longitude !== undefined ? String(details.longitude) : '',
                cache: details.cache !== undefined ? String(details.cache) : '',
                units: details.units || '', // Shared with resources, openmeteo
                // logo specific
                icon: details.icon || '',
                href: details.href || '',
                // text specific
                content: details.content || '',
                // greeting specific
                text: details.text || '',
                 // resources specific
                tempmin: details.tempmin !== undefined ? String(details.tempmin) : '',
                tempmax: details.tempmax !== undefined ? String(details.tempmax) : '',
                refresh: details.refresh !== undefined ? String(details.refresh) : '',
                network: details.network ?? false, // Initialize network state based on saved value (bool or string)
                // longhorn specific
                total: details.total !== undefined ? details.total : false,
                labels: details.labels !== undefined ? details.labels : false,
                nodes: details.nodes !== undefined ? details.nodes : false,
                // stocks specific
                watchlist: Array.isArray(details.watchlist) ? details.watchlist.join(', ') : '', // Convert array back to string for TextField
                color: details.color !== undefined ? details.color : true,
                // unifi_console specific
                site: details.site || '',
                key: '', // Always clear key field on edit
                // kubernetes specific (nested)
                cluster: {
                    show: details.cluster?.show ?? true,
                    cpu: details.cluster?.cpu ?? true,
                    memory: details.cluster?.memory ?? true,
                    showLabel: details.cluster?.showLabel ?? false,
                    label: details.cluster?.label ?? 'cluster',
                },
                k8sNodes: { // Use k8sNodes for state, map from 'nodes' in details if present
                    show: details.nodes?.show ?? true,
                    cpu: details.nodes?.cpu ?? true,
                    memory: details.nodes?.memory ?? true,
                    showLabel: details.nodes?.showLabel ?? true,
                },
                 // openmeteo specific
                timezone: details.timezone || '',
            });
            setOriginalIndex(index); // Use the passed index
        } else {
            // Reset if widgetToEdit is null or invalid
            setEditedWidget(initialWidgetState);
            setOriginalIndex(-1);
        }
    }, [widgetToEdit]);

    const handleChange = (event) => {
        const { name, value, type: inputType, checked } = event.target;
        const isFormatField = name.startsWith('format.');
        const isClusterField = name.startsWith('cluster.');
        const isNodesField = name.startsWith('k8sNodes.');
        const isCheckbox = inputType === 'checkbox';
        const isTypeField = name === 'type';

        setEditedWidget(prev => {
            let nextState = { ...prev };
            if (isFormatField) {
                const fieldName = name.split('.')[1];
                nextState = { ...nextState, format: { ...nextState.format, [fieldName]: isCheckbox ? checked : value } };
            } else if (isClusterField) {
                const fieldName = name.split('.')[1];
                nextState = { ...nextState, cluster: { ...nextState.cluster, [fieldName]: isCheckbox ? checked : value } };
            } else if (isNodesField) {
                const fieldName = name.split('.')[1];
                nextState = { ...nextState, k8sNodes: { ...nextState.k8sNodes, [fieldName]: isCheckbox ? checked : value } };
            } else if (isCheckbox) {
                 // Special handling for network: if checked, set to true; if unchecked, set to false.
                 // If it was a string before, it becomes boolean false on uncheck.
                 // The text field for network interface is handled separately.
                 if (name === 'network') {
                     nextState = { ...nextState, network: checked };
                 } else {
                     nextState = { ...nextState, [name]: checked };
                 }
            } else if (name === 'networkValue') {
                 // Update the network field only if the network checkbox is currently true (meaning we want a string value)
                 if (nextState.network === true) {
                     nextState = { ...nextState, network: value };
                 }
                 // If checkbox is false, ignore changes to the text field
            }
             else if (!isTypeField) { // Handle all other non-type, non-checkbox, non-networkValue fields
                nextState = { ...nextState, [name]: value };
            }

            // Clear customUrl if provider is not custom
            if (name === 'provider' && value !== 'custom') {
                nextState = { ...nextState, customUrl: '' };
            }
            // Ensure format object exists for types that use it
             if ((nextState.type === 'datetime' || nextState.type === 'openweathermap' || nextState.type === 'openmeteo' || nextState.type === 'greeting') && !nextState.format) {
                 nextState.format = { ...initialWidgetState.format };
             }
            return nextState;
        });
    };

    // Generic handler for the EnvVarAutocompleteInput component
    const handleEnvVarChange = (fieldName) => (event) => {
        const { value } = event.target;
        setEditedWidget(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        if (originalIndex === -1) { setError("Cannot save, original widget index not found."); return; }
        const validationError = validateWidget(editedWidget);
        if (validationError) { setError(validationError); return; }
        setLoading(true);

        // Initialize an empty object for the widget's configuration details
        let widgetConfig = {};
        // Add label if present
        if (editedWidget.label) widgetConfig.label = editedWidget.label;

        // Dynamically add fields based on type to the config object
        const fieldsToSave = {
            datetime: ['text_size', 'locale', 'format'],
            glances: ['url', 'username', 'password', 'version', 'cpu', 'mem', 'cputemp', 'uptime', 'disk', 'diskUnits', 'expanded'],
            search: ['provider', 'target', 'customUrl', 'suggestionUrl', 'focus', 'showSearchSuggestions'],
            openweathermap: ['apiKey', 'latitude', 'longitude', 'cache', 'units', 'format'],
            logo: ['icon', 'href', 'target'],
            text: ['content', 'text_size'],
            greeting: ['text', 'text_size', 'format'],
            // Note: 'mem' should likely be 'memory' based on docs, but keeping 'mem' for now based on initial state.
            // Also, 'url', 'username', 'password' seem incorrect for resources based on docs. Keeping for now.
            resources: ['url', 'username', 'password', 'cpu', 'mem', 'cputemp', 'disk', 'diskUnits', 'tempmin', 'tempmax', 'refresh', 'network', 'units'],
            longhorn: ['url', 'total', 'labels', 'nodes'],
            stocks: ['watchlist', 'color', 'apiKey'], // Added apiKey
            unifi_console: ['url', 'username', 'password', 'site', 'key'],
            kubernetes: ['cluster', 'k8sNodes'],
            openmeteo: ['latitude', 'longitude', 'timezone', 'units', 'cache', 'format'],
        };

        if (fieldsToSave[editedWidget.type]) {
            fieldsToSave[editedWidget.type].forEach(field => {
                // Handle nested objects (format, cluster, k8sNodes)
                if (field === 'format' && editedWidget.format && Object.keys(editedWidget.format).some(k => editedWidget.format[k] !== '' && editedWidget.format[k] !== undefined && editedWidget.format[k] !== false)) {
                    const cleanFormat = {};
                    Object.keys(editedWidget.format).forEach(key => {
                        if (editedWidget.format[key] !== '' && editedWidget.format[key] !== undefined && editedWidget.format[key] !== false) {
                            if (key === 'maximumFractionDigits' || key === 'cache') {
                                const num = parseInt(editedWidget.format[key], 10);
                                if (!isNaN(num)) cleanFormat[key] = num;
                            } else if (key === 'hour12') {
                                cleanFormat[key] = editedWidget.format[key];
                            } else {
                                cleanFormat[key] = editedWidget.format[key];
                            }
                        }
                    });
                    if (Object.keys(cleanFormat).length > 0) widgetConfig.format = cleanFormat; // Add to widgetConfig
                } else if (field === 'cluster' && editedWidget.cluster) {
                    widgetConfig.cluster = { ...editedWidget.cluster }; // Add to widgetConfig
                } else if (field === 'k8sNodes' && editedWidget.k8sNodes) {
                    widgetConfig.k8sNodes = { ...editedWidget.k8sNodes }; // Add to widgetConfig
                } else if (editedWidget[field] !== undefined && editedWidget[field] !== '' && editedWidget[field] !== false) {
                    if (['latitude', 'longitude', 'tempmin', 'tempmax'].includes(field)) {
                        const num = parseFloat(editedWidget[field]);
                        if (!isNaN(num)) widgetConfig[field] = num; // Add to widgetConfig
                    } else if (['cache', 'refresh', 'version'].includes(field)) { // Added 'version' here
                        const num = parseInt(editedWidget[field], 10);
                        if (!isNaN(num)) widgetConfig[field] = num; // Add to widgetConfig
                    } else if (field === 'password' && editedWidget.password) { // Only add password if entered
                         widgetConfig[field] = editedWidget[field]; // Add to widgetConfig
                    } else if (field === 'apiKey' && editedWidget.apiKey) { // Only add apiKey if entered
                         widgetConfig[field] = editedWidget[field]; // Add to widgetConfig
                    } else if (field === 'key' && editedWidget.key) { // Only add unifi key if entered
                         widgetConfig[field] = editedWidget[field]; // Add to widgetConfig
                    } else if (field === 'watchlist' && editedWidget.watchlist) { // Handle watchlist string to array
                        widgetConfig[field] = editedWidget.watchlist.split(',').map(s => s.trim()).filter(s => s); // Add to widgetConfig
                    } else if (field === 'network') { // Handle network boolean/string
                         if (typeof editedWidget.network === 'string' && editedWidget.network.trim()) {
                            widgetConfig.network = editedWidget.network.trim(); // Add to widgetConfig
                        } else if (editedWidget.network === true) {
                            widgetConfig.network = true; // Add to widgetConfig
                        } // Don't add if false
                    } else if (!['password', 'apiKey', 'key', 'watchlist', 'network'].includes(field)) { // Add other fields if they have a value
                        widgetConfig[field] = editedWidget[field]; // Add to widgetConfig
                    }
                }
            });
        }

        // Special handling for search provider 'custom'
        if (editedWidget.type === 'search' && editedWidget.provider === 'custom') {
            widgetConfig.url = editedWidget.customUrl || undefined; // Save customUrl as url
            delete widgetConfig.customUrl; // Remove the temporary field
        } else if (editedWidget.type === 'search') {
            delete widgetConfig.url; // Ensure url is removed if not custom
        }

        // Special handling for unifi_console key vs user/pass
        if (editedWidget.type === 'unifi_console' && widgetConfig.key) {
            delete widgetConfig.username;
            delete widgetConfig.password;
        } else if (editedWidget.type === 'unifi_console') {
            delete widgetConfig.key; // Ensure key is removed if user/pass is used
        }

        // Remove undefined keys from the final config object
        Object.keys(widgetConfig).forEach(key => widgetConfig[key] === undefined && delete widgetConfig[key]);

        // Create the final widget object with the type as the key
        const widgetToSave = { [editedWidget.type]: widgetConfig };

        const updatedWidgets = [...currentWidgets];
        updatedWidgets[originalIndex] = widgetToSave;

        try {
            await saveWidgetsApi(updatedWidgets);
            onWidgetUpdated(); handleClose();
        } catch (err) {
            console.error("Error updating widget:", err);
            setError(err.message || 'Failed to update widget.');
        } finally { setLoading(false); }
    };

    const handleClose = () => {
        setError(null); setLoading(false); onClose();
    };

    if (!widgetToEdit) { return null; }

    const showNetworkTextField = editedWidget.type === 'resources' && editedWidget.network === true;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Info Widget</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                     <TextField margin="normal" required fullWidth id="type" label="Widget Type" name="type" value={editedWidget.type} InputProps={{ readOnly: true }} helperText="Widget type cannot be changed after creation." />
                    <TextField margin="normal" fullWidth id="label" label="Label (Optional)" name="label" value={editedWidget.label} onChange={handleChange} helperText="Display name for the widget" autoFocus />

                    {/* Datetime Fields */}
                    {editedWidget.type === 'datetime' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Datetime Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="dt-textsize-label">Text Size</InputLabel><Select labelId="dt-textsize-label" id="text_size" name="text_size" value={editedWidget.text_size} label="Text Size" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{TEXT_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="locale" label="Locale (Optional)" name="locale" value={editedWidget.locale} onChange={handleChange} helperText="e.g., en-US, de-DE" /></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="dt-datestyle-label">Date Style</InputLabel><Select labelId="dt-datestyle-label" id="format.dateStyle" name="format.dateStyle" value={editedWidget.format?.dateStyle ?? ''} label="Date Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="dt-timestyle-label">Time Style</InputLabel><Select labelId="dt-timestyle-label" id="format.timeStyle" name="format.timeStyle" value={editedWidget.format?.timeStyle ?? ''} label="Time Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={editedWidget.format?.hour12 ?? false} onChange={handleChange} name="format.hour12" />} label="Use 12-Hour Clock" /></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Glances Fields */}
                    {editedWidget.type === 'glances' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Glances Options</Typography>
                            <TextField margin="normal" required fullWidth id="url" label="Glances API URL" name="url" value={editedWidget.url} onChange={handleChange} helperText="e.g., http://192.168.1.10:61208" />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="username" label="Username (Optional)" name="username" value={editedWidget.username} onChange={handleChange} /></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="password" label="Password (Optional)" name="password" type="password" value={editedWidget.password} onChange={handleChange} helperText="Enter new password to change" /></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="version" label="API Version (Optional)" name="version" type="number" value={editedWidget.version} onChange={handleChange} helperText="Usually 3 or 4" inputProps={{ min: "1", step: "1" }} /></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="disk" label="Disk(s) to Show (Optional)" name="disk" value={editedWidget.disk} onChange={handleChange} helperText="Comma-separated, e.g., /dev/sda1,/" /></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="gl-diskunits-label">Disk Units</InputLabel><Select labelId="gl-diskunits-label" id="diskUnits" name="diskUnits" value={editedWidget.diskUnits} label="Disk Units" onChange={handleChange}><MenuItem value=""><em>Default (bytes)</em></MenuItem>{DISK_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                            <FormControlLabel control={<Switch checked={editedWidget.cpu} onChange={handleChange} name="cpu" />} label="Show CPU" />
                            <FormControlLabel control={<Switch checked={editedWidget.mem} onChange={handleChange} name="mem" />} label="Show Memory" />
                            <FormControlLabel control={<Switch checked={editedWidget.cputemp} onChange={handleChange} name="cputemp" />} label="Show CPU Temp" />
                            <FormControlLabel control={<Switch checked={editedWidget.uptime} onChange={handleChange} name="uptime" />} label="Show Uptime" />
                            <FormControlLabel control={<Switch checked={editedWidget.expanded} onChange={handleChange} name="expanded" />} label="Expanded View" />
                        </>
                    )}
                    {/* Search Fields */}
                    {editedWidget.type === 'search' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Search Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" required fullWidth><InputLabel id="search-provider-label">Search Provider</InputLabel><Select labelId="search-provider-label" id="provider" name="provider" value={editedWidget.provider} label="Search Provider" onChange={handleChange}><MenuItem value=""><em>Select Provider...</em></MenuItem>{SEARCH_PROVIDERS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="search-target-label">Link Target</InputLabel><Select labelId="search-target-label" id="target" name="target" value={editedWidget.target} label="Link Target" onChange={handleChange}><MenuItem value=""><em>Default (_blank)</em></MenuItem>{LINK_TARGETS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                            {editedWidget.provider === 'custom' && (
                                <TextField margin="normal" required fullWidth id="customUrl" label="Custom Search URL" name="customUrl" value={editedWidget.customUrl} onChange={handleChange} helperText="Use {query} as placeholder, e.g., https://search.example.com/?q={query}" />
                            )}
                            <TextField margin="normal" fullWidth id="suggestionUrl" label="Custom Suggestion URL (Optional)" name="suggestionUrl" value={editedWidget.suggestionUrl} onChange={handleChange} helperText="URL for search suggestions (if supported)" />
                            <FormControlLabel control={<Switch checked={editedWidget.focus} onChange={handleChange} name="focus" />} label="Autofocus Search Bar" />
                            <FormControlLabel control={<Switch checked={editedWidget.showSearchSuggestions} onChange={handleChange} name="showSearchSuggestions" />} label="Show Search Suggestions" />
                        </>
                    )}
                    {/* OpenWeatherMap Fields */}
                    {editedWidget.type === 'openweathermap' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>OpenWeatherMap Options</Typography>
                            {/* Replace TextField with EnvVarAutocompleteInput */}
                            <EnvVarAutocompleteInput
                                margin="normal"
                                fullWidth
                                id="apiKey"
                                label="API Key"
                                value={editedWidget.apiKey}
                                onChange={handleEnvVarChange('apiKey')} // Use generic handler
                                helperText="Enter new key or select existing {{HOMEPAGE_VAR_...}}"
                                // Not making it required on edit
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="latitude" label="Latitude (Optional)" name="latitude" type="number" value={editedWidget.latitude} onChange={handleChange} helperText="e.g., 50.449" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="longitude" label="Longitude (Optional)" name="longitude" type="number" value={editedWidget.longitude} onChange={handleChange} helperText="e.g., 30.525" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="owm-units-label">Units</InputLabel><Select labelId="owm-units-label" id="units" name="units" value={editedWidget.units} label="Units" onChange={handleChange}><MenuItem value=""><em>Default (metric)</em></MenuItem>{WEATHER_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="cache" label="Cache Time (minutes)" name="cache" type="number" value={editedWidget.cache} onChange={handleChange} helperText="Default: 5" inputProps={{ min: "0", step: "1" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="format.maximumFractionDigits" label="Max Decimal Places (Optional)" name="format.maximumFractionDigits" type="number" value={editedWidget.format?.maximumFractionDigits ?? ''} onChange={handleChange} helperText="For temperature display" inputProps={{ min: "0", step: "1" }}/></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Logo Fields */}
                    {editedWidget.type === 'logo' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Logo Options</Typography>
                            <TextField margin="normal" fullWidth id="icon" label="Icon URL or Name" name="icon" value={editedWidget.icon} onChange={handleChange} helperText="e.g., /logo.png or mdi-home" />
                            <TextField margin="normal" fullWidth id="href" label="Link URL (Optional)" name="href" value={editedWidget.href} onChange={handleChange} helperText="Make the logo clickable" />
                            <FormControl margin="normal" fullWidth><InputLabel id="logo-target-label">Link Target</InputLabel><Select labelId="logo-target-label" id="target" name="target" value={editedWidget.target} label="Link Target" onChange={handleChange} disabled={!editedWidget.href}><MenuItem value=""><em>Default (_blank)</em></MenuItem>{LINK_TARGETS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl>
                        </>
                    )}
                    {/* Text Fields */}
                    {editedWidget.type === 'text' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Text Options</Typography>
                            <TextField margin="normal" required fullWidth multiline rows={3} id="content" label="Content" name="content" value={editedWidget.content} onChange={handleChange} helperText="Supports Markdown" />
                            <FormControl margin="normal" fullWidth><InputLabel id="text-textsize-label">Text Size</InputLabel><Select labelId="text-textsize-label" id="text_size" name="text_size" value={editedWidget.text_size} label="Text Size" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{TEXT_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl>
                        </>
                    )}
                    {/* Greeting Fields */}
                    {editedWidget.type === 'greeting' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Greeting Options</Typography>
                            <TextField margin="normal" required fullWidth id="text" label="Greeting Text" name="text" value={editedWidget.text} onChange={handleChange} helperText="e.g., Good {timeOfDay}, {user}!" />
                            <FormControl margin="normal" fullWidth><InputLabel id="greet-textsize-label">Text Size</InputLabel><Select labelId="greet-textsize-label" id="text_size" name="text_size" value={editedWidget.text_size} label="Text Size" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{TEXT_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="greet-datestyle-label">Date Style</InputLabel><Select labelId="greet-datestyle-label" id="format.dateStyle" name="format.dateStyle" value={editedWidget.format?.dateStyle ?? ''} label="Date Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="greet-timestyle-label">Time Style</InputLabel><Select labelId="greet-timestyle-label" id="format.timeStyle" name="format.timeStyle" value={editedWidget.format?.timeStyle ?? ''} label="Time Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={editedWidget.format?.hour12 ?? false} onChange={handleChange} name="format.hour12" />} label="Use 12-Hour Clock" /></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Resources Fields */}
                    {editedWidget.type === 'resources' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Resources Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="refresh" label="Refresh Rate (ms)" name="refresh" type="number" value={editedWidget.refresh} onChange={handleChange} helperText="Default: 5000" inputProps={{ min: "100", step: "100" }}/></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="res-units-label">Units</InputLabel><Select labelId="res-units-label" id="units" name="units" value={editedWidget.units} label="Units" onChange={handleChange}><MenuItem value=""><em>Default (metric)</em></MenuItem>{WEATHER_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="tempmin" label="Min Temp (Optional)" name="tempmin" type="number" value={editedWidget.tempmin} onChange={handleChange} helperText="For temp gauge color" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="tempmax" label="Max Temp (Optional)" name="tempmax" type="number" value={editedWidget.tempmax} onChange={handleChange} helperText="For temp gauge color" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="res-diskunits-label">Disk Units</InputLabel><Select labelId="res-diskunits-label" id="diskUnits" name="diskUnits" value={editedWidget.diskUnits} label="Disk Units" onChange={handleChange}><MenuItem value=""><em>Default (bytes)</em></MenuItem>{DISK_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel control={<Switch checked={!!editedWidget.network} onChange={handleChange} name="network" />} label="Show Network Stats" />
                                    <TextField
                                        margin="dense"
                                        fullWidth
                                        id="networkValue"
                                        label="Network Interface (Optional)"
                                        name="networkValue" // Use a different name to avoid conflict with the switch
                                        value={typeof editedWidget.network === 'string' ? editedWidget.network : ''}
                                        onChange={handleChange}
                                        helperText="Leave blank for default, or specify interface (e.g., eth0)"
                                        sx={{ mt: 1, display: !!editedWidget.network ? 'block' : 'none' }} // Show if network is true or a string
                                    />
                                </Grid>
                            </Grid>
                            <FormControlLabel control={<Switch checked={editedWidget.cpu} onChange={handleChange} name="cpu" />} label="Show CPU" />
                            <FormControlLabel control={<Switch checked={editedWidget.mem} onChange={handleChange} name="mem" />} label="Show Memory" />
                            <FormControlLabel control={<Switch checked={editedWidget.cputemp} onChange={handleChange} name="cputemp" />} label="Show CPU Temp" />
                            <FormControlLabel control={<Switch checked={editedWidget.disk} onChange={handleChange} name="disk" />} label="Show Disk" />
                            <FormControlLabel control={<Switch checked={editedWidget.expanded} onChange={handleChange} name="expanded" />} label="Expanded View" />
                        </>
                    )}
                    {/* Longhorn Fields */}
                    {editedWidget.type === 'longhorn' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Longhorn Options</Typography>
                            <TextField margin="normal" required fullWidth id="url" label="Longhorn API URL" name="url" value={editedWidget.url} onChange={handleChange} helperText="e.g., http://longhorn.example.com" />
                            <FormControlLabel control={<Switch checked={editedWidget.total} onChange={handleChange} name="total" />} label="Show Total Size" />
                            <FormControlLabel control={<Switch checked={editedWidget.labels} onChange={handleChange} name="labels" />} label="Show Labels" />
                            <FormControlLabel control={<Switch checked={editedWidget.nodes} onChange={handleChange} name="nodes" />} label="Show Nodes" />
                        </>
                    )}
                    {/* Stocks Fields */}
                    {editedWidget.type === 'stocks' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Stocks Options</Typography>
                            <TextField margin="normal" required fullWidth id="watchlist" label="Watchlist Symbols" name="watchlist" value={editedWidget.watchlist} onChange={handleChange} helperText="Comma-separated, e.g., AAPL,GOOG,MSFT" />
                            {/* Add EnvVarAutocompleteInput for apiKey */}
                            <EnvVarAutocompleteInput
                                margin="normal"
                                fullWidth
                                id="stocksApiKey" // Unique ID
                                label="API Key (Optional)"
                                value={editedWidget.apiKey} // Assuming apiKey is used for stocks too
                                onChange={handleEnvVarChange('apiKey')}
                                helperText="Enter new key or select existing {{HOMEPAGE_VAR_...}}"
                            />
                            <FormControlLabel control={<Switch checked={editedWidget.color} onChange={handleChange} name="color" />} label="Show Color Indicators" />
                        </>
                    )}
                    {/* UniFi Console Fields */}
                    {editedWidget.type === 'unifi_console' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>UniFi Console Options</Typography>
                            <TextField margin="normal" required fullWidth id="url" label="Controller URL" name="url" value={editedWidget.url} onChange={handleChange} helperText="e.g., https://unifi.example.com" />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <EnvVarAutocompleteInput
                                        margin="normal"
                                        fullWidth
                                        id="unifiUsername"
                                        label="Username (if no API Key)"
                                        value={editedWidget.username}
                                        onChange={handleEnvVarChange('username')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <EnvVarAutocompleteInput
                                        margin="normal"
                                        fullWidth
                                        id="unifiPassword"
                                        label="Password (if no API Key)"
                                        type="password" // Enables visibility toggle
                                        value={editedWidget.password}
                                        onChange={handleEnvVarChange('password')}
                                        helperText="Enter new password to change"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <EnvVarAutocompleteInput
                                        margin="normal"
                                        fullWidth
                                        id="unifiKey"
                                        label="API Key (Optional)"
                                        type="password" // Treat API key like a password for visibility toggle
                                        value={editedWidget.key}
                                        onChange={handleEnvVarChange('key')}
                                        helperText="Preferred over username/password. Enter new key to change."
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="site" label="Site Name (Optional)" name="site" value={editedWidget.site} onChange={handleChange} helperText="Default: 'default'" /></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Kubernetes Fields */}
                    {editedWidget.type === 'kubernetes' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Kubernetes Cluster Options</Typography>
                            <FormControlLabel control={<Switch checked={editedWidget.cluster?.show ?? true} onChange={handleChange} name="cluster.show" />} label="Show Cluster Info" />
                            <FormControlLabel control={<Switch checked={editedWidget.cluster?.cpu ?? true} onChange={handleChange} name="cluster.cpu" />} label="Show Cluster CPU" />
                            <FormControlLabel control={<Switch checked={editedWidget.cluster?.memory ?? true} onChange={handleChange} name="cluster.memory" />} label="Show Cluster Memory" />
                            <FormControlLabel control={<Switch checked={editedWidget.cluster?.showLabel ?? false} onChange={handleChange} name="cluster.showLabel" />} label="Show 'Cluster' Label" />
                            <TextField margin="dense" fullWidth id="cluster.label" label="Cluster Label Text" name="cluster.label" value={editedWidget.cluster?.label ?? 'cluster'} onChange={handleChange} disabled={!editedWidget.cluster?.showLabel} />

                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Kubernetes Nodes Options</Typography>
                            <FormControlLabel control={<Switch checked={editedWidget.k8sNodes?.show ?? true} onChange={handleChange} name="k8sNodes.show" />} label="Show Nodes Info" />
                            <FormControlLabel control={<Switch checked={editedWidget.k8sNodes?.cpu ?? true} onChange={handleChange} name="k8sNodes.cpu" />} label="Show Nodes CPU" />
                            <FormControlLabel control={<Switch checked={editedWidget.k8sNodes?.memory ?? true} onChange={handleChange} name="k8sNodes.memory" />} label="Show Nodes Memory" />
                            <FormControlLabel control={<Switch checked={editedWidget.k8sNodes?.showLabel ?? true} onChange={handleChange} name="k8sNodes.showLabel" />} label="Show 'Nodes' Label" />
                        </>
                    )}
                    {/* OpenMeteo Fields */}
                    {editedWidget.type === 'openmeteo' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Open-Meteo Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="latitude" label="Latitude (Optional)" name="latitude" type="number" value={editedWidget.latitude} onChange={handleChange} helperText="e.g., 50.449" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="longitude" label="Longitude (Optional)" name="longitude" type="number" value={editedWidget.longitude} onChange={handleChange} helperText="e.g., 30.525" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="timezone" label="Timezone (Optional)" name="timezone" value={editedWidget.timezone} onChange={handleChange} helperText="e.g., Europe/London" /></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="om-units-label">Units</InputLabel><Select labelId="om-units-label" id="units" name="units" value={editedWidget.units} label="Units" onChange={handleChange}><MenuItem value=""><em>Default (metric)</em></MenuItem>{WEATHER_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="cache" label="Cache Time (minutes)" name="cache" type="number" value={editedWidget.cache} onChange={handleChange} helperText="Default: 5" inputProps={{ min: "0", step: "1" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="format.maximumFractionDigits" label="Max Decimal Places (Optional)" name="format.maximumFractionDigits" type="number" value={editedWidget.format?.maximumFractionDigits ?? ''} onChange={handleChange} helperText="For temperature display" inputProps={{ min: "0", step: "1" }}/></Grid>
                            </Grid>
                        </>
                    )}


                     {/* Placeholder for other widget types */}
                    {editedWidget.type && !WIDGET_TYPES.includes(editedWidget.type) && (
                          <Typography variant="caption" display="block" gutterBottom sx={{mt: 2}}>
                             Note: Specific fields for '{editedWidget.type}' are not yet editable in this form. Only Label will be saved. Other properties will be preserved.
                         </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button type="submit" variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
export default EditWidgetForm;