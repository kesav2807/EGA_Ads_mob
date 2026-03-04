const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },

    role: {
        type: String,
        enum: ["register", "initialization", "designer", "installer", "helper", "manager"],
        default: "register"
    },

    address: String,

    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);
