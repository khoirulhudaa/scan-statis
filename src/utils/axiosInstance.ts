import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    console.log('status', status)
    if (status === 401) {
      // 🔥 TOKEN EXPIRED
      console.warn("Token expired, logout...");
        
      localStorage.clear();

      // Redirect pakai hard reload biar semua state reset
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;