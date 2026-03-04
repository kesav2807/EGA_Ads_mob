import apiClient from "./client";

export const getDashboardSummary = async () => {
    try {
        const response = await apiClient.get("/dashboard/summary");
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const getRecentWorks = async (limit = 6) => {
    try {
        const response = await apiClient.get(`/dashboard/recent?limit=${limit}`);
        return response.data;
    } catch (err) {
        throw err;
    }
};
