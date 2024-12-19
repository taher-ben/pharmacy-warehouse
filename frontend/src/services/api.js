import axios from "axios";
import store from "../store";
import { logout } from "../store/authSlice"; // استدعاء دالة logout من Redux

const API = axios.create({
  baseURL: "http://localhost:8081/api",
});

API.interceptors.request.use((config) => {
  const { token } = store.getState().auth;
  if (config.url !== "/login") config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// إعداد interceptor للاستجابات
API.interceptors.response.use(
  (response) => {
    // تمرير الرد إذا كان ناجحًا
    return response;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.log("error from response");
      // تنفيذ عملية تسجيل الخروج عبر Redux
      store.dispatch(logout());
      console.error("Unauthorized or forbidden. Logging out.");
    }
    // تمرير الخطأ للمعالجة الإضافية
    return Promise.reject(error);
  }
);

export default API;
