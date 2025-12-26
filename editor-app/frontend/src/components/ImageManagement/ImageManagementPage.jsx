import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getAccessToken, apiRequest } from '../../utils/api';

function ImageManagementPage() {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' }); // type can be 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const token = getAccessToken();
      const response = await axios.get('/api/images', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(response.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setMessage({ text: 'Failed to fetch images. ' + (error.response?.data?.error || error.message), type: 'error' });
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage({ text: '', type: '' });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ text: 'Please select a file to upload.', type: 'error' });
      return;
    }
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    const formData = new FormData();
    formData.append('imageFile', selectedFile);

    try {
      const token = getAccessToken();
      const response = await axios.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage({ text: response.data.message || 'Image uploaded successfully!', type: 'success' });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      fetchImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ text: 'Image upload failed. ' + (error.response?.data?.error || error.message), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const token = getAccessToken();
      await axios.delete(`/api/images/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: `Image "${filename}" deleted successfully.`, type: 'success' });
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      setMessage({ text: `Failed to delete image "${filename}". ` + (error.response?.data?.error || error.message), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Manage Custom Images
      </Typography>

      {message.text && (
        <Alert severity={message.type || 'info'} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Upload New Image
        </Typography>
        <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={isLoading}
          >
            Choose File
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Button>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {selectedFile.name}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={isLoading || !selectedFile}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          >
            {isLoading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </Box>
      </Paper>

      <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
        Uploaded Images
      </Typography>

      {isLoading && images.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {!isLoading && images.length === 0 && (
        <Typography variant="body1" sx={{ my: 2 }}>
          No images uploaded yet, or failed to load.
        </Typography>
      )}

      <Grid container spacing={3}>
        {images.map((image) => (
          <Grid
            key={image.name}
            sx={{
              gridColumn: {
                xs: 'span 12',
                sm: 'span 6',
                md: 'span 4',
                lg: 'span 3',
              },
            }}
          >
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardMedia
                component="img"
                sx={{
                  height: 140, // Fixed height for consistency
                  objectFit: 'contain', // Use 'contain' to see the whole image, 'cover' to fill
                  p: 1, // Add some padding around the image within the media area
                  backgroundColor: (theme) => theme.palette.grey[200], // Background for letterboxing
                }}
                image={image.url}
                alt={image.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  gutterBottom
                  variant="subtitle2"
                  component="div"
                  sx={{
                    wordBreak: 'break-all',
                    maxHeight: '3.6em', // Approx 2 lines with default line height
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                  title={image.name}
                >
                  {image.name}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(image.name)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ImageManagementPage;