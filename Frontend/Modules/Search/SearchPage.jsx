import { useMemo, useState } from "react";
import { Container, PageHeader } from "../../Components/ui";
import { search, suggestions } from "./searchIndex";

export default function SearchPage() {
  const initial = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") || "";
  const [query, setQuery] = useState(initial);
  const results = useMemo(() => search(query, 40), [query]);
  const trimmed = query.trim();

  const submit = (event) => {
    event.preventDefault();
    const url = new URL(window.location.href);
    if (trimmed) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <PageHeader crumbs={[{ label: "Search" }]} eyebrow="Search" title="Find a Course, Lab or Page" />

      <section aria-label="Search results" className="min-h-[50vh] bg-cream-100 py-12">
        <Container className="max-w-4xl">
          <form role="search" onSubmit={submit}>
            <label htmlFor="search-page-input" className="sr-only">Search PSCDB</label>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-2 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
              <input
                id="search-page-input"
                type="search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try “fine-tuning”, “forensics” or “fees”"
                className="h-11 w-full bg-transparent px-3 text-base text-ink outline-none placeholder:text-muted"
              />
              <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Search</button>
            </div>
          </form>

          {trimmed === "" ? (
            <div className="mt-8">
              <p className="text-sm text-muted">Popular Searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-full border border-line bg-white px-4 py-2 text-sm text-body hover:border-emerald-700">{item}</button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="mt-8">
              <p className="text-sm text-muted" aria-live="polite">{results.length} {results.length === 1 ? "result" : "results"} for “{trimmed}”</p>
              <ul className="mt-4 grid gap-3">
                {results.map((item) => (
                  <li key={item.href + item.title}>
                    <a href={item.href} className="card-lift group block rounded-xl border border-line bg-white p-5">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">{item.type}</span>
                      <span className="mt-1 block font-display text-lg font-bold text-ink group-hover:text-emerald-800">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted">{item.description}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-line bg-white p-8">
              <p aria-live="polite" className="font-display text-xl font-bold text-ink">No results for “{trimmed}”</p>
              <p className="mt-2 text-sm leading-6 text-muted">Check the spelling, use fewer words, or try a broader term such as “AI”, “cyber”, “courses” or “admissions”.</p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
