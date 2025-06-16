import React, { createContext, useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

export const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Try to get theme from localStorage or default to 'light'
    const localTheme = localStorage.getItem('appTheme');
    return localTheme || 'light';
  });

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    // You might also want to update a class on the body or html element here
    // document.body.className = theme;
  }, [theme]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};