import api from "./axiosInstance";


const authApi = {
  register: (data) => api.post("/user/register", data),
  verifyOtp: (data) => api.post("/user/verify-otp", data),
  resendOtp: (data) => api.post("/user/resend-otp", data),
  login: (data) => api.post("/user/login", data),
  googleLogin: (data) => api.post("/user/google-login", data),
  logout: () => api.post("/user/logout"),
  getMe: () => api.get("/user/me"),
  updateProfile: (data) => api.patch("/user/profile", data),
  updateProfileImage: (formData) => api.patch("/user/profile-image", formData),
  changePassword: (data) => api.patch("/user/change-password", data),
  forgotPassword: (data) => api.post("/user/forgot-password", data),
  resetPassword: (token, data) => api.patch(`/user/reset-password/${token}`, data),
  getPublicStats: () => api.get("/user/public-stats"),
};

export default authApi;
