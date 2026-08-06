const metrics = [
  { label: "Services", value: "—", hint: "Connect your first service" },
  { label: "Deployments", value: "—", hint: "Awaiting GitHub integration" },
  { label: "Success rate", value: "—", hint: "No workflow runs yet" },
  { label: "Open alerts", value: "0", hint: "All clear" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-emerald-400 uppercase">
              DevOps Control Center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Operations overview
            </h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              A reliable foundation for deployments, service health, workflows,
              and incidents.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> System
            ready
          </span>
        </header>

        <section
          className="grid gap-4 py-8 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Dashboard metrics"
        >
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10"
            >
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <div className="mt-8 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center">
              <p className="font-medium">No deployments recorded</p>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                GitHub workflow events and deployment history will appear here
                after integration.
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-lg font-semibold">Foundation status</h2>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                "Next.js App Router",
                "MongoDB data layer",
                "Validated API routes",
                "Automated quality checks",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0"
                >
                  <span className="text-slate-300">{item}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                    Ready
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
