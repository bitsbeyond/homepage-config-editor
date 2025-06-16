import React, { useState, useMemo, useEffect, useContext } from 'react'; // Added useContext
import {
  BrowserRouter as Router,
  Routes,
  Route,                  // Import Route
  Navigate,               // Import Navigate for redirection
  Link as RouterLink,     // Import Link and alias it
  useLocation,            // Import useLocation
  useNavigate             // Import useNavigate
} from 'react-router-dom';
import { SnackbarProvider } from 'notistack'; // Import SnackbarProvider
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  ThemeProvider,
  createTheme,
  IconButton,
  CircularProgress, // Import CircularProgress for loading
  GlobalStyles // Import GlobalStyles
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewListIcon from '@mui/icons-material/ViewList';
import ConstructionIcon from '@mui/icons-material/Construction';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LowPriorityIcon from '@mui/icons-material/LowPriority'; // Icon for item reordering
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Icon for Env Vars
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'; // Icon for Help
import SwapVertIcon from '@mui/icons-material/SwapVert'; // Icon for Group Reorder
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'; // Icon for Image Management
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Icon for Profile Settings
// Removed ListAltIcon as InfoWidgetOrderPage is being removed

// Import Auth components
import LoginPage from './components/Auth/LoginPage';
import InitialSetupPage from './components/Auth/InitialSetupPage';
import { apiRequest, getAccessToken, setAccessToken, clearAccessToken } from './utils/api';
import { ThemeContext as AppThemeContext } from './contexts/ThemeContext';

import ServiceListPage from './components/Services/ServiceListPage';

// Placeholder components for main sections (excluding Services)
const PlaceholderComponent = ({ title }) => (
  <Typography variant="h4" component="h1" gutterBottom>{title}</Typography>
);
import BookmarkListPage from './components/Bookmarks/BookmarkListPage';
import WidgetListPage from './components/Widgets/WidgetListPage';
import SettingsPage from './components/Settings/SettingsPage'; // Import the new component
import GroupLayoutPage from './components/Settings/GroupLayoutPage'; // Import the new layout page
// import ItemOrderPage from './components/Settings/ItemOrderPage'; // This line was already correctly commented
import RawEditorPage from './components/RawEditor/RawEditorPage'; // Import the actual component
import EnvVarsPage from './components/EnvVars/EnvVarsPage'; // Import the new Env Vars page
import HelpPage from './components/HelpPage/HelpPage'; // Import the Help page component
import ImageManagementPage from './components/ImageManagement/ImageManagementPage'; // Import the Image Management page
import ProfileSettingsPage from './components/ProfileSettings/ProfileSettingsPage'; // Import Profile Settings page
// Removed InfoWidgetOrderPage import
const UserManagementPage = () => <PlaceholderComponent title="User Management" />; // Placeholder for Admin

// --- Theme Setup (Basic) ---
// We'll enhance this later for dynamic switching
const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const drawerWidth = 240;

