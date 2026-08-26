import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      *,
      customers (
        first_name,
        last_name,
        phone
      ),
      properties (
        street,
        city,
        state,
        zip,
        panel_count,
        stories
      )
    `)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="mt-4 text-red-400">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>

          <p className="mt-2 text-zinc-400">
            Manage upcoming and completed jobs.
          </p>
        </div>

        <Link
          href="/dashboard/jobs/new"
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          + Schedule Job
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        {!jobs || jobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-400">No jobs scheduled yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {job.customers?.first_name}{" "}
                    {job.customers?.last_name}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {job.properties?.street}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
                    <span>{job.scheduled_date}</span>

                    {job.scheduled_time && (
                      <>
                        <span>•</span>
                        <span>
                          {job.scheduled_time.slice(0, 5)}
                        </span>
                      </>
                    )}

                    {job.properties?.panel_count && (
                      <>
                        <span>•</span>
                        <span>
                          {job.properties.panel_count} panels
                        </span>
                      </>
                    )}

                    {job.quoted_price && (
                      <>
                        <span>•</span>
                        <span>
                          ${Number(job.quoted_price).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs capitalize">
                    {job.status.replace("_", " ")}
                  </span>

                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}