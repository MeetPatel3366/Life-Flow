import axiosInstance from "./axiosInstance";

export const getAdminUsersAnalyzed = (params) => {
  return axiosInstance.get("/user/admin/users", { params });
};

export const getAdminUserById = (id) => {
  return axiosInstance.get(`/user/admin/users/${id}`);
};