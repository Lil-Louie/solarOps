// app/dashboard/page.tsx

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-zinc-400">
          Your Chico Solar Cleaners operations overview.
        </p>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Jobs"
          value="3"
          subtitle="2 remaining"
        />

        <StatCard
          title="Expected Revenue"
          value="$525"
          subtitle="Today"
        />

        <StatCard
          title="Panels"
          value="58"
          subtitle="Scheduled today"
        />

        <StatCard
          title="Est. Profit"
          value="$421"
          subtitle="After job costs"
        />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* Today's Jobs */}
        <section className="xl:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <div>
                <h2 className="text-lg font-semibold">Today's Jobs</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Monday, August 24
                </p>
              </div>

              <button className="text-sm text-zinc-400 hover:text-white">
                View all
              </button>
            </div>

            <div className="divide-y divide-zinc-800">
              <JobRow
                time="9:00 AM"
                customer="John Smith"
                address="123 Main St, Chico"
                panels={18}
                price="$150"
                status="Completed"
              />

              <JobRow
                time="11:30 AM"
                customer="Maria Garcia"
                address="East Ave, Chico"
                panels={24}
                price="$200"
                status="Next"
              />

              <JobRow
                time="3:00 PM"
                customer="Robert Jones"
                address="Forest Ave, Chico"
                panels={16}
                price="$175"
                status="Scheduled"
              />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-semibold">Quick Actions</h2>

            <div className="mt-5 space-y-3">
              <button className="w-full rounded-xl bg-white px-4 py-3 text-left font-semibold text-black">
                + Schedule New Job
              </button>

              <button className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-left text-sm hover:bg-zinc-800">
                + Add Customer
              </button>

              <button className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-left text-sm hover:bg-zinc-800">
                Create Invoice
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-semibold">This Month</h2>

            <div className="mt-5 space-y-4">
              <MiniStat label="Jobs Completed" value="17" />
              <MiniStat label="Revenue" value="$3,150" />
              <MiniStat label="Avg. Job" value="$185" />
              <MiniStat label="Panels Cleaned" value="328" />
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
      <p className="text-sm text-zinc-400">{title}</p>

      <p className="mt-3 text-3xl font-bold">{value}</p>

      <p className="mt-2 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function JobRow({
  time,
  customer,
  address,
  panels,
  price,
  status,
}: {
  time: string;
  customer: string;
  address: string;
  panels: number;
  price: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <div className="min-w-20">
          <p className="font-semibold">{time}</p>
        </div>

        <div>
          <p className="font-semibold">{customer}</p>
          <p className="mt-1 text-sm text-zinc-500">{address}</p>

          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <span>{panels} panels</span>
            <span>•</span>
            <span>{price}</span>
          </div>
        </div>
      </div>

      <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-xs">
        {status}
      </span>
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
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}