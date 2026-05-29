import api from "./axiosInstance";

const buildQuery = (params) => params ? new URLSearchParams(params).toString() : "";

const donationApi = {
  checkEligibility: () => api.get("/donation/eligibility"),
  getAllDonations: (params) => api.get(`/donation/all?${buildQuery(params)}`),
  createDonation: (data) => api.post("/donation", data),
  getMyDonations: (params) => api.get(`/donation/my?${buildQuery(params)}`),
  cancelDonation: (id) => api.patch(`/donation/${id}/cancel`),
  rescheduleDonation: (id, scheduledDate) => api.patch(`/donation/${id}/reschedule`, { scheduledDate }),
  getHospitalDonations: (params) => api.get(`/donation?${buildQuery(params)}`),
  getDonationById: (id) => api.get(`/donation/${id}`),
  updateScreening: (id, data) => api.patch(`/donation/${id}/screening`, data),
  completeDonation: (id) => api.patch(`/donation/${id}/complete`),
  updateLabTests: (id, data) => api.patch(`/donation/${id}/lab-tests`, data),
  getDonationsByHospital: (hospitalId, params) => api.get(`/donation/hospital/${hospitalId}?${buildQuery(params)}`),
  getDonationStats: () => api.get("/donation/stats"),
};

export default donationApi;
