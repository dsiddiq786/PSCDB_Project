import { useCatalogue } from "../Catalogue/catalogueContext";
import { labs } from "./labsData";

/* Lab content comes from the database (admin panel); the bundled copy covers the first load
   and supplies the decorative terminal snippet. */
export function useLab(slug) {
  const { site, siteStatus } = useCatalogue();
  const live = site.labs.find((l) => l.slug === slug);
  const bundled = labs[slug];
  if (live) return { ...(bundled || {}), ...live };
  return siteStatus === "loading" || siteStatus === "offline" ? bundled || null : null;
}
