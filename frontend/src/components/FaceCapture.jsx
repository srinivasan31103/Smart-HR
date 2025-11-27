import React, { useState } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CameraAlt, Check, Close } from '@mui/icons-material';
import { useWebcam } from '../hooks/useWebcam';

export const FaceCapture = ({ open, onClose, onCapture, title = 'Capture Face' }) => {
  const { webcamRef, hasPermission, error, requestPermission, capturePhoto } = useWebcam();
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setCapturedImage(photo);
    }
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setLoading(true);
    try {
      await onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            bgcolor: 'black',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onUserMedia={() => requestPermission()}
            />
          )}
        </Box>

        {!capturedImage && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CameraAlt />}
              onClick={handleCapture}
              disabled={!hasPermission}
            >
              Capture Photo
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {capturedImage ? (
          <>
            <Button onClick={handleRetake} startIcon={<Close />}>
              Retake
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              startIcon={loading ? <CircularProgress size={20} /> : <Check />}
              disabled={loading}
            >
              Confirm
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Cancel</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
