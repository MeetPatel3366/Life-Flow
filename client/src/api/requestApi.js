import api from "./axiosInstance";

const buildQuery = (params) => params ? new URLSearchParams(params).toString() : "";

const requestApi = {
  createRequest: (data) => api.post("/request", data),
  getMyRequests: (params) => api.get(`/request/my?${buildQuery(params)}`),
  getMyRequestById: (id) => api.get(`/request/${id}/my`),
  getActiveRequest: () => api.get("/request/active"),
  cancelRequest: (id) => api.patch(`/request/${id}/cancel`),
  getHospitalRequests: (params) => api.get(`/request?${buildQuery(params)}`),
  getRequestByIdForHospital: (id) => api.get(`/request/${id}`),
  approveRequest: (id) => api.patch(`/request/${id}/approve`),
  rejectRequest: (id, reason) => api.patch(`/request/${id}/reject`, { reason }),
  markRequestReady: (id) => api.patch(`/request/${id}/ready`),
  completeRequest: (id) => api.patch(`/request/${id}/complete`),
  getAllRequests: (params) => api.get(`/request/all?${buildQuery(params)}`),
  forceApproveRequest: (id) => api.patch(`/request/${id}/force-approve`),
  getRequestStats: () => api.get("/request/stats"),
};

export default requestApi;