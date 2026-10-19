import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import MainLayout from "../MainLayout/MainLayout";
import HomePage from "../Modules/Home/HomePage";
import LabPage from "../Modules/Labs/LabPage";
import { labs } from "../Modules/Labs/labsData";
import ProgrammesSection from "../Modules/Programmes/ProgrammesSection";
import ProgrammeDetails from "../Modules/Programmes/ProgrammeDetails";
import PaymentsPage from "../Modules/Payments/PaymentsPage";
import SearchPage from "../Modules/Search/SearchPage";
import EnrolPage from "../Modules/Enrol/EnrolPage";
import ConfirmationPage from "../Modules/Enrol/ConfirmationPage";
import AboutUs from "../Components/AboutUs";
import AdmissionsPage from "../Components/Admissions";
import LeadershipPage from "../Components/BoardOfDirectors";
import CareersPage from "../Components/opportunities";
import ContactPage from "../Components/contact";
import { Container } from "../Components/ui";

import "./App.css";

// The admin panel loads only when someone opens /admin, so the public site stays light.
const AdminApp = lazy(() => import("../Modules/Admin/AdminApp"));

function LabRoute() {
  const { slug } = useParams();
  if (!labs[slug]) return <NotFoundPage />;
  return <LabPage slug={slug} />;
}

function ProgrammeRoute() {
  const { slug } = useParams();
  return <ProgrammeDetails slug={slug} />;
}

function EnrolRoute() {
  const { slug } = useParams();
  return <EnrolPage slug={slug} />;
}

/* Sends an old address to its new one, keeping the slug and the query string (such as ?ref= or ?lab=). */
function LegacyRedirect({ to, keepSlug = false }) {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${keepSlug && slug ? `/${slug}` : ""}${search}${hash}`} replace />;
}

function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] items-center bg-cream-100 py-24">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Error 404</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-ink">This Page Could Not Be Found</h1>
          <p className="mt-4 text-base leading-7 text-muted">The link may be broken or the page may have moved. Try one of the links below, or search the site.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Back to Home</a>
            <a href="/courses" className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink hover:border-emerald-700">Browse Courses</a>
            <a href="/search" className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink hover:border-emerald-700">Search</a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin/*" element={<Suspense fallback={<div className="min-h-screen bg-[#f4f6f9]" />}><AdminApp /></Suspense>} />
        <Route path="superadmin" element={<Navigate to="/admin" replace />} />
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="labs/:slug" element={<LabRoute />} />
          <Route path="courses" element={<ProgrammesSection />} />
          <Route path="courses/:slug" element={<ProgrammeRoute />} />
          <Route path="enroll/confirmation" element={<ConfirmationPage />} />
          <Route path="enroll/:slug" element={<EnrolRoute />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="leadership" element={<LeadershipPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="fees" element={<PaymentsPage />} />
          <Route path="contact" element={<ContactPage />} />
          {/* Old addresses keep working. */}
          <Route path="programmes" element={<LegacyRedirect to="/courses" />} />
          <Route path="programmes/:slug" element={<LegacyRedirect to="/courses" keepSlug />} />
          <Route path="enrol/confirmation" element={<LegacyRedirect to="/enroll/confirmation" />} />
          <Route path="enrol/:slug" element={<LegacyRedirect to="/enroll" keepSlug />} />
          <Route path="payments" element={<LegacyRedirect to="/fees" />} />
          <Route path="opportunities" element={<Navigate to="/careers" replace />} />
          <Route path="directors" element={<Navigate to="/leadership" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
