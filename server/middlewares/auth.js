import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    let token = req.headers.authorization || null;
  
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized access - No token provided" })
    }

    // Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }

    // Validate JWT format (should have 2 dots = 3 parts)
    if (!token || token.split('.').length !== 3) {
        return res.status(401).json({ success: false, message: "Unauthorized access - Invalid token format" })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        // Support both 'id' (from authController) and '_id' (from adminlogin)
        const userId = decoded.id || decoded._id;
        const isAdmin = decoded.isAdmin || false;
        
        console.log('[AUTH] Token verified for user:', userId, isAdmin ? '(Admin)' : '(User)')
        
        req.user = {
            id: userId,
            _id: userId,
            email: decoded.email,
            isAdmin: isAdmin
        };
        next();
    }
    catch (error) {
        console.error("[AUTH JWT ERROR]", error.message);
        res.status(401).json({ success: false, message: "Invalid or expired token" })
    }
}

export default auth;
export { auth };
