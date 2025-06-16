import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  List,           // Added
  ListItem,       // Added
  ListItemText,   // Added
  IconButton,     // Added
  Tooltip,        // Added
  Divider,        // Added
  Accordion,      // Added
  AccordionSummary, // Added
  AccordionDetails, // Added
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History'; // Added
import ReplayIcon from '@mui/icons-material/Replay';   // Added
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Added
import Editor from '@monaco-editor/react'; // Use the React wrapper
import { useSnackbar } from 'notistack'; // Added
import {
  listRawFiles,
  getRawFileContent,
  saveRawFileContent,
  getFileHistoryApi, // Added
  rollbackFileApi    // Added
} from '../../utils/api';
import ConfirmationDialog from '../ConfirmationDialog'; // Added

function RawEditorPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar(); // Added
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [initialContent, setInitialContent] = useState(''); // To track changes
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const editorRef = useRef(null);

  // History and Rollback State
  const [fileHistory, setFileHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [isRollbackLoading, setIsRollbackLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [commitToRollback, setCommitToRollback] = useState(null); // { hash: string, filename: string }

  // Fetch the list of editable files on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoadingFiles(true);
      setError(null);
      try {
        const fileList = await listRawFiles();
        setFiles(fileList || []); // Handle potential null/undefined response
        if (fileList && fileList.length > 0) {
          // Optionally select the first file by default
          // setSelectedFile(fileList[0].name);
        }
      } catch (err) {
        console.error('Error fetching file list:', err);
        setError('Failed to load file list. Please ensure the backend is running and you are logged in.');
      } finally {
        setIsLoadingFiles(false);
      }
    };
    fetchFiles();
  }, []);

  
    // Fetch content function (extracted for reuse)
    const fetchFileContent = useCallback(async (filename) => {
      if (!filename) return;
      setIsLoadingContent(true);
      setError(null);
      setSaveSuccess(false);
      setSaveError(null);
      try {
        const data = await getRawFileContent(filename);
        const content = data?.content || '';
        setFileContent(content);
        setInitialContent(content);
      } catch (err) {
        console.error(`Error fetching content for ${filename}:`, err);
        setError(`Failed to load content for ${filename}.`);
        setFileContent('');
        setInitialContent('');
      } finally {
        setIsLoadingContent(false);
      }
    }, []); // No dependencies needed as getRawFileContent is stable
  
    // Fetch history function
    const fetchFileHistory = useCallback(async (filename) => {
      if (!filename) return;
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        const historyData = await getFileHistoryApi(filename);
        setFileHistory(historyData || []); // Ensure it's always an array
      } catch (err) {
        console.error(`Error fetching history for ${filename}:`, err);
        setHistoryError(`Failed to load history for ${filename}.`);
        setFileHistory([]);
      } finally {
        setIsHistoryLoading(false);
      }
    }, []); // No dependencies needed as getFileHistoryApi is stable
  
    // Fetch content and history when a file is selected
    useEffect(() => {
      if (!selectedFile) {
        setFileContent('');
        setInitialContent('');
        setFileHistory([]);
        setHistoryError(null);
        editorRef.current = null; // Reset editor ref
        return;
      }
  
      fetchFileContent(selectedFile);
      fetchFileHistory(selectedFile);
  
    }, [selectedFile, fetchFileContent, fetchFileHistory]);
  const handleFileChange = (event) => {
    setSelectedFile(event.target.value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // You can add editor configurations here if needed
    // Example: editor.updateOptions({ minimap: { enabled: false } });
  };

  const handleEditorChange = (value, event) => {
    // The 'value' parameter already contains the current content
    setFileContent(value);
    // Clear save status messages on edit
    if (saveSuccess) setSaveSuccess(false);
    if (saveError) setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedFile || fileContent === initialContent) {
      // No file selected or no changes made
      setSaveError("No changes to save or no file selected.");
      setTimeout(() => setSaveError(null), 3000); // Clear message after 3s
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await saveRawFileContent(selectedFile, fileContent);
      setInitialContent(fileContent); // Update initial content after successful save
      enqueueSnackbar('File saved successfully!', { variant: 'success' });
      // Refetch history after successful save to show the new commit
      fetchFileHistory(selectedFile);
      // No need for separate saveSuccess state with snackbar
      // setSaveSuccess(true);
      // setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(`Error saving file ${selectedFile}:`, err);
      // Access the error message correctly
      const backendError = err.data?.error || err.message || 'Failed to save file.';
      enqueueSnackbar(`Save failed: ${backendError}`, { variant: 'error' });
      // No need for separate saveError state with snackbar
      // setSaveError(backendError);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Rollback Handlers ---
  const handleRollbackClick = (commit) => {
    if (!selectedFile || !commit?.hash) return;
    setCommitToRollback({ hash: commit.hash, filename: selectedFile });
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setCommitToRollback(null);
  };

  const handleConfirmRollback = async () => {
    if (!commitToRollback) return;

    setIsRollbackLoading(true);
    handleCloseConfirmDialog(); // Close dialog immediately

    try {
      await rollbackFileApi(commitToRollback.filename, commitToRollback.hash);
      enqueueSnackbar(`Successfully reverted ${commitToRollback.filename} to version ${commitToRollback.hash.substring(0, 7)}`, { variant: 'success' });
      // Refetch content and history after successful rollback
      await fetchFileContent(commitToRollback.filename);
      await fetchFileHistory(commitToRollback.filename);
    } catch (err) {
      console.error('Rollback failed:', err);
      const errorMsg = err.data?.error || err.message || 'Failed to perform rollback.';
      enqueueSnackbar(`Rollback failed: ${errorMsg}`, { variant: 'error' });
    } finally {
      setIsRollbackLoading(false);
    }
  };
  // --- End Rollback Handlers ---

  // Determine language based on file extension
  const getLanguage = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      default:
        return 'plaintext';
    }
  };

  
    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'N/A';
      // Multiply by 1000 because JS expects milliseconds
      return new Date(timestamp * 1000).toLocaleString();
      // Or use date-fns formatDistanceToNow for relative time
      // import { formatDistanceToNow } from 'date-fns';
      // return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
    };
  
    return (
      // Outer Box: Grow, flex column, remove padding. Let App.jsx handle padding.
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}> {/* Removed p:3 */}
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          Raw Configuration File Editor
        </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel id="file-select-label">Select File</InputLabel>
          <Select
            labelId="file-select-label"
            id="file-select"
            value={selectedFile}
            label="Select File"
            onChange={handleFileChange}
            disabled={isLoadingFiles || files.length === 0}
          >
            <MenuItem value="">
              <em>--- Select a file ---</em>
            </MenuItem>
            {files.map((file) => (
              <MenuItem key={file.name} value={file.name}>
                {file.name} ({file.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {isLoadingFiles && <CircularProgress size={24} />}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!selectedFile || isLoadingContent || isSaving || fileContent === initialContent}
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* History Accordion - Only show if a file is selected */}
      {selectedFile && (
        <Accordion sx={{ mb: 2 }} TransitionProps={{ unmountOnExit: true }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="file-history-content"
            id="file-history-header"
          >
            <HistoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography>File History</Typography>
            {isHistoryLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}> {/* Remove padding for List */}
            {historyError && <Alert severity="error" sx={{ m: 2 }}>{historyError}</Alert>}
            {!isHistoryLoading && !historyError && fileHistory.length === 0 && (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>No history found for this file.</Typography>
            )}
            {!isHistoryLoading && !historyError && fileHistory.length > 0 && (
              <List
                dense
                disablePadding
                sx={{
                  maxHeight: '250px', // Limit height to roughly 5 items
                  overflowY: 'auto',  // Enable vertical scroll
                  pr: 1, // Add some padding to the right to avoid scrollbar overlap
                }}
              >
                {fileHistory.map((commit, index) => (
                  <React.Fragment key={commit.hash}>
                    <ListItem
                      secondaryAction={
                        <Tooltip title="Rollback to this version">
                          {/* Disable rollback for the very first commit in history? Or allow? Allow for now. */}
                          {/* Disable if rollback is already in progress */}
                          <span> {/* Tooltip needs a span wrapper when button is disabled */}
                            <IconButton
                              edge="end"
                              aria-label="rollback"
                              onClick={() => handleRollbackClick(commit)}
                              disabled={isRollbackLoading}
                            >
                              <ReplayIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={`${commit.subject} (${commit.hash.substring(0, 7)})`}
                        secondary={`by ${commit.authorEmail} on ${formatTimestamp(commit.timestamp)}`}
                        primaryTypographyProps={{ sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                        secondaryTypographyProps={{ sx: { fontSize: '0.8rem' } }}
                      />
                    </ListItem>
                    {index < fileHistory.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Editor Container Box: Make this grow */}
      {/* Wrapper for Editor/Spinner/Placeholder - THIS should grow */}
      <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {isLoadingContent ? (
          // Center spinner within this growing Box
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress />
          </Box>
        ) : selectedFile ? (
          // Editor: Explicitly set height/width to fill container.
          <Editor
            height="100%" // Re-add explicit height
            width="100%" // Re-add explicit width
            language={getLanguage(selectedFile)}
            value={fileContent}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
              automaticLayout: true,
              wordWrap: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
            }}
          />
        ) : (
          // Placeholder Box: Center within this growing Box
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, color: 'text.secondary' }}>
            <Typography>Select a file to view or edit its content.</Typography>
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog for Rollback */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmRollback}
        title="Confirm Rollback"
        message={`Are you sure you want to revert '${commitToRollback?.filename}' to the version from commit ${commitToRollback?.hash?.substring(0, 7)}? This will create a new commit recording the revert.`}
        confirmText="Rollback"
        cancelText="Cancel"
        isLoading={isRollbackLoading}
      />
    </Box>
  );
}

export default RawEditorPage;