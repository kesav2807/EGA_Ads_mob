import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define your base URL here
// For Vercel Production:
export const BASE_URL = "https://ega-ads-backend.vercel.app/api";

// For Localhost Development (Uncomment to use local backend):
// const BASE_URL = "http://localhost:5000/api"; 
// Android Emulator use: http://10.0.2.2:5000/api

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // Increased for Vercel cold starts
    headers: {
        "Content-Type": "application/json",
    },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            let token = await AsyncStorage.getItem("adminToken");
            if (!token) {
                token = await AsyncStorage.getItem("employeeToken");
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                config.headers.Cookie = `token=${token}`;
            }
        } catch (error) {
            console.error("Error retrieving token:", error.message);
            if (error.response) {
                console.warn("Token API Response Error:", error.response.status, error.response.data);
            } else if (error.request) {
                console.warn("Token API Network Error (No Response):", error.request);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log error for debugging
        const message = error.response?.data?.message || "Something went wrong";
        console.warn("API Error:", message);

        // You could trigger a global logout here if status === 401

        return Promise.reject(error);
    }
);

export default apiClient;
