import axios from "axios";
import { API_BASE } from "./config";

export const getEmployees = async (token, search = "") => {
    const res = await axios.get(`${API_BASE}/api/employee/list?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

export const deleteEmployee = async (id, token) => {
    return axios.delete(`${API_BASE}/api/employee/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const toggleEmployee = async (id, token) => {
    return axios.patch(`${API_BASE}/api/employee/toggle/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
