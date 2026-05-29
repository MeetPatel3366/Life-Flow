import api from "./axiosInstance";

const buildQuery = (params) => params ? new URLSearchParams(params).toString() : "";

const notificationApi = {
  getNotifications: (params) => api.get(`/notifications?${buildQuery(params)}`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
};

export default notificationApi;