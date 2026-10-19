import { useState } from "react";
import { useStudent } from "../../Context/studentContext";
import enrollmentConfig from "./data/enrollmentConfig.json";
import EnrollmentContractChallan from "./EnrollmentContractChallan";

function ModeCard({ mode, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group rounded-md border p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[#167A62]/20 ${
        selected
          ? "border-[#167A62] bg-[#EFF7E9] shadow-md"
          : "border-[#E5EBE3] bg-cream-50 hover:border-[#B8C9B6]"
      }`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-md bg-[#0B4F3C] text-xl text-[#D6F28D]">
        {mode === "remote" ? "⌂" : "⌖"}
      </span>

      <h2 className="mt-5 text-xl font-bold text-[#173A30]">
        {enrollmentConfig.modes[mode].label}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#718077]">
        {enrollmentConfig.modes[mode].description}
      </p>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#176247]">
        Choose this option
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

export default function ProgrammeEnrollment({ programme, onBack }) {
  const { studentProfile } = useStudent();
  const [selectedMode, setSelectedMode] = useState(null);
  const [preparedPayload, setPreparedPayload] = useState(null);

  const student = studentProfile || {};
  const studentInfo = student.profile || {};

  function prepareEnrollment({ acceptedContract }) {
    if (!student._id && !student.id) {
      return {
        success: false,
        message: "Your student profile could not be loaded. Please try again.",
      };
    }

    const payload = {
      studentId: student._id || student.id,
      programme: {
        id: programme.id,
        slug: programme.slug,
        title: programme.title,
        category: programme.category,
        duration: programme.duration,
        timing: programme.timing,
        creditHours: programme.creditHours,
      },
      attendanceMode: selectedMode,
      studentSnapshot: {
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        age: studentInfo.age,
        gender: studentInfo.gender,
        location: studentInfo.location,
        latestEducation: studentInfo.latestEducation,
      },
      contractAccepted: acceptedContract,
      paymentStatus: "pending",
      enrollmentStatus: "draft",
      createdAt: new Date().toISOString(),
    };

    setPreparedPayload(payload);
    console.log("Enrollment payload (not sent to backend):", payload);

    return { success: true, payload };
  }

  if (preparedPayload) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <div className="rounded-md border border-[#DCE9D4] bg-cream-50 p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EAF4E2] text-2xl font-bold text-[#167A62]">
            ✓
          </span>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#608B3E]">
            Enrollment payload prepared
          </p>

          <h1 className="mt-2 text-2xl font-bold text-[#173A30]">
            {programme.title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#718077]">
            Your selection and contract confirmation are saved in component
            state and the browser console. Nothing has been submitted to the
            backend yet.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-xl bg-[#176247] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B4F3C]"
          >
            Back to programs
          </button>
        </div>
      </section>
    );
  }

  if (selectedMode) {
    return (
      <EnrollmentContractChallan
        programme={programme}
        mode={selectedMode}
        student={student}
        config={enrollmentConfig}
        onBack={() => setSelectedMode(null)}
        onPrepare={prepareEnrollment}
      />
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#176247] hover:text-[#0B4F3C]"
      >
        <span aria-hidden="true">←</span> Back to programs
      </button>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#608B3E]">
          {programme.category}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#173A30] sm:text-4xl">
          Choose how you want to learn
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#718077]">
          You selected <strong>{programme.title}</strong>. Choose remote
          learning or attend classes at a PSCDB center.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <ModeCard
          mode="remote"
          selected={selectedMode === "remote"}
          onSelect={() => setSelectedMode("remote")}
        />
        <ModeCard
          mode="centre"
          selected={selectedMode === "centre"}
          onSelect={() => setSelectedMode("centre")}
        />
      </div>

      <p className="mt-5 text-xs leading-5 text-[#829087]">
        Your name and contact details will come from your saved student
        profile; you do not need to enter them again.
      </p>
    </section>
  );
}