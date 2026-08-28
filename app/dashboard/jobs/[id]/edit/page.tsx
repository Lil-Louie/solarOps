import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function EditJobPage({
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
        id,
        first_name,
        last_name
      ),
      properties (
        id,
        street,
        city,
        panel_count
      )
    `)
    .eq("id", id)
    .single();

  if (error || !job) {
    notFound();
  }

  async function updateJob(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

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

    const { error } =
      await supabase
        .from("jobs")
        .update({
          scheduled_date:
            scheduledDate,

          scheduled_time:
            scheduledTime || null,

          quoted_price:
            quotedPrice
              ? Number(quotedPrice)
              : null,

          notes:
            notes || null,
        })
        .eq("id", id);

    if (error) {
      throw new Error(
        error.message
      );
    }

    redirect(
      `/dashboard/jobs/${id}`
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          Job
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Edit Job
        </h1>

        <p className="mt-2 text-zinc-400">
          {job.customers
            ?.first_name}{" "}
          {job.customers?.last_name}
        </p>
      </div>

      <form
        action={updateJob}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        {/* Customer / Property */}
        <section>
          <h2 className="text-lg font-semibold">
            Customer
          </h2>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="font-semibold">
              {job.customers
                ?.first_name}{" "}
              {job.customers
                ?.last_name}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {job.properties
                ?.street}
              {job.properties?.city
                ? `, ${job.properties.city}`
                : ""}
            </p>

            {job.properties
              ?.panel_count && (
              <p className="mt-2 text-sm text-zinc-500">
                {
                  job.properties
                    .panel_count
                }{" "}
                panels
              </p>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            Customer and property
            information is managed from
            the customer profile.
          </p>
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
                defaultValue={
                  job.scheduled_date
                }
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
                defaultValue={
                  job.scheduled_time
                    ? job.scheduled_time.slice(
                        0,
                        5
                      )
                    : ""
                }
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
                defaultValue={
                  job.quoted_price ??
                  ""
                }
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
            defaultValue={
              job.notes ?? ""
            }
            placeholder="Anything specific to this cleaning..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
          <Link
            href={`/dashboard/jobs/${id}`}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-center text-sm font-medium transition hover:bg-zinc-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}