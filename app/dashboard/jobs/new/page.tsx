import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{
    customer?: string;
    error?: string;
  }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  const selectedCustomerId =
    params.customer ?? "";

  const { data: customers, error } =
    await supabase
      .from("customers")
      .select(`
        id,
        first_name,
        last_name,
        properties (
          id,
          street,
          city,
          state,
          zip,
          panel_count,
          stories,
          roof_type,
          roof_pitch
        )
      `)
      .order("last_name", {
        ascending: true,
      });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">
          Schedule Job
        </h1>

        <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          Customers could not be loaded.
          Please refresh and try again.
        </div>
      </div>
    );
  }

  async function addJob(
    formData: FormData
  ) {
    "use server";

    const supabase =
      await createClient();

    const customerId =
      String(
        formData.get(
          "customer_id"
        ) ?? ""
      ).trim();

    const scheduledDate =
      String(
        formData.get(
          "scheduled_date"
        ) ?? ""
      ).trim();

    const scheduledTime =
      String(
        formData.get(
          "scheduled_time"
        ) ?? ""
      ).trim();

    const quotedPriceInput =
      String(
        formData.get(
          "quoted_price"
        ) ?? ""
      ).trim();

    const notes =
      String(
        formData.get(
          "notes"
        ) ?? ""
      ).trim();

    function redirectWithError(
      message: string
    ): never {
      const customerParam =
        customerId
          ? `&customer=${encodeURIComponent(
              customerId
            )}`
          : "";

      redirect(
        `/dashboard/jobs/new?error=${encodeURIComponent(
          message
        )}${customerParam}`
      );
    }

    if (!customerId) {
      redirectWithError(
        "Please select a customer."
      );
    }

    if (!scheduledDate) {
      redirectWithError(
        "Please choose a date for the job."
      );
    }

    const datePattern =
      /^\d{4}-\d{2}-\d{2}$/;

    if (
      !datePattern.test(
        scheduledDate
      )
    ) {
      redirectWithError(
        "Please enter a valid job date."
      );
    }

    const [
      year,
      month,
      day,
    ] = scheduledDate
      .split("-")
      .map(Number);

    const scheduledDateObject =
      new Date(
        year,
        month - 1,
        day,
        12
      );

    const isValidDate =
      scheduledDateObject.getFullYear() ===
        year &&
      scheduledDateObject.getMonth() ===
        month - 1 &&
      scheduledDateObject.getDate() ===
        day;

    if (!isValidDate) {
      redirectWithError(
        "Please enter a valid job date."
      );
    }

    if (
      scheduledTime &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        scheduledTime
      )
    ) {
      redirectWithError(
        "Please enter a valid job time."
      );
    }

    const quotedPrice =
      quotedPriceInput === ""
        ? null
        : Number(
            quotedPriceInput
          );

    if (
      quotedPrice !== null &&
      (
        !Number.isFinite(
          quotedPrice
        ) ||
        quotedPrice < 0
      )
    ) {
      redirectWithError(
        "Quoted price must be 0 or greater."
      );
    }

    /*
      Get the property that belongs
      to the selected customer.

      This prevents a job from ever
      being connected to another
      customer's property.
    */
    const {
      data: property,
      error: propertyError,
    } = await supabase
      .from("properties")
      .select("id")
      .eq(
        "customer_id",
        customerId
      )
      .limit(1)
      .maybeSingle();

    if (
      propertyError ||
      !property
    ) {
      redirectWithError(
        "This customer does not have a property. Add property information before scheduling a job."
      );
    }

    const {
      data: newJob,
      error: jobError,
    } = await supabase
      .from("jobs")
      .insert({
        customer_id:
          customerId,

        property_id:
          property.id,

        scheduled_date:
          scheduledDate,

        scheduled_time:
          scheduledTime ||
          null,

        quoted_price:
          quotedPrice,

        notes:
          notes || null,
      })
      .select("id")
      .single();

    if (
      jobError ||
      !newJob
    ) {
      redirectWithError(
        "The job could not be scheduled. Please try again."
      );
    }

    redirect(
      `/dashboard/jobs/${newJob.id}`
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Schedule Job
        </h1>

        <p className="mt-2 text-zinc-400">
          Schedule a new Chico
          Solar Cleaners job.
        </p>
      </div>

      {params.error && (
        <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {params.error}
        </div>
      )}

      <form
        action={addJob}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
      >
        {/* Customer */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Customer
          </h2>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Customer
            </label>

            <select
              name="customer_id"
              required
              defaultValue={
                selectedCustomerId
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            >
              <option value="">
                Select customer
              </option>

              {customers?.map(
                (customer) => {
                  const property =
                    customer
                      .properties?.[0];

                  return (
                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                      disabled={
                        !property
                      }
                    >
                      {
                        customer.first_name
                      }{" "}
                      {
                        customer.last_name
                      }
                      {property
                        ?.street
                        ? ` — ${property.street}`
                        : " — No property"}
                    </option>
                  );
                }
              )}
            </select>

            <p className="mt-2 text-xs text-zinc-500">
              The customer&apos;s
              saved property will
              automatically be used
              for this job.
            </p>
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Schedule */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Schedule
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Date
              </label>

              <input
                type="date"
                name="scheduled_date"
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Time
              </label>

              <input
                type="time"
                name="scheduled_time"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Pricing */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Pricing
          </h2>

          <div className="max-w-sm">
            <label className="mb-2 block text-sm font-medium">
              Quoted Price
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                $
              </span>

              <input
                type="number"
                name="quoted_price"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="150"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4 outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Notes */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Job Notes
          </h2>

          <textarea
            name="notes"
            rows={4}
            maxLength={1000}
            placeholder="Customer prefers morning, side gate unlocked, special instructions..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Optional. Maximum 1,000
            characters.
          </p>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/jobs"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-center text-sm font-medium transition hover:bg-zinc-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Schedule Job
          </button>
        </div>
      </form>
    </div>
  );
}
