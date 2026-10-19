import { useCallback, useEffect, useMemo, useState } from "react";
import bundled from "../Programmes/data/programmes.json";
import { api } from "../Api/client";
import { CatalogueContext } from "./catalogueContext";

const LIVE_FIELDS = ["code", "title", "level", "duration", "centre", "feeUsd", "examFeeUsd", "examIncludedByInstitute", "batches"];

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
    return bundled
      .filter((course) => bySlug.has(course.slug))
      .map((course) => {
        const fresh = bySlug.get(course.slug);
        const merged = { ...course };
        for (const field of LIVE_FIELDS) merged[field] = fresh[field];
        return merged;
      });
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
