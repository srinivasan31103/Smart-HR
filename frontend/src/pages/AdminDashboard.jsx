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
} from '@mui/material';
import {
  People,
  EventBusy,
  CheckCircle,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { KPICard } from '../components/KPICard';
import { useSnackbar } from 'notistack';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch company-wide data
      const [attendance, leaves] = await Promise.all([
        attendanceService.getTeamAttendance().catch(() => ({ data: [] })),
        leaveService.getPendingApprovals().catch(() => []),
      ]);

      // Calculate stats
      const presentCount = attendance.data?.filter(a => a.status === 'PRESENT').length || 0;
      const absentCount = attendance.data?.filter(a => a.status === 'ABSENT').length || 0;
      const leaveCount = attendance.data?.filter(a => a.status === 'ON_LEAVE').length || 0;

      setStats({
        totalEmployees: 50, // Mock data - would come from backend
        presentToday: presentCount,
        absentToday: absentCount,
        onLeaveToday: leaveCount,
        pendingLeaves: leaves.length || 0,
      });

      setRecentAttendance(attendance.data?.slice(0, 10) || []);
      setPendingLeaves(leaves.slice(0, 5) || []);
    } catch (error) {
      console.error('Admin dashboard fetch error:', error);
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const attendancePercentage = stats.totalEmployees > 0
    ? Math.round((stats.presentToday / stats.totalEmployees) * 100)
    : 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome, {user?.firstName}! Here's your company overview.
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={People}
            color="primary"
            subtitle="Active employees"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Present Today"
            value={stats.presentToday}
            icon={CheckCircle}
            color="success"
            subtitle={`${attendancePercentage}% attendance`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="On Leave"
            value={stats.onLeaveToday}
            icon={EventBusy}
            color="warning"
            subtitle="Approved leaves today"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Approvals"
            value={stats.pendingLeaves}
            icon={Warning}
            color="error"
            subtitle="Leave requests"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        {/* Recent Attendance */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Attendance
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Punch In</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentAttendance.length > 0 ? (
                      recentAttendance.map((record) => (
                        <TableRow key={record._id || Math.random()}>
                          <TableCell>
                            {record.employee?.firstName || 'N/A'} {record.employee?.lastName || ''}
                          </TableCell>
                          <TableCell>{record.employee?.department?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {record.punchIn
                              ? new Date(record.punchIn).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                bgcolor:
                                  record.status === 'PRESENT' ? 'success.light' :
                                  record.status === 'LATE' ? 'warning.light' :
                                  'error.light',
                                color: 'white',
                              }}
                            >
                              {record.status || 'ABSENT'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No attendance records today
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

        {/* Pending Leave Requests */}
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
                      <Typography variant="caption" color="text.secondary">
                        {leave.fromDate
                          ? new Date(leave.fromDate).toLocaleDateString()
                          : 'N/A'
                        } - {
                          leave.toDate
                            ? new Date(leave.toDate).toLocaleDateString()
                            : 'N/A'
                        }
                      </Typography>
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

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'success.dark' }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                      {attendancePercentage}%
                    </Typography>
                    <Typography variant="body2">Average Attendance</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                    <EventBusy sx={{ fontSize: 40, color: 'info.dark' }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                      {stats.onLeaveToday}
                    </Typography>
                    <Typography variant="body2">On Leave Today</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.dark' }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                      {stats.pendingLeaves}
                    </Typography>
                    <Typography variant="body2">Pending Approvals</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
