/* Turns the database-driven menu into what the navbar renders. "certifications" and "labs"
   items get their groups from institutes, certifications, labs and courses; "link" items use
   their own sub-items. Institutes hidden from the menu are grouped under "Other Institutes". */

const certLabel = (c) => (c.code && !c.title.includes(c.code) ? `${c.code}: ${c.title}` : c.title);

function certificationGroups(site) {
  const byInstitute = new Map();
  for (const cert of site.certifications) {
    if (!byInstitute.has(cert.institute)) byInstitute.set(cert.institute, []);
    byInstitute.get(cert.institute).push(cert);
  }
  const groups = [];
  const others = [];
  for (const inst of site.institutes) {
    const certs = byInstitute.get(inst.slug) || [];
    if (!certs.length) continue;
    const children = certs.map((c) => ({ label: certLabel(c), href: `/certifications/${c.slug}`, meta: [c.level, c.category === "ai_ml" ? "AI/ML" : "Cybersecurity"].filter(Boolean).join(" · ") }));
    if (inst.showInNav) {
      groups.push({ key: inst.slug, label: inst.shortName || inst.name, href: `/certifications?institute=${inst.slug}`, logo: inst.logoUrl, children, viewLabel: `All ${inst.shortName || inst.name} Certifications` });
    } else {
      others.push(...children.map((c) => ({ ...c, meta: `${inst.shortName || inst.name}${c.meta ? ` · ${c.meta}` : ""}` })));
    }
  }
  if (others.length) groups.push({ key: "other-institutes", label: "Other Institutes", href: "/certifications", children: others, viewLabel: "All Certifications" });
  return groups;
}

function labGroups(site) {
  return site.labs.map((lab) => ({
    key: lab.slug,
    label: lab.name,
    href: `/labs/${lab.slug}`,
    children: lab.courses.map((c) => ({ label: c.title, href: `/courses/${c.slug}`, meta: c.code })),
    viewLabel: `Visit the ${lab.shortName}`,
  }));
}

export function buildMenu(site) {
  return site.menu.map((item) => {
    if (item.kind === "certifications") return { ...item, groups: certificationGroups(site), footer: { label: "View All Certifications", href: "/certifications" } };
    if (item.kind === "labs") return { ...item, groups: labGroups(site) };
    return { ...item, groups: item.children.map((c) => ({ key: c.href, label: c.label, href: c.href })) };
  });
}

/* Paths that count as "inside" a menu item, for highlighting the active one. */
export function itemMatches(item, pathname) {
  if (item.kind === "certifications") return pathname.startsWith("/certifications");
  if (item.kind === "labs") return pathname.startsWith("/labs");
  return pathname === item.href || pathname.startsWith(`${item.href}/`) || item.groups.some((g) => pathname === g.href);
}
