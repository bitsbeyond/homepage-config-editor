import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react'; // Added lazy, Suspense, useMemo, useCallback
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    FormControl, InputLabel, Select, MenuItem, Box, Typography, IconButton, Alert, CircularProgress // Added CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { apiRequest } from '../../utils/api';

// List of available service widget types (copied from AddServiceForm)
// TODO: Keep this list updated as new widget components are added
const serviceWidgetTypes = [
    'adguard-home', 'apcups', 'argocd', 'atsumeru', 'audiobookshelf', 'authentik', 'autobrr',
    'azuredevops', 'bazarr', 'beszel', 'caddy', 'calendar', 'calibre-web', 'changedetectionio',
    'channelsdvrserver', 'cloudflared', 'coin-market-cap', 'crowdsec', 'customapi', 'deluge',
    'develancacheui', 'diskstation', 'downloadstation', 'emby', 'esphome', 'evcc', 'fileflows',
    'firefly', 'flood', 'freshrss', 'frigate', 'fritzbox', 'gamedig', 'gatus', 'ghostfolio',
    'gitea', 'gitlab', 'glances', 'gluetun', 'gotify', 'grafana', 'hdhomerun', 'headscale',
    'healthchecks', 'homeassistant', 'homebox', 'homebridge', 'iframe', 'immich', 'jackett',
    'jdownloader', 'jellyfin', 'jellyseerr', 'karakeep', 'kavita', 'komga', 'kopia', 'lidarr',
    'linkwarden', 'lubelogger', 'mailcow', 'mastodon', 'mealie', 'medusa', 'mikrotik', 'minecraft',
    'miniflux', 'mjpeg', 'moonraker', 'mylar', 'myspeed', 'navidrome', 'netalertx', 'netdata',
    'nextcloud', 'nextdns', 'npm', 'nzbget', 'octoprint', 'omada', 'ombi',
    'opendtu', 'openmediavault', 'openwrt', 'opnsense', 'overseerr', 'paperlessngx', 'peanut',
    'pfsense', 'photoprism', 'pihole', 'plantit', 'plex-tautulli', 'plex', 'portainer', 'tautulli',
    'prometheus', 'prometheusmetric', 'prowlarr', 'proxmox', 'proxmoxbackupserver', 'pterodactyl',
    'pyload', 'qbittorrent', 'qnap', 'radarr', 'readarr', 'romm', 'rutorrent', 'sabnzbd',
    'scrutiny', 'slskd', 'sonarr', 'speedtest-tracker', 'spoolman', 'stash', 'stocks', 'suwayomi',
    'swagdashboard', 'syncthing-relay-server', 'tailscale', 'tandoor', 'tdarr', 'technitium',
    'traefik', 'transmission', 'truenas', 'tubearchivist', 'unifi', 'unmanic', // Changed 'unifi-controller' to 'unifi' and removed the explicit 'unifi' at the end
    'uptime-kuma', 'uptimerobot', 'urbackup', 'vikunja', 'watchtower', 'wgeasy', 'whatsupdocker',
    'xteve', 'zabbix'
].filter((v, i, a) => a.indexOf(v) === i); // Ensure unique values

// Helper to convert widget type string to component name (copied from AddServiceForm)
const widgetTypeToComponentName = (type) => {
    if (!type) return null;
    return type.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
};

