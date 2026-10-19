import { useState } from "react";
import { api } from "../../Api/client";
import AdminIcon from "../ui/AdminIcon";
import { Spinner, inputClass } from "../ui/kit";

export default function Login({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await api("/admin/login", { method: "POST", body: { email, password } });
    setBusy(false);
    if (!result.ok) return setError(result.message || "Sign-in failed.");
    onSignedIn(result.data);
  };

  return (
    <main className="texture-grid grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/brand/crest-768.png" alt="" className="h-20 w-20 object-contain drop-shadow-lg" />
          <p className="mt-3 font-display text-2xl font-extrabold text-white">PSCDB <span className="font-medium text-white/70">Admin</span></p>
          <p className="text-xs text-white/60">Professional Skills and Community Development Board</p>
        </div>
        <form onSubmit={submit} className="admin-pop rounded-lg border-t-[3px] border-t-gold-400 bg-white p-7 shadow-2xl">
          <h1 className="text-center text-sm text-slate-600">Sign In to Start Your Session</h1>
          <div className="mt-5 grid gap-4">
            <label className="relative block">
              <span className="sr-only">Email</span>
              <input type="email" autoComplete="username" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} h-11 pr-10`} />
              <AdminIcon name="enquiries" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
            <label className="relative block">
              <span className="sr-only">Password</span>
              <input type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} h-11 pr-10`} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-slate-400 hover:text-slate-700">
                <AdminIcon name={show ? "eye" : "users"} className="h-4 w-4" />
              </button>
            </label>
            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-60">
              {busy && <Spinner className="h-4 w-4" />}{busy ? "Signing In…" : "Sign In"}
            </button>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">Authorized staff only. Every action is recorded.</p>
        </form>
        <p className="mt-6 text-center text-xs text-white/50"><a href="/" className="hover:text-white">← Back to the Website</a></p>
      </div>
    </main>
  );
}
