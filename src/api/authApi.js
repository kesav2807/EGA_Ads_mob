import apiClient from "./client";

export const adminLogin = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/admin/login", {
      email,
      password,
    });
    return response.data;
  } catch (err) {
    // Re-throw with a clean error object
    const errors = err.response?.data?.errors;
    const message = err.response?.data?.message || "Server error";

    // If multiple errors, combine them
    const fullMessage = errors ? Object.values(errors).flat().join(", ") : message;

    throw { message: fullMessage, status: err.response?.status };
  }
};

export const employeeLogin = async (name, mobile) => {
  try {
    const response = await apiClient.post("/auth/employee/login", {
      name,
      mobile,
    });
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message || "Login failed";
    throw { message, status: err.response?.status };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem("adminToken");
  await AsyncStorage.removeItem("employeeToken");
};
