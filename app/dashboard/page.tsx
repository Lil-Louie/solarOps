import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const firstDayOfMonth = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
  
  // Today's jobs
  const { data: todaysJobs } = await supabase
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
    .eq("scheduled_date", todayString)
    .neq("status", "cancelled")
    .order("scheduled_time", {
      ascending: true,
    });

  // All jobs this month
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
    .lte("scheduled_date", todayString)
    .neq("status", "cancelled");

  const jobsToday = todaysJobs?.length ?? 0;

  const panelsToday =
    todaysJobs?.reduce((total, job) => {
      return (
        total +
        Number(job.properties?.panel_count ?? 0)
      );
    }, 0) ?? 0;

  const expectedRevenue =
    todaysJobs?.reduce((total, job) => {
      const price = Number(
        job.final_price ??
          job.quoted_price ??
          0
      );

      return total + price;
    }, 0) ?? 0;

  const completedToday =
    todaysJobs?.filter(
      (job) => job.status === "completed"
    ).length ?? 0;

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

      {/* Today's Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Jobs"
          value={String(jobsToday)}
          subtitle={`${completedToday} completed`}
        />

        <StatCard
          title="Expected Revenue"
          value={`$${expectedRevenue.toFixed(
            2
          )}`}
          subtitle="Scheduled today"
        />

        <StatCard
          title="Panels"
          value={String(panelsToday)}
          subtitle="Scheduled today"
        />

        <StatCard
          title="Completed"
          value={`${completedToday}/${jobsToday}`}
          subtitle="Jobs today"
        />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* Today's Jobs */}
        <section className="xl:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Today's Jobs
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {today.toLocaleDateString(
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

            {!todaysJobs ||
            todaysJobs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-400">
                  No jobs scheduled today.
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
                {todaysJobs.map((job) => (
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

            <div className="mt-5 space-y-3">
              <Link
                href="/dashboard/jobs/new"
                className="block w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                + Schedule New Job
              </Link>

              <Link
                href="/dashboard/customers/new"
                className="block w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm transition hover:bg-zinc-800"
              >
                + Add Customer
              </Link>

              <Link
                href="/dashboard/invoices"
                className="block w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm transition hover:bg-zinc-800"
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

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        {subtitle}
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
  const [hours, minutes] = time.split(":");

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