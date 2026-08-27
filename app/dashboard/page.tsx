import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  // Actual current local date
  const today = new Date();

  const actualTodayString = formatDateForDatabase(today);

  // Date currently being viewed
  const selectedDateString =
    params.date ?? actualTodayString;

  const selectedDate = parseLocalDate(
    selectedDateString
  );

  // Previous / next day navigation
  const previousDate = new Date(selectedDate);
  previousDate.setDate(previousDate.getDate() - 1);

  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const previousDateString =
    formatDateForDatabase(previousDate);

  const nextDateString =
    formatDateForDatabase(nextDate);

  // Monthly stats always use the actual current month
  const firstDayOfMonth = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");

  // Jobs for selected date
  const { data: selectedJobs } = await supabase
    .from("jobs")
    .select(`
      *,
      customers (
        first_name,
        last_name
      ),
      properties (
        street,
        panel_count
      ),
      job_costs (
        total_cost,
        estimated_profit
      )
    `)
    .eq("scheduled_date", selectedDateString)
    .neq("status", "cancelled")
    .order("scheduled_time", {
      ascending: true,
    });

  // Completed jobs this month
  const { data: monthlyJobs } = await supabase
    .from("jobs")
    .select(`
      *,
      properties (
        panel_count
      ),
      job_costs (
        total_cost,
        estimated_profit
      )
    `)
    .gte("scheduled_date", firstDayOfMonth)
    .lte("scheduled_date", actualTodayString)
    .neq("status", "cancelled");

  /*
   * Selected day stats
   */

  const jobsForSelectedDay =
    selectedJobs?.length ?? 0;

  const completedForSelectedDay =
    selectedJobs?.filter(
      (job) => job.status === "completed"
    ).length ?? 0;

  const panelsForSelectedDay =
    selectedJobs?.reduce((total, job) => {
      return (
        total +
        Number(
          job.properties?.panel_count ?? 0
        )
      );
    }, 0) ?? 0;

  const revenueForSelectedDay =
    selectedJobs?.reduce((total, job) => {
      return (
        total +
        Number(
          job.final_price ??
            job.quoted_price ??
            0
        )
      );
    }, 0) ?? 0;

  /*
   * Monthly stats
   */

  const completedMonthlyJobs =
    monthlyJobs?.filter(
      (job) => job.status === "completed"
    ) ?? [];

  const monthlyRevenue =
    completedMonthlyJobs.reduce(
      (total, job) => {
        return (
          total +
          Number(
            job.final_price ??
              job.quoted_price ??
              0
          )
        );
      },
      0
    );

  const monthlyCosts =
    completedMonthlyJobs.reduce(
      (total, job) => {
        return (
          total +
          Number(
            job.job_costs?.[0]?.total_cost ??
              0
          )
        );
      },
      0
    );

  const monthlyProfit =
    completedMonthlyJobs.reduce(
      (total, job) => {
        return (
          total +
          Number(
            job.job_costs?.[0]
              ?.estimated_profit ?? 0
          )
        );
      },
      0
    );

  const monthlyPanels =
    completedMonthlyJobs.reduce(
      (total, job) => {
        return (
          total +
          Number(
            job.properties?.panel_count ?? 0
          )
        );
      },
      0
    );

  const averageJob =
    completedMonthlyJobs.length > 0
      ? monthlyRevenue /
        completedMonthlyJobs.length
      : 0;

  const isViewingToday =
    selectedDateString === actualTodayString;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-2 text-zinc-400">
          Chico Solar Cleaners operations overview.
        </p>
      </div>

      {!isViewingToday && (
            <div className="mb-3 text-center">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-zinc-500 transition hover:text-white"
              >
                Back to Today
              </Link>
            </div>
          )}

      {/* Selected Date Stats */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-1">
        {/* Date Navigation */}
        <div className="">
          <div className="grid grid-cols-3 items-center px-2">
            <Link
              href={`/dashboard?date=${previousDateString}`}
              aria-label="Previous day"
              className="flex items-center justify-start rounded-full px-4 py-2 text-2xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              «
            </Link>

            <div className="text-center">
              <p className="text-base font-semibold text-white sm:text-lg">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <Link
              href={`/dashboard?date=${nextDateString}`}
              aria-label="Next day"
              className="flex items-center justify-end rounded-full px-4 py-2 text-2xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              »
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800">
          <DashboardStat
            label="Jobs"
            value={`${completedForSelectedDay}/${jobsForSelectedDay}`}
          />

          <DashboardStat
            label="Revenue"
            value={`$${revenueForSelectedDay.toFixed(
              0
            )}`}
          />

          <DashboardStat
            label="Panels"
            value={String(
              panelsForSelectedDay
            )}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Selected Day Jobs */}
        <section className="xl:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Jobs
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {selectedDate.toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>

              <Link
                href="/dashboard/jobs"
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                View all
              </Link>
            </div>

            {!selectedJobs ||
            selectedJobs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-400">
                  No jobs scheduled for this day.
                </p>

                <Link
                  href="/dashboard/jobs/new"
                  className="mt-4 inline-block text-sm font-medium text-white underline"
                >
                  Schedule a job
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {selectedJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    id={job.id}
                    time={
                      job.scheduled_time
                        ? formatTime(
                            job.scheduled_time
                          )
                        : "No time"
                    }
                    customer={`${job.customers?.first_name ?? ""} ${
                      job.customers?.last_name ?? ""
                    }`}
                    address={
                      job.properties?.street ??
                      "No address"
                    }
                    panels={Number(
                      job.properties
                        ?.panel_count ?? 0
                    )}
                    price={Number(
                      job.final_price ??
                        job.quoted_price ??
                        0
                    )}
                    status={job.status}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Column */}
        <section className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-semibold">
              Quick Actions
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/customers/new"
                className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm transition hover:bg-zinc-800"
              >
                + Customer
              </Link>

              <Link
                href="/dashboard/invoices"
                className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm transition hover:bg-zinc-800"
              >
                Invoices
              </Link>
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-semibold">
              This Month
            </h2>

            <div className="mt-5 space-y-4">
              <MiniStat
                label="Jobs Completed"
                value={String(
                  completedMonthlyJobs.length
                )}
              />

              <MiniStat
                label="Revenue"
                value={`$${monthlyRevenue.toFixed(
                  2
                )}`}
              />

              <MiniStat
                label="Costs"
                value={`$${monthlyCosts.toFixed(
                  2
                )}`}
              />

              <MiniStat
                label="Est. Profit"
                value={`$${monthlyProfit.toFixed(
                  2
                )}`}
              />

              <MiniStat
                label="Avg. Job"
                value={`$${averageJob.toFixed(
                  2
                )}`}
              />

              <MiniStat
                label="Panels Cleaned"
                value={String(monthlyPanels)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 text-center sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 sm:text-sm">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
        {value}
      </p>
    </div>
  );
}

function JobRow({
  id,
  time,
  customer,
  address,
  panels,
  price,
  status,
}: {
  id: string;
  time: string;
  customer: string;
  address: string;
  panels: number;
  price: number;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <div className="min-w-20">
          <p className="font-semibold">
            {time}
          </p>
        </div>

        <div>
          <p className="font-semibold">
            {customer}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            {address}
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
            <span>{panels} panels</span>

            <span>•</span>

            <span>
              ${price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-xs capitalize">
          {status.replace("_", " ")}
        </span>

        <Link
          href={`/dashboard/jobs/${id}`}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium transition hover:bg-zinc-800"
        >
          View
        </Link>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

function formatTime(time: string) {
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

function formatDateForDatabase(
  date: Date
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function parseLocalDate(
  dateString: string
) {
  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}