// --- Main App Component ---
function AppContent() {
  const location = useLocation();
  const { theme: mode, setTheme } = useContext(AppThemeContext); // Use our ThemeContext
  const [mobileOpen, setMobileOpen] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Actual auth status
  const [authLoading, setAuthLoading] = useState(true); // Loading initial auth/setup status
  const [currentUser, setCurrentUser] = useState(null); // Store user info { email, role }
  const navigate = useNavigate(); // Hook for programmatic navigation
  // --- Theme ---
  const currentTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  // Function to toggle theme mode
  const toggleTheme = () => {
    setTheme((prevMode) => (prevMode === 'light' ? 'dark' : 'light')); // Call setTheme from our context
  };

  // --- Auth & Setup Status Check ---
  useEffect(() => {
    const checkInitialStatus = async () => {
      setAuthLoading(true);
      try {
        // 1. Check setup status
        const setupStatusResponse = await apiRequest('/api/setup/status');
        const setupNeeded = setupStatusResponse.needsSetup;
        setNeedsSetup(setupNeeded);

        // 2. If setup is done, check authentication status
        if (!setupNeeded) {
          // Try to refresh access token using refresh token cookie
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include'
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setAccessToken(refreshData.accessToken);
              
              // Now verify the new access token
              const authStatusResponse = await apiRequest('/api/auth/status');
              if (authStatusResponse.loggedIn) {
                setIsAuthenticated(true);
                setCurrentUser(authStatusResponse.user);
                console.log('Authentication restored via refresh token');
              } else {
                setIsAuthenticated(false);
                setCurrentUser(null);
              }
            } else {
              // No valid refresh token - user needs to log in
              console.log('No valid refresh token found - user needs to log in');
              setIsAuthenticated(false);
              setCurrentUser(null);
            }
          } catch (authError) {
            console.log('Authentication check failed:', authError.message);
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        } else {
          // If setup is needed, user cannot be authenticated yet
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error checking initial status:", error);
        // Handle potential errors (e.g., backend down) - maybe show an error message?
        // For now, assume setup needed or not logged in if checks fail
        setNeedsSetup(true); // Default to setup needed on error? Or show error page?
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkInitialStatus();
  }, []); // Run only once on initial mount

  // --- Handlers ---
  // Called by LoginPage on successful login
  const handleLogin = (userData) => {
    console.log("Login successful:", userData);
    setIsAuthenticated(true);
    setCurrentUser(userData); // Store user info from login response
    setNeedsSetup(false); // Should already be false if login was possible
    // Navigation is handled by PublicRoute redirecting away from /login
  };

  // Called by InitialSetupPage on successful setup
  const handleSetupComplete = () => {
    console.log("Setup complete");
    setNeedsSetup(false);
    setIsAuthenticated(false); // User needs to log in after setup
    setCurrentUser(null);
    navigate('/login'); // Explicitly navigate to login after setup
  };

   const handleLogout = async () => {
    console.log("Logout");
    try {
      // Call backend logout endpoint to invalidate refresh token
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error("Logout API call failed:", e);
      // Continue with logout even if API call fails
    }
    
    // Clear access token from memory
    clearAccessToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Navigation is handled by ProtectedRoute redirecting away from protected areas
  };

  // --- Drawer ---

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Placeholder navigation items
  // Define drawer items - adjust based on actual sections later
  const drawerItems = useMemo(() => [
    { text: 'Services', icon: <ViewListIcon />, path: '/services' },
    { text: 'Bookmarks', icon: <ViewListIcon />, path: '/bookmarks' },
    { text: 'Info Widgets', icon: <ViewListIcon />, path: '/widgets' },
    { text: 'Group Reorder', icon: <SwapVertIcon />, path: '/settings/layout' }, // Added Group Layout link
    // { text: 'Bookmark Reorder', icon: <LowPriorityIcon />, path: '/settings/item-order' }, // Commented out
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Raw Editor', icon: <ConstructionIcon />, path: '/raw-editor' },
    { text: 'Env Variables', icon: <VpnKeyIcon />, path: '/env-vars' }, // Added Env Vars link
    { text: 'Manage Images', icon: <PhotoLibraryIcon />, path: '/image-management' }, // Added Image Management link
    // { text: 'Info Widget Order', icon: <ListAltIcon />, path: '/info-widget-order' }, // Removed Info Widget Order link
    { text: 'Help', icon: <HelpOutlineIcon />, path: '/help' }, // Added Help link
    // { text: 'Profile Settings', icon: <AccountCircleIcon />, path: '/profile-settings' }, // REMOVED from drawer
    // TODO: Add User Management link conditionally for Admins
  ], []);

  const editorVersion = import.meta.env.VITE_APP_VERSION || "0.0.0";
  const supportedHomepageVersion = import.meta.env.VITE_HOMEPAGE_COMPATIBLE_VERSION || "N/A";

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={(theme) => ({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1,
        height: '64px', /* Match Toolbar height */
        backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : 'transparent',
      })}>
        <img src="/favicon.svg" alt="Homepage Editor Logo" style={{ height: '48px', width: '48px' }} />
      </Box>
      <List sx={{ flexGrow: 1 }}> {/* Allow list to take available space */}
        {drawerItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, mt: 'auto', borderTop: 1, borderColor: 'divider' }}> {/* Version info at the bottom */}
        <Typography variant="caption" display="block" gutterBottom>
          Editor Version: {editorVersion}
        </Typography>
        <Typography variant="caption" display="block">
          Homepage Compatible: {supportedHomepageVersion}
        </Typography>
      </Box>
    </Box>
  );

  // --- Protected Route Component ---
  // Wraps routes that require authentication
  const ProtectedRoute = ({ children }) => {
    if (authLoading || needsSetup === null) {
      return ( // Show loading indicator while checking auth/setup status
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    if (needsSetup) {
      return <Navigate to="/setup" replace />; // Redirect to setup if needed
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />; // Redirect to login if not authenticated
    }
    return children; // Render the protected content if authenticated and setup is done
  };

  // --- Public Route Component ---
  // Handles routes like Login and Setup
  const PublicRoute = ({ children, type }) => {
     if (authLoading || needsSetup === null) {
      return ( // Show loading indicator
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    // If setup is needed, only allow access to the setup page
    if (needsSetup && type !== 'setup') {
        return <Navigate to="/setup" replace />;
    }
    // If setup is done and user is authenticated, redirect away from login/setup
    if (!needsSetup && isAuthenticated) {
        return <Navigate to="/" replace />; // Redirect to dashboard/home
    }
    // Otherwise, render the public page (Login or Setup)
    return children;
  };

  // --- Main Authenticated App Layout Component ---
  const MainLayout = () => (
    // Ensure the top-level flex container fills viewport height
    <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Removed width: '100%' */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          {/* TODO: Add Menu Icon for mobile drawer toggle */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Homepage Editor
          </Typography>
          <IconButton
           sx={{ ml: 1 }}
           onClick={() => navigate('/profile-settings')}
           color="inherit"
           title="Profile Settings"
          >
           <AccountCircleIcon />
          </IconButton>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit" title="Toggle light/dark theme">
            {currentTheme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton sx={{ ml: 1 }} onClick={handleLogout} color="inherit" title="Logout">
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation drawer"
      >
        {/* Temporary Drawer for mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Permanent Drawer for desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        // Flex column, grow, ensure minHeight 0 for shrinking. Add padding back.
        // Re-add explicit width calculation.
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }, // Re-added explicit width calculation
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Ensure it can shrink
          overflowY: 'auto', // ADDED: Allow vertical scrolling within the main content area
        }}
      >
        <Toolbar /> {/* Spacer - stays at top */}
        {/* --- Nested Routes for Authenticated Content --- */}
        {/* Remove the extra wrapper Box, let Routes render directly */}
        {/* The matched page component (e.g., RawEditorPage) needs flexGrow: 1 */}
        <Routes>
          <Route index element={<Navigate to="/services" replace />} /> {/* Default route */}
          <Route path="/services" element={<ServiceListPage />} /> {/* Use the actual component */}
          <Route path="/bookmarks" element={<BookmarkListPage />} /> {/* Use the actual component */}
          <Route path="/widgets" element={<WidgetListPage />} /> {/* Use the actual component */}
          <Route path="/settings" element={<SettingsPage />} /> {/* Use the actual component */}
          <Route path="/settings/layout" element={<GroupLayoutPage />} /> {/* Added route for Group Layout */}
          {/* <Route path="/settings/item-order" element={<ItemOrderPage />} /> */}{/* This line was already correctly commented */}
          <Route path="/raw-editor" element={<RawEditorPage />} />
          <Route path="/env-vars" element={<EnvVarsPage />} /> {/* Added route for Env Vars */}
          <Route path="/image-management" element={<ImageManagementPage />} /> {/* Added route for Image Management */}
          {/* <Route path="/info-widget-order" element={<InfoWidgetOrderPage />} /> */}{/* Removed route for Info Widget Order Page */}
          <Route path="/help" element={<HelpPage />} /> {/* Added route for Help Page */}
          <Route path="/profile-settings" element={<ProfileSettingsPage />} /> {/* Added route for Profile Settings Page */}
          {/* TODO: Add admin-only route for User Management */}
          {/* <Route path="/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} /> */}
          <Route path="*" element={<Navigate to="/services" replace />} /> {/* Fallback */}
          </Routes>
        {/* Removed wrapper Box */}
      </Box>
    </Box>
  );

  // --- Render Logic with Router ---
  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}> {/* Wrap Routes */}
        <Routes>
          <Route
            path="/setup"
          element={
            <PublicRoute type="setup">
              <InitialSetupPage onSetupComplete={handleSetupComplete} />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute type="login">
              <LoginPage onLogin={handleLogin} />
            </PublicRoute>
          }
        />
        <Route
          path="/*" // All other routes are protected
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
          />
        </Routes>
      </SnackbarProvider> {/* Close SnackbarProvider */}
    </ThemeProvider>
  );
}

// Define the global styles more explicitly
const globalStyles = (
  <GlobalStyles
    styles={{
      '*': { // Apply border-box to all elements
        boxSizing: 'border-box',
      },
      'html, body': {
        height: '100%', // Ensure html and body take full height
        width: '100%', // Ensure html and body take full width
        margin: 0,
        padding: 0,
        // overflow: 'hidden', // REMOVED: Allow body scroll if needed, main content handles its own
      },
      '#root': {
        height: '100%', // Make root fill the body
        width: '100%',
        display: 'flex', // Use flexbox for root
        flexDirection: 'column',
      },
      // Remove the .full-height-container class, rely on #root styling
    }}
  />
);


// Wrap AppContent with Router and ensure root container takes height
function App() {
  return (
    <Router>
      {globalStyles} {/* Apply global styles */}
      {/* AppContent will now render directly into #root which has flex column */}
      <AppContent />
      {/* Removed the extra Box wrapper */}
    </Router>
  );
}

export default App;