// Map widget types to their lazy loading functions
// IMPORTANT: Keep this map updated as new widget components are added!
const widgetComponentLoaders = {
    'glances': lazy(() => import('../ServiceWidgets/GlancesWidgetFields.jsx')),
    'plex': lazy(() => import('../ServiceWidgets/PlexWidgetFields.jsx')),
    'customapi': lazy(() => import('../ServiceWidgets/CustomApiWidgetFields.jsx')),
    'adguard-home': lazy(() => import('../ServiceWidgets/AdguardWidgetFields.jsx')),
    'pihole': lazy(() => import('../ServiceWidgets/PiholeWidgetFields.jsx')),
    'uptime-kuma': lazy(() => import('../ServiceWidgets/UptimekumaWidgetFields.jsx')),
    'sonarr': lazy(() => import('../ServiceWidgets/SonarrWidgetFields.jsx')),
    'radarr': lazy(() => import('../ServiceWidgets/RadarrWidgetFields.jsx')),
    'lidarr': lazy(() => import('../ServiceWidgets/LidarrWidgetFields.jsx')),
    'readarr': lazy(() => import('../ServiceWidgets/ReadarrWidgetFields.jsx')),
    'prowlarr': lazy(() => import('../ServiceWidgets/ProwlarrWidgetFields.jsx')),
    'transmission': lazy(() => import('../ServiceWidgets/TransmissionWidgetFields.jsx')),
    'qbittorrent': lazy(() => import('../ServiceWidgets/QbittorrentWidgetFields.jsx')),
    'deluge': lazy(() => import('../ServiceWidgets/DelugeWidgetFields.jsx')),
    'sabnzbd': lazy(() => import('../ServiceWidgets/SabnzbdWidgetFields.jsx')),
    'nzbget': lazy(() => import('../ServiceWidgets/NzbgetWidgetFields.jsx')),
    'overseerr': lazy(() => import('../ServiceWidgets/OverseerrWidgetFields.jsx')),
    'jellyfin': lazy(() => import('../ServiceWidgets/JellyfinWidgetFields.jsx')),
    'jellyseerr': lazy(() => import('../ServiceWidgets/JellyseerrWidgetFields.jsx')),
    'bazarr': lazy(() => import('../ServiceWidgets/BazarrWidgetFields.jsx')),
    'ombi': lazy(() => import('../ServiceWidgets/OmbiWidgetFields.jsx')),
    'portainer': lazy(() => import('../ServiceWidgets/PortainerWidgetFields.jsx')),
    'homeassistant': lazy(() => import('../ServiceWidgets/HomeassistantWidgetFields.jsx')),
    'proxmox': lazy(() => import('../ServiceWidgets/ProxmoxWidgetFields.jsx')),
    'tautulli': lazy(() => import('../ServiceWidgets/TautulliWidgetFields.jsx')),
    'watchtower': lazy(() => import('../ServiceWidgets/WatchtowerWidgetFields.jsx')),
    'emby': lazy(() => import('../ServiceWidgets/EmbyWidgetFields.jsx')),
    'tdarr': lazy(() => import('../ServiceWidgets/TdarrWidgetFields.jsx')),
    'unifi': lazy(() => import('../ServiceWidgets/UnifiWidgetFields.jsx')), // Ensure this uses 'unifi'
    'netdata': lazy(() => import('../ServiceWidgets/NetdataWidgetFields.jsx')),
    'prometheus': lazy(() => import('../ServiceWidgets/PrometheusWidgetFields.jsx')),
    'prometheusmetric': lazy(() => import('../ServiceWidgets/PrometheusmetricWidgetFields.jsx')),
    'healthchecks': lazy(() => import('../ServiceWidgets/HealthchecksWidgetFields.jsx')),
    'iframe': lazy(() => import('../ServiceWidgets/IframeWidgetFields.jsx')),
    'mjpeg': lazy(() => import('../ServiceWidgets/MjpegWidgetFields.jsx')),
    'octoprint': lazy(() => import('../ServiceWidgets/OctoprintWidgetFields.jsx')),
    'paperlessngx': lazy(() => import('../ServiceWidgets/PaperlessngxWidgetFields.jsx')),
    'rutorrent': lazy(() => import('../ServiceWidgets/RutorrentWidgetFields.jsx')),
    'diskstation': lazy(() => import('../ServiceWidgets/DiskstationWidgetFields.jsx')),
    'downloadstation': lazy(() => import('../ServiceWidgets/DownloadstationWidgetFields.jsx')),
    'traefik': lazy(() => import('../ServiceWidgets/TraefikWidgetFields.jsx')),
    'nextcloud': lazy(() => import('../ServiceWidgets/NextcloudWidgetFields.jsx')),
    'medusa': lazy(() => import('../ServiceWidgets/MedusaWidgetFields.jsx')),
    'npm': lazy(() => import('../ServiceWidgets/NpmWidgetFields.jsx')),
    'truenas': lazy(() => import('../ServiceWidgets/TruenasWidgetFields.jsx')),
    'unmanic': lazy(() => import('../ServiceWidgets/UnmanicWidgetFields.jsx')),
    'gitea': lazy(() => import('../ServiceWidgets/GiteaWidgetFields.jsx')),
    'gitlab': lazy(() => import('../ServiceWidgets/GitlabWidgetFields.jsx')),
    'jackett': lazy(() => import('../ServiceWidgets/JackettWidgetFields.jsx')),
    'miniflux': lazy(() => import('../ServiceWidgets/MinifluxWidgetFields.jsx')),
    'navidrome': lazy(() => import('../ServiceWidgets/NavidromeWidgetFields.jsx')),
    'mylar': lazy(() => import('../ServiceWidgets/MylarWidgetFields.jsx')),
    'flood': lazy(() => import('../ServiceWidgets/FloodWidgetFields.jsx')),
    'grafana': lazy(() => import('../ServiceWidgets/GrafanaWidgetFields.jsx')),
    'audiobookshelf': lazy(() => import('../ServiceWidgets/AudiobookshelfWidgetFields.jsx')),
    'gotify': lazy(() => import('../ServiceWidgets/GotifyWidgetFields.jsx')),
    'authentik': lazy(() => import('../ServiceWidgets/AuthentikWidgetFields.jsx')),
    'pyload': lazy(() => import('../ServiceWidgets/PyloadWidgetFields.jsx')),
    'scrutiny': lazy(() => import('../ServiceWidgets/ScrutinyWidgetFields.jsx')),
    'speedtest-tracker': lazy(() => import('../ServiceWidgets/SpeedtestWidgetFields.jsx')),
    'syncthing-relay-server': lazy(() => import('../ServiceWidgets/StrelaysrvWidgetFields.jsx')),
    'uptimerobot': lazy(() => import('../ServiceWidgets/UptimerobotWidgetFields.jsx')),
    'openmediavault': lazy(() => import('../ServiceWidgets/OpenmediavaultWidgetFields.jsx')), // Added openmediavault
    'apcups': lazy(() => import('../ServiceWidgets/ApcupsWidgetFields.jsx')),
    'argocd': lazy(() => import('../ServiceWidgets/ArgocdWidgetFields.jsx')),
    'atsumeru': lazy(() => import('../ServiceWidgets/AtsumeruWidgetFields.jsx')),
    'autobrr': lazy(() => import('../ServiceWidgets/AutobrrWidgetFields.jsx')),
    'azuredevops': lazy(() => import('../ServiceWidgets/AzureDevopsWidgetFields.jsx')), // Added azuredevops
    'beszel': lazy(() => import('../ServiceWidgets/BeszelWidgetFields.jsx')), // Added beszel
    'caddy': lazy(() => import('../ServiceWidgets/CaddyWidgetFields.jsx')), // Added caddy
    'calibre-web': lazy(() => import('../ServiceWidgets/CalibreWebWidgetFields.jsx')), // Added calibre-web
    'changedetectionio': lazy(() => import('../ServiceWidgets/ChangedetectionioWidgetFields.jsx')), // Added changedetectionio
    'channelsdvrserver': lazy(() => import('../ServiceWidgets/ChannelsdvrserverWidgetFields.jsx')), // Added channelsdvrserver
    'cloudflared': lazy(() => import('../ServiceWidgets/CloudflaredWidgetFields.jsx')), // Added cloudflared
    'coin-market-cap': lazy(() => import('../ServiceWidgets/CoinmarketcapWidgetFields.jsx')), // Corrected key for coinmarketcap
    'crowdsec': lazy(() => import('../ServiceWidgets/CrowdsecWidgetFields.jsx')), // Added crowdsec
    'develancacheui': lazy(() => import('../ServiceWidgets/DevelancacheuiWidgetFields.jsx')), // Added develancacheui
    'esphome': lazy(() => import('../ServiceWidgets/EsphomeWidgetFields.jsx')), // Added esphome
    'evcc': lazy(() => import('../ServiceWidgets/EvccWidgetFields.jsx')), // Added evcc
    'fileflows': lazy(() => import('../ServiceWidgets/FileflowsWidgetFields.jsx')), // Added fileflows
    'firefly': lazy(() => import('../ServiceWidgets/FireflyWidgetFields.jsx')), // Added firefly
    'freshrss': lazy(() => import('../ServiceWidgets/FreshrssWidgetFields.jsx')), // Added freshrss
    'frigate': lazy(() => import('../ServiceWidgets/FrigateWidgetFields.jsx')), // Added frigate
    'fritzbox': lazy(() => import('../ServiceWidgets/FritzboxWidgetFields.jsx')), // Added fritzbox
    'gamedig': lazy(() => import('../ServiceWidgets/GamedigWidgetFields.jsx')), // Added gamedig
    'gatus': lazy(() => import('../ServiceWidgets/GatusWidgetFields.jsx')), // Added gatus
    'ghostfolio': lazy(() => import('../ServiceWidgets/GhostfolioWidgetFields.jsx')), // Added ghostfolio
    'gluetun': lazy(() => import('../ServiceWidgets/GluetunWidgetFields.jsx')), // Added gluetun
    'hdhomerun': lazy(() => import('../ServiceWidgets/HdhomerunWidgetFields.jsx')), // Added hdhomerun
    'headscale': lazy(() => import('../ServiceWidgets/HeadscaleWidgetFields.jsx')), // Added headscale
    'homebox': lazy(() => import('../ServiceWidgets/HomeboxWidgetFields.jsx')), // Added homebox
    'homebridge': lazy(() => import('../ServiceWidgets/HomebridgeWidgetFields.jsx')), // Added homebridge
    'immich': lazy(() => import('../ServiceWidgets/ImmichWidgetFields.jsx')), // Added immich
    'jdownloader': lazy(() => import('../ServiceWidgets/JdownloaderWidgetFields.jsx')), // Added jdownloader
    'karakeep': lazy(() => import('../ServiceWidgets/KarakeepWidgetFields.jsx')), // Added karakeep
    'kavita': lazy(() => import('../ServiceWidgets/KavitaWidgetFields.jsx')), // Added kavita
    'komga': lazy(() => import('../ServiceWidgets/KomgaWidgetFields.jsx')), // Added komga
    'kopia': lazy(() => import('../ServiceWidgets/KopiaWidgetFields.jsx')), // Added kopia
    'linkwarden': lazy(() => import('../ServiceWidgets/LinkwardenWidgetFields.jsx')), // Added linkwarden
    'lubelogger': lazy(() => import('../ServiceWidgets/LubeLoggerWidgetFields.jsx')), // Added lubelogger
    'mailcow': lazy(() => import('../ServiceWidgets/MailcowWidgetFields.jsx')), // Added mailcow
    'mastodon': lazy(() => import('../ServiceWidgets/MastodonWidgetFields.jsx')), // Added mastodon
    'mealie': lazy(() => import('../ServiceWidgets/MealieWidgetFields.jsx')), // Added mealie
    'mikrotik': lazy(() => import('../ServiceWidgets/MikrotikWidgetFields.jsx')), // Added mikrotik
    'minecraft': lazy(() => import('../ServiceWidgets/MinecraftWidgetFields.jsx')), // Added minecraft
    'moonraker': lazy(() => import('../ServiceWidgets/MoonrakerWidgetFields.jsx')), // Added moonraker
    'myspeed': lazy(() => import('../ServiceWidgets/MyspeedWidgetFields.jsx')), // Added myspeed
    'netalertx': lazy(() => import('../ServiceWidgets/NetalertxWidgetFields.jsx')), // Added netalertx
    'nextdns': lazy(() => import('../ServiceWidgets/NextdnsWidgetFields.jsx')), // Added nextdns
    'omada': lazy(() => import('../ServiceWidgets/OmadaWidgetFields.jsx')), // Added omada
    'opendtu': lazy(() => import('../ServiceWidgets/OpendtuWidgetFields.jsx')), // Added opendtu
    'openwrt': lazy(() => import('../ServiceWidgets/OpenwrtWidgetFields.jsx')), // Added openwrt
    'opnsense': lazy(() => import('../ServiceWidgets/OpnsenseWidgetFields.jsx')), // Added opnsense
    'peanut': lazy(() => import('../ServiceWidgets/PeanutWidgetFields.jsx')), // Added peanut
    'pfsense': lazy(() => import('../ServiceWidgets/PfsenseWidgetFields.jsx')), // Added pfsense
    'photoprism': lazy(() => import('../ServiceWidgets/PhotoprismWidgetFields.jsx')), // Added photoprism
    'plantit': lazy(() => import('../ServiceWidgets/PlantitWidgetFields.jsx')), // Added plantit
    'proxmoxbackupserver': lazy(() => import('../ServiceWidgets/ProxmoxbackupserverWidgetFields.jsx')), // Added proxmoxbackupserver
    'pterodactyl': lazy(() => import('../ServiceWidgets/PterodactylWidgetFields.jsx')), // Added pterodactyl
    'qnap': lazy(() => import('../ServiceWidgets/QnapWidgetFields.jsx')), // Added qnap
    'romm': lazy(() => import('../ServiceWidgets/RommWidgetFields.jsx')), // Added romm
    'slskd': lazy(() => import('../ServiceWidgets/SlskdWidgetFields.jsx')), // Added slskd
    'spoolman': lazy(() => import('../ServiceWidgets/SpoolmanWidgetFields.jsx')), // Added spoolman
    'stash': lazy(() => import('../ServiceWidgets/StashWidgetFields.jsx')), // Added stash
    'suwayomi': lazy(() => import('../ServiceWidgets/SuwayomiWidgetFields.jsx')), // Added suwayomi
    'swagdashboard': lazy(() => import('../ServiceWidgets/SwagdashboardWidgetFields.jsx')), // Added swagdashboard
    'tailscale': lazy(() => import('../ServiceWidgets/TailscaleWidgetFields.jsx')), // Added tailscale
    'tandoor': lazy(() => import('../ServiceWidgets/TandoorWidgetFields.jsx')), // Added tandoor
    'technitium': lazy(() => import('../ServiceWidgets/TechnitiumWidgetFields.jsx')), // Added technitium
    'tubearchivist': lazy(() => import('../ServiceWidgets/TubearchivistWidgetFields.jsx')), // Added tubearchivist
    'urbackup': lazy(() => import('../ServiceWidgets/UrbackupWidgetFields.jsx')), // Added urbackup
    'vikunja': lazy(() => import('../ServiceWidgets/VikunjaWidgetFields.jsx')), // Added vikunja
    'stocks': lazy(() => import('../ServiceWidgets/StocksWidgetFields.jsx')), // Added stocks
    'wgeasy': lazy(() => import('../ServiceWidgets/WgeasyWidgetFields.jsx')), // Added wgeasy
    'whatsupdocker': lazy(() => import('../ServiceWidgets/WhatsupdockerWidgetFields.jsx')), // Added whatsupdocker
    'xteve': lazy(() => import('../ServiceWidgets/XteveWidgetFields.jsx')), // Added xteve
    'zabbix': lazy(() => import('../ServiceWidgets/ZabbixWidgetFields.jsx')), // Added zabbix
    // Add other widget types here as they are implemented
};


