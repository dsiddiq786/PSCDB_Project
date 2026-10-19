/* Line icons for the admin panel. Decorative: hidden from screen readers. */
const paths = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="9" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="15.5" width="7" height="5" rx="1.5" /></>,
  students: <><path d="m12 4 9 4.5-9 4.5-9-4.5Z" /><path d="M7 10.8V15c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.2M21 8.5V14" /></>,
  staff: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.9-3.3 3-5 5.5-5s4.6 1.7 5.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2c2.3 0 4 1.6 4.6 4.3" /></>,
  enrolments: <><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  courses: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" /></>,
  shifts: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  centres: <><path d="M3 20.5h18M5 20.5V8l7-4.5L19 8v12.5" /><path d="M9.5 20.5v-5h5v5M9 11h.01M15 11h.01" /></>,
  checkin: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="m8.5 12.2 2.4 2.4 4.6-4.8" /></>,
  attendance: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 17h2" /></>,
  enquiries: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  users: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" /></>,
  audit: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6Z" /><path d="M9 11.5h6M9 15h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></>,
  logout: <><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7M9.5 7V4.5h5V7" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  download: <><path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15" /></>,
  columns: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M9.5 4v16M14.5 4v16" /></>,
  filter: <path d="M4 5h16l-6 7.5V19l-4-1.5v-5Z" />,
  refresh: <><path d="M19.5 12a7.5 7.5 0 0 1-13.1 5M4.5 12a7.5 7.5 0 0 1 13.1-5" /><path d="M17.5 3.5V7H14M6.5 20.5V17H10" /></>,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  sort: <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />,
  sortUp: <path d="m8 14 4-4 4 4" />,
  sortDown: <path d="m8 10 4 4 4-4" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  money: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 9.5v.01M18 14.5v.01" /></>,
  seat: <><path d="M6.5 11V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v5" /><path d="M4.5 11h15v4.5h-15ZM6.5 15.5V20M17.5 15.5V20" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  login: <><path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" /><path d="M14 16.5 18.5 12 14 7.5M18.5 12H9" /></>,
  logoutIcon: <><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16.2v.3" /></>,
};

export default function AdminIcon({ name, className = "h-5 w-5", strokeWidth = 1.8 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
