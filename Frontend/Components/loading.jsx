export default function Loading({
  show = false,
  message = "Syncing",
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[#062D26]/10 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-sm border border-white/70 bg-cream-50/75 px-6 py-5 text-center shadow-lg backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="flex justify-center gap-0.5 text-2xl font-black tracking-wide text-[#0B4F3C] sm:text-3xl"
        >
          {"PSCDB".split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              style={{ animationDelay: `${index * 100}ms` }}
              className="pscdb-loader-letter inline-block"
            >
              {letter}
            </span>
          ))}
        </div>

        <p className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-[#65756A]">
          {message}
          <span className="pscdb-sync-dots" aria-hidden="true">
            ...
          </span>
        </p>

        <span className="sr-only">{message}</span>
      </div>
    </div>
  );
}