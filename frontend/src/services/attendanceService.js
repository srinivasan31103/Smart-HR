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
    const response = await api.get('/attendance/today');
    return response.data.data.attendance;
  },

  getTeamAttendance: async (params = {}) => {
    const response = await api.get('/attendance/team', { params });
    return response.data;
  },
};
