import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
    *,
    customers (
      first_name,
      last_name,
      phone,
      email
    ),
    properties (
      street,
      city,
      state,
      zip,
      panel_count,
      stories,
      roof_type,
      roof_pitch,
      notes
    ),
    water_readings (
      incoming_tds,
      outgoing_tds,
      flow_rate,
      gallons_used
    )
  `)
    .eq("id", id)
    .single();

  if (error || !job) {
    notFound();
  }

  async function startJob() {
    "use server";

    const supabase = await createClient();

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "in_progress",
        start_time: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    redirect(`/dashboard/jobs/${id}`);
  }

  async function completeJob(formData: FormData) {
    "use server";
  
    const supabase = await createClient();
  
    const finalPrice = formData.get("final_price") as string;
    const milesDriven = formData.get("miles_driven") as string;
  
    const incomingTds = formData.get("incoming_tds") as string;
    const outgoingTds = formData.get("outgoing_tds") as string;
    const flowRate = formData.get("flow_rate") as string;
  
    const finishTime = new Date();
  
    const { data: currentJob, error: jobFetchError } = await supabase
      .from("jobs")
      .select("start_time")
      .eq("id", id)
      .single();
  
    if (jobFetchError) {
      throw new Error(jobFetchError.message);
    }
  
    let gallonsUsed: number | null = null;
  
    if (currentJob.start_time && flowRate) {
      const startTime = new Date(currentJob.start_time);
  
      const durationMinutes =
        (finishTime.getTime() - startTime.getTime()) /
        1000 /
        60;
  
      gallonsUsed = durationMinutes * Number(flowRate);
    }
  
    const { error: jobError } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        finish_time: finishTime.toISOString(),
        final_price: finalPrice ? Number(finalPrice) : null,
        miles_driven: milesDriven ? Number(milesDriven) : null,
      })
      .eq("id", id);
  
    if (jobError) {
      throw new Error(jobError.message);
    }
  
    const { error: waterError } = await supabase
      .from("water_readings")
      .insert({
        job_id: id,
        incoming_tds: incomingTds ? Number(incomingTds) : null,
        outgoing_tds: outgoingTds ? Number(outgoingTds) : null,
        flow_rate: flowRate ? Number(flowRate) : null,
        gallons_used: gallonsUsed,
      });
  
    if (waterError) {
      throw new Error(waterError.message);
    }
  
    redirect(`/dashboard/jobs/${id}`);
    }


  const startTime = job.start_time
    ? new Date(job.start_time)
    : null;

  const finishTime = job.finish_time
    ? new Date(job.finish_time)
    : null;

  let durationMinutes: number | null = null;

  if (startTime && finishTime) {
    durationMinutes = Math.round(
      (finishTime.getTime() - startTime.getTime()) / 1000 / 60
    );
  }

  const waterReading = job.water_readings?.[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Job</p>

          <h1 className="mt-1 text-3xl font-bold">
            {job.customers?.first_name}{" "}
            {job.customers?.last_name}
          </h1>

          <p className="mt-2 text-zinc-400">
            {job.properties?.street},{" "}
            {job.properties?.city}
          </p>
        </div>

        <span className="w-fit rounded-full border border-zinc-700 px-4 py-2 text-sm capitalize">
          {job.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Customer
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Phone"
                value={job.customers?.phone}
              />

              <Detail
                label="Email"
                value={job.customers?.email}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Property
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Address"
                value={`${job.properties?.street ?? ""}, ${
                  job.properties?.city ?? ""
                }, ${job.properties?.state ?? ""} ${
                  job.properties?.zip ?? ""
                }`}
              />

              <Detail
                label="Panels"
                value={
                  job.properties?.panel_count
                    ? String(job.properties.panel_count)
                    : null
                }
              />

              <Detail
                label="Stories"
                value={
                  job.properties?.stories
                    ? String(job.properties.stories)
                    : null
                }
              />

              <Detail
                label="Roof Type"
                value={job.properties?.roof_type}
              />

              <Detail
                label="Roof Pitch"
                value={job.properties?.roof_pitch}
              />
            </div>

            {job.properties?.notes && (
              <div className="mt-6 border-t border-zinc-800 pt-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Property Notes
                </p>

                <p className="mt-2 text-zinc-300">
                  {job.properties.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Job Details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Scheduled Date"
                value={job.scheduled_date}
              />

              <Detail
                label="Scheduled Time"
                value={
                  job.scheduled_time
                    ? job.scheduled_time.slice(0, 5)
                    : null
                }
              />

              <Detail
                label="Quoted Price"
                value={
                  job.quoted_price
                    ? `$${Number(job.quoted_price).toFixed(2)}`
                    : null
                }
              />

              <Detail
                label="Final Price"
                value={
                  job.final_price
                    ? `$${Number(job.final_price).toFixed(2)}`
                    : null
                }
              />
            </div>

            {job.notes && (
              <div className="mt-6 border-t border-zinc-800 pt-5">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Job Notes
                </p>

                <p className="mt-2 text-zinc-300">
                  {job.notes}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Job Status
            </h2>

            {job.status === "scheduled" && (
              <form action={startJob} className="mt-5">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200"
                >
                  Start Job
                </button>
              </form>
            )}

            {job.status === "in_progress" && (
            <form
                action={completeJob}
                className="mt-5 space-y-5"
            >
                <div className="border-b border-zinc-800 pb-5">
                <h3 className="font-semibold">Water Data</h3>

                <p className="mt-1 text-sm text-zinc-500">
                    Record your water quality and flow.
                </p>
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">
                    Incoming TDS
                </label>

                <div className="relative">
                    <input
                    type="number"
                    name="incoming_tds"
                    min="0"
                    step="0.1"
                    placeholder="327"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-16"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    ppm
                    </span>
                </div>
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">
                    Output TDS
                </label>

                <div className="relative">
                    <input
                    type="number"
                    name="outgoing_tds"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-16"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    ppm
                    </span>
                </div>
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">
                    Flow Rate
                </label>

                <div className="relative">
                    <input
                    type="number"
                    name="flow_rate"
                    min="0"
                    step="0.01"
                    placeholder="0.82"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-20"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    GPM
                    </span>
                </div>
                </div>

                <div className="border-t border-zinc-800 pt-5">
                <label className="mb-2 block text-sm font-medium">
                    Final Price
                </label>

                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                    </span>

                    <input
                    type="number"
                    name="final_price"
                    min="0"
                    step="0.01"
                    defaultValue={
                        job.quoted_price
                        ? Number(job.quoted_price)
                        : ""
                    }
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4"
                    />
                </div>
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium">
                    Miles Driven
                </label>

                <input
                    type="number"
                    name="miles_driven"
                    min="0"
                    step="0.1"
                    placeholder="8.4"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
                />
                </div>

                <button
                type="submit"
                className="w-full rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200"
                >
                Complete Job
                </button>
            </form>
            )}

            {job.status === "completed" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-500">
                    Completed
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    Job finished
                  </p>
                </div>

                {durationMinutes !== null && (
                  <Detail
                    label="Cleaning Time"
                    value={`${durationMinutes} minutes`}
                  />
                )}

                <Detail
                  label="Miles Driven"
                  value={
                    job.miles_driven
                      ? `${job.miles_driven} miles`
                      : null
                  }
                />

                <Link
                  href={`/dashboard/jobs/${job.id}/invoice`}
                  className="block w-full rounded-xl border border-zinc-700 px-5 py-3 text-center text-sm font-medium hover:bg-zinc-800"
                >
                  Create Invoice
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Timing
            </h2>

            <div className="mt-5 space-y-4">
              <Detail
                label="Started"
                value={
                  startTime
                    ? startTime.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : null
                }
              />

              <Detail
                label="Finished"
                value={
                  finishTime
                    ? finishTime.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : null
                }
              />

              <Detail
                label="Duration"
                value={
                  durationMinutes !== null
                    ? `${durationMinutes} min`
                    : null
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value || "Not provided"}
      </p>
    </div>
  );
}