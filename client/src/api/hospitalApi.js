import api from "./axiosInstance";

const hospitalApi = {
  registerHospital: (formData) => api.post("/hospital/register", formData),
  getMyHospitalProfile: () => api.get("/hospital/me"),
  updateMyHospitalProfile: (formData) => api.patch("/hospital/me", formData),
  getPendingHospitals: (params) => {
    const query = params ? new URLSearchParams(params).toString() : "";
    return api.get(`/hospital/pending?${query}`);
  },
  approveHospital: (id) => api.patch(`/hospital/${id}/approve`),
  rejectHospital: (id, rejectionReason) => api.patch(`/hospital/${id}/reject`, { rejectionReason }),
  getHospitals: (params) => {
    const query = params ? new URLSearchParams(params).toString() : "";
    return api.get(`/hospital?${query}`);
  },
  getHospitalById: (id) => api.get(`/hospital/${id}`),
  getNearbyHospitals: (params) => {
    const query = params ? new URLSearchParams(params).toString() : "";
    return api.get(`/hospital/nearby?${query}`);
  },
};

export default hospitalApi;