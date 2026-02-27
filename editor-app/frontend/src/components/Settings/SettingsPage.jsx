import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Grid,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Box,
    Slider,
    FormLabel,
   AlertTitle,
   Card,           // Added for Group Layout section
   CardContent,    // Added for Group Layout section
   CardHeader,     // Added for Group Layout section
   Switch,         // Added for boolean layout settings
   FormControlLabel // Added for Switch labels
} from '@mui/material';
import { fetchSettingsApi, saveSettingsApi } from '../../utils/api'; // Corrected path
import { useSnackbar } from 'notistack';

// Define available themes and colors based on Homepage documentation (or common options)
const availableThemes = ['dark', 'light', 'transparent-dark', 'transparent-light']; // Add more as needed
const availableColors = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']; // From Tailwind defaults
const availableBlurs = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']; // Tailwind blur values + 'none'
const availableLayoutStyles = ['row', 'column']; // From Homepage docs
const defaultGroupLayout = { header: true, style: 'row', columns: 4 }; // Default for new/unset groups

function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [allGroupNames, setAllGroupNames] = useState([]); // State for group names
    const [selectedGroupLayout, setSelectedGroupLayout] = useState({ groupName: null, config: {} }); // State for selected group layout editing
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch both settings and group names
            const { settings: fetchedSettings, groupNames } = await fetchSettingsApi();

            // Initialize nested structures if they don't exist in settings
            setSettings({
                ...fetchedSettings,
                background: fetchedSettings.background || {},
                providers: fetchedSettings.providers || {},
                layout: fetchedSettings.layout || {}, // Ensure layout exists
            });
            setAllGroupNames(groupNames || []); // Set the fetched group names

        } catch (err) {
            setError(`Failed to load settings or group names: ${err.message}`);
            enqueueSnackbar(`Error loading settings: ${err.message}`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (section, event) => {
        const { name, value } = event.target;
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value,
            },
        }));
    };

     const handleSliderChange = (section, name, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: value,
            },
        }));
    };

    // Handler for selecting a group to edit its layout
    const handleGroupSelect = (event) => {
        const groupName = event.target.value;
        setSelectedGroupLayout({ groupName: groupName, config: {} }); // Reset config display on select

        // Ensure the layout object exists in the main settings state for this group
        if (groupName && settings && (!settings.layout || !settings.layout[groupName])) {
            setSettings(prev => {
                const newLayout = { ...(prev.layout || {}) };
                newLayout[groupName] = { ...defaultGroupLayout };
                return { ...prev, layout: newLayout };
            });
        }
    };

    // Handler for changing values in the selected group's layout form (TextField, Select)
    const handleLayoutChange = (event) => {
        const { name, value } = event.target;
        const groupName = selectedGroupLayout.groupName;

        if (!groupName) return; // Should not happen if form is visible

        // Ensure 'columns' is stored as a number
        let processedValue = value;
        if (name === 'columns') {
            const parsedValue = parseInt(value, 10);
            processedValue = (!isNaN(parsedValue) && parsedValue >= 1) ? parsedValue : 1;
        }

        // Update the main settings state directly
        setSettings(prev => {
            const newLayout = { ...(prev.layout || {}) };
            newLayout[groupName] = {
                ...(newLayout[groupName] || defaultGroupLayout), // Ensure group layout exists
                [name]: processedValue,
            };
            return { ...prev, layout: newLayout };
        });
    };

    // Handler for changing Switch values in the selected group's layout form
    const handleLayoutSwitchChange = (event) => {
        const { name, checked } = event.target;
        const groupName = selectedGroupLayout.groupName;

        if (!groupName) return;

        // Update the main settings state directly
        setSettings(prev => {
            const newLayout = { ...(prev.layout || {}) };
            newLayout[groupName] = {
                ...(newLayout[groupName] || defaultGroupLayout), // Ensure group layout exists
                [name]: checked,
            };
            return { ...prev, layout: newLayout };
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            // 1. The 'settings' state now contains all accumulated changes (general + all edited layouts)
            let settingsToSave = JSON.parse(JSON.stringify(settings || {})); // Deep copy just in case

            // Ensure top-level keys exist (might be redundant now but safe)
            settingsToSave.background = settingsToSave.background || {};
            settingsToSave.providers = settingsToSave.providers || {};
            settingsToSave.layout = settingsToSave.layout || {}; // Ensure layout exists

            // *** CONVERT LAYOUT OBJECT TO ARRAY BEFORE SAVING ***
            // The backend expects the layout as an array [{ name: 'group', ...config }]
            // but the SettingsPage manipulates it as an object { group: { ...config } }
            if (settingsToSave.layout && typeof settingsToSave.layout === 'object' && !Array.isArray(settingsToSave.layout)) {
                console.log("Converting layout object back to array before saving:", settingsToSave.layout);
                const layoutArray = Object.entries(settingsToSave.layout).map(([groupName, groupConfig]) => ({
                    name: groupName,
                    ...(groupConfig || {}) // Ensure groupConfig is at least an empty object
                }));
                // We need to preserve the order based on how it was fetched or last ordered.
                // Fetch the original order from allGroupNames (which should reflect the order from readSettings)
                // This assumes allGroupNames is up-to-date. A safer approach might involve storing the fetched array separately.
                const orderedLayoutArray = allGroupNames
                    .map(name => layoutArray.find(group => group.name === name)) // Find the group data for each ordered name
                    .filter(group => group !== undefined); // Filter out any groups that might have been deleted but still in allGroupNames somehow

                // Add any groups present in layoutArray but missing from allGroupNames (shouldn't happen ideally)
                 const namesInOrder = new Set(orderedLayoutArray.map(g => g.name));
                 layoutArray.forEach(group => {
                     if (!namesInOrder.has(group.name)) {
                         console.warn(`Group "${group.name}" found in settings state but not in fetched group order. Appending.`);
                         orderedLayoutArray.push(group);
                     }
                 });


                settingsToSave.layout = orderedLayoutArray;
                console.log("Converted layout array for saving:", settingsToSave.layout);
            } else if (Array.isArray(settingsToSave.layout)) {
                 console.log("Layout is already an array, sending as is:", settingsToSave.layout);
            } else {
                 console.warn("Layout data is neither object nor array, sending empty array.");
                 settingsToSave.layout = []; // Send empty array if layout is invalid type
            }


            // 2. Save the complete settings object (now with layout as an array)
            await saveSettingsApi(settingsToSave);
            enqueueSnackbar('Settings saved successfully!', { variant: 'success' });

            // 3. Re-fetch settings to ensure consistency with the saved state
            // This is safer than relying solely on the local state update,
            // especially if backend modifies data during save (though unlikely here).
            await fetchSettings(); // Re-fetch after successful save

        } catch (err) {
            setError(`Failed to save settings: ${err.message}`);
            enqueueSnackbar(`Error saving settings: ${err.message}`, { variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    // Don't render form if initial fetch failed badly and settings is null
    if (!settings && error) {
         return (
            <Container sx={{ mt: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    // Ensure settings is not null before rendering form fields
    if (!settings) {
        return null; // Or some placeholder/error state
    }


    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Homepage Settings
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {/* Outer Grid container for vertical stacking of sections */}
                    <Grid container spacing={4} direction="column">

                        {/* --- General Settings Section --- */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>General</Typography>
                            <Grid container spacing={2}> {/* Nested grid for fields */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Page Title"
                                        name="title"
                                        value={settings.title || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="theme-select-label">Theme</InputLabel>
                                        <Select
                                            labelId="theme-select-label"
                                            id="theme-select"
                                            name="theme"
                                            value={settings.theme || ''}
                                            onChange={handleChange}
                                            label="Theme"
                                        >
                                            {availableThemes.map(theme => (
                                                <MenuItem key={theme} value={theme}>{theme}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="color-select-label">Color Accent</InputLabel>
                                        <Select
                                            labelId="color-select-label"
                                            id="color-select"
                                            name="color"
                                            value={settings.color || ''}
                                            onChange={handleChange}
                                            label="Color Accent"
                                        >
                                            {availableColors.map(color => (
                                                <MenuItem key={color} value={color}>{color}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* --- Background Settings Section --- */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Background</Typography>
                            <Grid container spacing={2}> {/* Nested grid for fields */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Image URL"
                                        name="image"
                                        value={settings.background?.image || ''}
                                        onChange={(e) => handleNestedChange('background', e)}
                                        variant="outlined"
                                        helperText="URL of the background image."
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel id="blur-select-label">Blur</InputLabel>
                                        <Select
                                            labelId="blur-select-label"
                                            id="blur-select"
                                            name="blur"
                                            value={settings.background?.blur || 'none'}
                                            onChange={(e) => handleNestedChange('background', e)}
                                            label="Blur"
                                        >
                                            {availableBlurs.map(blur => (
                                                <MenuItem key={blur} value={blur}>{blur}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ px: 1 }}>
                                        <FormLabel component="legend">Opacity ({settings.background?.opacity ?? 0}%)</FormLabel>
                                        <Slider
                                            name="opacity"
                                            value={settings.background?.opacity ?? 0}
                                            onChange={(e, newValue) => handleSliderChange('background', 'opacity', newValue)}
                                            aria-labelledby="opacity-slider"
                                            valueLabelDisplay="auto"
                                            step={5}
                                            marks
                                            min={0}
                                            max={100}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ px: 1 }}>
                                        <FormLabel component="legend">Saturation ({settings.background?.saturate ?? 100}%)</FormLabel>
                                        <Slider
                                            name="saturate"
                                            value={settings.background?.saturate ?? 100} // Default to 100 if undefined
                                            onChange={(e, newValue) => handleSliderChange('background', 'saturate', newValue)}
                                            aria-labelledby="saturate-slider"
                                            valueLabelDisplay="auto"
                                            step={10}
                                            marks
                                            min={0}
                                            max={200} // Tailwind saturate goes up to 200
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ px: 1 }}>
                                        <FormLabel component="legend">Brightness ({settings.background?.brightness ?? 100}%)</FormLabel>
                                        <Slider
                                            name="brightness"
                                            value={settings.background?.brightness ?? 100} // Default to 100 if undefined
                                            onChange={(e, newValue) => handleSliderChange('background', 'brightness', newValue)}
                                            aria-labelledby="brightness-slider"
                                            valueLabelDisplay="auto"
                                            step={5}
                                            marks
                                            min={0}
                                            max={200} // Tailwind brightness goes up to 200
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* --- Provider Settings Section --- */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>API Providers</Typography>
                            <Grid container spacing={2}> {/* Nested grid for fields */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="OpenWeatherMap API Key"
                                        name="openweathermap"
                                        value={settings.providers?.openweathermap || ''}
                                        onChange={(e) => handleNestedChange('providers', e)}
                                        variant="outlined"
                                        type="password" // Hide the key by default
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="WeatherAPI API Key"
                                        name="weatherapi"
                                        value={settings.providers?.weatherapi || ''}
                                        onChange={(e) => handleNestedChange('providers', e)}
                                        variant="outlined"
                                        type="password" // Hide the key by default
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* --- Group Layout Settings Section --- */}
                        <Grid item xs={12}> {/* Group Layouts Section Item */}
                            <Typography variant="h6" gutterBottom>Group Layouts</Typography>
                            {/* Dropdown Grid Item */}
                            <Grid item xs={12} sx={{ mb: 2 }}> {/* Ensure dropdown takes full width */}
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="group-layout-select-label">Select Group to Edit Layout</InputLabel>
                                    <Select
                                        labelId="group-layout-select-label"
                                        value={selectedGroupLayout.groupName || ''}
                                        onChange={handleGroupSelect}
                                        label="Select Group to Edit Layout"
                                    >
                                        <MenuItem value="">
                                            <em>-- Select a Group --</em>
                                        </MenuItem>
                                        {allGroupNames.map(name => (
                                            <MenuItem key={name} value={name}>{name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Conditionally Render Layout Editor */}
                            {selectedGroupLayout.groupName && (
                                <Grid item xs={12}> {/* Ensure this takes full width */}
                                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>Layout for: {selectedGroupLayout.groupName}</Typography>
                                        <Grid container spacing={2}> {/* Inner grid for layout fields */}
                                                {/* Row 1: Style, Columns, Icon */}
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <FormControl fullWidth variant="outlined">
                                                        <InputLabel id={`style-label-${selectedGroupLayout.groupName}`}>Style</InputLabel>
                                                        <Select
                                                            labelId={`style-label-${selectedGroupLayout.groupName}`}
                                                            name="style"
                                                            value={settings?.layout?.[selectedGroupLayout.groupName]?.style || defaultGroupLayout.style}
                                                            onChange={handleLayoutChange}
                                                            label="Style"
                                                        >
                                                            {availableLayoutStyles.map(style => (
                                                                <MenuItem key={style} value={style}>{style}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Columns"
                                                        name="columns"
                                                        type="number"
                                                        value={settings?.layout?.[selectedGroupLayout.groupName]?.columns ?? defaultGroupLayout.columns}
                                                        onChange={handleLayoutChange}
                                                        variant="outlined"
                                                        inputProps={{ min: 1, step: 1 }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Icon URL/Name"
                                                        name="icon"
                                                        value={settings?.layout?.[selectedGroupLayout.groupName]?.icon || ''}
                                                        onChange={handleLayoutChange}
                                                        variant="outlined"
                                                        helperText="e.g., home-assistant.png or mdi-server"
                                                    />
                                                </Grid>
                                                {/* Row 2: Tab Name */}
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Tab Name"
                                                        name="tab"
                                                        value={settings?.layout?.[selectedGroupLayout.groupName]?.tab || ''}
                                                        onChange={handleLayoutChange}
                                                        variant="outlined"
                                                        helperText="Assign group to a tab (optional)"
                                                    />
                                                </Grid>
                                                {/* Spacer to push toggles down if needed, or just let grid wrap */}
                                                <Grid item xs={12} sm={6} md={8}></Grid> {/* Adjust spacer as needed */}

                                                {/* Row 3: Toggles */}
                                                <Grid item xs={12} sm={6} md={3}> {/* Adjusted md size */}
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                name="header"
                                                                checked={settings?.layout?.[selectedGroupLayout.groupName]?.header ?? defaultGroupLayout.header}
                                                                onChange={handleLayoutSwitchChange}
                                                            />
                                                        }
                                                        label="Show Header"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}> {/* Adjusted md size */}
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                name="iconsOnly"
                                                                checked={settings?.layout?.[selectedGroupLayout.groupName]?.iconsOnly ?? false}
                                                                onChange={handleLayoutSwitchChange}
                                                            />
                                                        }
                                                        label="Icons Only (Bookmarks)"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}> {/* Adjusted md size */}
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                name="initiallyCollapsed"
                                                                checked={settings?.layout?.[selectedGroupLayout.groupName]?.initiallyCollapsed ?? false}
                                                                onChange={handleLayoutSwitchChange}
                                                            />
                                                        }
                                                        label="Initially Collapsed"
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}> {/* Adjusted md size */}
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                name="useEqualHeights"
                                                                checked={settings?.layout?.[selectedGroupLayout.groupName]?.useEqualHeights ?? false}
                                                                onChange={handleLayoutSwitchChange}
                                                            />
                                                        }
                                                        label="Use Equal Heights"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                )}
                            {/* No intermediate Grid container was here */}
                        </Grid> {/* Closes Grid item from line 385 */}

                        {/* --- Advanced Settings Section --- */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Advanced Settings</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                name="disableIndexing"
                                                checked={settings.disableIndexing || false}
                                                onChange={(e) => setSettings(prev => ({ ...prev, disableIndexing: e.target.checked }))}
                                            />
                                        }
                                        label="Disable Search Engine Indexing"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Block Highlight Levels</Typography>
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                                        Custom CSS classes for widget block highlights. Leave empty for default Homepage styling.
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Good (CSS class)"
                                                name="good"
                                                value={settings.blockHighlights?.levels?.good || ''}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    blockHighlights: {
                                                        ...prev.blockHighlights,
                                                        levels: { ...(prev.blockHighlights?.levels || {}), good: e.target.value }
                                                    }
                                                }))}
                                                variant="outlined"
                                                helperText="e.g., bg-green-500/50"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Warn (CSS class)"
                                                name="warn"
                                                value={settings.blockHighlights?.levels?.warn || ''}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    blockHighlights: {
                                                        ...prev.blockHighlights,
                                                        levels: { ...(prev.blockHighlights?.levels || {}), warn: e.target.value }
                                                    }
                                                }))}
                                                variant="outlined"
                                                helperText="e.g., bg-yellow-500/50"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Danger (CSS class)"
                                                name="danger"
                                                value={settings.blockHighlights?.levels?.danger || ''}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    blockHighlights: {
                                                        ...prev.blockHighlights,
                                                        levels: { ...(prev.blockHighlights?.levels || {}), danger: e.target.value }
                                                    }
                                                }))}
                                                variant="outlined"
                                                helperText="e.g., bg-red-500/50"
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>PWA Configuration (JSON)</Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="PWA JSON"
                                        value={settings.pwa ? JSON.stringify(settings.pwa, null, 2) : ''}
                                        onChange={(e) => {
                                            try {
                                                const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                                                setSettings(prev => ({ ...prev, pwa: parsed }));
                                            } catch {
                                                // Allow invalid JSON while typing
                                            }
                                        }}
                                        variant="outlined"
                                        helperText='Optional. JSON object with "icons" and/or "shortcuts" arrays for PWA manifest customization.'
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* --- Save Button Section --- */}
                        <Grid item xs={12} sx={{ mt: 3, textAlign: 'right' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSaving || loading}
                                startIcon={isSaving ? <CircularProgress size={20} /> : null}
                            >
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </Grid>

                    </Grid> {/* Closes Outer Grid container (started line 219) */}
                </Box> {/* Closes Box form (started line 217) */}
            </Paper> {/* Closes Paper (started line 216) */}
        </Container>
    );
}

export default SettingsPage;