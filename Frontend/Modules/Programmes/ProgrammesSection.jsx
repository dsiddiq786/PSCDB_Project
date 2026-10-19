import { useMemo, useState } from "react";
import { Container, PageHeader, Reveal } from "../../Components/ui";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CourseCard } from "../Catalogue/CourseParts";

const labOptions = [
  { value: "ai", label: "AI Lab" },
  { value: "cyber", label: "Cyber Security Lab" },
];
const levelOptions = ["Beginner", "Intermediate", "Advanced"].map((level) => ({ value: level, label: level }));
const batchOptions = [
  { value: "morning", label: "Morning batch" },
  { value: "evening", label: "Evening batch" },
];
const sorts = [
  { value: "title", label: "Title, A to Z" },
  { value: "fee-asc", label: "Fee, low to high" },
  { value: "fee-desc", label: "Fee, high to low" },
  { value: "duration", label: "Shortest first" },
];

const weeks = (course) => Number.parseInt(course.duration, 10) || 0;

function initialLab() {
  if (typeof window === "undefined") return [];
  const lab = new URLSearchParams(window.location.search).get("lab");
  return lab === "ai" || lab === "cyber" ? [lab] : [];
}

function CheckGroup({ legend, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold text-ink">{legend}</legend>
      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm text-body">
            <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} className="h-4 w-4 accent-emerald-700" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ProgrammesSection() {
  const { courses, status } = useCatalogue();
  const [query, setQuery] = useState("");
  const [lab, setLab] = useState(initialLab);
  const [level, setLevel] = useState([]);
  const [batch, setBatch] = useState([]);
  const [sort, setSort] = useState("title");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggle = (setter) => (value) => setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = courses.filter((course) => {
      if (lab.length && !lab.includes(course.lab)) return false;
      if (level.length && !level.includes(course.level)) return false;
      if (batch.length && !course.batches.some((item) => batch.includes(item.id) && item.seatsAvailable > 0)) return false;
      if (!term) return true;
      return [course.title, course.code, course.summary, ...course.tools].some((value) => value.toLowerCase().includes(term));
    });
    const sorted = [...filtered];
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "fee-asc") sorted.sort((a, b) => a.feeUsd - b.feeUsd);
    if (sort === "fee-desc") sorted.sort((a, b) => b.feeUsd - a.feeUsd);
    if (sort === "duration") sorted.sort((a, b) => weeks(a) - weeks(b));
    return sorted;
  }, [courses, query, lab, level, batch, sort]);

  const activeCount = lab.length + level.length + batch.length + (query.trim() ? 1 : 0);
  const reset = () => {
    setQuery("");
    setLab([]);
    setLevel([]);
    setBatch([]);
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Courses" }]}
        eyebrow="Courses"
        title="Advanced courses in AI and cyber security"
        intro="Every course is taught onsite, ends with a professional skills exam and lists its fees, batches and prerequisites up front."
      />

      <section aria-label="Course catalogue" className="bg-cream-100 py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <div className="lg:hidden">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="course-filters"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink"
            >
              Filters{activeCount ? ` (${activeCount})` : ""}
              <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
            </button>
          </div>

          <aside id="course-filters" aria-label="Filter courses" className={`${filtersOpen ? "block" : "hidden"} rounded-xl border border-line bg-white p-5 lg:sticky lg:top-24 lg:block lg:self-start`}>
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-bold text-ink">Filters</p>
              {activeCount > 0 && (
                <button type="button" onClick={reset} className="text-sm font-semibold text-emerald-800 hover:underline">Clear all</button>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-6">
              <div>
                <label htmlFor="course-search" className="mb-2 block text-sm font-bold text-ink">Search</label>
                <input
                  id="course-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Course, code or tool"
                  className="h-10 w-full rounded-lg border border-line px-3 text-sm text-ink outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <CheckGroup legend="Lab" options={labOptions} selected={lab} onToggle={toggle(setLab)} />
              <CheckGroup legend="Level" options={levelOptions} selected={level} onToggle={toggle(setLevel)} />
              <CheckGroup legend="Batch with seats" options={batchOptions} selected={batch} onToggle={toggle(setBatch)} />
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-body" aria-live="polite">
                Showing <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? "course" : "courses"}
                {status === "loading" && <span className="ml-2 text-muted">· updating fees and seats</span>}
              </p>
              <label className="flex items-center gap-3 text-sm text-body">
                Sort by
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-emerald-600">
                  {sorts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            {results.length > 0 ? (
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((course, index) => (
                  <Reveal as="li" key={course.slug} delay={Math.min(index, 5) * 60}><CourseCard course={course} /></Reveal>
                ))}
              </ul>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-line bg-white p-10 text-center">
                <h2 className="font-display text-xl font-bold text-ink">No courses match these filters</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Remove a filter or change your search. Admissions can also help you choose.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={reset} className="min-h-11 rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Clear filters</button>
                  <a href="/contact" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Contact admissions</a>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
