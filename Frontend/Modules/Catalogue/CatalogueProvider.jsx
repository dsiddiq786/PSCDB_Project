import { useCallback, useEffect, useMemo, useState } from "react";
import bundled from "../Programmes/data/programmes.json";
import { api } from "../Api/client";
import { CatalogueContext } from "./catalogueContext";
import { labMeta } from "./labMeta";

const LIVE_FIELDS = ["code", "title", "lab", "level", "duration", "centre", "centreName", "centreAddress", "feeUsd", "examFeeUsd", "examIncludedByInstitute", "batches"];

/* Courses added in the admin panel have no bundled page content yet, so they get a plain page. */
function fromLive(course) {
  return {
    id: course.slug,
    ...course,
    summary: course.summary || `${course.title} is an on-site course taught in the ${labMeta[course.lab]?.name || "PSCDB labs"}, ending with a professional skills exam.`,
    outcomes: [],
    modules: [],
    tools: [],
    prerequisites: [],
    labs: [],
    projects: [],
    format: "",
    thumbnail: labMeta[course.lab]?.image || "/images/lab/ai-lab-room.jpg",
  };
}

/* Shown until the database-driven site data arrives, so the menu does not jump on load. */
const EMPTY_SITE = {
  menu: [
    { label: "Courses", kind: "link", href: "/courses", children: [] },
    { label: "Labs", kind: "labs", href: "/labs/ai", children: [] },
    { label: "Certifications", kind: "certifications", href: "/certifications", children: [] },
    { label: "Admissions", kind: "link", href: "/admissions", children: [] },
    { label: "Fees", kind: "link", href: "/fees", children: [] },
    { label: "About", kind: "link", href: "/about", children: [] },
  ],
  sections: {},
  labs: [],
  institutes: [],
  certifications: [],
};

/* Course content ships with the site. Fees, batches and seats come live from the API. */
export default function CatalogueProvider({ children }) {
  const [live, setLive] = useState(null);
  const [rate, setRate] = useState(null);
  const [status, setStatus] = useState("loading");
  const [site, setSite] = useState(EMPTY_SITE);
  const [siteStatus, setSiteStatus] = useState("loading");

  const apply = useCallback(([courses, settings, siteResult]) => {
    if (courses.aborted) return;
    if (courses.ok) {
      setLive(courses.data);
      setStatus("live");
    } else {
      setStatus("offline");
    }
    if (settings.ok) setRate(settings.data.pkrPerUsd);
    if (siteResult?.ok) {
      setSite({ ...EMPTY_SITE, ...siteResult.data });
      setSiteStatus("live");
    } else if (siteResult && !siteResult.aborted) {
      setSiteStatus("offline");
    }
  }, []);

  const fetchAll = (signal) => Promise.all([api("/courses", { signal }), api("/settings", { signal }), api("/site", { signal })]);

  const load = useCallback(() => fetchAll().then(apply), [apply]);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  const courses = useMemo(() => {
    if (!live) return bundled;
    const bySlug = new Map(live.map((course) => [course.slug, course]));
    const known = new Set(bundled.map((course) => course.slug));
    const merged = bundled
      .filter((course) => bySlug.has(course.slug))
      .map((course) => {
        const fresh = bySlug.get(course.slug);
        const next = { ...course };
        for (const field of LIVE_FIELDS) next[field] = fresh[field];
        return next;
      });
    return [...merged, ...live.filter((course) => !known.has(course.slug)).map(fromLive)];
  }, [live]);

  const value = useMemo(
    () => ({
      courses,
      rate,
      status,
      site,
      siteStatus,
      refresh: () => load(),
      findCourse: (slug) => courses.find((course) => course.slug === slug),
    }),
    [courses, rate, status, site, siteStatus, load],
  );

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}
