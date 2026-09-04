import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function JobDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      *,
      customers (
        id,
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

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  async function startJob() {
    "use server";

    const supabase = await createClient();

    const { data: currentJob, error: fetchError } =
      await supabase
        .from("jobs")
        .select("status")
        .eq("id", id)
        .single();

    if (fetchError || !currentJob) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Unable to load this job."
        )}`
      );
    }

    if (currentJob.status !== "scheduled") {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Only scheduled jobs can be started."
        )}`
      );
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "in_progress",
        start_time: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Could not start the job. Please try again."
        )}`
      );
    }

    redirect(
      `/dashboard/jobs/${id}?success=${encodeURIComponent(
        "Job started."
      )}`
    );
  }


  async function cancelJob() {
    "use server";

    const supabase = await createClient();

    const { data: currentJob, error: fetchError } =
      await supabase
        .from("jobs")
        .select("status")
        .eq("id", id)
        .single();

    if (fetchError || !currentJob) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Unable to load this job."
        )}`
      );
    }

    if (currentJob.status !== "scheduled") {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Only scheduled jobs can be cancelled."
        )}`
      );
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Could not cancel the job. Please try again."
        )}`
      );
    }

    redirect(
      `/dashboard/jobs/${id}?success=${encodeURIComponent(
        "Job cancelled."
      )}`
    );
  }


  async function saveWaterData(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const incomingTdsInput =
      String(formData.get("incoming_tds") ?? "").trim();

    const outgoingTdsInput =
      String(formData.get("outgoing_tds") ?? "").trim();

    const flowRateInput =
      String(formData.get("flow_rate") ?? "").trim();

    const incomingTds =
      incomingTdsInput === ""
        ? null
        : Number(incomingTdsInput);

    const outgoingTds =
      outgoingTdsInput === ""
        ? null
        : Number(outgoingTdsInput);

    const flowRate =
      flowRateInput === ""
        ? null
        : Number(flowRateInput);

    const values = [
      incomingTds,
      outgoingTds,
      flowRate,
    ];

    if (
      values.some(
        (value) =>
          value !== null &&
          (!Number.isFinite(value) || value < 0)
      )
    ) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Water readings must be valid non-negative numbers."
        )}`
      );
    }

    if (
      incomingTds === null &&
      outgoingTds === null &&
      flowRate === null
    ) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Enter at least one water reading before saving."
        )}`
      );
    }

    const { data: currentJob, error: jobError } =
      await supabase
        .from("jobs")
        .select("status")
        .eq("id", id)
        .single();

    if (jobError || !currentJob) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Unable to load this job."
        )}`
      );
    }

    if (currentJob.status !== "in_progress") {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Water data can only be saved while a job is in progress."
        )}`
      );
    }

    const { data: existingReading } =
      await supabase
        .from("water_readings")
        .select("id")
        .eq("job_id", id)
        .limit(1)
        .maybeSingle();

    if (existingReading) {
      const { error } = await supabase
        .from("water_readings")
        .update({
          incoming_tds: incomingTds,
          outgoing_tds: outgoingTds,
          flow_rate: flowRate,
        })
        .eq("id", existingReading.id);

      if (error) {
        redirect(
          `/dashboard/jobs/${id}?error=${encodeURIComponent(
            "Could not save water data. Please try again."
          )}`
        );
      }
    } else {
      const { error } = await supabase
        .from("water_readings")
        .insert({
          job_id: id,
          incoming_tds: incomingTds,
          outgoing_tds: outgoingTds,
          flow_rate: flowRate,
        });

      if (error) {
        redirect(
          `/dashboard/jobs/${id}?error=${encodeURIComponent(
            "Could not save water data. Please try again."
          )}`
        );
      }
    }

    redirect(
      `/dashboard/jobs/${id}?success=${encodeURIComponent(
        "Water data saved."
      )}`
    );
  }


  async function completeJob(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const finalPriceInput =
      String(formData.get("final_price") ?? "").trim();

    const milesDrivenInput =
      String(formData.get("miles_driven") ?? "").trim();

    const finishTime = new Date();

    if (!finalPriceInput) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Final price is required before completing the job."
        )}`
      );
    }

    const finalPrice = Number(finalPriceInput);

    const milesDriven =
      milesDrivenInput === ""
        ? 0
        : Number(milesDrivenInput);

    if (
      !Number.isFinite(finalPrice) ||
      finalPrice <= 0
    ) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Final price must be greater than $0."
        )}`
      );
    }

    if (
      !Number.isFinite(milesDriven) ||
      milesDriven < 0
    ) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Miles driven must be 0 or greater."
        )}`
      );
    }

      const {
        data: currentJob,
        error: jobFetchError,
      } = await supabase
        .from("jobs")
        .select(`
          start_time,
          water_readings (
            id,
            flow_rate
          )
        `)
        .eq("id", id)
        .single();

    if (jobFetchError || !currentJob) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Unable to load the current job."
        )}`
      );
    }

    if (!currentJob.start_time) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "This job has not been started yet."
        )}`
      );
    }

    const savedWaterReading =
  currentJob.water_readings?.[0];

    const flowRate = Number(
      savedWaterReading?.flow_rate ?? 0
    );

    const {
      data: currentSettings,
      error: settingsError,
    } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !currentSettings) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Business cost settings could not be loaded."
        )}`
      );
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
      const startTime = new Date(
        currentJob.start_time
      );

      durationMinutes =
        (finishTime.getTime() -
          startTime.getTime()) /
        1000 /
        60;
    }

    if (flowRate > 0) {
      gallonsUsed =
        durationMinutes * flowRate;
    }

    const laborCost = laborRate;

    const gasCost =
      vehicleMpg > 0
        ? (milesDriven / vehicleMpg) * gasPrice
        : 0;
    
    const resinCost =
      gallonsUsed * resinCostPerGallon;
    
    // Material / operating costs only
    const totalCost =
      gasCost + resinCost;
    
    // Profit after paying yourself labor
    const estimatedProfit =
      finalPrice -
      totalCost -
      laborCost;

    const { error: jobError } =
      await supabase
        .from("jobs")
        .update({
          status: "completed",
          finish_time:
            finishTime.toISOString(),
          final_price: finalPrice,
          miles_driven: milesDriven,
        })
        .eq("id", id);

    if (jobError) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "Could not complete the job. Please try again."
        )}`
      );
    }

    if (savedWaterReading?.id) {
      const { error: waterUpdateError } =
        await supabase
          .from("water_readings")
          .update({
            gallons_used: gallonsUsed,
          })
          .eq(
            "id",
            savedWaterReading.id
          );
    
      if (waterUpdateError) {
        redirect(
          `/dashboard/jobs/${id}?error=${encodeURIComponent(
            "The job was completed, but water usage could not be updated."
          )}`
        );
      }
    }

    const { error: costError } =
      await supabase
        .from("job_costs")
        .upsert(
          {
            job_id: id,

            labor_rate:
              laborRate,

            labor_cost:
              laborCost,

            vehicle_mpg:
              vehicleMpg,

            gas_price:
              gasPrice,

            gas_cost:
              gasCost,

            resin_cost_per_gallon:
              resinCostPerGallon,

            resin_cost:
              resinCost,

            total_cost:
              totalCost,

            estimated_profit:
              estimatedProfit,
          },
          {
            onConflict: "job_id",
          }
        );

    if (costError) {
      redirect(
        `/dashboard/jobs/${id}?error=${encodeURIComponent(
          "The job was completed, but job costs could not be saved."
        )}`
      );
    }

    redirect(
      `/dashboard/jobs/${id}?success=${encodeURIComponent(
        "Job completed."
      )}`
    );
  }

  const startTime = job.start_time
    ? new Date(job.start_time)
    : null;

  const finishTime = job.finish_time
    ? new Date(job.finish_time)
    : null;

  let durationMinutes: number | null =
    null;

  if (startTime && finishTime) {
    durationMinutes = Math.round(
      (finishTime.getTime() -
        startTime.getTime()) /
        1000 /
        60
    );
  }

  const waterReading =
    job.water_readings?.[0];

    const savedCosts =
    job.job_costs;

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
  laborRate;

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

// Materials / operating costs only
const totalCost = Number(
  savedCosts?.total_cost ??
    gasCost +
      resinCost
);

// Profit after material costs and labor
const estimatedProfit = Number(
  savedCosts?.estimated_profit ??
    finalPrice -
      totalCost -
      laborCost
);

  return (
    <div className="mx-auto max-w-4xl">
      {query.error && (
        <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {query.error}
        </div>
      )}

      {query.success && (
        <div className="mb-5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          {query.success}
        </div>
      )}

      {/* Header */}
      <header className="mb-5 sm:mb-6">
        <div className="min-w-0">

          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="w-full min-w-0">
              <div className="flex justify-between items-center">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  {job.customers?.first_name}{" "}
                  {job.customers?.last_name}
                </h1>
                
                {job.customers?.id && (
                <Link
                  href={`/dashboard/customers/${job.customers.id}`}
                  className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium transition hover:bg-zinc-800 sm:px-4 sm:py-2.5"
                >
                  View Customer
                </Link>
              )}
            </div>

              <p className="mt-1 truncate text-sm text-zinc-400 sm:text-base">
                {job.properties?.street},{" "}
                {job.properties?.city}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {job.properties?.panel_count ?? "?"} panels
                {" • "}
                {job.properties?.stories ?? "?"} story
              </p>
            </div>


          </div>

        </div>
      </header>

      <div className="space-y-6">
        {/* Scheduled */}
        {job.status === "scheduled" && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Ready to start
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Start the timer when
                  cleaning begins.
                </p>
              </div>
            </div>

            <form
              action={startJob}
              className="mt-5"
            >
              <button
                type="submit"
                className="w-full rounded-xl bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-zinc-200"
              >
                Start Job
              </button>
            </form>
          </section>
        )}

        {/* In Progress */}
        {job.status === "in_progress" && (
          <>
            {/* Complete Job */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Job In Progress
                </h2>

                {startTime && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Started{" "}
                    {formatDateTime(startTime)}
                  </p>
                )}
              </div>

              <form
                action={completeJob}
                className="mt-5 space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Final Price */}
                  <div>
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
                        min="0.01"
                        step="0.01"
                        required
                        inputMode="decimal"
                        defaultValue={
                          job.quoted_price
                            ? Number(
                                job.quoted_price
                              )
                            : ""
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4 outline-none transition focus:border-zinc-500"
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
                      inputMode="decimal"
                      placeholder="8.4"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-white px-5 py-4 font-semibold text-black transition hover:bg-zinc-200"
                >
                  Complete Job
                </button>
              </form>
            </section>

            {/* Water Data */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Water Data
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Record water quality and
                    flow for this job.
                  </p>
                </div>

                {waterReading && (
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                    Saved
                  </span>
                )}
              </div>

              {waterReading ? (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Detail
                    label="Incoming TDS"
                    value={
                      waterReading.incoming_tds !==
                        null &&
                      waterReading.incoming_tds !==
                        undefined
                        ? `${waterReading.incoming_tds} ppm`
                        : null
                    }
                  />

                  <Detail
                    label="Output TDS"
                    value={
                      waterReading.outgoing_tds !==
                        null &&
                      waterReading.outgoing_tds !==
                        undefined
                        ? `${waterReading.outgoing_tds} ppm`
                        : null
                    }
                  />

                  <Detail
                    label="Flow Rate"
                    value={
                      waterReading.flow_rate !==
                        null &&
                      waterReading.flow_rate !==
                        undefined
                        ? `${waterReading.flow_rate} GPM`
                        : null
                    }
                  />
                </div>
              ) : (
                <form
                  action={saveWaterData}
                  className="mt-5 space-y-5"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FieldWithUnit
                      label="Incoming TDS"
                      name="incoming_tds"
                      placeholder="327"
                      unit="ppm"
                      step="0.1"
                    />

                    <FieldWithUnit
                      label="Output TDS"
                      name="outgoing_tds"
                      placeholder="0"
                      unit="ppm"
                      step="0.1"
                    />

                    <FieldWithUnit
                      label="Flow Rate"
                      name="flow_rate"
                      placeholder="0.82"
                      unit="GPM"
                      step="0.01"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-zinc-700 px-5 py-3 font-semibold transition hover:bg-zinc-800"
                  >
                    Save Water Data
                  </button>
                </form>
              )}
            </section>
          </>
        )}

        {/* Completed Summary */}
        {job.status ===
          "completed" && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Job Summary
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Completed service
                  details and costs.
                </p>
              </div>

              <Link
                href={`/dashboard/jobs/${job.id}/invoice`}
                className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Create Invoice
              </Link>
            </div>

            {/* Main Summary */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryStat
                label="Time"
                value={
                  durationMinutes !== null
                    ? `${durationMinutes} min`
                    : "—"
                }
              />

              <SummaryStat
                label="Water"
                value={
                  waterReading?.gallons_used !==
                    null &&
                  waterReading?.gallons_used !==
                    undefined
                    ? `${Number(
                        waterReading.gallons_used
                      ).toFixed(1)} gal`
                    : "—"
                }
              />

              <SummaryStat
                label="Revenue"
                value={`$${finalPrice.toFixed(
                  2
                )}`}
              />

              <SummaryStat
                label="Profit"
                value={`$${estimatedProfit.toFixed(
                  2
                )}`}
              />
            </div>

            {/* Detailed Summary */}
            <div className="mt-6 grid gap-6 border-t border-zinc-800 pt-5 md:grid-cols-2">
              <div>
                <h3 className="mb-4 font-semibold">
                  Water
                </h3>

                <div className="space-y-3">
                  <SummaryRow
                    label="Incoming TDS"
                    value={
                      waterReading?.incoming_tds !==
                        null &&
                      waterReading?.incoming_tds !==
                        undefined
                        ? `${waterReading.incoming_tds} ppm`
                        : "—"
                    }
                  />

                  <SummaryRow
                    label="Output TDS"
                    value={
                      waterReading?.outgoing_tds !==
                        null &&
                      waterReading?.outgoing_tds !==
                        undefined
                        ? `${waterReading.outgoing_tds} ppm`
                        : "—"
                    }
                  />

                  <SummaryRow
                    label="Flow"
                    value={
                      waterReading?.flow_rate !==
                        null &&
                      waterReading?.flow_rate !==
                        undefined
                        ? `${waterReading.flow_rate} GPM`
                        : "—"
                    }
                  />

                  <SummaryRow
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
                        : "—"
                    }
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">
                  Costs
                </h3>

                <div className="space-y-3">
                  <SummaryRow
                    label="Your Labor"
                    value={`$${laborCost.toFixed(2)}`}
                  />

                  <CostRow
                    label="Gas"
                    value={gasCost}
                    negative
                  />

                  <CostRow
                    label="DI Resin"
                    value={resinCost}
                    negative
                  />

                  <div className="border-t border-zinc-800 pt-3">
                    <CostRow
                      label="Material Cost"
                      value={totalCost}
                      negative
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                    <span className="font-semibold">
                      Estimated Profit
                    </span>

                    <span className="font-bold">
                      ${estimatedProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Job Details */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex justify-between items-center gap-4 sm:gap-2">
            <h2 className="text-lg font-semibold">
              Job Details
            </h2>
            <StatusBadge status={job.status} />
            </div>

            {job.status !== "completed" &&
              job.status !== "cancelled" && (
                <Link
                  href={`/dashboard/jobs/${job.id}/edit`}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium transition hover:bg-zinc-800"
                >
                  Edit
                </Link>
              )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <Detail
              label="Date"
              value={formatJobDate(
                job.scheduled_date
              )}
            />

            <Detail
              label="Time"
              value={
                job.scheduled_time
                  ? formatJobTime(
                      job.scheduled_time
                    )
                  : null
              }
            />

            <Detail
              label="Panels"
              value={
                job.properties?.panel_count
                  ? String(
                      job.properties.panel_count
                    )
                  : null
              }
            />

            <Detail
              label="Stories"
              value={
                job.properties?.stories
                  ? String(
                      job.properties.stories
                    )
                  : null
              }
            />

            <Detail
              label="Roof"
              value={
                job.properties?.roof_type
              }
            />

            <Detail
              label="Pitch"
              value={
                job.properties?.roof_pitch
              }
            />

            <Detail
              label="Quoted"
              value={
                job.quoted_price
                  ? `$${Number(
                      job.quoted_price
                    ).toFixed(2)}`
                  : null
              }
            />

            {job.status ===
              "completed" && (
              <Detail
                label="Final"
                value={
                  job.final_price
                    ? `$${Number(
                        job.final_price
                      ).toFixed(2)}`
                    : null
                }
              />
            )}
          </div>

          {job.properties?.notes && (
            <div className="mt-5 border-t border-zinc-800 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Property Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {job.properties.notes}
              </p>
            </div>
          )}

          {job.notes && (
            <div className="mt-5 border-t border-zinc-800 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Job Notes
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {job.notes}
              </p>
            </div>
          )}
        </section>

        {job.status === "scheduled" && (
          <form
            action={cancelJob}
            className="flex justify-end"
          >
            <button
              type="submit"
              className="rounded-xl border border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/30"
            >
              Cancel Job
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex w-fit rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium capitalize text-zinc-300">
      {status.replace("_", " ")}
    </span>
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
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value || "—"}
      </p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-950 p-3 sm:p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1.5 text-base font-bold sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="text-sm font-medium">
        {value}
      </span>
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
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="text-sm font-medium">
        {negative ? "-" : ""}
        ${value.toFixed(2)}
      </span>
    </div>
  );
}

function FieldWithUnit({
  label,
  name,
  placeholder,
  unit,
  step,
}: {
  label: string;
  name: string;
  placeholder: string;
  unit: string;
  step: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <input
          type="number"
          name={name}
          min="0"
          step={step}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-16 outline-none transition focus:border-zinc-500"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
          {unit}
        </span>
      </div>
    </div>
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
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatDateTime(
  date: Date
) {
  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}