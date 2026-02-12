import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

const API_BASE_URL = "https://api.ltc365.com/api/work-track";

interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// Tạo axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Log request (optional)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý response và lỗi
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra';
    const errorStatus = error.response?.status;

    console.error('API Error:', errorStatus, errorMessage);

    const apiError: ApiError = {
      message: errorMessage,
      status: errorStatus,
      data: error.response?.data,
    };

    return Promise.reject(apiError);
  }
);

// Helper: chuyển object params thành config.params nếu chưa có
const normalizeConfig = (config?: AxiosRequestConfig | Record<string, any>): AxiosRequestConfig => {
  if (!config) return {};
  
  // Nếu config đã có cấu trúc AxiosRequestConfig (chứa params, headers, ...)
  if ('params' in config || 'headers' in config || 'timeout' in config || 'signal' in config) {
    return config as AxiosRequestConfig;
  }
  
  // Ngược lại, coi toàn bộ config là params object
  return { params: config };
};

// API Service Object - ĐÃ CẬP NHẬT
const apiService = {
  // GET request - hỗ trợ params trực tiếp
  get: <T = any>(url: string, config?: AxiosRequestConfig | Record<string, any>): Promise<T> => {
    return apiClient.get(url, normalizeConfig(config));
  },

  // POST request - giữ nguyên (dành cho data)
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post(url, data, config);
  },

  // PUT request - giữ nguyên
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put(url, data, config);
  },

  // PATCH request - giữ nguyên
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch(url, data, config);
  },

  // DELETE request - hỗ trợ params trực tiếp (giống GET)
  delete: <T = any>(url: string, config?: AxiosRequestConfig | Record<string, any>): Promise<T> => {
    return apiClient.delete(url, normalizeConfig(config));
  },
};

export default apiService;
export type { ApiError };