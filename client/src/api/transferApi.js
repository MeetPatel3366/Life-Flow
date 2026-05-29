import api from "./axiosInstance";

const buildQuery = (params) => params ? new URLSearchParams(params).toString() : "";

const transferApi = {
  createTransfer: (data) => api.post("/transfer", data),
  getTransfers: (params) => api.get(`/transfer?${buildQuery(params)}`),
  getTransferById: (id) => api.get(`/transfer/${id}`),
  approveTransfer: (id) => api.patch(`/transfer/${id}/approve`),
  dispatchTransfer: (id, data) => api.patch(`/transfer/${id}/dispatch`, data),
  markDelivered: (id) => api.patch(`/transfer/${id}/delivered`),
  completeTransfer: (id) => api.patch(`/transfer/${id}/complete`),
  getAllTransfers: (params) => api.get(`/transfer/all?${buildQuery(params)}`),
  getTransferStats: (params) => api.get(`/transfer/stats?${buildQuery(params)}`),
  getTransferByRequest: (requestId) => api.get(`/transfer/request/${requestId}`),
};

export default transferApi;