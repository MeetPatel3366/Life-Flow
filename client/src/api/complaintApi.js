import api from "./axiosInstance";

const buildQuery = (params) => params ? new URLSearchParams(params).toString() : "";

const complaintApi = {
  createComplaint: (data) => api.post("/complaints", data),
  getMyComplaints: (params) => api.get(`/complaints/my?${buildQuery(params)}`),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  getHospitalComplaints: (params) => api.get(`/complaints/hospital?${buildQuery(params)}`),
  getAllComplaints: (params) => api.get(`/complaints/all?${buildQuery(params)}`),
  updateComplaintStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  resolveComplaint: (id, data) => api.patch(`/complaints/${id}/resolve`, data),
  cancelComplaint: (id) => api.patch(`/complaints/${id}/cancel`),
};

export default complaintApi;
