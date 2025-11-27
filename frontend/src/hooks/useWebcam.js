import { useState, useRef, useCallback } from 'react';

export const useWebcam = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const webcamRef = useRef(null);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      setError('Camera permission denied');
      setHasPermission(false);
      return false;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) {
      setError('Webcam not ready');
      return null;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    return imageSrc;
  }, []);

  return {
    webcamRef,
    hasPermission,
    error,
    requestPermission,
    capturePhoto,
  };
};
