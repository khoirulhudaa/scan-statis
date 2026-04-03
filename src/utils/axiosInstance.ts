import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ RESPONSE:", response);
    return response;
  },
  (error) => {
    const status = error.response?.status;

    console.log("❌ ERROR RESPONSE:", error.response);

    if (status === 401) {
      console.warn("Token expired, logout...");
      localStorage.clear();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;