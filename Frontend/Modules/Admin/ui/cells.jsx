import { Badge } from "./kit";
import { date, dateTime, dayLabel, label, time, usd } from "../lib/format";

/* Renders one cell according to the column's type. */
export function renderCell(column, row) {
  const value = column.value ? column.value(row) : row[column.key];
  if (column.render) return column.render(row);
  if (value === null || value === undefined || value === "") return <span className="text-slate-300">—</span>;
  switch (column.type) {
    case "badge":
      return <Badge value={value} />;
    case "money":
      return <span className="tabular font-semibold text-slate-800">{usd(value)}</span>;
    case "date":
      return <span className="tabular whitespace-nowrap">{date(value)}</span>;
    case "day":
      return <span className="tabular whitespace-nowrap">{dayLabel(value)}</span>;
    case "datetime":
      return <span className="tabular whitespace-nowrap">{dateTime(value)}</span>;
    case "time":
      return <span className="tabular">{time(value)}</span>;
    case "boolean":
      return <Badge value={Boolean(value)} />;
    case "mono":
      return <span className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">{value}</span>;
    case "list":
      return <span className="whitespace-nowrap">{value.map(label).join(", ")}</span>;
    case "label":
      return label(value);
    default:
      return String(value);
  }
}

export function csvValue(column, row) {
  const value = column.csv ? column.csv(row) : column.value ? column.value(row) : row[column.key];
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (column.type === "datetime" || column.type === "time") return new Date(value).toISOString();
  if (column.type === "badge" || column.type === "label") return label(value);
  return String(value);
}
