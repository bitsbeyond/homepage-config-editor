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
    'openmeteo', 'openweathermap', 'resources', 'search', 'stocks', 'unifi_console'
];
const SEARCH_PROVIDERS = ['google', 'duckduckgo', 'bing', 'qwant', 'custom'];
const TEXT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
const DATE_TIME_STYLES = ['short', 'medium', 'long', 'full'];
const WEATHER_UNITS = ['metric', 'imperial'];
const LINK_TARGETS = ['_blank', '_self', '_top', '_parent'];
const DISK_UNITS = ['bytes', 'bbytes'];

// Basic validation (can be expanded)
const validateWidget = (widget) => {
    if (!widget.type) return "Widget type is required.";
    if (widget.type === 'glances' && !widget.url) return "Glances URL is required.";
    if (widget.type === 'search' && widget.provider === 'custom' && !widget.customUrl) return "Custom Search URL is required for custom provider.";
    if (widget.type === 'openweathermap') {
        if (!widget.apiKey) return "OpenWeatherMap API Key is required.";
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
        // Basic timezone check (can be improved)
        if (widget.timezone && !/^[A-Za-z_]+\/[A-Za-z_]+$/.test(widget.timezone)) {
            return "Timezone should be in Olson format (e.g., Europe/London)";
        }
    }
    if (widget.type === 'logo' && !widget.icon) return "Logo Icon/URL is required.";
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

function AddWidgetForm({ open, onClose, onWidgetAdded, currentWidgets }) {
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
        timezone: '', // Added timezone
    };
    const [newWidget, setNewWidget] = useState(initialWidgetState);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value, type: inputType, checked } = event.target;
        const isFormatField = name.startsWith('format.');
        const isClusterField = name.startsWith('cluster.');
        const isNodesField = name.startsWith('k8sNodes.');
        const isCheckbox = inputType === 'checkbox';

        setNewWidget(prev => {
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
                nextState = { ...nextState, [name]: checked };
            } else {
                nextState = { ...nextState, [name]: value };
            }
            // Clear customUrl if provider is not custom
            if (name === 'provider' && value !== 'custom') {
                nextState = { ...nextState, customUrl: '' };
            }
            // Clear network string value if checkbox is unchecked
            if (name === 'network' && !checked) {
                nextState = { ...nextState, network: false }; // Keep the boolean, but maybe clear a related string if needed? Assuming network field holds the string. Let's adjust if needed.
            }
            return nextState;
        });
    };

    // Generic handler for the EnvVarAutocompleteInput component
    const handleEnvVarChange = (fieldName) => (event) => {
        const { value } = event.target;
        setNewWidget(prev => ({ ...prev, [fieldName]: value }));
    };

    useEffect(() => {
        if (!newWidget.type) return;

        setNewWidget(prev => {
            let resetState = { type: prev.type, label: prev.label };

            // Preserve fields for the selected type
            // Combine initial state with preserved fields for the selected type
            resetState = { ...initialWidgetState, type: prev.type, label: prev.label };

            if (prev.type === 'datetime') {
                resetState.text_size = prev.text_size ?? initialWidgetState.text_size;
                resetState.locale = prev.locale ?? initialWidgetState.locale;
                resetState.format = { ...(prev.format || initialWidgetState.format) };
            } else if (prev.type === 'glances') {
                resetState.url = prev.url ?? initialWidgetState.url;
                resetState.username = prev.username ?? initialWidgetState.username;
                resetState.password = prev.password ?? initialWidgetState.password;
                resetState.version = prev.version ?? initialWidgetState.version;
                resetState.cpu = prev.cpu ?? initialWidgetState.cpu;
                resetState.mem = prev.mem ?? initialWidgetState.mem;
                resetState.cputemp = prev.cputemp ?? initialWidgetState.cputemp;
                resetState.uptime = prev.uptime ?? initialWidgetState.uptime;
                resetState.disk = prev.disk ?? initialWidgetState.disk;
                resetState.diskUnits = prev.diskUnits ?? initialWidgetState.diskUnits;
                resetState.expanded = prev.expanded ?? initialWidgetState.expanded;
            } else if (prev.type === 'search') {
                resetState.provider = prev.provider ?? initialWidgetState.provider;
                resetState.target = prev.target ?? initialWidgetState.target;
                resetState.customUrl = prev.customUrl ?? initialWidgetState.customUrl;
                resetState.suggestionUrl = prev.suggestionUrl ?? initialWidgetState.suggestionUrl;
                resetState.focus = prev.focus ?? initialWidgetState.focus;
                resetState.showSearchSuggestions = prev.showSearchSuggestions ?? initialWidgetState.showSearchSuggestions;
            } else if (prev.type === 'openweathermap') {
                resetState.apiKey = prev.apiKey ?? initialWidgetState.apiKey;
                resetState.latitude = prev.latitude ?? initialWidgetState.latitude;
                resetState.longitude = prev.longitude ?? initialWidgetState.longitude;
                resetState.cache = prev.cache ?? initialWidgetState.cache;
                resetState.units = prev.units ?? initialWidgetState.units;
                resetState.format = { ...(prev.format || initialWidgetState.format) }; // Shared with datetime/greeting/openmeteo
            } else if (prev.type === 'logo') {
                resetState.icon = prev.icon ?? initialWidgetState.icon;
                resetState.href = prev.href ?? initialWidgetState.href;
                resetState.target = prev.target ?? initialWidgetState.target; // Shared with search
            } else if (prev.type === 'text') {
                resetState.content = prev.content ?? initialWidgetState.content;
                resetState.text_size = prev.text_size ?? initialWidgetState.text_size; // Shared with datetime
            } else if (prev.type === 'greeting') {
                resetState.text = prev.text ?? initialWidgetState.text;
                resetState.text_size = prev.text_size ?? initialWidgetState.text_size; // Shared with datetime
                resetState.format = { ...(prev.format || initialWidgetState.format) }; // Shared with datetime/owm/openmeteo
            } else if (prev.type === 'resources') {
                resetState.url = prev.url ?? initialWidgetState.url; // Shared with glances/longhorn/unifi
                resetState.username = prev.username ?? initialWidgetState.username; // Shared with glances/unifi
                resetState.password = prev.password ?? initialWidgetState.password; // Shared with glances/unifi
                resetState.cpu = prev.cpu ?? initialWidgetState.cpu; // Shared with glances/kubernetes
                resetState.mem = prev.mem ?? initialWidgetState.mem; // Shared with glances/kubernetes
                resetState.cputemp = prev.cputemp ?? initialWidgetState.cputemp; // Shared with glances
                resetState.disk = prev.disk ?? initialWidgetState.disk; // Shared with glances
                resetState.diskUnits = prev.diskUnits ?? initialWidgetState.diskUnits; // Shared with glances
                resetState.tempmin = prev.tempmin ?? initialWidgetState.tempmin;
                resetState.tempmax = prev.tempmax ?? initialWidgetState.tempmax;
                resetState.refresh = prev.refresh ?? initialWidgetState.refresh;
                resetState.network = prev.network ?? initialWidgetState.network;
                resetState.units = prev.units ?? initialWidgetState.units; // Shared with owm/openmeteo
            } else if (prev.type === 'longhorn') {
                resetState.url = prev.url ?? initialWidgetState.url; // Shared with glances/resources/unifi
                resetState.total = prev.total ?? initialWidgetState.total;
                resetState.labels = prev.labels ?? initialWidgetState.labels;
                resetState.nodes = prev.nodes ?? initialWidgetState.nodes;
            } else if (prev.type === 'stocks') {
                resetState.watchlist = prev.watchlist ?? initialWidgetState.watchlist;
                resetState.color = prev.color ?? initialWidgetState.color;
            } else if (prev.type === 'unifi_console') {
                resetState.url = prev.url ?? initialWidgetState.url; // Shared with glances/resources/longhorn
                resetState.username = prev.username ?? initialWidgetState.username; // Shared with glances/resources
                resetState.password = prev.password ?? initialWidgetState.password; // Shared with glances/resources
                resetState.site = prev.site ?? initialWidgetState.site;
                resetState.key = prev.key ?? initialWidgetState.key; // Shared with owm
            } else if (prev.type === 'kubernetes') {
                resetState.cluster = { ...(prev.cluster || initialWidgetState.cluster) };
                resetState.k8sNodes = { ...(prev.k8sNodes || initialWidgetState.k8sNodes) };
                // Note: cpu/mem are within nested objects, handled above
            } else if (prev.type === 'openmeteo') {
                resetState.latitude = prev.latitude ?? initialWidgetState.latitude; // Shared with owm
                resetState.longitude = prev.longitude ?? initialWidgetState.longitude; // Shared with owm
                resetState.timezone = prev.timezone ?? initialWidgetState.timezone;
                resetState.units = prev.units ?? initialWidgetState.units; // Shared with owm/resources
                resetState.cache = prev.cache ?? initialWidgetState.cache; // Shared with owm
                resetState.format = { ...(prev.format || initialWidgetState.format) }; // Shared with datetime/owm/greeting
            }

            // Only return the new state if it's actually different from the previous state
            // This prevents unnecessary re-renders if only type/label changed but no fields needed resetting
            if (JSON.stringify(resetState) !== JSON.stringify(prev)) {
                 return resetState;
            }
            return prev;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newWidget.type]);


    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        const validationError = validateWidget(newWidget);
        if (validationError) { setError(validationError); return; }
        setLoading(true);

        // Initialize an empty object for the widget's configuration details
        let widgetConfig = {};
        // Add label if present (it's a common field, not specific to the type's config)
        if (newWidget.label) widgetConfig.label = newWidget.label;

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

        if (fieldsToSave[newWidget.type]) {
            fieldsToSave[newWidget.type].forEach(field => {
                // Handle nested objects (format, cluster, k8sNodes)
                if (field === 'format' && newWidget.format && Object.keys(newWidget.format).some(k => newWidget.format[k] !== '' && newWidget.format[k] !== undefined && newWidget.format[k] !== false)) {
                    const cleanFormat = {};
                    Object.keys(newWidget.format).forEach(key => {
                        if (newWidget.format[key] !== '' && newWidget.format[key] !== undefined && newWidget.format[key] !== false) {
                            if (key === 'maximumFractionDigits' || key === 'cache') {
                                const num = parseInt(newWidget.format[key], 10);
                                if (!isNaN(num)) cleanFormat[key] = num;
                            } else if (key === 'hour12') {
                                cleanFormat[key] = newWidget.format[key];
                            } else {
                                cleanFormat[key] = newWidget.format[key];
                            }
                        }
                    });
                    if (Object.keys(cleanFormat).length > 0) widgetConfig.format = cleanFormat; // Add to widgetConfig
                } else if (field === 'cluster' && newWidget.cluster) {
                    widgetConfig.cluster = { ...newWidget.cluster }; // Add to widgetConfig
                } else if (field === 'k8sNodes' && newWidget.k8sNodes) {
                    widgetConfig.k8sNodes = { ...newWidget.k8sNodes }; // Add to widgetConfig
                } else if (newWidget[field] !== undefined && newWidget[field] !== '' && newWidget[field] !== false) {
                    if (['latitude', 'longitude', 'tempmin', 'tempmax'].includes(field)) {
                        const num = parseFloat(newWidget[field]);
                        if (!isNaN(num)) widgetConfig[field] = num; // Add to widgetConfig
                    } else if (['cache', 'refresh'].includes(field)) {
                        const num = parseInt(newWidget[field], 10);
                        if (!isNaN(num)) widgetConfig[field] = num; // Add to widgetConfig
                    } else {
                        widgetConfig[field] = newWidget[field]; // Add to widgetConfig
                    }
                }
            });
        }

        // Create the final widget object with the type as the key
        const widgetToAdd = { [newWidget.type]: widgetConfig };

        const updatedWidgets = [...currentWidgets, widgetToAdd];
        try {
            await saveWidgetsApi(updatedWidgets);
            onWidgetAdded(); handleClose();
        } catch (err) {
            console.error("Error adding widget:", err);
            setError(err.message || 'Failed to add widget.');
        } finally { setLoading(false); }
    };

    const handleClose = () => {
        setNewWidget(initialWidgetState); setError(null); setLoading(false); onClose();
    };

    const showNetworkTextField = newWidget.type === 'resources' && newWidget.network === true;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Info Widget</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <FormControl margin="normal" required fullWidth>
                        <InputLabel id="widget-type-label">Widget Type</InputLabel>
                        <Select labelId="widget-type-label" id="type" name="type" value={newWidget.type} label="Widget Type" onChange={handleChange} autoFocus>
                            <MenuItem value="" disabled><em>Select a type...</em></MenuItem>
                            {WIDGET_TYPES.map((type) => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <TextField margin="normal" fullWidth id="label" label="Label (Optional)" name="label" value={newWidget.label} onChange={handleChange} helperText="Display name for the widget" disabled={!newWidget.type} />

                    {/* Datetime Fields */}
                    {/* Datetime Fields */}
                    {newWidget.type === 'datetime' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Datetime Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="dt-textsize-label">Text Size</InputLabel><Select labelId="dt-textsize-label" id="text_size" name="text_size" value={newWidget.text_size} label="Text Size" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{TEXT_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="locale" label="Locale (Optional)" name="locale" value={newWidget.locale} onChange={handleChange} helperText="e.g., en-US, de-DE" /></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="dt-datestyle-label">Date Style</InputLabel><Select labelId="dt-datestyle-label" id="format.dateStyle" name="format.dateStyle" value={newWidget.format?.dateStyle ?? ''} label="Date Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="dt-timestyle-label">Time Style</InputLabel><Select labelId="dt-timestyle-label" id="format.timeStyle" name="format.timeStyle" value={newWidget.format?.timeStyle ?? ''} label="Time Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={newWidget.format?.hour12 ?? false} onChange={handleChange} name="format.hour12" />} label="Use 12-Hour Clock" /></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Glances Fields */}
                    {newWidget.type === 'glances' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Glances Options</Typography>
                            <TextField margin="normal" required fullWidth id="url" label="Glances API URL" name="url" value={newWidget.url} onChange={handleChange} helperText="e.g., http://192.168.1.10:61208" />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="username" label="Username (Optional)" name="username" value={newWidget.username} onChange={handleChange} /></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="password" label="Password (Optional)" name="password" type="password" value={newWidget.password} onChange={handleChange} /></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="version" label="API Version (Optional)" name="version" type="number" value={newWidget.version} onChange={handleChange} helperText="Usually 3 or 4" inputProps={{ min: "1", step: "1" }} /></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="disk" label="Disk(s) to Show (Optional)" name="disk" value={newWidget.disk} onChange={handleChange} helperText="Comma-separated, e.g., /dev/sda1,/" /></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="gl-diskunits-label">Disk Units</InputLabel><Select labelId="gl-diskunits-label" id="diskUnits" name="diskUnits" value={newWidget.diskUnits} label="Disk Units" onChange={handleChange}><MenuItem value=""><em>Default (bytes)</em></MenuItem>{DISK_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                            <FormControlLabel control={<Switch checked={newWidget.cpu} onChange={handleChange} name="cpu" />} label="Show CPU" />
                            <FormControlLabel control={<Switch checked={newWidget.mem} onChange={handleChange} name="mem" />} label="Show Memory" />
                            <FormControlLabel control={<Switch checked={newWidget.cputemp} onChange={handleChange} name="cputemp" />} label="Show CPU Temp" />
                            <FormControlLabel control={<Switch checked={newWidget.uptime} onChange={handleChange} name="uptime" />} label="Show Uptime" />
                            <FormControlLabel control={<Switch checked={newWidget.expanded} onChange={handleChange} name="expanded" />} label="Expanded View" />
                        </>
                    )}
                    {/* Search Fields */}
                    {newWidget.type === 'search' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Search Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" required fullWidth><InputLabel id="search-provider-label">Search Provider</InputLabel><Select labelId="search-provider-label" id="provider" name="provider" value={newWidget.provider} label="Search Provider" onChange={handleChange}><MenuItem value=""><em>Select Provider...</em></MenuItem>{SEARCH_PROVIDERS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="search-target-label">Link Target</InputLabel><Select labelId="search-target-label" id="target" name="target" value={newWidget.target} label="Link Target" onChange={handleChange}><MenuItem value=""><em>Default (_blank)</em></MenuItem>{LINK_TARGETS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                            {newWidget.provider === 'custom' && (
                                <TextField margin="normal" required fullWidth id="customUrl" label="Custom Search URL" name="customUrl" value={newWidget.customUrl} onChange={handleChange} helperText="Use {query} as placeholder, e.g., https://search.example.com/?q={query}" />
                            )}
                            <TextField margin="normal" fullWidth id="suggestionUrl" label="Custom Suggestion URL (Optional)" name="suggestionUrl" value={newWidget.suggestionUrl} onChange={handleChange} helperText="URL for search suggestions (if supported)" />
                            <FormControlLabel control={<Switch checked={newWidget.focus} onChange={handleChange} name="focus" />} label="Autofocus Search Bar" />
                            <FormControlLabel control={<Switch checked={newWidget.showSearchSuggestions} onChange={handleChange} name="showSearchSuggestions" />} label="Show Search Suggestions" />
                        </>
                    )}
                    {/* OpenWeatherMap Fields */}
                    {newWidget.type === 'openweathermap' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>OpenWeatherMap Options</Typography>
                            {/* Replace TextField with EnvVarAutocompleteInput */}
                            <EnvVarAutocompleteInput
                                margin="normal"
                                required
                                fullWidth
                                id="apiKey"
                                label="API Key"
                                value={newWidget.apiKey}
                                onChange={handleEnvVarChange('apiKey')} // Use generic handler
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="latitude" label="Latitude (Optional)" name="latitude" type="number" value={newWidget.latitude} onChange={handleChange} helperText="e.g., 50.449" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="longitude" label="Longitude (Optional)" name="longitude" type="number" value={newWidget.longitude} onChange={handleChange} helperText="e.g., 30.525" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="owm-units-label">Units</InputLabel><Select labelId="owm-units-label" id="units" name="units" value={newWidget.units} label="Units" onChange={handleChange}><MenuItem value=""><em>Default (metric)</em></MenuItem>{WEATHER_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="cache" label="Cache Time (minutes)" name="cache" type="number" value={newWidget.cache} onChange={handleChange} helperText="Default: 5" inputProps={{ min: "0", step: "1" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="format.maximumFractionDigits" label="Max Decimal Places (Optional)" name="format.maximumFractionDigits" type="number" value={newWidget.format?.maximumFractionDigits ?? ''} onChange={handleChange} helperText="For temperature display" inputProps={{ min: "0", step: "1" }}/></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Logo Fields */}
                    {newWidget.type === 'logo' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Logo Options</Typography>
                            <TextField margin="normal" required fullWidth id="icon" label="Icon URL or Name" name="icon" value={newWidget.icon} onChange={handleChange} helperText="e.g., /logo.png or mdi-home" />
                            <TextField margin="normal" fullWidth id="href" label="Link URL (Optional)" name="href" value={newWidget.href} onChange={handleChange} helperText="Make the logo clickable" />
                            <FormControl margin="normal" fullWidth><InputLabel id="logo-target-label">Link Target</InputLabel><Select labelId="logo-target-label" id="target" name="target" value={newWidget.target} label="Link Target" onChange={handleChange} disabled={!newWidget.href}><MenuItem value=""><em>Default (_blank)</em></MenuItem>{LINK_TARGETS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl>
                        </>
                    )}
                    {/* Text Fields */}
                    {newWidget.type === 'text' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Text Options</Typography>
                            <TextField margin="normal" required fullWidth multiline rows={3} id="content" label="Content" name="content" value={newWidget.content} onChange={handleChange} helperText="Supports Markdown" />
                            <FormControl margin="normal" fullWidth><InputLabel id="text-textsize-label">Text Size</InputLabel><Select labelId="text-textsize-label" id="text_size" name="text_size" value={newWidget.text_size} label="Text Size" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{TEXT_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl>
                        </>
                    )}
                    {/* Greeting Fields */}
                    {newWidget.type === 'greeting' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Greeting Options</Typography>
                            <TextField margin="normal" required fullWidth id="text" label="Greeting Text" name="text" value={newWidget.text} onChange={handleChange} helperText="e.g., Good {timeOfDay}, {user}!" />
                            <FormControl margin="normal" fullWidth><InputLabel id="greet-textsize-label">Text Size</InputLabel><Select labelId="greet-textsize-label" id="text_size" name="text_size" value={newWidget.text_size} label="Text Size" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{TEXT_SIZES.map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</Select></FormControl>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="greet-datestyle-label">Date Style</InputLabel><Select labelId="greet-datestyle-label" id="format.dateStyle" name="format.dateStyle" value={newWidget.format?.dateStyle ?? ''} label="Date Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="greet-timestyle-label">Time Style</InputLabel><Select labelId="greet-timestyle-label" id="format.timeStyle" name="format.timeStyle" value={newWidget.format?.timeStyle ?? ''} label="Time Style" onChange={handleChange}><MenuItem value=""><em>Default</em></MenuItem>{DATE_TIME_STYLES.map(style => <MenuItem key={style} value={style}>{style}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={newWidget.format?.hour12 ?? false} onChange={handleChange} name="format.hour12" />} label="Use 12-Hour Clock" /></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Resources Fields */}
                    {newWidget.type === 'resources' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Resources Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="refresh" label="Refresh Rate (ms)" name="refresh" type="number" value={newWidget.refresh} onChange={handleChange} helperText="Default: 5000" inputProps={{ min: "100", step: "100" }}/></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="res-units-label">Units</InputLabel><Select labelId="res-units-label" id="units" name="units" value={newWidget.units} label="Units" onChange={handleChange}><MenuItem value=""><em>Default (metric)</em></MenuItem>{WEATHER_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="tempmin" label="Min Temp (Optional)" name="tempmin" type="number" value={newWidget.tempmin} onChange={handleChange} helperText="For temp gauge color" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="tempmax" label="Max Temp (Optional)" name="tempmax" type="number" value={newWidget.tempmax} onChange={handleChange} helperText="For temp gauge color" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="res-diskunits-label">Disk Units</InputLabel><Select labelId="res-diskunits-label" id="diskUnits" name="diskUnits" value={newWidget.diskUnits} label="Disk Units" onChange={handleChange}><MenuItem value=""><em>Default (bytes)</em></MenuItem>{DISK_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                            </Grid>
                            <FormControlLabel control={<Switch checked={newWidget.cpu} onChange={handleChange} name="cpu" />} label="Show CPU" />
                            <FormControlLabel control={<Switch checked={newWidget.mem} onChange={handleChange} name="mem" />} label="Show Memory" />
                            <FormControlLabel control={<Switch checked={newWidget.cputemp} onChange={handleChange} name="cputemp" />} label="Show CPU Temp" />
                            <FormControlLabel control={<Switch checked={newWidget.network} onChange={handleChange} name="network" />} label="Show Network" />
                            {/* Conditionally show text field if network switch is on */}
                            {showNetworkTextField && (
                                <TextField margin="dense" fullWidth id="network-string" label="Network Interface (Optional)" name="network" value={typeof newWidget.network === 'string' ? newWidget.network : ''} onChange={handleChange} helperText="e.g., eth0 (leave blank for default)" />
                            )}
                            <FormControlLabel control={<Switch checked={newWidget.disk} onChange={handleChange} name="disk" />} label="Show Disk" />
                        </>
                    )}
                    {/* Longhorn Fields */}
                    {newWidget.type === 'longhorn' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Longhorn Options</Typography>
                            <TextField margin="normal" required fullWidth id="url" label="Longhorn API URL" name="url" value={newWidget.url} onChange={handleChange} helperText="e.g., http://longhorn.example.com" />
                            <FormControlLabel control={<Switch checked={newWidget.total} onChange={handleChange} name="total" />} label="Show Total Size" />
                            <FormControlLabel control={<Switch checked={newWidget.labels} onChange={handleChange} name="labels" />} label="Show Labels" />
                            <FormControlLabel control={<Switch checked={newWidget.nodes} onChange={handleChange} name="nodes" />} label="Show Nodes" />
                        </>
                    )}
                    {/* Stocks Fields */}
                    {newWidget.type === 'stocks' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Stocks Options</Typography>
                            <TextField margin="normal" required fullWidth id="watchlist" label="Watchlist Symbols" name="watchlist" value={newWidget.watchlist} onChange={handleChange} helperText="Comma-separated, e.g., AAPL,GOOG,MSFT" />
                            {/* Add EnvVarAutocompleteInput for apiKey */}
                            <EnvVarAutocompleteInput
                                margin="normal"
                                fullWidth
                                id="stocksApiKey" // Unique ID
                                label="API Key (Optional)"
                                value={newWidget.apiKey} // Assuming apiKey is used for stocks too, adjust if needed
                                onChange={handleEnvVarChange('apiKey')}
                            />
                            <FormControlLabel control={<Switch checked={newWidget.color} onChange={handleChange} name="color" />} label="Show Color Indicators" />
                        </>
                    )}
                    {/* UniFi Console Fields */}
                    {newWidget.type === 'unifi_console' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>UniFi Console Options</Typography>
                            <TextField margin="normal" required fullWidth id="url" label="Controller URL" name="url" value={newWidget.url} onChange={handleChange} helperText="e.g., https://unifi.example.com" />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <EnvVarAutocompleteInput
                                        margin="normal"
                                        fullWidth
                                        id="unifiUsername"
                                        label="Username (if no API Key)"
                                        value={newWidget.username}
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
                                        value={newWidget.password}
                                        onChange={handleEnvVarChange('password')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <EnvVarAutocompleteInput
                                        margin="normal"
                                        fullWidth
                                        id="unifiKey"
                                        label="API Key (Optional)"
                                        helperText="Preferred over username/password"
                                        value={newWidget.key}
                                        onChange={handleEnvVarChange('key')}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="site" label="Site Name (Optional)" name="site" value={newWidget.site} onChange={handleChange} helperText="Default: 'default'" /></Grid>
                            </Grid>
                        </>
                    )}
                    {/* Kubernetes Fields */}
                    {newWidget.type === 'kubernetes' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Kubernetes Cluster Options</Typography>
                            <FormControlLabel control={<Switch checked={newWidget.cluster?.show ?? true} onChange={handleChange} name="cluster.show" />} label="Show Cluster Info" />
                            <FormControlLabel control={<Switch checked={newWidget.cluster?.cpu ?? true} onChange={handleChange} name="cluster.cpu" />} label="Show Cluster CPU" />
                            <FormControlLabel control={<Switch checked={newWidget.cluster?.memory ?? true} onChange={handleChange} name="cluster.memory" />} label="Show Cluster Memory" />
                            <FormControlLabel control={<Switch checked={newWidget.cluster?.showLabel ?? false} onChange={handleChange} name="cluster.showLabel" />} label="Show 'Cluster' Label" />
                            <TextField margin="dense" fullWidth id="cluster.label" label="Cluster Label Text" name="cluster.label" value={newWidget.cluster?.label ?? 'cluster'} onChange={handleChange} disabled={!newWidget.cluster?.showLabel} />

                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Kubernetes Nodes Options</Typography>
                            <FormControlLabel control={<Switch checked={newWidget.k8sNodes?.show ?? true} onChange={handleChange} name="k8sNodes.show" />} label="Show Nodes Info" />
                            <FormControlLabel control={<Switch checked={newWidget.k8sNodes?.cpu ?? true} onChange={handleChange} name="k8sNodes.cpu" />} label="Show Nodes CPU" />
                            <FormControlLabel control={<Switch checked={newWidget.k8sNodes?.memory ?? true} onChange={handleChange} name="k8sNodes.memory" />} label="Show Nodes Memory" />
                            <FormControlLabel control={<Switch checked={newWidget.k8sNodes?.showLabel ?? true} onChange={handleChange} name="k8sNodes.showLabel" />} label="Show 'Nodes' Label" />
                        </>
                    )}

                    {/* OpenMeteo Fields */}
                    {newWidget.type === 'openmeteo' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Open-Meteo Options</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="latitude" label="Latitude (Optional)" name="latitude" type="number" value={newWidget.latitude} onChange={handleChange} helperText="e.g., 50.449" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="longitude" label="Longitude (Optional)" name="longitude" type="number" value={newWidget.longitude} onChange={handleChange} helperText="e.g., 30.525" inputProps={{ step: "any" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="timezone" label="Timezone (Optional)" name="timezone" value={newWidget.timezone} onChange={handleChange} helperText="e.g., Europe/London" /></Grid>
                                <Grid item xs={12} sm={6}><FormControl margin="normal" fullWidth><InputLabel id="om-units-label">Units</InputLabel><Select labelId="om-units-label" id="units" name="units" value={newWidget.units} label="Units" onChange={handleChange}><MenuItem value=""><em>Default (metric)</em></MenuItem>{WEATHER_UNITS.map(unit => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}</Select></FormControl></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="cache" label="Cache Time (minutes)" name="cache" type="number" value={newWidget.cache} onChange={handleChange} helperText="Default: 5" inputProps={{ min: "0", step: "1" }}/></Grid>
                                <Grid item xs={12} sm={6}><TextField margin="normal" fullWidth id="format.maximumFractionDigits" label="Max Decimal Places (Optional)" name="format.maximumFractionDigits" type="number" value={newWidget.format?.maximumFractionDigits ?? ''} onChange={handleChange} helperText="For temperature display" inputProps={{ min: "0", step: "1" }}/></Grid>
                            </Grid>
                        </>
                    )}


                     {/* Placeholder for other widget types */}
                    {newWidget.type && !WIDGET_TYPES.includes(newWidget.type) && (
                          <Typography variant="caption" display="block" gutterBottom sx={{mt: 2}}>
                             Note: Specific fields for '{newWidget.type}' are not yet implemented in this form. Only Type and Label will be saved.
                         </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button type="submit" variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Widget'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddWidgetForm;