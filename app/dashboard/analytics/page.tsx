import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
  }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  const today = new Date();

  const selectedMonth =
    params.month ??
    formatMonthForDatabase(today);

  const [yearString, monthString] =
    selectedMonth.split("-");

  const year = Number(yearString);
  const month = Number(monthString);

  const firstDayOfMonth = `${selectedMonth}-01`;

  const lastDayOfMonth =
    formatDateForDatabase(
      new Date(year, month, 0)
    );

  const { data: jobs, error } =
    await supabase
      .from("jobs")
      .select(`
        id,
        scheduled_date,
        status,
        final_price,
        quoted_price,
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
      .gte(
        "scheduled_date",
        firstDayOfMonth
      )
      .lte(
        "scheduled_date",
        lastDayOfMonth
      )
      .eq(
        "status",
        "completed"
      )
      .order(
        "scheduled_date",
        {
          ascending: true,
        }
      );

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Analytics
        </h1>

        <p className="mt-4 text-red-400">
          {error.message}
        </p>
      </div>
    );
  }

  const completedJobs =
    jobs ?? [];

  const revenue =
    completedJobs.reduce(
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

  const labor =
    completedJobs.reduce(
      (total, job) => {
        const costs =
          Array.isArray(job.job_costs)
            ? job.job_costs[0]
            : job.job_costs;

        return (
          total +
          Number(
            costs?.labor_cost ?? 0
          )
        );
      },
      0
    );

  const materialCosts =
    completedJobs.reduce(
      (total, job) => {
        const costs =
          Array.isArray(job.job_costs)
            ? job.job_costs[0]
            : job.job_costs;

        return (
          total +
          Number(
            costs?.total_cost ?? 0
          )
        );
      },
      0
    );

  const estimatedProfit =
    completedJobs.reduce(
      (total, job) => {
        const costs =
          Array.isArray(job.job_costs)
            ? job.job_costs[0]
            : job.job_costs;

        return (
          total +
          Number(
            costs?.estimated_profit ?? 0
          )
        );
      },
      0
    );

  const panelsCleaned =
    completedJobs.reduce(
      (total, job) => {
        const property =
          Array.isArray(job.properties)
            ? job.properties[0]
            : job.properties;

        return (
          total +
          Number(
            property?.panel_count ?? 0
          )
        );
      },
      0
    );

  const averageJob =
    completedJobs.length > 0
      ? revenue /
        completedJobs.length
      : 0;

  const averageProfit =
    completedJobs.length > 0
      ? estimatedProfit /
        completedJobs.length
      : 0;

  const profitMargin =
    revenue > 0
      ? (estimatedProfit /
          revenue) *
        100
      : 0;

  const previousMonthDate =
    new Date(
      year,
      month - 2,
      1
    );

  const nextMonthDate =
    new Date(
      year,
      month,
      1
    );

  const previousMonth =
    formatMonthForDatabase(
      previousMonthDate
    );

  const nextMonth =
    formatMonthForDatabase(
      nextMonthDate
    );

  const displayMonth =
    new Date(
      year,
      month - 1,
      1,
      12
    );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics
        </h1>

        <p className="mt-2 text-zinc-400">
          Track business performance
          and profitability.
        </p>
      </div>

      {/* Month Selector */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <div className="grid grid-cols-3 items-center">
          <Link
            href={`/dashboard/analytics?month=${previousMonth}`}
            className="w-fit rounded-lg px-3 py-2 text-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            ‹
          </Link>

          <div className="text-center">
            <p className="font-semibold">
              {displayMonth.toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>
          </div>

          <div className="flex justify-end">
            <Link
              href={`/dashboard/analytics?month=${nextMonth}`}
              className="rounded-lg px-3 py-2 text-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              ›
            </Link>
          </div>
        </div>
      </section>

      {/* Main Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={`$${revenue.toFixed(
            2
          )}`}
        />

        <StatCard
          label="Estimated Profit"
          value={`$${estimatedProfit.toFixed(
            2
          )}`}
        />

        <StatCard
          label="Labor"
          value={`$${labor.toFixed(
            2
          )}`}
        />

        <StatCard
          label="Material Costs"
          value={`$${materialCosts.toFixed(
            2
          )}`}
        />
      </section>

      {/* Secondary Stats */}
      <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SmallStat
          label="Jobs"
          value={String(
            completedJobs.length
          )}
        />

        <SmallStat
          label="Avg. Job"
          value={`$${averageJob.toFixed(
            2
          )}`}
        />

        <SmallStat
          label="Panels"
          value={String(
            panelsCleaned
          )}
        />

        <SmallStat
          label="Profit Margin"
          value={`${profitMargin.toFixed(
            1
          )}%`}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Completed Jobs */}
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 lg:col-span-2">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="text-lg font-semibold">
              Completed Jobs
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Revenue and profit by
              completed job.
            </p>
          </div>

          {completedJobs.length ===
          0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-medium text-zinc-300">
                No completed jobs.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Completed jobs for this
                month will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {completedJobs.map(
                (job) => {
                  const costs =
                    Array.isArray(
                      job.job_costs
                    )
                      ? job.job_costs[0]
                      : job.job_costs;

                  const property =
                    Array.isArray(
                      job.properties
                    )
                      ? job.properties[0]
                      : job.properties;

                  const jobRevenue =
                    Number(
                      job.final_price ??
                        job.quoted_price ??
                        0
                    );

                  const jobProfit =
                    Number(
                      costs?.estimated_profit ??
                        0
                    );

                  return (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="group block px-5 py-4 transition hover:bg-zinc-800/50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {formatDate(
                              job.scheduled_date
                            )}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {
                              property
                                ?.panel_count ??
                              0
                            }{" "}
                            panels
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-zinc-600">
                              Revenue
                            </p>

                            <p className="mt-1 font-semibold">
                              $
                              {jobRevenue.toFixed(
                                2
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-zinc-600">
                              Profit
                            </p>

                            <p className="mt-1 font-semibold">
                              $
                              {jobProfit.toFixed(
                                2
                              )}
                            </p>
                          </div>

                          <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
                            ›
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* Business Summary */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-lg font-semibold">
            Business Summary
          </h2>

          <div className="mt-5 space-y-4">
            <SummaryRow
              label="Revenue"
              value={`$${revenue.toFixed(
                2
              )}`}
            />

            <SummaryRow
              label="Labor"
              value={`-$${labor.toFixed(
                2
              )}`}
            />

            <SummaryRow
              label="Materials"
              value={`-$${materialCosts.toFixed(
                2
              )}`}
            />

            <div className="border-t border-zinc-800 pt-4">
              <SummaryRow
                label="Est. Profit"
                value={`$${estimatedProfit.toFixed(
                  2
                )}`}
                strong
              />
            </div>

            <SummaryRow
              label="Avg. Profit / Job"
              value={`$${averageProfit.toFixed(
                2
              )}`}
            />

            <SummaryRow
              label="Profit Margin"
              value={`${profitMargin.toFixed(
                1
              )}%`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span
        className={
          strong
            ? "font-bold"
            : "font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatMonthForDatabase(
  date: Date
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
  ].join("-");
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

function formatDate(
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
      month: "short",
      day: "numeric",
    }
  );
}