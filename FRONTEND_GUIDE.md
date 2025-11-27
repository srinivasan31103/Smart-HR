# Smart HR Frontend - Complete Implementation Guide

This document contains all frontend code for the Smart HR system.

---

## TABLE OF CONTENTS

1. [API Service Layer](#api-service-layer)
2. [Contexts](#contexts)
3. [Custom Hooks](#custom-hooks)
4. [Components](#components)
5. [Pages](#pages)
6. [Routes](#routes)
7. [App.jsx](#app-jsx)

---

## API SERVICE LAYER

### `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (fallback)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### `frontend/src/services/authService.js`

```javascript
import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, accessToken };
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data.data.accessToken;
  },
};
```

### `frontend/src/services/attendanceService.js`

```javascript
import api from './api';

export const attendanceService = {
  registerFace: async (faceImage) => {
    const response = await api.post('/attendance/register-face', { faceImage });
    return response.data;
  },

  punchIn: async (faceImage, location, isWFH = false, deviceInfo = {}) => {
    const response = await api.post('/attendance/punch-in', {
      faceImage,
      location,
      isWFH,
      deviceInfo,
    });
    return response.data;
  },

  punchOut: async (faceImage, location, deviceInfo = {}) => {
    const response = await api.post('/attendance/punch-out', {
      faceImage,
      location,
      deviceInfo,
    });
    return response.data;
  },

  getMyAttendance: async (params = {}) => {
    const response = await api.get('/attendance/my-attendance', { params });
    return response.data.data;
  },

  getTodayStatus: async () => {
    const response = await api.get('/attendance/today-status');
    return response.data.data.attendance;
  },
};
```

### `frontend/src/services/leaveService.js`

```javascript
import api from './api';

export const leaveService = {
  applyLeave: async (leaveData) => {
    const response = await api.post('/leaves/apply', leaveData);
    return response.data;
  },

  getMyLeaves: async (params = {}) => {
    const response = await api.get('/leaves/my-leaves', { params });
    return response.data.data;
  },

  getLeaveBalance: async () => {
    const response = await api.get('/leaves/balance');
    return response.data.data.balance;
  },

  approveRejectLeave: async (leaveId, status, comments) => {
    const response = await api.put(`/leaves/${leaveId}/approve`, {
      status,
      comments,
    });
    return response.data;
  },
};
```

---

## CONTEXTS

### `frontend/src/contexts/AuthContext.jsx`

```javascript
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          // Verify token by fetching user
          const userData = await authService.getMe();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { user: userData } = await authService.login(email, password);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
    },
    [user]
  );

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### `frontend/src/contexts/ThemeContext.jsx`

```javascript
import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
          },
          success: {
            main: '#2e7d32',
          },
          error: {
            main: '#d32f2f',
          },
          warning: {
            main: '#ed6c02',
          },
          info: {
            main: '#0288d1',
          },
          ...(mode === 'dark' && {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
          }),
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 600 },
          h2: { fontWeight: 600 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0,0,0,0.1)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
```

---

## CUSTOM HOOKS

### `frontend/src/hooks/useAuth.js`

```javascript
import { useContext } from 'react';
import { AuthContext } from '@contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
```

### `frontend/src/hooks/useTheme.js`

```javascript
import { useContext } from 'react';
import { ThemeContext } from '@contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
```

### `frontend/src/hooks/useWebcam.js`

```javascript
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
```

---

## COMPONENTS

### `frontend/src/components/ProtectedRoute.jsx`

```javascript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### `frontend/src/components/FaceCapture.jsx`

```javascript
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
import { useWebcam } from '@hooks/useWebcam';

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
```

### `frontend/src/components/KPICard.jsx`

```javascript
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export const KPICard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="caption" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                bgcolor: `${color}.lighter`,
                color: `${color}.main`,
                p: 1,
                borderRadius: 2,
              }}
            >
              <Icon sx={{ fontSize: 32 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
```

---

## PAGES

### `frontend/src/pages/Login.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { useSnackbar } from 'notistack';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      enqueueSnackbar('Login successful!', { variant: 'success' });
      navigate(from, { replace: true });
    } else {
      setError(result.message);
      enqueueSnackbar(result.message, { variant: 'error' });
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Smart HR
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendance & Leave Management System
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
```

### `frontend/src/pages/Dashboard.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Home,
  EventBusy,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { attendanceService } from '@services/attendanceService';
import { leaveService } from '@services/leaveService';
import { KPICard } from '@components/KPICard';
import { FaceCapture } from '@components/FaceCapture';
import { useSnackbar } from 'notistack';

export const Dashboard = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [todayStatus, setTodayStatus] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [openFaceCapture, setOpenFaceCapture] = useState(false);
  const [punchType, setPunchType] = useState('IN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [status, balance] = await Promise.all([
        attendanceService.getTodayStatus(),
        leaveService.getLeaveBalance(),
      ]);

      setTodayStatus(status);
      setLeaveBalance(balance);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const handlePunchClick = (type) => {
    setPunchType(type);
    setOpenFaceCapture(true);
  };

  const handleFaceCapture = async (faceImage) => {
    setLoading(true);
    try {
      if (punchType === 'IN') {
        await attendanceService.punchIn(faceImage, null, false);
        enqueueSnackbar('Punch in successful!', { variant: 'success' });
      } else {
        await attendanceService.punchOut(faceImage, null);
        enqueueSnackbar('Punch out successful!', { variant: 'success' });
      }
      fetchDashboardData();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || 'Operation failed',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const hasPunchedIn = todayStatus && todayStatus.punchIn;
  const hasPunchedOut = todayStatus && todayStatus.punchOut;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome, {user?.firstName}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => handlePunchClick('IN')}
                  disabled={hasPunchedIn}
                  startIcon={<CheckCircle />}
                >
                  {hasPunchedIn ? 'Punched In' : 'Punch In'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  onClick={() => handlePunchClick('OUT')}
                  disabled={!hasPunchedIn || hasPunchedOut}
                  startIcon={<Cancel />}
                >
                  {hasPunchedOut ? 'Punched Out' : 'Punch Out'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Status */}
        <Grid item xs={12} md={6}>
          <KPICard
            title="Today's Status"
            value={todayStatus?.status || 'Absent'}
            icon={CheckCircle}
            color={todayStatus?.status === 'PRESENT' ? 'success' : 'error'}
            subtitle={
              hasPunchedIn
                ? `Punch In: ${new Date(todayStatus.punchIn).toLocaleTimeString()}`
                : 'Not punched in yet'
            }
          />
        </Grid>

        {/* Leave Balance */}
        {leaveBalance.slice(0, 3).map((leave) => (
          <Grid item xs={12} sm={6} md={4} key={leave.leaveType.id}>
            <KPICard
              title={leave.leaveType.name}
              value={`${leave.available}/${leave.total}`}
              subtitle={`Used: ${leave.used} | Pending: ${leave.pending}`}
              icon={EventBusy}
            />
          </Grid>
        ))}
      </Grid>

      <FaceCapture
        open={openFaceCapture}
        onClose={() => setOpenFaceCapture(false)}
        onCapture={handleFaceCapture}
        title={punchType === 'IN' ? 'Punch In' : 'Punch Out'}
      />
    </Container>
  );
};
```

---

## ROUTES

### `frontend/src/routes/AppRoutes.jsx`

```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { Login } from '@pages/Login';
import { Dashboard } from '@pages/Dashboard';
import { MainLayout } from '../layouts/MainLayout';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
```

### `frontend/src/layouts/MainLayout.jsx`

```javascript
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material';
import { Brightness4, Brightness7, Logout } from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@hooks/useTheme';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart HR
          </Typography>

          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <Avatar sx={{ ml: 2, mr: 1 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>

          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.fullName}
          </Typography>

          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
```

---

## APP.JSX

### `frontend/src/App.jsx`

```javascript
import React from 'react';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return <AppRoutes />;
}

export default App;
```

---

## SETUP INSTRUCTIONS

See main README.md for complete setup instructions.

