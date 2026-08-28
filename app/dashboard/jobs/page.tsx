import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
  }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  const view =
    params.view === "history"
      ? "history"
      : "upcoming";

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  let query = supabase
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
    `);

  if (view === "upcoming") {
    query = query
      .in("status", [
        "scheduled",
        "in_progress",
      ])
      .gte("scheduled_date", todayString)
      .order("scheduled_date", {
        ascending: true,
      })
      .order("scheduled_time", {
        ascending: true,
      });
  } else {
    query = query
      .eq("status", "completed")
      .order("scheduled_date", {
        ascending: false,
      })
      .order("scheduled_time", {
        ascending: false,
      });
  }

  const {
    data: jobs,
    error,
  } = await query;

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Jobs
        </h1>

        <p className="mt-4 text-red-400">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Jobs
          </h1>

          <p className="mt-2 text-zinc-400">
            View upcoming work or review
            previous jobs.
          </p>
        </div>

        <Link
          href="/dashboard/jobs/new"
          className="w-fit rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          + Schedule Job
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <Link
            href="/dashboard/jobs?view=upcoming"
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              view === "upcoming"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Upcoming
          </Link>

          <Link
            href="/dashboard/jobs?view=history"
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              view === "history"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            History
          </Link>
        </div>
      </div>

      {/* Section Heading */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {view === "upcoming"
            ? "Upcoming Jobs"
            : "Completed Jobs"}
        </h2>

        <span className="text-sm text-zinc-600">
          {jobs?.length ?? 0}
        </span>
      </div>

      {/* Jobs */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {!jobs || jobs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-zinc-300">
              {view === "upcoming"
                ? "No upcoming jobs."
                : "No completed jobs yet."}
            </p>

            {view === "upcoming" && (
              <>
                <p className="mt-2 text-sm text-zinc-500">
                  Schedule your next cleaning
                  to see it here.
                </p>

                <Link
                  href="/dashboard/jobs/new"
                  className="mt-5 inline-block rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-800"
                >
                  Schedule Job
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {jobs.map((job) => (
              <JobRow
                key={job.id}
                id={job.id}
                customer={`${job.customers?.first_name ?? ""} ${
                  job.customers?.last_name ?? ""
                }`}
                address={[
                  job.properties?.street,
                  job.properties?.city,
                ]
                  .filter(Boolean)
                  .join(", ")}
                date={job.scheduled_date}
                time={job.scheduled_time}
                panels={Number(
                  job.properties?.panel_count ??
                    0
                )}
                price={Number(
                  job.final_price ??
                    job.quoted_price ??
                    0
                )}
                status={job.status}
                view={view}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobRow({
  id,
  customer,
  address,
  date,
  time,
  panels,
  price,
  status,
  view,
}: {
  id: string;
  customer: string;
  address: string;
  date: string;
  time: string | null;
  panels: number;
  price: number;
  status: string;
  view: "upcoming" | "history";
}) {
  return (
    <Link
      href={`/dashboard/jobs/${id}`}
      className="group block px-5 py-5 transition hover:bg-zinc-800/50 sm:px-6"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Main Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="truncate text-lg font-semibold text-white">
              {customer}
            </h3>

            {status === "in_progress" && (
              <span className="rounded-full border border-zinc-600 px-2.5 py-1 text-xs font-medium text-white">
                In Progress
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-zinc-500">
            {address || "No address"}
          </p>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">
              {formatJobDate(date)}
            </span>

            {time && (
              <>
                <span className="text-zinc-700">
                  •
                </span>

                <span>
                  {formatJobTime(time)}
                </span>
              </>
            )}

            <span className="text-zinc-700">
              •
            </span>

            <span>
              {panels} panels
            </span>

            <span className="text-zinc-700">
              •
            </span>

            <span className="font-medium text-zinc-300">
              ${price.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex shrink-0 items-center gap-3">
          {view === "history" && (
            <span className="hidden rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500 sm:inline-flex">
              Completed
            </span>
          )}

          <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
            ›
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatJobDate(
  dateString: string
) {
  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    12
  );

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );
}

function formatJobTime(
  time: string
) {
  const [hours, minutes] =
    time.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}