const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        try {
            let token;

            // Check Authorization Header
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }

            // Fallback to Cookie (for CURL/Web compatibility)
            if (!token && req.headers.cookie) {
                const cookieToken = req.headers.cookie.split(';')
                    .find(c => c.trim().startsWith('token='))
                    ?.split('=')[1];
                if (cookieToken) token = cookieToken;
            }

            if (!token) {
                return res.status(401).json({ message: "No token, authorization denied" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
            req.user = decoded;

            // Role check: Only block if user has a role and it's not in the allowed list
            // This allows backward compatibility with tokens that don't have a role field (e.g. legacy admin tokens)
            if (roles.length && req.user.role && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: "Forbidden: You don't have enough permissions" });
            }

            next();
        } catch (err) {
            res.status(401).json({ message: "Token is not valid" });
        }
    };
};

module.exports = authMiddleware;
