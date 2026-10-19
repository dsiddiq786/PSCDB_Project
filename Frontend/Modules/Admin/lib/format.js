/* Formatting helpers and the labels and colours used for every status in the panel. */
export const usd = (value) =>
  value === null || value === undefined ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
export const pkr = (usdValue, rate) => (rate && usdValue !== null && usdValue !== undefined ? `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(usdValue * rate))}` : "");
export const number = (value) => new Intl.NumberFormat("en-GB").format(value || 0);
export const date = (value) => (value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
export const dateTime = (value) => (value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const time = (value) => (value ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
export const dayLabel = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "");

export const LABELS = {
  paid: "Paid",
  pending_payment: "Awaiting Payment",
  expired: "Expired",
  cancelled: "Canceled",
  new: "New",
  answered: "Answered",
  active: "Active",
  suspended: "Suspended",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
  on_leave: "On Leave",
  inactive: "Inactive",
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "Leave",
  online: "Online",
  desk: "Desk",
  stripe: "Stripe",
  simulated: "Test Payment",
  manual: "Desk Payment",
  superadmin: "Superadmin",
  manager: "Manager",
  staff: "Staff",
  student: "Student",
  instructor: "Instructor",
  lab_engineer: "Lab Engineer",
  admissions: "Admissions",
  accounts: "Accounts",
  management: "Management",
  support: "Support",
  ai: "AI Lab",
  cyber: "Cyber Lab",
  administration: "Administration",
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  login: "Signed In",
  check_in: "Checked In",
  check_out: "Checked Out",
  settings: "Settings",
  enrolments: "Enrollments",
  centres: "Centers",
  enquiries: "Inquiries",
  students: "Students",
  courses: "Courses",
  shifts: "Shifts",
  attendance: "Attendance",
  users: "Users",
  programme: "Program",
  admission: "Admission",
  payment: "Payment",
  research: "Research",
  partnership: "Partnership",
  opportunity: "Opportunity",
  other: "Other",
  true: "Yes",
  false: "No",
};
export const label = (value) => LABELS[value] ?? (typeof value === "string" ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : String(value));

const GREEN = "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
const AMBER = "bg-amber-50 text-amber-800 ring-amber-600/20";
const RED = "bg-red-50 text-red-700 ring-red-600/20";
const GREY = "bg-slate-100 text-slate-600 ring-slate-500/20";
const BLUE = "bg-cyber-50 text-cyber-700 ring-cyber-600/20";
const GOLD = "bg-gold-50 text-gold-600 ring-gold-500/30";
export const TONES = {
  paid: GREEN, active: GREEN, present: GREEN, answered: GREEN, true: GREEN, graduated: BLUE, online: BLUE, stripe: BLUE, check_in: GREEN,
  pending_payment: AMBER, late: AMBER, on_leave: AMBER, new: GOLD, leave: AMBER, suspended: AMBER, update: AMBER, check_out: BLUE,
  cancelled: RED, absent: RED, delete: RED, withdrawn: RED,
  expired: GREY, inactive: GREY, false: GREY, desk: GREY, manual: GREY, simulated: GREY,
  superadmin: GOLD, manager: BLUE, staff: GREY, create: GREEN, login: GREY, settings: BLUE,
  ai: GREEN, cyber: BLUE, student: GREEN,
};

/* "staff member" -> "Staff Member", for button and dialog titles. */
export const titleWords = (text = "") => text.replace(/\b\w/g, (c) => c.toUpperCase());

export const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
