import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { api } from "../Api/client";
import { AdminContext, hasRole } from "./lib/adminContext";
import Shell from "./ui/Shell";
import { Spinner } from "./ui/kit";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CheckInDesk from "./pages/CheckInDesk";
import ResourcePage from "./pages/ResourcePage";
import Settings from "./pages/Settings";

const EMPTY_LOOKUPS = { shifts: [], centres: [], courses: [], students: [] };

/* Opens the add form when a quick action links here with ?new=1. */
function Resource({ name }) {
  const [params] = useSearchParams();
  return <ResourcePage key={name} name={name} openNew={params.get("new") === "1"} />;
}

export default function AdminApp() {
  const [me, setMe] = useState(undefined);
  const [lookups, setLookups] = useState(EMPTY_LOOKUPS);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (t) => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((list) => [...list.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismissToast(id), t.tone === "error" ? 7000 : 4500);
    },
    [dismissToast],
  );

  const refreshLookups = useCallback(() => {
    api("/admin/lookups").then((r) => r.ok && setLookups({ ...EMPTY_LOOKUPS, ...r.data }));
  }, []);

  useEffect(() => {
    // Admin pages must never be indexed by search engines.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const title = document.title;
    document.title = "PSCDB Admin";
    api("/admin/me").then((r) => {
      setMe(r.ok ? r.data : null);
      if (r.ok) refreshLookups();
    });
    return () => {
      meta.remove();
      document.title = title;
    };
  }, [refreshLookups]);

  const signedIn = (user) => {
    setMe(user);
    refreshLookups();
  };
  const signOut = async () => {
    await api("/admin/logout", { method: "POST" });
    setMe(null);
  };

  const value = useMemo(() => ({ me, lookups, refreshLookups, toast }), [me, lookups, refreshLookups, toast]);

  if (me === undefined) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f6f9] text-emerald-700"><Spinner className="h-8 w-8" /></div>;
  }
  if (!me) return <Login onSignedIn={signedIn} />;

  const guard = (role, element) => (hasRole(me, role) ? element : <Navigate to="/admin" replace />);

  return (
    <AdminContext.Provider value={value}>
      <Shell toasts={toasts} dismissToast={dismissToast} onSignOut={signOut}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="check-in" element={<CheckInDesk />} />
          {["students", "staff", "enrolments", "courses", "shifts", "centres", "attendance", "enquiries"].map((name) => (
            <Route key={name} path={name} element={<Resource name={name} />} />
          ))}
          <Route path="users" element={guard("superadmin", <Resource name="users" />)} />
          <Route path="audit" element={guard("superadmin", <Resource name="audit" />)} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Shell>
    </AdminContext.Provider>
  );
}
