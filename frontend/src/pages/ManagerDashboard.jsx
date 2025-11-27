import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import {
  People,
  EventBusy,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { KPICard } from '../components/KPICard';
import { FaceCapture } from '../components/FaceCapture';
import { useSnackbar } from 'notistack';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [todayStatus, setTodayStatus] = useState(null);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [openFaceCapture, setOpenFaceCapture] = useState(false);
  const [punchType, setPunchType] = useState('IN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const [status, team, leaves, balance] = await Promise.all([
        attendanceService.getTodayStatus().catch(() => null),
        attendanceService.getTeamAttendance().catch(() => ({ data: [] })),
        leaveService.getPendingApprovals().catch(() => []),
        leaveService.getLeaveBalance().catch(() => []),
      ]);

      setTodayStatus(status);
      setTeamAttendance(team.data || []);
      setPendingLeaves(leaves || []);
      setLeaveBalance(balance || []);
    } catch (error) {
      console.error('Manager dashboard fetch error:', error);
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
      fetchManagerData();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || 'Operation failed',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await leaveService.approveLeave(leaveId);
      enqueueSnackbar('Leave approved successfully', { variant: 'success' });
      fetchManagerData();
    } catch (error) {
      enqueueSnackbar('Failed to approve leave', { variant: 'error' });
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await leaveService.rejectLeave(leaveId);
      enqueueSnackbar('Leave rejected', { variant: 'info' });
      fetchManagerData();
    } catch (error) {
      enqueueSnackbar('Failed to reject leave', { variant: 'error' });
    }
  };

  const hasPunchedIn = todayStatus && todayStatus.punchIn;
  const hasPunchedOut = todayStatus && todayStatus.punchOut;
  const teamPresentCount = teamAttendance.filter(a => a.status === 'PRESENT').length;
  const teamSize = teamAttendance.length || 10; // Mock: would come from backend

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manager Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome, {user?.firstName}! Manage your team and attendance.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Personal Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Attendance
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
                  startIcon={<Schedule />}
                >
                  {hasPunchedOut ? 'Punched Out' : 'Punch Out'}
                </Button>
              </Box>
              {hasPunchedIn && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Punch In: {new Date(todayStatus.punchIn).toLocaleTimeString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Team Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Overview
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold">{teamPresentCount}</Typography>
                    <Typography variant="body2">Present Today</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold">{pendingLeaves.length}</Typography>
                    <Typography variant="body2">Pending Approvals</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* My Leave Balance */}
        {leaveBalance.slice(0, 3).map((leave) => (
          <Grid item xs={12} sm={6} md={4} key={leave.leaveType?.id || Math.random()}>
            <KPICard
              title={leave.leaveType?.name || 'Leave'}
              value={`${leave.available || 0}/${leave.total || 0}`}
              subtitle={`Used: ${leave.used || 0} | Pending: ${leave.pending || 0}`}
              icon={EventBusy}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Team Attendance */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Attendance Today
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Punch In</TableCell>
                      <TableCell>Punch Out</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamAttendance.length > 0 ? (
                      teamAttendance.map((record) => (
                        <TableRow key={record._id || Math.random()}>
                          <TableCell>
                            {record.employee?.firstName || 'N/A'} {record.employee?.lastName || ''}
                          </TableCell>
                          <TableCell>
                            {record.punchIn
                              ? new Date(record.punchIn).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.punchOut
                              ? new Date(record.punchOut).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={record.status || 'ABSENT'}
                              size="small"
                              color={
                                record.status === 'PRESENT' ? 'success' :
                                record.status === 'LATE' ? 'warning' :
                                'error'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No team attendance records
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Leave Approvals */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pending Leave Approvals
              </Typography>
              <Box sx={{ mt: 2 }}>
                {pendingLeaves.length > 0 ? (
                  pendingLeaves.map((leave) => (
                    <Paper
                      key={leave._id || Math.random()}
                      variant="outlined"
                      sx={{ p: 2, mb: 2 }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {leave.employee?.firstName || 'N/A'} {leave.employee?.lastName || ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {leave.leaveType?.name || 'Leave'} - {leave.duration || 0} day(s)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {leave.fromDate
                          ? new Date(leave.fromDate).toLocaleDateString()
                          : 'N/A'
                        } to {
                          leave.toDate
                            ? new Date(leave.toDate).toLocaleDateString()
                            : 'N/A'
                        }
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApproveLeave(leave._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectLeave(leave._id)}
                        >
                          Reject
                        </Button>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No pending leave requests
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
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
