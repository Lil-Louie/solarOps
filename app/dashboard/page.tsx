import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JobSection from "@/app/dashboard/JobSection";

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
      labor_cost,
      gas_cost,
      resin_cost,
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

    const upcomingJobs =
    selectedJobs?.filter(
      (job) =>
        job.status === "scheduled" ||
        job.status === "in_progress"
    ) ?? [];

  const completedJobs =
    selectedJobs?.filter(
      (job) => job.status === "completed"
    ) ?? [];

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
            job.job_costs?.total_cost ?? 0
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
            job.job_costs?.estimated_profit ?? 0
          )
        );
      },
      0
    );
  
  const monthlyLabor =
    completedMonthlyJobs.reduce(
      (total, job) => {
        return (
          total +
          Number(
            job.job_costs?.labor_cost ?? 0
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
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold">
                Jobs
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <JobSection
              title="Upcoming"
              count={upcomingJobs.length}
            >
              {upcomingJobs.length === 0 ? (
                <p className="border-t border-zinc-800 px-5 py-5 text-sm text-zinc-500">
                  No upcoming jobs.
                </p>
              ) : (
                <div className="divide-y divide-zinc-800 border-t border-zinc-800">
                  {upcomingJobs.map((job) => (
                    <CompactJobRow
                      key={job.id}
                      id={job.id}
                      time={
                        job.scheduled_time
                          ? formatTime(job.scheduled_time)
                          : "No time"
                      }
                      customer={`${job.customers?.first_name ?? ""} ${
                        job.customers?.last_name ?? ""
                      }`}
                      address={
                        job.properties?.street ?? "No address"
                      }
                      panels={Number(
                        job.properties?.panel_count ?? 0
                      )}
                      price={Number(
                        job.final_price ??
                          job.quoted_price ??
                          0
                      )}
                    />
                  ))}
                </div>
              )}
            </JobSection>

            <JobSection
              title="Completed"
              count={completedJobs.length}
              defaultOpen={false}
            >
              {completedJobs.length === 0 ? (
                <p className="border-t border-zinc-800 px-5 py-5 text-sm text-zinc-500">
                  No completed jobs.
                </p>
              ) : (
                <div className="divide-y divide-zinc-800 border-t border-zinc-800">
                  {completedJobs.map((job) => (
                    <CompactJobRow
                      key={job.id}
                      id={job.id}
                      time={
                        job.scheduled_time
                          ? formatTime(job.scheduled_time)
                          : "No time"
                      }
                      customer={`${job.customers?.first_name ?? ""} ${
                        job.customers?.last_name ?? ""
                      }`}
                      address={
                        job.properties?.street ?? "No address"
                      }
                      panels={Number(
                        job.properties?.panel_count ?? 0
                      )}
                      price={Number(
                        job.final_price ??
                          job.quoted_price ??
                          0
                      )}
                    />
                  ))}
                </div>
              )}
            </JobSection>
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
                label="Labor"
                value={`$${monthlyLabor.toFixed(
                  2
                )}`}
              />

              <MiniStat
                label="Material Costs"
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

function CompactJobRow({
  id,
  time,
  customer,
  address,
  panels,
  price,
}: {
  id: string;
  time: string;
  customer: string;
  address: string;
  panels: number;
  price: number;
}) {
  return (
    <Link
      href={`/dashboard/jobs/${id}`}
      className="group block px-5 py-4 transition hover:bg-zinc-800/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {customer}
          </p>

          <p className="mt-1 truncate text-sm text-zinc-500">
            {address}
          </p>
        </div>

        <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
          ›
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-600">
            Time
          </p>

          <p className="mt-1 text-sm font-medium text-zinc-300">
            {time}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-600">
            Panels
          </p>

          <p className="mt-1 text-sm font-medium text-zinc-300">
            {panels}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-600">
            Price
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            ${price.toFixed(0)}
          </p>
        </div>
      </div>
    </Link>
  );
}


function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "in_progress") {
    return (
      <span className="rounded-full border border-zinc-600 px-2.5 py-1 text-xs font-medium text-white">
        In Progress
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400">
        Completed
      </span>
    );
  }

  return (
    <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300">
      Scheduled
    </span>
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