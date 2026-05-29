import axios from "axios";
console.log(import.meta.env.VITE_API_URL);
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const storedAuth = JSON.parse(localStorage.getItem("lifeflow_auth") || "null");
    const token = storedAuth?.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/user/refresh-token`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse?.data?.data) {
          const { accessToken, refreshToken } = refreshResponse.data.data;

          const storedAuth = JSON.parse(localStorage.getItem("lifeflow_auth") || "{}");
          localStorage.setItem(
            "lifeflow_auth",
            JSON.stringify({
              ...storedAuth,
              accessToken,
              refreshToken,
            })
          );

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("lifeflow_auth");
        window.location.href = "/login"; // Force re-login
        return Promise.reject(refreshError);
      }
    }
    

    return Promise.reject(error);
  }
);

export default api;