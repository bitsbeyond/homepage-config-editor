import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import YAML from 'js-yaml'; // Import js-yaml for validation

// Helper to check if a string is valid YAML (specifically an array for metrics)
const isValidYamlArray = (str) => {
    // Metrics array is required, so empty is invalid.
    if (!str || !str.trim()) return false;
    try {
        const parsed = YAML.load(str);
        // Check if it's an array and not empty (at least one metric needed)
        return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
        return false;
    }
};

function PrometheusmetricWidgetFields({ initialData, onChange: parentOnChange }) {
    // Function to safely dump YAML
    const safeYamlDump = (data) => {
        try {
            // Ensure data is not null/undefined before dumping
            return data ? YAML.dump(data) : '';
        } catch (e) {
            console.error("Error dumping YAML:", e);
            return '';
        }
    };

     // Function to determine initial error state
     const getInitialErrors = (data) => {
        const metricsStr = data?.metrics ? safeYamlDump(data.metrics) : '';
        const initialErrors = {
            url: !data?.url?.trim(), // URL is required
            metrics: !isValidYamlArray(metricsStr) // Metrics are required
        };
         // If metrics are initially empty/null, mark as error because it's required
         if (!metricsStr) {
             initialErrors.metrics = true;
         }
        return initialErrors;
    };

  const [widgetData, setWidgetData] = useState({
    type: 'prometheusmetric',
    url: initialData?.url || '',
    refreshInterval: initialData?.refreshInterval || '', // Keep as string for TextField
    metrics: initialData?.metrics ? safeYamlDump(initialData.metrics) : '', // Store as YAML string
  });

   // Initialize error state based on initial data
   const [errors, setErrors] = useState(() => getInitialErrors(initialData));


  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
        const newMetrics = initialData.metrics ? safeYamlDump(initialData.metrics) : '';
      setWidgetData({
        type: 'prometheusmetric',
        url: initialData.url || '',
        refreshInterval: initialData.refreshInterval || '',
        metrics: newMetrics,
      });
       // Recalculate errors based on new initial data
       setErrors(getInitialErrors(initialData));
    } else {
      // Reset to defaults
      setWidgetData({
        type: 'prometheusmetric',
        url: '',
        refreshInterval: '',
        metrics: '',
      });
       // Reset errors - URL and metrics will be invalid by default as they're required
       setErrors({ url: true, metrics: true });
    }
  }, [initialData]);

  // Handle changes to individual fields
  const handleChange = (event) => {
    const { name, value } = event.target;
    let currentErrors = { ...errors };

     // Update local state immediately
     const updatedLocalState = { ...widgetData, [name]: value };
     setWidgetData(updatedLocalState);

    // --- Validation ---
    let isFieldValid = true;
    if (name === 'metrics') {
        isFieldValid = isValidYamlArray(value);
        currentErrors.metrics = !isFieldValid;
    } else if (name === 'url') {
        isFieldValid = value?.trim() !== '';
        currentErrors.url = !isFieldValid;
    }
    setErrors(currentErrors);
    // --- End Validation ---


    // Prepare data for parent, parsing YAML if valid
    const dataForParent = { ...updatedLocalState, type: 'prometheusmetric' };

     // Parse numeric fields
     if (name === 'refreshInterval' && value) {
        const numVal = parseInt(value, 10);
        if (!isNaN(numVal) && numVal >= 0) {
            dataForParent.refreshInterval = numVal;
        } else {
            delete dataForParent.refreshInterval; // Don't send invalid number
        }
   } else if (!value && name === 'refreshInterval') {
        delete dataForParent.refreshInterval;
   }

    // Parse metrics YAML only if valid
    if (name === 'metrics') {
        if (isFieldValid && value) {
             try { dataForParent.metrics = YAML.load(value); }
             catch (e) { console.error("Error loading metrics YAML:", e); delete dataForParent.metrics; }
        } else {
             delete dataForParent.metrics; // Delete if invalid or empty
        }
    } else if (!dataForParent.metrics) { // Handle case where metrics was already empty/invalid
         delete dataForParent.metrics;
    }

    // Remove empty optional fields
    if (!dataForParent.refreshInterval) {
        delete dataForParent.refreshInterval;
    }

     // URL is required
     if (!dataForParent.url) {
         delete dataForParent.url; // Let parent form handle required validation
     }
     // Metrics are required
     if (!dataForParent.metrics) {
          delete dataForParent.metrics; // Let parent form handle required validation
     }


    onChange(dataForParent); // Pass the processed widget data object
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Prometheus URL"
        name="url"
        value={widgetData.url}
        onChange={handleChange}
        fullWidth
        required
        type="url"
        error={errors.url}
        helperText={errors.url ? "URL is required for Prometheus Metric widget." : "URL of your Prometheus instance (e.g., http://prometheus.host:9090)"}
      />
      <TextField
        label="Refresh Interval (ms)"
        name="refreshInterval"
        value={widgetData.refreshInterval}
        onChange={handleChange}
        fullWidth
        type="number"
        inputProps={{ min: 0 }}
        helperText="Optional. Global refresh interval (e.g., 10000 for 10s). Can be overridden per metric."
      />
       <TextField
        label="Metrics (YAML Array)"
        name="metrics"
        value={widgetData.metrics}
        onChange={handleChange}
        fullWidth
        required
        multiline
        rows={10} // Allow space for metric definitions
        error={errors.metrics}
        helperText={errors.metrics ? "Invalid or empty YAML array format" : "Required. Define metrics using PromQL queries. See Homepage docs."}
        sx={{ fontFamily: 'monospace' }}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
}

PrometheusmetricWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    refreshInterval: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    metrics: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  }),
  onChange: PropTypes.func.isRequired,
};

PrometheusmetricWidgetFields.defaultProps = {
  initialData: null,
};

export default PrometheusmetricWidgetFields;