import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';

const WIDGET_TYPE = 'stocks';

function StocksWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [watchlist, setWatchlist] = useState('');
  const [showUSMarketStatus, setShowUSMarketStatus] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      // Handle watchlist which might be an array (initial load) or string (subsequent edits)
      const newWatchlist = Array.isArray(initialData.watchlist)
        ? initialData.watchlist.join(', ')
        : typeof initialData.watchlist === 'string'
        ? initialData.watchlist
        : '';
      if (newWatchlist !== watchlist) {
        setWatchlist(newWatchlist);
      }
      const newShowUSMarketStatus = initialData.showUSMarketStatus !== undefined ? initialData.showUSMarketStatus : true;
      if (newShowUSMarketStatus !== showUSMarketStatus) {
        setShowUSMarketStatus(newShowUSMarketStatus);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setWatchlist('');
      setShowUSMarketStatus(true);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: WIDGET_TYPE,
      provider: 'finnhub',
      watchlist: watchlist || undefined,
      showUSMarketStatus: showUSMarketStatus || undefined,
    };

    const errors = {};
    // No mandatory fields for stocks widget - watchlist is optional
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: WIDGET_TYPE, provider: 'finnhub' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && k !== 'provider' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Remove showUSMarketStatus if true (default)
    if (dataForParent.showUSMarketStatus === true) {
      delete dataForParent.showUSMarketStatus;
    }

    parentOnChange(dataForParent, errors);
  }, [watchlist, showUSMarketStatus, parentOnChange]);

  // Handle changes for standard TextFields
  const handleWatchlistChange = (event) => {
    setWatchlist(event.target.value);
  };

  // Handle changes for checkbox
  const handleShowUSMarketStatusChange = (event) => {
    setShowUSMarketStatus(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body2" color="textSecondary">
        Provider must be 'finnhub'. Ensure your Finnhub API key is configured in settings.yaml.
      </Typography>
      <TextField
        fullWidth
        name="watchlist"
        label="Watchlist (comma-separated symbols)"
        value={watchlist}
        onChange={handleWatchlistChange}
        helperText="Stock symbols to display (e.g., GME, AMC, NVDA). Optional - shows default stocks if empty."
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showUSMarketStatus}
            onChange={handleShowUSMarketStatusChange}
            name="showUSMarketStatus"
          />
        }
        label="Show US Market Status"
      />
    </Box>
  );
}

StocksWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    provider: PropTypes.string,
    watchlist: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    showUSMarketStatus: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

StocksWidgetFields.defaultProps = {
  initialData: null,
};

export default StocksWidgetFields;