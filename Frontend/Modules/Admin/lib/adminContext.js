import { createContext, useContext } from "react";

/* Signed-in user, shared drop-down options and notifications for the admin panel. */
export const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

const RANK = { staff: 1, manager: 2, superadmin: 3 };
export const hasRole = (me, role) => (RANK[me?.role] || 0) >= (RANK[role] || 99);
