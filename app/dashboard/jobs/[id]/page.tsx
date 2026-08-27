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
    ),
    job_costs (
      labor_rate,
      labor_cost,
      vehicle_mpg,
      gas_price,
      gas_cost,
      resin_cost_per_gallon,
      resin_cost,
      total_cost,
      estimated_profit
    )
  `)
  .eq("id", id)
  .single();

  if (error || !job) {
    notFound();
  }

  // Get business settings for cost calculations
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

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
  
    const finalPriceInput = formData.get("final_price") as string;
    const milesDrivenInput = formData.get("miles_driven") as string;
  
    const incomingTds = formData.get("incoming_tds") as string;
    const outgoingTds = formData.get("outgoing_tds") as string;
    const flowRateInput = formData.get("flow_rate") as string;
  
    const finishTime = new Date();
  
    const finalPrice = finalPriceInput
      ? Number(finalPriceInput)
      : 0;
  
    const milesDriven = milesDrivenInput
      ? Number(milesDrivenInput)
      : 0;
  
    const flowRate = flowRateInput
      ? Number(flowRateInput)
      : 0;
  
    // Get job start time
    const { data: currentJob, error: jobFetchError } = await supabase
      .from("jobs")
      .select("start_time")
      .eq("id", id)
      .single();
  
    if (jobFetchError) {
      throw new Error(jobFetchError.message);
    }
  
    // Get current business settings
    const { data: currentSettings, error: settingsError } =
      await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();
  
    if (settingsError) {
      throw new Error(settingsError.message);
    }
  
    const laborRate = Number(
      currentSettings?.labor_rate ?? 40
    );
  
    const vehicleMpg = Number(
      currentSettings?.vehicle_mpg ?? 0
    );
  
    const gasPrice = Number(
      currentSettings?.gas_price ?? 0
    );
  
    const resinCostPerGallon = Number(
      currentSettings?.resin_cost_per_gallon ?? 0
    );
  
    let durationMinutes = 0;
    let gallonsUsed = 0;
  
    if (currentJob.start_time) {
      const startTime = new Date(currentJob.start_time);
  
      durationMinutes =
        (finishTime.getTime() - startTime.getTime()) /
        1000 /
        60;
    }
  
    if (flowRate > 0) {
      gallonsUsed = durationMinutes * flowRate;
    }
  
    // Calculate costs
    const laborCost =
      (durationMinutes / 60) * laborRate;
  
    const gasCost =
      vehicleMpg > 0
        ? (milesDriven / vehicleMpg) * gasPrice
        : 0;
  
    const resinCost =
      gallonsUsed * resinCostPerGallon;
  
    const totalCost =
      laborCost +
      gasCost +
      resinCost;
  
    const estimatedProfit =
      finalPrice -
      totalCost;
  
    // Update job
    const { error: jobError } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        finish_time: finishTime.toISOString(),
        final_price: finalPrice,
        miles_driven: milesDriven,
      })
      .eq("id", id);
  
    if (jobError) {
      throw new Error(jobError.message);
    }
  
    // Save water data
    const { error: waterError } = await supabase
      .from("water_readings")
      .insert({
        job_id: id,
        incoming_tds: incomingTds
          ? Number(incomingTds)
          : null,
        outgoing_tds: outgoingTds
          ? Number(outgoingTds)
          : null,
        flow_rate: flowRate || null,
        gallons_used: gallonsUsed,
      });
  
    if (waterError) {
      throw new Error(waterError.message);
    }
  
    // Save the exact costs used for this job
    const { error: costError } = await supabase
      .from("job_costs")
      .upsert(
        {
          job_id: id,
  
          labor_rate: laborRate,
          labor_cost: laborCost,
  
          vehicle_mpg: vehicleMpg,
          gas_price: gasPrice,
          gas_cost: gasCost,
  
          resin_cost_per_gallon: resinCostPerGallon,
          resin_cost: resinCost,
  
          total_cost: totalCost,
          estimated_profit: estimatedProfit,
        },
        {
          onConflict: "job_id",
        }
      );
  
    if (costError) {
      throw new Error(costError.message);
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
      (finishTime.getTime() - startTime.getTime()) /
        1000 /
        60
    );
  }

  const waterReading = job.water_readings?.[0];
  const savedCosts = job.job_costs?.[0];

  // Business settings
  const laborRate = Number(
    savedCosts?.labor_rate ??
    settings?.labor_rate ??
    40
  );
  
  const vehicleMpg = Number(
    savedCosts?.vehicle_mpg ??
    settings?.vehicle_mpg ??
    0
  );
  
  const gasPrice = Number(
    savedCosts?.gas_price ??
    settings?.gas_price ??
    0
  );
  
  const resinCostPerGallon = Number(
    savedCosts?.resin_cost_per_gallon ??
    settings?.resin_cost_per_gallon ??
    0
  );
  
  const finalPrice = Number(
    job.final_price ??
    job.quoted_price ??
    0
  );
  
  const milesDriven = Number(
    job.miles_driven ?? 0
  );
  
  const gallonsUsed = Number(
    waterReading?.gallons_used ?? 0
  );
  
  const calculatedLaborCost =
    durationMinutes !== null
      ? (durationMinutes / 60) * laborRate
      : 0;
  
  const calculatedGasCost =
    vehicleMpg > 0
      ? (milesDriven / vehicleMpg) * gasPrice
      : 0;
  
  const calculatedResinCost =
    gallonsUsed * resinCostPerGallon;
  
  const laborCost = Number(
    savedCosts?.labor_cost ??
    calculatedLaborCost
  );
  
  const gasCost = Number(
    savedCosts?.gas_cost ??
    calculatedGasCost
  );
  
  const resinCost = Number(
    savedCosts?.resin_cost ??
    calculatedResinCost
  );
  
  const totalCost = Number(
    savedCosts?.total_cost ??
    laborCost + gasCost + resinCost
  );
  
  const estimatedProfit = Number(
    savedCosts?.estimated_profit ??
    finalPrice - totalCost
  );

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            Job
          </p>

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
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Customer
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Phone"
                value={
                  job.customers?.phone
                }
              />

              <Detail
                label="Email"
                value={
                  job.customers?.email
                }
              />
            </div>
          </section>

          {/* Property */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Property
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Address"
                value={`${job.properties?.street ?? ""}, ${
                  job.properties?.city ?? ""
                }, ${
                  job.properties?.state ?? ""
                } ${
                  job.properties?.zip ?? ""
                }`}
              />

              <Detail
                label="Panels"
                value={
                  job.properties
                    ?.panel_count
                    ? String(
                        job.properties
                          .panel_count
                      )
                    : null
                }
              />

              <Detail
                label="Stories"
                value={
                  job.properties?.stories
                    ? String(
                        job.properties
                          .stories
                      )
                    : null
                }
              />

              <Detail
                label="Roof Type"
                value={
                  job.properties?.roof_type
                }
              />

              <Detail
                label="Roof Pitch"
                value={
                  job.properties?.roof_pitch
                }
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

          {/* Job details */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Job Details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Scheduled Date"
                value={
                  job.scheduled_date
                }
              />

              <Detail
                label="Scheduled Time"
                value={
                  job.scheduled_time
                    ? job.scheduled_time.slice(
                        0,
                        5
                      )
                    : null
                }
              />

              <Detail
                label="Quoted Price"
                value={
                  job.quoted_price
                    ? `$${Number(
                        job.quoted_price
                      ).toFixed(2)}`
                    : null
                }
              />

              <Detail
                label="Final Price"
                value={
                  job.final_price
                    ? `$${Number(
                        job.final_price
                      ).toFixed(2)}`
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

          {/* Completed job analytics */}
          {job.status ===
            "completed" && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-semibold">
                Job Summary
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Water */}
                <div>
                  <h3 className="mb-4 font-semibold">
                    Water Data
                  </h3>

                  <div className="space-y-4">
                    <Detail
                      label="Incoming TDS"
                      value={
                        waterReading?.incoming_tds !==
                          null &&
                        waterReading?.incoming_tds !==
                          undefined
                          ? `${waterReading.incoming_tds} ppm`
                          : null
                      }
                    />

                    <Detail
                      label="Output TDS"
                      value={
                        waterReading?.outgoing_tds !==
                          null &&
                        waterReading?.outgoing_tds !==
                          undefined
                          ? `${waterReading.outgoing_tds} ppm`
                          : null
                      }
                    />

                    <Detail
                      label="Flow Rate"
                      value={
                        waterReading?.flow_rate !==
                          null &&
                        waterReading?.flow_rate !==
                          undefined
                          ? `${waterReading.flow_rate} GPM`
                          : null
                      }
                    />

                    <Detail
                      label="Water Used"
                      value={
                        waterReading?.gallons_used !==
                          null &&
                        waterReading?.gallons_used !==
                          undefined
                          ? `${Number(
                              waterReading.gallons_used
                            ).toFixed(
                              1
                            )} gallons`
                          : null
                      }
                    />
                  </div>
                </div>

                {/* Costs */}
                <div>
                  <h3 className="mb-4 font-semibold">
                    Profitability
                  </h3>

                  <div className="space-y-3">
                    <CostRow
                      label="Revenue"
                      value={
                        finalPrice
                      }
                    />

                    <CostRow
                      label="Labor"
                      value={
                        laborCost
                      }
                      negative
                    />

                    <CostRow
                      label="Gas"
                      value={gasCost}
                      negative
                    />

                    <CostRow
                      label="DI Resin"
                      value={
                        resinCost
                      }
                      negative
                    />

                    <div className="border-t border-zinc-800 pt-3">
                      <CostRow
                        label="Total Cost"
                        value={
                          totalCost
                        }
                        negative
                      />
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Estimated
                          Profit
                        </span>

                        <span className="text-xl font-bold">
                          $
                          {estimatedProfit.toFixed(
                            2
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Job Status */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Job Status
            </h2>

            {job.status ===
              "scheduled" && (
              <form
                action={startJob}
                className="mt-5"
              >
                <button
                  type="submit"
                  className="w-full rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-zinc-200"
                >
                  Start Job
                </button>
              </form>
            )}

            {job.status ===
              "in_progress" && (
              <form
                action={completeJob}
                className="mt-5 space-y-5"
              >
                <div className="border-b border-zinc-800 pb-5">
                  <h3 className="font-semibold">
                    Water Data
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Record water
                    quality and flow.
                  </p>
                </div>

                {/* Incoming TDS */}
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

                {/* Output TDS */}
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

                {/* Flow */}
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

                {/* Final price */}
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
                          ? Number(
                              job.quoted_price
                            )
                          : ""
                      }
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4"
                    />
                  </div>
                </div>

                {/* Mileage */}
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

            {job.status ===
              "completed" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-500">
                    Completed
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    Job finished
                  </p>
                </div>

                {durationMinutes !==
                  null && (
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

          {/* Timing */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold">
              Timing
            </h2>

            <div className="mt-5 space-y-4">
              <Detail
                label="Started"
                value={
                  startTime
                    ? startTime.toLocaleTimeString(
                        [],
                        {
                          hour: "numeric",
                          minute:
                            "2-digit",
                        }
                      )
                    : null
                }
              />

              <Detail
                label="Finished"
                value={
                  finishTime
                    ? finishTime.toLocaleTimeString(
                        [],
                        {
                          hour: "numeric",
                          minute:
                            "2-digit",
                        }
                      )
                    : null
                }
              />

              <Detail
                label="Duration"
                value={
                  durationMinutes !==
                  null
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
  value:
    | string
    | null
    | undefined;
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

function CostRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">
        {label}
      </span>

      <span className="font-medium">
        {negative ? "-" : ""}
        ${value.toFixed(2)}
      </span>
    </div>
  );
}