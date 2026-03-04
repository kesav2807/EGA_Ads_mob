const Employee = require("../models/Employee");


// CREATE
exports.createEmployee = async (req, res) => {
    try {
        const { name, mobile, email, role, address } = req.body;

        if (!name || (!mobile && !email))
            return res.status(400).json({ message: "Name & mobile/email required" });

        const exists = await Employee.findOne({ $or: [{ mobile }, { email }] });
        if (exists) return res.status(409).json({ message: "Employee exists" });

        const emp = await Employee.create({ name, mobile, email, role, address });

        res.status(201).json({ message: "Employee created", emp });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// GET ALL
exports.getEmployees = async (req, res) => {
    try {
        const { search } = req.query;

        let query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const employees = await Employee.find(query).sort({ createdAt: -1 });

        res.json({ employees });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// UPDATE
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const emp = await Employee.findByIdAndUpdate(id, req.body, { new: true });

        res.json({ message: "Updated", emp });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// TOGGLE ACTIVE
exports.toggleEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const emp = await Employee.findById(id);
        emp.isActive = !emp.isActive;
        await emp.save();

        res.json({ message: "Status updated", emp });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// DELETE
exports.deleteEmployee = async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: "Employee deleted" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
