import apiClient from "./client";

export const createWork = async (formData) => {
    try {
        const response = await apiClient.post("/works/create", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            transformRequest: (data) => data,
        });
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const updateWork = async (formData) => {
    try {
        const response = await apiClient.put("/works/updatework", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            transformRequest: (data) => data,
        });
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const getWorks = async (beta = "", distributed = "") => {
    try {
        const response = await apiClient.get(`/works/getworks?beta=${beta}&distributed=${distributed}`);
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const deleteWork = async (workId) => {
    try {
        console.log("Attempting to delete work ID:", workId);
        // Using path parameter as per API docs: /api/work/deletework/:workId
        const response = await apiClient.delete(`/works/deletework/${workId}`);
        console.log("Delete Response:", response.data);
        return response.data;
    } catch (err) {
        console.error("Delete Work API Error Detail:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
        throw err;
    }
};

export const getBetas = async () => {
    try {
        const response = await apiClient.get("/betas");
        return response.data;
    } catch (err) {
        throw err;
    }
};
