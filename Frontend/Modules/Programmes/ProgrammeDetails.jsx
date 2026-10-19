import { Container, Reveal } from "../../Components/ui";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { BatchTable, CodeTag, CourseCard, FeePanel, LabTag } from "../Catalogue/CourseParts";
import { labMeta } from "../Catalogue/labMeta";
import { seatsLeft } from "../Catalogue/pricing";
import { centreById } from "../Config/institute";

const two = (index) => String(index + 1).padStart(2, "0");

export default function ProgrammeDetails({ slug }) {
  const { courses, findCourse } = useCatalogue();
  const course = findCourse(slug);

  if (!course) {
    return (
      <section className="bg-cream-100 py-24">
        <Container className="max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold text-ink">This course is not available</h1>
          <p className="mt-3 text-muted">It may have been withdrawn or renamed.</p>
          <a href="/programmes" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Browse courses</a>
        </Container>
      </section>
    );
  }

  const left = seatsLeft(course);
  const centre = centreById(course.centre);
  const related = courses.filter((item) => item.lab === course.lab && item.slug !== slug).slice(0, 3);

  return (
    <>
      <section aria-labelledby="course-title" className="surface-dark texture-grid">
        <Container className="py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            <ol className="flex flex-wrap items-center gap-2">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li aria-hidden="true">/</li>
              <li><a href="/programmes" className="hover:text-white">Courses</a></li>
              <li aria-hidden="true">/</li>
              <li><a href={`/labs/${course.lab}`} className="hover:text-white">{labMeta[course.lab].name}</a></li>
            </ol>
          </nav>
          <div className="mt-8 max-w-3xl lg:max-w-[calc(100%-26rem)]">
            <div className="flex flex-wrap items-center gap-2">
              <CodeTag code={course.code} />
              <LabTag lab={course.lab} className="bg-white" />
            </div>
            <h1 id="course-title" className="mt-5 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">{course.title}</h1>
            <p className="mt-5 text-lg leading-8 text-white/75">{course.summary}</p>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[["Level", course.level], ["Duration", course.duration], ["Delivery", "Onsite"], ["Centre", centre?.name || "To be announced"]].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-white/50">{term}</dt>
                  <dd className="font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <div className="bg-cream-100">
        <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_380px] lg:py-16">
          <div className="flex min-w-0 flex-col gap-12">
            <Reveal>
              <figure className="overflow-hidden rounded-xl border border-line bg-white">
                <img src={course.thumbnail} alt="" width="800" height="450" className="aspect-[16/9] w-full object-cover" />
              </figure>
            </Reveal>

            <Reveal as="section" aria-labelledby="outcomes-heading">
              <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
                <h2 id="outcomes-heading" className="font-display text-2xl font-bold text-ink">What you will learn</h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {course.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-3 text-sm leading-6 text-body">
                      <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">✓</span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal as="section" aria-labelledby="batches-heading">
              <h2 id="batches-heading" className="font-display text-2xl font-bold text-ink">Batches and seats</h2>
              <p className="mt-2 text-sm text-muted">Every batch is taught onsite. Seats are limited and are updated as students enrol.</p>
              <div className="mt-5"><BatchTable course={course} /></div>
            </Reveal>

            <Reveal as="section" aria-labelledby="modules-heading">
              <h2 id="modules-heading" className="font-display text-2xl font-bold text-ink">Course content</h2>
              <ol className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {course.modules.map((module, index) => (
                  <li key={module.title}>
                    <details className="group" open={index === 0}>
                      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
                        <span className="tabular font-mono text-xs font-semibold text-emerald-700">{two(index)}</span>
                        <span className="flex-1 font-semibold text-ink">{module.title}</span>
                        <span aria-hidden="true" className="text-emerald-800 transition-transform duration-300 group-open:rotate-45">+</span>
                      </summary>
                      <p className="px-5 pb-5 pl-14 text-sm leading-6 text-muted">{module.topics}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal as="section" aria-labelledby="requirements-heading" className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-6">
                <h2 id="requirements-heading" className="font-display text-xl font-bold text-ink">Prerequisites</h2>
                <ul className="mt-4 flex flex-col gap-2 text-sm text-body">
                  {course.prerequisites.map((item) => (
                    <li key={item} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-xl font-bold text-ink">Tools you will use</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {course.tools.map((tool) => (
                    <li key={tool} className="rounded-md bg-cream-100 px-2.5 py-1 font-mono text-xs text-body">{tool}</li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal as="section" aria-labelledby="exam-heading">
              <div className="rounded-xl border border-gold-300 bg-gold-50 p-6 sm:p-8">
                <h2 id="exam-heading" className="font-display text-xl font-bold text-ink">Professional skills exam</h2>
                <p className="mt-3 text-sm leading-7 text-body">
                  This course ends with a professional skills exam. {course.examIncludedByInstitute ? "The institute covers the exam fee for this course." : "The exam fee is paid separately and is shown in the fee summary."} Format: {course.format.toLowerCase()}.
                </p>
              </div>
            </Reveal>
          </div>

          <aside aria-label="Enrolment" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-line bg-white p-6 shadow-[0_20px_40px_-28px_rgba(6,36,27,0.45)]">
              <p className="font-display text-lg font-bold text-ink">Fees</p>
              <div className="mt-2"><FeePanel course={course} /></div>
              <p className={`mt-5 text-sm font-semibold ${left > 0 ? "text-emerald-700" : "text-red-700"}`}>{left > 0 ? `${left} seats available across both batches` : "All batches are fully booked"}</p>
              <div className="mt-5 flex flex-col gap-3">
                {left > 0 ? (
                  <a href={`/enrol/${course.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800">Enrol now</a>
                ) : (
                  <a href={`/contact?topic=admission&programme=${course.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800">Join the waiting list</a>
                )}
                <a href={`/contact?topic=programme&programme=${course.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-6 text-sm font-semibold text-ink hover:border-emerald-700">Ask a question</a>
              </div>
            </div>
          </aside>
        </Container>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="bg-white py-16">
          <Container>
            <h2 id="related-heading" className="font-display text-2xl font-bold text-ink">More courses in the {labMeta[course.lab].name}</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => <Reveal as="li" key={item.slug} delay={index * 80}><CourseCard course={item} /></Reveal>)}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
