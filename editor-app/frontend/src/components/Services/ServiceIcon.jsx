import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from '../../contexts/ThemeContext.jsx';
import { MetadataContext } from '../../contexts/MetadataContext.jsx';

const ServiceIcon = ({ iconName, serviceName, size = 32 }) => {
  const { theme } = useContext(ThemeContext);
  console.log('ServiceIcon rendered/re-rendered. Current theme:', theme, 'for icon:', iconName); // Log theme on render
  const { iconMetadata, loading: metadataLoading, error: metadataError } = useContext(MetadataContext);
  
  // Define theme-dependent placeholders first
  const noneIconSrc = theme === 'dark' ? '/none-dark.svg' : '/none.svg';
  const errorIconSrc = theme === 'dark' ? '/error-dark.svg' : '/error.svg';

  // Initialize currentIconSrc. If no iconName, use noneIconSrc. Otherwise, start empty for useEffect to fill.
  const [currentIconSrc, setCurrentIconSrc] = useState(() => {
    if (!iconName) return noneIconSrc;
    return '';
  });
  const [hasError, setHasError] = useState(false);

  const requiresMetadata = iconName ? !(iconName.match(/^(http:\/\/|https:\/\/|\/images\/|mdi-|si-|sh-)/) || iconName.split('.').length > 1) : false;

  useEffect(() => {
    setHasError(false);
    console.log(`ServiceIcon: useEffect triggered. iconName="${iconName}", theme="${theme}", metadataLoading=${metadataLoading}, metadataError=${metadataError}, requiresMetadata=${requiresMetadata}`);

    if (!iconName) {
      // This case is handled by initial state if iconName is null/undefined from props
      // If iconName becomes null later, this will set it.
      if (currentIconSrc !== noneIconSrc) {
        console.log('ServiceIcon: iconName became null/undefined, setting to noneIconSrc.');
        setCurrentIconSrc(noneIconSrc);
      }
      return;
    }

    // If metadata is still loading and the icon type *requires* metadata,
    // currentIconSrc might be '', or already noneIconSrc from a previous run.
    // We want to avoid resolving until metadata is ready for these cases.
    if (metadataLoading && requiresMetadata) {
      console.log(`ServiceIcon: Metadata loading for required icon "${iconName}". Current src: ${currentIconSrc}. Waiting.`);
      // If currentIconSrc is empty, it means we haven't set a placeholder yet for this specific iconName.
      // Set to noneIconSrc to avoid empty string in <img>.
      if (currentIconSrc === '' && iconName) { // Check iconName again to ensure it's not a reset
          setCurrentIconSrc(noneIconSrc);
      }
      return;
    }
    
    // If there was a metadata error and this icon requires metadata, set to error.
    if (metadataError && requiresMetadata) {
        console.log(`ServiceIcon: Metadata error for required icon "${iconName}". Setting to errorIconSrc.`);
        if (currentIconSrc !== errorIconSrc) setCurrentIconSrc(errorIconSrc);
        return;
    }

    let resolvedSrc = '';

    if (iconName.startsWith('http://') || iconName.startsWith('https://')) {
      resolvedSrc = iconName;
    } else if (iconName.startsWith('/images/')) {
      resolvedSrc = `/api/images/view/${iconName.substring(8)}`;
    } else if (iconName.startsWith('mdi-')) {
      const iconIdentifier = iconName.substring(4);
      resolvedSrc = `https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/${iconIdentifier}.svg`;
    } else if (iconName.startsWith('si-')) {
      const iconIdentifier = iconName.substring(3);
      resolvedSrc = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${iconIdentifier}.svg`;
    } else if (iconName.startsWith('sh-')) {
      const baseName = iconName.substring(3).replace(/\.(svg|png|webp)$/, '');
      let extension = 'png';
      if (iconName.endsWith('.svg')) extension = 'svg';
      else if (iconName.endsWith('.webp')) extension = 'webp';
      resolvedSrc = `https://cdn.jsdelivr.net/gh/selfhst/icons@main/${extension}/${baseName}.${extension}`;
    } else { // Needs homarr-labs/dashboard-icons, potentially with metadata
      const parts = iconName.split('.');
      const isPrefixedByThemeInName = iconName.endsWith('-light') || iconName.endsWith('-dark');
      const hasExplicitExtension = parts.length > 1 && !isPrefixedByThemeInName; // e.g. myicon.png, but not github-light

      let nameForMetadataLookup = iconName;
      if (hasExplicitExtension) {
        nameForMetadataLookup = parts.slice(0, -1).join('.');
      } else if (isPrefixedByThemeInName) {
        nameForMetadataLookup = iconName.replace(/-light|-dark$/, '');
      }
      
      let finalIconName = iconName; // The actual filename to use, potentially with -light/-dark
      let type = '';

      if (metadataError && !hasExplicitExtension && !iconName.match(/^(http|mdi-|si-|sh-|\/images\/)/) ) {
        console.log(`ServiceIcon: Metadata error, cannot reliably resolve "${iconName}". Using error icon.`);
        resolvedSrc = errorIconSrc;
      } else if (iconMetadata && iconMetadata[nameForMetadataLookup]) {
        const meta = iconMetadata[nameForMetadataLookup];
        type = meta.base; // e.g., "svg" or "png"
        
        // Check for theme-specific versions from metadata and invert the logic
        if (meta.colors) {
          if (theme === 'dark' && meta.colors.light) { // For dark theme, use the 'light' icon variant from metadata
            finalIconName = meta.colors.light;
          } else if (theme === 'light' && meta.colors.dark) { // For light theme, use the 'dark' icon variant from metadata
            finalIconName = meta.colors.dark;
          } else if (meta.colors[theme]) { // Fallback to direct match if only one is defined matching current theme
            finalIconName = meta.colors[theme];
          } else { // No specific theme variant found or applicable, use base name
            finalIconName = nameForMetadataLookup;
          }
        } else { // No 'colors' object in metadata
           finalIconName = nameForMetadataLookup;
        }
        console.log(`ServiceIcon: Themed icon. Initial name: "${iconName}", nameForMeta: "${nameForMetadataLookup}", theme: "${theme}", finalIconName for URL: "${finalIconName}", type: "${type}"`);
        resolvedSrc = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${type}/${finalIconName}.${type}`;

      } else if (hasExplicitExtension) {
        type = parts[parts.length - 1];
        const baseName = parts.slice(0, -1).join('.');
        resolvedSrc = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${type}/${baseName}.${type}`;
      } else { // No extension, not in metadata
        console.log(`ServiceIcon: Icon "${iconName}" not in metadata and no extension. Attempting .png fallback.`);
        type = 'png';
        resolvedSrc = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${type}/${iconName}.${type}`;
      }
    }

    if (resolvedSrc && resolvedSrc !== currentIconSrc) { // Avoid unnecessary state updates if src is the same
      console.log(`ServiceIcon: Setting currentIconSrc for "${iconName}" to "${resolvedSrc}"`);
      setCurrentIconSrc(resolvedSrc);
    } else if (!resolvedSrc) { // Should ideally not happen if logic is exhaustive
      console.log(`ServiceIcon: No resolvedSrc for "${iconName}", setting to errorIconSrc.`);
      setCurrentIconSrc(errorIconSrc);
    }

  }, [iconName, theme, iconMetadata, metadataLoading, metadataError, noneIconSrc, errorIconSrc, requiresMetadata]);

  const handleError = (e) => {
    console.error(`ServiceIcon: Error loading image src="${e.target.src}". Setting to error icon. HasError already: ${hasError}`);
    if (!hasError) {
        setCurrentIconSrc(errorIconSrc);
        setHasError(true); // Mark that an error occurred for this icon instance
    }
  };

  // Determine initial src before first effect run for non-metadata icons
  let initialDisplaySrc = noneIconSrc;
  if (iconName) {
    if (iconName.startsWith('http://') || iconName.startsWith('https://')) initialDisplaySrc = iconName;
    else if (iconName.startsWith('/images/')) initialDisplaySrc = `/api/images/view/${iconName.substring(8)}`;
    // For other types, wait for useEffect to resolve with metadata if needed
  }


  // Determine the source to display. Default to noneIconSrc if currentIconSrc is not yet set.
  // The useEffect will update currentIconSrc, and this will re-render.
  const displaySrc = currentIconSrc || noneIconSrc;

  // The conditional rendering blocks for loading/initial state are removed,
  // as useEffect should now handle setting currentIconSrc to an appropriate
  // placeholder (noneIconSrc or errorIconSrc) or the resolvedSrc.
  // This simplifies the render return.

  // if (!currentIconSrc && metadataLoading && requiresMetadata) { ... } // Removed
  // if (!currentIconSrc && !iconName) { ... } // Removed

  return (
    <img
      src={displaySrc} // Always use displaySrc which has a fallback
      alt={serviceName ? `${serviceName} icon` : 'Service icon'}
      style={{
        width: `${size}px`,     // Apply size directly to width
        height: `${size}px`,    // Apply size directly to height
        maxWidth: `${size}px`,  // Keep maxWidth as a fallback/constraint
        maxHeight: `${size}px`, // Keep maxHeight as a fallback/constraint
        objectFit: 'contain',
      }}
      onError={handleError}
    />
  );
};

ServiceIcon.propTypes = {
  iconName: PropTypes.string,
  serviceName: PropTypes.string,
  size: PropTypes.number,
};

export default ServiceIcon;