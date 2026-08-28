import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{
    customer?: string;
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
    throw new Error(error.message);
  }

  async function addJob(
    formData: FormData
  ) {
    "use server";

    const supabase =
      await createClient();

    const customerId =
      formData.get(
        "customer_id"
      ) as string;

    const scheduledDate =
      formData.get(
        "scheduled_date"
      ) as string;

    const scheduledTime =
      formData.get(
        "scheduled_time"
      ) as string;

    const quotedPrice =
      formData.get(
        "quoted_price"
      ) as string;

    const notes =
      formData.get(
        "notes"
      ) as string;

    if (!customerId) {
      throw new Error(
        "Please select a customer."
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
      .single();

    if (
      propertyError ||
      !property
    ) {
      throw new Error(
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
          quotedPrice
            ? Number(
                quotedPrice
              )
            : null,

        notes:
          notes || null,
      })
      .select("id")
      .single();

    if (jobError) {
      throw new Error(
        jobError.message
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

      <form
        action={addJob}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
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
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Time
              </label>

              <input
                type="time"
                name="scheduled_time"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
                placeholder="150"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4"
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
            placeholder="Customer prefers morning, side gate unlocked, special instructions..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />
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