// This form is very similar to AddServiceForm, but pre-fills fields
// and handles updating an existing service entry.

function EditServiceForm({ open, onClose, onServiceUpdated, serviceToEdit, currentServiceGroupsData = {} }) { // Changed prop name and default
    // State for form fields
    const [groupName, setGroupName] = useState('');
    const [isNewGroup, setIsNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [href, setHref] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('');
    const [widgetType, setWidgetType] = useState(''); // State for selected widget type
    const [widgetData, setWidgetData] = useState(null); // State for widget-specific data
    const [widgetFieldErrors, setWidgetFieldErrors] = useState({}); // State for widget-specific field errors

    // State for component logic
    const [originalGroupName, setOriginalGroupName] = useState(''); // To find the service later
    const [originalServiceName, setOriginalServiceName] = useState(''); // To find the service later
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the correct lazy-loaded component based on the selected type
    const WidgetFieldsComponent = useMemo(() => {
        if (!widgetType || !widgetComponentLoaders[widgetType]) {
             if (widgetType) {
                 console.warn(`No component loader found for widget type: ${widgetType}`);
             }
            return null;
        }
        return widgetComponentLoaders[widgetType];
    }, [widgetType]);


    // Effect to populate form when serviceToEdit prop changes
    useEffect(() => {
        if (serviceToEdit) {
            const { group, name, details } = serviceToEdit;
            setOriginalGroupName(group || ''); // Store original group for update logic
            setOriginalServiceName(name || ''); // Store original name for update logic

            setGroupName(group || '');
            setServiceName(name || '');
            setHref(details?.href || '');
            setDescription(details?.description || '');
            setIcon(details?.icon || '');

            // Populate widget state
            const currentWidget = details?.widget;
            let formWidgetType = currentWidget?.type || ''; // This will be 'unifi' from YAML

            // Map specific backend types to frontend dropdown values ONLY IF NECESSARY
            // Example: Adguard mapping
            if (formWidgetType === 'adguard') {
                formWidgetType = 'adguard-home';
            } else if (formWidgetType === 'unifi-controller') { // Map 'unifi-controller' from YAML to 'unifi' for dropdown
                formWidgetType = 'unifi';
            } else if (formWidgetType === 'calibreweb') { // Map 'calibreweb' from YAML to 'calibre-web' for dropdown
                formWidgetType = 'calibre-web';
            }

            setWidgetType(formWidgetType);
            setWidgetData(currentWidget || null);

            setIsNewGroup(false); // Reset group creation toggle
            setNewGroupName('');
            setError(''); // Clear previous errors
            setWidgetFieldErrors({}); // Clear widget errors
        } else {
             // Reset all fields if serviceToEdit becomes null (e.g., dialog closed and reopened without selection)
            setOriginalGroupName('');
            setOriginalServiceName('');
            setGroupName('');
            setServiceName('');
            setHref('');
            setDescription('');
            setIcon('');
            setWidgetType('');
            setWidgetData(null);
            setIsNewGroup(false);
            setNewGroupName('');
            setError('');
            setWidgetFieldErrors({});
        }
    }, [serviceToEdit]); // Rerun when the service to edit changes

    // Callback for widget components to update widget data and errors
    const handleWidgetDataChange = useCallback((newData, errors = {}) => {
        setWidgetData(newData);
        setWidgetFieldErrors(errors);
    }, []); // setWidgetData and setWidgetFieldErrors are stable

    const handleClose = () => {
        if (loading) return;
        // Don't reset fields here immediately, let useEffect handle it if a new service is selected
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        const finalGroupName = isNewGroup ? newGroupName.trim() : groupName;
        const finalServiceName = serviceName.trim();

        // --- Basic Validation ---
        if (!finalServiceName) {
            setError('Service Name is required.');
            setLoading(false);
            return;
        }
        if (isNewGroup && !newGroupName.trim()) {
            setError('New Group Name cannot be empty if selected.');
            setLoading(false);
            return;
        }
        // --- End Validation ---

        // Prepare widget data, converting stocks watchlist string to array
        let finalWidgetData = widgetData;
        if (widgetType === 'stocks' && widgetData?.watchlist && typeof widgetData.watchlist === 'string') {
            const watchlistArray = widgetData.watchlist.split(',').map(item => item.trim()).filter(item => item);
            finalWidgetData = { ...widgetData, watchlist: watchlistArray };
        }

        // Widget-specific required field validation (now handled by child components)
        // if (widgetType) { // Only validate widget fields if a widget is selected
        //     // Example of old parent-level validation:
        //     // if (widgetType === 'cloudflared') {
        //     //     if (!finalWidgetData?.accountid?.trim() || !finalWidgetData?.tunnelid?.trim() || !finalWidgetData?.key?.trim()) {
        //     //         setError('For Cloudflared widget, Account ID, Tunnel ID, and API Token are required.');
        //     //         setLoading(false);
        //     //         return;
        //     //     }
        //     // } else if (widgetType === 'unifi') {
        //     //      if (!finalWidgetData?.url?.trim()) {
        //     //         setError('For Unifi widget, the URL is required.');
        //     //         setLoading(false);
        //     //         return;
        //     //     }
        //     // }
        //     // Add other widget-specific validations here as needed...
        // }
        // The save button is already disabled if widgetFieldErrors has entries.
        // No further explicit checks needed here if children report errors correctly.

        // Construct the updated service object
        const updatedServiceDetails = {
            ...(href.trim() && { href: href.trim() }),
            ...(description.trim() && { description: description.trim() }),
            ...(icon.trim() && { icon: icon.trim() }),
            // Add widget data if a type is selected and data exists
            ...(widgetType && finalWidgetData && { widget: finalWidgetData }), // Use processed widget data
        };

        // Create a deep copy of the current groups data (which is an object: { groupName: [services] })
        const updatedGroupsDataObject = JSON.parse(JSON.stringify(currentServiceGroupsData));

        const targetGroupName = finalGroupName || ""; // Use "" for Ungrouped (empty string key)
        const newServiceEntry = { [finalServiceName]: updatedServiceDetails }; // { "NewServiceName": {details} }

        // Remove the original service from its original group
        if (updatedGroupsDataObject[originalGroupName]) {
            updatedGroupsDataObject[originalGroupName] = updatedGroupsDataObject[originalGroupName].filter(
                service => {
                    // Check if 'service' is a DND-transformed item or a direct service entry
                    if (service && typeof service === 'object' && typeof service.name === 'string' && service.originalData) {
                        // It's a DND item, compare its name
                        return service.name !== originalServiceName;
                    } else if (service && typeof service === 'object') {
                        // It's a direct service entry { "ServiceName": {...} }
                        return Object.keys(service)[0] !== originalServiceName;
                    }
                    return true; // Should not happen if data is consistent
                }
            );
            // If the original group is now empty and it's not the 'Ungrouped' group, remove the group key
            if (updatedGroupsDataObject[originalGroupName].length === 0 && originalGroupName !== "") {
                delete updatedGroupsDataObject[originalGroupName];
            }
        } else {
            console.warn(`Original group '${originalGroupName}' not found during edit. This might happen if it was deleted concurrently.`);
        }

        // Add the (potentially renamed or modified) service to the target group
        if (!updatedGroupsDataObject[targetGroupName]) {
            updatedGroupsDataObject[targetGroupName] = []; // Create group if it doesn't exist
        }
        updatedGroupsDataObject[targetGroupName].push(newServiceEntry);


        // Convert the updated object back to an array of group objects for the API
        const finalDataToSave = Object.entries(updatedGroupsDataObject).map(([groupKey, groupItemsArray]) => {
            const mappedGroupItems = groupItemsArray.map(item => {
                // If item is from DND structure (has 'originalData' and 'id' properties at its top level)
                // The edited item (newServiceEntry) will be { "ServiceName": {details} } and won't have 'id' or 'originalData' at its top level.
                if (item && typeof item === 'object' && item.originalData && typeof item.id === 'string') {
                    return item.originalData; // Use the original, schema-compliant data
                }
                // Otherwise, it's the edited item already in the correct format, or an item that was somehow already correct.
                return item;
            });
            return { [groupKey]: mappedGroupItems };
        });

        console.log("Submitting updated service groups (Edit):", finalDataToSave);

        try {
            // Call the API with the *entire* updated service groups array
            await apiRequest('/api/services', {
                method: 'POST',
                body: JSON.stringify(finalDataToSave),
            });
            onServiceUpdated(); // Notify parent component to refresh
            handleClose(); // Close dialog on success
        } catch (err) {
            console.error("Failed to update service:", err);
            setError(err.data?.error || err.message || 'Failed to update service.');
            // TODO: Consider reverting local state changes if API call fails? More complex.
        } finally {
            setLoading(false);
        }
    };

    // Get existing group names for the dropdown from the object keys
    const existingGroupNames = Object.keys(currentServiceGroupsData)
        .filter(name => name !== ""); // Exclude 'Ungrouped' (empty string key)

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Edit Service: {originalServiceName}
                <IconButton aria-label="close" onClick={handleClose} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box component="form" id="edit-service-form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    {/* Group Selection/Creation */}
                    <FormControl fullWidth margin="normal" disabled={loading}>
                        <InputLabel id="group-select-label">Group</InputLabel>
                        <Select
                            labelId="group-select-label"
                            id="group-select"
                            value={isNewGroup ? '__NEW_GROUP__' : groupName}
                            label="Group"
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '__NEW_GROUP__') {
                                    setIsNewGroup(true);
                                    setGroupName(''); // Clear selection if switching to new group
                                } else {
                                    setIsNewGroup(false);
                                    setGroupName(value);
                                }
                            }}
                        >
                            <MenuItem value=""><em>Ungrouped</em></MenuItem>
                            {existingGroupNames.map((name) => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                            <MenuItem value="__NEW_GROUP__"><em>-- Create New Group --</em></MenuItem>
                        </Select>
                    </FormControl>

                    {isNewGroup && (
                        <TextField
                            margin="dense"
                            required
                            fullWidth
                            id="newGroupName"
                            label="New Group Name"
                            name="newGroupName"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    )}

                    {/* Service Details */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="serviceName"
                        label="Service Name"
                        name="serviceName"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        disabled={loading}
                        autoFocus={!isNewGroup}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="href"
                        label="URL (href)"
                        name="href"
                        value={href}
                        onChange={(e) => setHref(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="description"
                        label="Description"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="icon"
                        label="Icon (e.g., 'fas fa-cloud' or 'si-plex')"
                        name="icon"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        disabled={loading}
                        helperText="Find icons at FontAwesome or Simple Icons"
                    />

                    {/* --- Widget Selection --- */}
                    <FormControl fullWidth margin="normal" disabled={loading}>
                        <InputLabel id="widget-type-select-label">Widget Type (Optional)</InputLabel>
                        <Select
                            labelId="widget-type-select-label"
                            id="widget-type-select"
                            value={widgetType}
                            label="Widget Type (Optional)"
                            onChange={(e) => {
                                const newType = e.target.value;
                                setWidgetType(newType);
                                // Reset widget data when type changes, but keep the type
                                setWidgetData(newType ? { type: newType } : null);
                            }}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {serviceWidgetTypes.sort().map((type) => ( // Sort alphabetically
                                <MenuItem key={type} value={type}>
                                    {widgetTypeToComponentName(type)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* --- Dynamically Rendered Widget Fields --- */}
                    {WidgetFieldsComponent && (
                        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}>
                            <WidgetFieldsComponent
                                key={widgetType || 'no-widget'} // Add key based on type, handle empty type
                                initialData={widgetData || { type: widgetType }} // Pass prop as "initialData"
                                onChange={handleWidgetDataChange}
                            />
                        </Suspense>
                    )}
                    {/* --- End Widget Section --- */}


                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
                <Button onClick={handleClose} disabled={loading}>Cancel</Button>
                <Button
                    type="submit"
                    form="edit-service-form" // Link button to the form
                    variant="contained"
                    disabled={
                        loading ||
                        !serviceName ||
                        (isNewGroup && !newGroupName.trim()) ||
                        Object.keys(widgetFieldErrors).length > 0
                    }
                >
                    {loading ? 'Saving...' : (Object.keys(widgetFieldErrors).length > 0 ? 'Fix Widget Errors' : 'Save Changes')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditServiceForm;