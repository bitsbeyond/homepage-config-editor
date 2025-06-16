import React, { createContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios'; // Ensure axios is installed: npm install axios

export const MetadataContext = createContext({
  iconMetadata: {},
  loading: true,
  error: null,
});

const METADATA_URL = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/metadata.json';

export const MetadataProvider = ({ children }) => {
  const [iconMetadata, setIconMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const response = await axios.get(METADATA_URL);
        setIconMetadata(response.data || {});
        setError(null);
      } catch (err) {
        console.error('Failed to fetch icon metadata:', err);
        setError(err);
        setIconMetadata({}); // Set to empty object on error
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []); // Fetch only once on component mount

  const contextValue = useMemo(() => ({
    iconMetadata,
    loading,
    error,
  }), [iconMetadata, loading, error]);

  return (
    <MetadataContext.Provider value={contextValue}>
      {children}
    </MetadataContext.Provider>
  );
};

MetadataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};