import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select(`
      *,
      properties (*)
    `)
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const property = customer.properties?.[0];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-sm text-zinc-500">Customer</p>

        <h1 className="mt-1 text-3xl font-bold">
          {customer.first_name} {customer.last_name}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Contact Information
          </h2>

          <div className="mt-5 space-y-4">
            <Detail label="Phone" value={customer.phone} />
            <Detail label="Email" value={customer.email} />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Property
          </h2>

          {property ? (
            <div className="mt-5 space-y-4">
              <Detail
                label="Address"
                value={`${property.street}, ${property.city}, ${property.state} ${property.zip ?? ""}`}
              />

              <Detail
                label="Panels"
                value={
                  property.panel_count
                    ? String(property.panel_count)
                    : null
                }
              />

              <Detail
                label="Stories"
                value={
                  property.stories
                    ? String(property.stories)
                    : null
                }
              />

              <Detail
                label="Roof Type"
                value={property.roof_type}
              />

              <Detail
                label="Roof Pitch"
                value={property.roof_pitch}
              />
            </div>
          ) : (
            <p className="mt-5 text-zinc-500">
              No property information.
            </p>
          )}
        </section>
      </div>

      {property?.notes && (
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Notes
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-zinc-400">
            {property.notes}
          </p>
        </section>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1">
        {value || "Not provided"}
      </p>
    </div>
  );
}