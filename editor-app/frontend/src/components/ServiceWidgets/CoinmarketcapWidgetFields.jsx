import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

// Helper to convert comma-separated string to array of strings
const stringToArray = (str) => {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(item => item.trim()).filter(item => item);
};

// Helper to convert array of strings to comma-separated string
const arrayToString = (arr) => {
  if (!Array.isArray(arr)) return '';
  return arr.join(', ');
};

function CoinmarketcapWidgetFields({ initialData, onChange: parentOnChange }) {
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [currency, setCurrency] = useState(initialData?.currency || '');
  // Store symbols and slugs as strings for TextField, parse them in useEffect
  const [symbolsStr, setSymbolsStr] = useState(arrayToString(initialData?.symbols || []));
  const [slugsStr, setSlugsStr] = useState(arrayToString(initialData?.slugs || []));
  const [defaultInterval, setDefaultInterval] = useState(initialData?.defaultinterval || '');

  useEffect(() => {
    setApiKey(initialData?.key || '');
    setCurrency(initialData?.currency || '');
    setSymbolsStr(arrayToString(initialData?.symbols || []));
    setSlugsStr(arrayToString(initialData?.slugs || []));
    setDefaultInterval(initialData?.defaultinterval || '');
  }, [initialData]);

  useEffect(() => {
    const parsedSymbols = stringToArray(symbolsStr);
    const parsedSlugs = stringToArray(slugsStr);

    const currentWidgetData = {
      type: 'coinmarketcap',
      key: apiKey || undefined,
      currency: currency || undefined,
      symbols: parsedSymbols.length > 0 ? parsedSymbols : undefined,
      slugs: parsedSlugs.length > 0 ? parsedSlugs : undefined,
      defaultinterval: defaultInterval || undefined,
    };

    const validationErrors = {};
    if (!apiKey?.trim()) {
      validationErrors.key = 'API Key is required.';
    }
    if (parsedSymbols.length === 0 && parsedSlugs.length === 0) {
      validationErrors.symbols = 'Either Symbols or Slugs must be provided.';
      validationErrors.slugs = 'Either Symbols or Slugs must be provided.';
    }

    const dataForParent = { ...currentWidgetData };
    Object.keys(dataForParent).forEach(k => {
      if (dataForParent[k] === undefined) {
        delete dataForParent[k];
      }
    });
    dataForParent.type = 'coinmarketcap';

    parentOnChange(dataForParent, validationErrors);
  }, [apiKey, currency, symbolsStr, slugsStr, defaultInterval, parentOnChange]);

  const handleApiKeyChange = (event) => setApiKey(event.target.value);
  const handleCurrencyChange = (event) => setCurrency(event.target.value);
  const handleSymbolsChange = (event) => setSymbolsStr(event.target.value);
  const handleSlugsChange = (event) => setSlugsStr(event.target.value);
  const handleDefaultIntervalChange = (event) => setDefaultInterval(event.target.value);

  const symbolsArray = stringToArray(symbolsStr);
  const slugsArray = stringToArray(slugsStr);

  return (
    <Grid container spacing={2} sx={{ paddingTop: 2 }}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 1 }}>
          Requires a CoinMarketCap Pro API Key. Provide either Symbols OR Slugs. Slugs take precedence if both are provided.
        </Alert>
      </Grid>
      <Grid item xs={12}>
        <EnvVarAutocompleteInput
          required
          fullWidth
          name="key"
          label="API Key"
          type="password" // Enables visibility toggle
          value={apiKey}
          onChange={handleApiKeyChange}
          helperText="Get from your CoinMarketCap Pro Dashboard."
          // error={!!validationErrors.key} // Example if passing errors down
          // helperText={validationErrors.key || "Get from your CoinMarketCap Pro Dashboard."}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="symbols"
          label="Symbols (comma-separated)"
          value={symbolsStr}
          onChange={handleSymbolsChange}
          helperText="E.g., BTC, ETH, LTC. Required if Slugs not provided."
          disabled={slugsArray.length > 0} // Disable if slugs are provided
          // error={!!validationErrors.symbols}
          // helperText={validationErrors.symbols || "E.g., BTC, ETH, LTC. Required if Slugs not provided."}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="slugs"
          label="Slugs (comma-separated)"
          value={slugsStr}
          onChange={handleSlugsChange}
          helperText="E.g., bitcoin, ethereum. Takes precedence over Symbols."
          // error={!!validationErrors.slugs}
          // helperText={validationErrors.slugs || "E.g., bitcoin, ethereum. Takes precedence over Symbols."}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="currency"
          label="Currency (Optional)"
          value={currency}
          onChange={handleCurrencyChange}
          helperText="E.g., GBP, EUR (Default: USD)."
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="defaultinterval"
          label="Default Interval (Optional)"
          value={defaultInterval}
          onChange={handleDefaultIntervalChange}
          helperText="E.g., 7d, 1m (Default: 7d)."
        />
      </Grid>
    </Grid>
  );
}

CoinmarketcapWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    key: PropTypes.string,
    currency: PropTypes.string,
    symbols: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]), // Can be array or string from initialData
    slugs: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),   // Can be array or string from initialData
    defaultinterval: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

CoinmarketcapWidgetFields.defaultProps = {
  initialData: null,
};

export default CoinmarketcapWidgetFields;