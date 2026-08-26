import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewJobPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
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
        stories
      )
    `)
    .order("last_name");

  async function addJob(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const customerId = formData.get("customer_id") as string;
    const propertyId = formData.get("property_id") as string;
    const scheduledDate = formData.get("scheduled_date") as string;
    const scheduledTime = formData.get("scheduled_time") as string;
    const quotedPrice = formData.get("quoted_price") as string;
    const notes = formData.get("notes") as string;

    const { error } = await supabase.from("jobs").insert({
      customer_id: customerId,
      property_id: propertyId,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || null,
      quoted_price: quotedPrice ? Number(quotedPrice) : null,
      notes: notes || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect("/dashboard/jobs");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Schedule Job</h1>

        <p className="mt-2 text-zinc-400">
          Schedule a new Chico Solar Cleaners job.
        </p>
      </div>

      <form
        action={addJob}
        className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Customer
          </label>

          <select
            name="customer_id"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          >
            <option value="">Select customer</option>

            {customers?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Property
          </label>

          <select
            name="property_id"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          >
            <option value="">Select property</option>

            {customers?.flatMap((customer) =>
              customer.properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {customer.first_name} {customer.last_name} — {property.street}
                </option>
              )) ?? []
            )}
          </select>
        </div>

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

        <div>
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

        <div>
          <label className="mb-2 block text-sm font-medium">
            Job Notes
          </label>

          <textarea
            name="notes"
            rows={4}
            placeholder="Customer prefers morning, side gate unlocked, panels on garage..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
          />
        </div>

        <div className="flex justify-end gap-3">
          <a
            href="/dashboard/jobs"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium hover:bg-zinc-800"
          >
            Cancel
          </a>

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Schedule Job
          </button>
        </div>
      </form>
    </div>
  );
}