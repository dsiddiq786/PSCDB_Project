import jwt from "jsonwebtoken";
import Admin from "../DBModels/Admin.js";

export const ADMIN_COOKIE = "pscdb_admin";

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/v1/admin",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

function secret() {
  const value = process.env.ADMIN_JWT_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_JWT_SECRET must be set and at least 32 characters.");
  return value;
}

export function signAdmin(admin) {
  return jwt.sign({ sub: String(admin._id), role: admin.role }, secret(), { expiresIn: "8h", issuer: "pscdb-admin", audience: "pscdb-admin" });
}

const RANK = { staff: 1, manager: 2, superadmin: 3 };

/* Requires a signed-in, active administrator. Pass "manager" or "superadmin" to restrict a route further. */
export function requireAdmin(role) {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.[ADMIN_COOKIE];
      if (!token) return res.status(401).json({ success: false, message: "Please sign in." });
      const payload = jwt.verify(token, secret(), { issuer: "pscdb-admin", audience: "pscdb-admin" });
      const admin = await Admin.findById(payload.sub).lean();
      if (!admin || admin.active === false) return res.status(401).json({ success: false, message: "Please sign in." });
      if (role && (RANK[admin.role] || 0) < RANK[role]) {
        return res.status(403).json({ success: false, message: "You do not have permission to do this." });
      }
      req.admin = admin;
      next();
    } catch {
      res.status(401).json({ success: false, message: "Please sign in." });
    }
  };
}
