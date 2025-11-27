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
  EventBusy,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { KPICard } from '../components/KPICard';
import { FaceCapture } from '../components/FaceCapture';
import { useSnackbar } from 'notistack';

export const EmployeeDashboard = () => {
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
