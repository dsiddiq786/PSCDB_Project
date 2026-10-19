import { Link } from "react-router-dom";
import AdminIcon from "./AdminIcon";

/* Content header: page title on the left, breadcrumb on the right. */
export default function PageHeader({ title, crumbs = [], icon, children }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && <span className="hidden h-10 w-10 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200 sm:grid"><AdminIcon name={icon} /></span>}
        <h1 className="font-display text-2xl font-bold text-slate-800">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-slate-500">
            <li><Link to="/admin" className="text-emerald-700 hover:underline">Home</Link></li>
            {crumbs.map((crumb) => (
              <li key={crumb} className="flex items-center gap-1.5"><span aria-hidden="true" className="text-slate-300">/</span><span>{crumb}</span></li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
