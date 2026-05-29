import api from "./axiosInstance";

const buildQuery = (params) => params ? new URLSearchParams(params).toString() : "";

const bloodStockApi = {
  createBloodStock: (data) => api.post("/bloodstock", data),
  getBloodStock: (params) => api.get(`/bloodstock?${buildQuery(params)}`),
  getBloodStockById: (id) => api.get(`/bloodstock/${id}`),
  getAvailableBloodStock: (params) => api.get(`/bloodstock/available?${buildQuery(params)}`),
  getHospitalBloodStock: (hospitalId, params) => api.get(`/bloodstock/hospital/${hospitalId}?${buildQuery(params)}`),
  updateBloodStockStatus: (id, data) => api.patch(`/bloodstock/${id}/status`, data),
  updateBloodStock: (id, data) => api.patch(`/bloodstock/${id}`, data),
  separateComponents: (id, data) => api.post(`/bloodstock/${id}/separate-components`, data),
  getBloodStockStats: (params) => api.get(`/bloodstock/stats?${buildQuery(params)}`),
};

export default bloodStockApi;