import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Paper,
    Box,
} from '@mui/material';
import { fetchEnvKeysApi } from '../../utils/api';

function EnvVarsPage() {
    const [envKeys, setEnvKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadEnvKeys = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchEnvKeysApi();
                console.log('API Response Data:', data); // DEBUG: Log raw API response
                setEnvKeys(data.keys || []); // Expecting { keys: [...] }
            } catch (err) {
                console.error("Failed to fetch env keys:", err);
                setError(err.message || 'Failed to load environment variable keys. Check server logs.');
            } finally {
                setLoading(false);
            }
        };

        loadEnvKeys();
    }, []);

    console.log('Rendering EnvVarsPage - envKeys:', envKeys, 'loading:', loading, 'error:', error); // DEBUG: Log state before render

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Environment Variables (.env)
            </Typography>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="body1" paragraph>
                    This page lists the variable names (keys) found in the <code>.env</code> file located in your Homepage configuration directory (<code>{/* Assuming CONFIG_DIR is known or can be displayed */}</code>).
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    For security reasons, only the variable names are displayed here, not their values. These variables can be used within your Homepage configuration files using the <code>${'{'}{'{'}VAR_NAME{'}'}{'}'}</code> syntax.
                </Alert>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && (
                    <>
                        <Typography variant="h6" gutterBottom>
                            Detected Variable Keys:
                        </Typography>
                        {envKeys.length > 0 ? (
                            <List dense>
                                {envKeys.map((key) => (
                                    <ListItem key={key}>
                                        <ListItemText primary={<code>{key}</code>} />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No environment variables found in the <code>.env</code> file or the file does not exist.
                            </Typography>
                        )}
                    </>
                )}
            </Paper>
        </Container>
    );
}

export default EnvVarsPage;