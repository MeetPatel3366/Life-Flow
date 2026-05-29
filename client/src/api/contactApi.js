import api from "./axiosInstance";

const buildQuery = (params) =>
  params ? new URLSearchParams(params).toString() : "";

const contactApi = {
  submitContact: (data) => api.post("/contact", data),
  getAllContacts: (params) => api.get(`/contact/all?${buildQuery(params)}`),
  getContactById: (id) => api.get(`/contact/${id}`),
  replyToContact: (id, data) => api.post(`/contact/${id}/reply`, data),
};

export default contactApi;
