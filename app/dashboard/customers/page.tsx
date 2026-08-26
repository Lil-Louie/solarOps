import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
  .from("customers")
  .select(`
    *,
    properties (
      id,
      street,
      city,
      state,
      zip,
      panel_count,
      stories,
      roof_type,
      roof_pitch,
      notes
    )
  `)
  .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>

        <p className="mt-4 text-red-400">
          Error loading customers: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="mt-2 text-zinc-400">
            Manage Chico Solar Cleaners customers.
          </p>
        </div>

        <Link
          href="/dashboard/customers/new"
          className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          + Add Customer
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        {customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-400">No customers yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-5"
              >
                <div>
                  <p className="font-semibold">
                    {customer.first_name} {customer.last_name}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {customer.phone || "No phone"}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {customer.email || "No email"}
                  </p>
                </div>
                <Link
                    href={`/dashboard/customers/${customer.id}`}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
                  >
                    View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}