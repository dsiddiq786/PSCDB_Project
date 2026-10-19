import { useCallback, useEffect, useMemo, useState } from "react";
import bundled from "../Programmes/data/programmes.json";
import { api } from "../Api/client";
import { CatalogueContext } from "./catalogueContext";
import { labMeta } from "./labMeta";

const LIVE_FIELDS = ["code", "title", "level", "duration", "centre", "centreName", "centreAddress", "feeUsd", "examFeeUsd", "examIncludedByInstitute", "batches"];

/* Courses added in the admin panel have no bundled page content yet, so they get a plain page. */
function fromLive(course) {
  return {
    id: course.slug,
    ...course,
    summary: course.summary || `${course.title} is an onsite course taught in the ${labMeta[course.lab]?.name || "PSCDB labs"}, ending with a professional skills exam.`,
    outcomes: [],
    modules: [],
    tools: [],
    prerequisites: [],
    format: "",
    thumbnail: labMeta[course.lab]?.image || "/images/lab/ai-lab-room.jpg",
  };
}

/* Course content ships with the site. Fees, batches and seats come live from the API. */
export default function CatalogueProvider({ children }) {
  const [live, setLive] = useState(null);
  const [rate, setRate] = useState(null);
  const [status, setStatus] = useState("loading");

  const apply = useCallback(([courses, settings]) => {
    if (courses.aborted) return;
    if (courses.ok) {
      setLive(courses.data);
      setStatus("live");
    } else {
      setStatus("offline");
    }
    if (settings.ok) setRate(settings.data.pkrPerUsd);
  }, []);

  const fetchAll = (signal) => Promise.all([api("/courses", { signal }), api("/settings", { signal })]);

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
      refresh: () => load(),
      findCourse: (slug) => courses.find((course) => course.slug === slug),
    }),
    [courses, rate, status, load],
  );

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}
