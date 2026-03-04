const router = require("express").Router();
const ctrl = require("../controllers/employeeController");
const auth = require("../middleware/authMiddleware");

router.post("/create", auth(["admin", "manager"]), ctrl.createEmployee);
router.get("/list", auth(["admin", "manager"]), ctrl.getEmployees);
router.put("/update/:id", auth(["admin", "manager"]), ctrl.updateEmployee);
router.patch("/toggle/:id", auth(["admin", "manager"]), ctrl.toggleEmployee);
router.delete("/delete/:id", auth(["admin", "manager"]), ctrl.deleteEmployee);

module.exports = router;
