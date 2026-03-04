import apiClient from "./client";

// READ (List - Robust implementation with multi-endpoint fallback)
export const getEmployees = async (search = "") => {
    let employees = [];
    let errors = [];

    // Strategy 1: Attempt plural endpoint (following workApi pattern)
    try {
        const response = await apiClient.get(`/employees/list?search=${search}`);
        const list = response.data?.employees || response.data || [];
        if (Array.isArray(list)) return { employees: list };
    } catch (err) {
        errors.push(`Plural list failed: ${err.message}`);
    }

    // Strategy 2: Attempt singular endpoint (following employeeService pattern)
    try {
        const response = await apiClient.get(`/employee/list?search=${search}`);
        const list = response.data?.employees || response.data || [];
        if (Array.isArray(list)) return { employees: list };
    } catch (err) {
        errors.push(`Singular list failed: ${err.message}`);
    }

    // Strategy 3: Attempt legacy GET /employees (no suffix)
    try {
        const response = await apiClient.get(`/employees?search=${search}`);
        const list = response.data?.employees || response.data || [];
        if (Array.isArray(list)) return { employees: list };
    } catch (err) {
        errors.push(`Legacy list failed: ${err.message}`);
    }

    // Strategy 4: Fallback to Dashboard Summary extraction
    try {
        const response = await apiClient.get("/dashboard/summary");
        const data = response.data;

        if (data?.worksByEmployee) {
            data.worksByEmployee.forEach(item => {
                const emp = item.employee || item;
                if (emp && (emp._id || emp.name)) {
                    employees.push(typeof emp === "string" ? { _id: emp, name: emp, role: "member" } : emp);
                }
            });
        }

        if (data?.employeesByRole) {
            Object.values(data.employeesByRole).flat().forEach(emp => {
                if (emp && (emp._id || emp.name)) employees.push(emp);
            });
        }

        const seen = new Set();
        employees = employees.filter(e => {
            const id = e._id || e.id || e.name;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });

    } catch (err) {
        console.warn("Summary extraction failed:", err.message);
    }

    return { employees };
};

// CREATE
export const createEmployee = async (data) => {
    try {
        // Try plural first
        const response = await apiClient.post("/employees/create", data);
        return response.data;
    } catch (err) {
        // Fallback to singular
        const response = await apiClient.post("/employee/create", data);
        return response.data;
    }
};

// UPDATE - Using specific endpoint: /api/employees/updateemp/:id
export const updateEmployee = async (id, data) => {
    try {
        console.log(`Attempting to update employee ID: ${id}`);
        const response = await apiClient.put(`/employees/updateemp/${id}`, data);
        return response.data;
    } catch (err) {
        console.error("Update Employee API Error:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
        throw err;
    }
};

// TOGGLE STATUS
export const toggleEmployeeStatus = async (id) => {
    try {
        const response = await apiClient.patch(`/employees/toggle/${id}`);
        return response.data;
    } catch (err) {
        const response = await apiClient.patch(`/employee/toggle/${id}`);
        return response.data;
    }
};

// DELETE - Using specific endpoint: /api/employees/deleteemp/:id
export const deleteEmployee = async (id) => {
    try {
        console.log(`Attempting to delete employee ID: ${id}`);
        const response = await apiClient.delete(`/employees/deleteemp/${id}`);
        return response.data;
    } catch (err) {
        console.error("Delete Employee API Error:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
        throw err;
    }
};

