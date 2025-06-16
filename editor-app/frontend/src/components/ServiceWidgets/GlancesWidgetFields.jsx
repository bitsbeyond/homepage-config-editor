import React, { useState, useEffect } from 'react';
import {
    TextField, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Typography
} from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';
import PropTypes from 'prop-types'; // Added PropTypes

// Based on sourcecode_homepage/docs/widgets/services/glances.md

function GlancesWidgetFields({ initialData, onChange: parentOnChange }) {
    const defaults = {
        version: 3,
        diskUnits: 'bytes',
        pointsLimit: 15,
        chart: true,
    };

    const [url, setUrl] = useState(initialData?.url || '');
    const [username, setUsername] = useState(initialData?.username || '');
    const [password, setPassword] = useState(initialData?.password || '');
    const [version, setVersion] = useState(initialData?.version ?? defaults.version);
    const [metric, setMetric] = useState(initialData?.metric || '');
    const [diskUnits, setDiskUnits] = useState(initialData?.diskUnits ?? defaults.diskUnits);
    const [refreshInterval, setRefreshInterval] = useState(initialData?.refreshInterval?.toString() || '');
    const [pointsLimit, setPointsLimit] = useState(initialData?.pointsLimit ?? defaults.pointsLimit);
    const [chart, setChart] = useState(initialData?.chart ?? defaults.chart);


    useEffect(() => {
        setUrl(initialData?.url || '');
        setUsername(initialData?.username || '');
        setPassword(initialData?.password || '');
        setVersion(initialData?.version ?? defaults.version);
        setMetric(initialData?.metric || '');
        setDiskUnits(initialData?.diskUnits ?? defaults.diskUnits);
        setRefreshInterval(initialData?.refreshInterval?.toString() || '');
        setPointsLimit(initialData?.pointsLimit ?? defaults.pointsLimit);
        setChart(initialData?.chart ?? defaults.chart);
    }, [initialData]);

    useEffect(() => {
        const currentWidgetData = {
            type: 'glances',
            url: url || undefined,
            username: username || undefined,
            password: password || undefined,
            version, // Will be handled if default
            metric: metric || undefined,
            diskUnits, // Will be handled if default
            chart, // Will be handled if default
        };

        const validationErrors = {};
        if (!url?.trim()) {
            validationErrors.url = 'Glances URL is required.';
        }
        if (!metric?.trim()) {
            validationErrors.metric = 'Metric is required.';
        }
        if (refreshInterval && (isNaN(parseInt(refreshInterval, 10)) || parseInt(refreshInterval, 10) < 0)) {
            validationErrors.refreshInterval = 'Refresh Interval must be a non-negative number.';
        }
        if (pointsLimit && (isNaN(parseInt(pointsLimit.toString(), 10)) || parseInt(pointsLimit.toString(), 10) < 1)) {
            validationErrors.pointsLimit = 'Points Limit must be a positive number.';
        }


        if (refreshInterval) {
            const numInterval = parseInt(refreshInterval, 10);
            if (!isNaN(numInterval) && numInterval >= 0) {
                currentWidgetData.refreshInterval = numInterval;
            }
        }
        if (pointsLimit) {
            const numPoints = parseInt(pointsLimit.toString(), 10);
            if (!isNaN(numPoints) && numPoints >= 1) {
                currentWidgetData.pointsLimit = numPoints;
            }
        }


        const dataForParent = { ...currentWidgetData };
        Object.keys(dataForParent).forEach(k => {
            if (dataForParent[k] === undefined) {
                delete dataForParent[k];
            }
        });

        // Remove optional fields if they match their default value
        if (dataForParent.username === '') delete dataForParent.username;
        if (dataForParent.password === '') delete dataForParent.password;
        if (dataForParent.refreshInterval === '') delete dataForParent.refreshInterval;
        if (dataForParent.version === defaults.version) delete dataForParent.version;
        if (dataForParent.diskUnits === defaults.diskUnits) delete dataForParent.diskUnits;
        if (dataForParent.pointsLimit === defaults.pointsLimit) delete dataForParent.pointsLimit;
        if (dataForParent.chart === defaults.chart) delete dataForParent.chart;

        dataForParent.type = 'glances';

        parentOnChange(dataForParent, validationErrors);
    }, [url, username, password, version, metric, diskUnits, refreshInterval, pointsLimit, chart, parentOnChange]);

    const handleUrlChange = (event) => setUrl(event.target.value);
    const handleUsernameChange = (event) => setUsername(event.target.value);
    const handlePasswordChange = (event) => setPassword(event.target.value);
    const handleVersionChange = (event) => setVersion(Number(event.target.value));
    const handleMetricChange = (event) => setMetric(event.target.value);
    const handleDiskUnitsChange = (event) => setDiskUnits(event.target.value);
    const handleRefreshIntervalChange = (event) => setRefreshInterval(event.target.value);
    const handlePointsLimitChange = (event) => setPointsLimit(event.target.value === '' ? '' : Number(event.target.value));
    const handleChartChange = (event) => setChart(event.target.checked);

    const isDiskMetric = metric?.startsWith('disk:');
    const urlError = !url?.trim();
    const metricError = !metric?.trim();
    const refreshIntervalError = refreshInterval && (isNaN(parseInt(refreshInterval, 10)) || parseInt(refreshInterval, 10) < 0);
    const pointsLimitError = pointsLimit && (isNaN(parseInt(pointsLimit.toString(),10)) || parseInt(pointsLimit.toString(),10) <1);


    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                label="Glances URL"
                name="url"
                value={url}
                onChange={handleUrlChange}
                fullWidth
                required
                type="url"
                helperText={urlError ? 'Glances URL is required.' : "e.g., http://glances.host.or.ip:port"}
                error={urlError}
            />
            <TextField
                label="Metric"
                name="metric"
                value={metric}
                onChange={handleMetricChange}
                fullWidth
                required
                helperText={metricError ? 'Metric is required.' : "e.g., cpu, memory, network:eth0, disk:sda, fs:/, sensor:core_0, gpu:0, process, containers, info"}
                error={metricError}
            />
            <EnvVarAutocompleteInput
                label="Username (Optional)"
                name="username"
                value={username}
                onChange={handleUsernameChange}
                fullWidth
            />
            <EnvVarAutocompleteInput
                label="Password (Optional)"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                type="password"
                fullWidth
            />
            <FormControl fullWidth>
                <InputLabel id="glances-version-label">API Version</InputLabel>
                <Select
                    labelId="glances-version-label"
                    id="glances-version"
                    name="version"
                    value={version}
                    label="API Version"
                    onChange={handleVersionChange}
                >
                    <MenuItem value={3}>3 (Default)</MenuItem>
                    <MenuItem value={4}>4</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ mt: 1 }}>Required only if running Glances v4+</Typography>
            </FormControl>

            <FormControl fullWidth disabled={!isDiskMetric}>
                <InputLabel id="glances-diskunits-label">Disk Units</InputLabel>
                <Select
                    labelId="glances-diskunits-label"
                    id="glances-diskunits"
                    name="diskUnits"
                    value={diskUnits}
                    label="Disk Units"
                    onChange={handleDiskUnitsChange}
                >
                    <MenuItem value="bytes">bytes (Default)</MenuItem>
                    <MenuItem value="bbytes">bbytes</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ mt: 1 }}>Only applies if metric starts with 'disk:'</Typography>
            </FormControl>

            <TextField
                label="Refresh Interval (ms, Optional)"
                name="refreshInterval"
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
                type="number"
                inputProps={{ min: "0", step: "100" }}
                fullWidth
                helperText={refreshIntervalError ? "Must be a non-negative number." : "Default varies by metric (e.g., 1000ms+)"}
                error={refreshIntervalError}
            />

            <TextField
                label="Points Limit (Optional)"
                name="pointsLimit"
                value={pointsLimit.toString()} // Ensure value is string for TextField
                onChange={handlePointsLimitChange}
                type="number"
                inputProps={{ min: "1", step: "1" }}
                fullWidth
                helperText={pointsLimitError ? "Must be a positive number." : "Number of data points for charts (Default: 15)"}
                error={pointsLimitError}
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={chart}
                        onChange={handleChartChange}
                        name="chart"
                    />
                }
                label="Show Chart View (Default: On)"
            />
        </Box>
    );
}

GlancesWidgetFields.propTypes = {
    initialData: PropTypes.shape({
        type: PropTypes.string,
        url: PropTypes.string,
        username: PropTypes.string,
        password: PropTypes.string,
        version: PropTypes.number,
        metric: PropTypes.string,
        diskUnits: PropTypes.string,
        refreshInterval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        pointsLimit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        chart: PropTypes.bool,
    }),
    onChange: PropTypes.func.isRequired,
};

GlancesWidgetFields.defaultProps = {
    initialData: null,
};

export default GlancesWidgetFields;