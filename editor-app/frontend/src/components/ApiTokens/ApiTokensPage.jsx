import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress,
  IconButton, Tooltip, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';

// Use the existing apiRequest function from the api utils
import { apiRequest } from '../../utils/api';

function ApiTokensPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create token modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // One-time token display state
  const [createdToken, setCreatedToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirmation state
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/admin/api-tokens');
      setTokens(data.tokens || []);
    } catch (err) {
      setError(err.message || 'Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const handleCreate = async () => {
    if (!newTokenName.trim() || newTokenName.trim().length < 2) {
      setCreateError('Name must be at least 2 characters');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const data = await apiRequest('/admin/api-tokens', {
        method: 'POST',
        body: JSON.stringify({ name: newTokenName.trim() }),
      });
      setCreatedToken(data.token);
      setNewTokenName('');
      await loadTokens();
    } catch (err) {
      setCreateError(err.message || 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setCreatedToken(null);
    setNewTokenName('');
    setCreateError(null);
    setCopied(false);
  };

  const handleCopy = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiRequest(`/admin/api-tokens/${revokeTarget.id}`, { method: 'DELETE' });
      setRevokeTarget(null);
      await loadTokens();
    } catch (err) {
      setError(err.message || 'Failed to revoke token');
    } finally {
      setRevoking(false);
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">API Tokens</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Token
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : tokens.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No API tokens yet. Create one to allow agents to access the API.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Created by</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Last used</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id} hover>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>{token.created_by}</TableCell>
                  <TableCell>{formatDate(token.created_at)}</TableCell>
                  <TableCell>
                    {token.last_used_at
                      ? formatDate(token.last_used_at)
                      : <Chip label="Never" size="small" color="default" />}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Revoke token">
                      <IconButton color="error" onClick={() => setRevokeTarget(token)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* API Information Box */}
      <Box mt={4}>
        <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            API Usage Information
          </Typography>
          <Typography variant="body2" paragraph>
            Use these tokens to authenticate with the Agent REST API. Include the token in the <code>Authorization</code> header of your requests:
          </Typography>
          <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.875rem' }}>
            Authorization: Bearer &lt;your_token&gt;
          </Box>
          <Typography variant="body2" paragraph>
            <strong>Base URL:</strong> <code>{window.location.origin}/api/v1</code>
          </Typography>
          <Typography variant="body2">
            For full documentation and available endpoints, please visit the <a href="/api/help" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>API Help Page</a>.
          </Typography>
        </Paper>
      </Box>

      {/* Create Token Dialog */}
      <Dialog open={createOpen} onClose={!createdToken ? handleCloseCreate : undefined} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Token</DialogTitle>
        <DialogContent>
          {!createdToken ? (
            <>
              <TextField
                autoFocus
                label="Token name"
                fullWidth
                variant="outlined"
                margin="normal"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                helperText="Give this token a descriptive name (e.g. 'Manuel agent')"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              {createError && <Alert severity="error" sx={{ mt: 1 }}>{createError}</Alert>}
            </>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Save this token now — it will never be shown again!</strong>
              </Alert>
              <TextField
                fullWidth
                variant="outlined"
                value={createdToken}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                      <IconButton onClick={handleCopy} edge="end">
                        <ContentCopyIcon color={copied ? 'success' : 'inherit'} />
                      </IconButton>
                    </Tooltip>
                  ),
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!createdToken ? (
            <>
              <Button onClick={handleCloseCreate} disabled={creating}>Cancel</Button>
              <Button onClick={handleCreate} variant="contained" disabled={creating}>
                {creating ? <CircularProgress size={20} /> : 'Create'}
              </Button>
            </>
          ) : (
            <Button onClick={handleCloseCreate} variant="contained">I've saved the token</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)}>
        <DialogTitle>Revoke token?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke <strong>{revokeTarget?.name}</strong>?
            Any agent using this token will lose access immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeTarget(null)} disabled={revoking}>Cancel</Button>
          <Button onClick={handleRevoke} color="error" variant="contained" disabled={revoking}>
            {revoking ? <CircularProgress size={20} /> : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ApiTokensPage;
