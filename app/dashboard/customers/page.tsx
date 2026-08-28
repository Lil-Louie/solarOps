import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
  }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  const search =
    params.search?.trim() ?? "";

  let query = supabase
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
    .order("first_name", {
      ascending: true,
    })
    .order("last_name", {
      ascending: true,
    });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const {
    data: customers,
    error,
  } = await query;

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Customers
        </h1>

        <p className="mt-4 text-red-400">
          Error loading customers:{" "}
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Customers
          </h1>

          <p className="mt-2 text-zinc-400">
            Find and manage customers.
          </p>
        </div>

        <Link
          href="/dashboard/customers/new"
          className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          + Add Customer
        </Link>
      </div>

      {/* Search */}
      <form
        method="GET"
        className="mb-6"
      >
        <div className="relative">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search name, phone or email..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 pr-24 text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results Info */}
      {search && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {customers?.length ?? 0} result
            {(customers?.length ?? 0) === 1
              ? ""
              : "s"}{" "}
            for &quot;{search}&quot;
          </p>

          <Link
            href="/dashboard/customers"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            Clear
          </Link>
        </div>
      )}

      {/* Contact List */}
      {!customers ||
      customers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
          <p className="font-medium text-zinc-300">
            {search
              ? "No customers found."
              : "No customers yet."}
          </p>

          {!search && (
            <Link
              href="/dashboard/customers/new"
              className="mt-4 inline-block text-sm font-medium text-white underline"
            >
              Add your first customer
            </Link>
          )}
        </div>
      ) : (
        <CustomerList
          customers={customers}
        />
      )}
    </div>
  );
}

function CustomerList({
  customers,
}: {
  customers: any[];
}) {
  const groups = customers.reduce(
    (
      grouped: Record<string, any[]>,
      customer
    ) => {
      const letter =
        customer.first_name
          ?.charAt(0)
          .toUpperCase() || "#";

      if (!grouped[letter]) {
        grouped[letter] = [];
      }

      grouped[letter].push(customer);

      return grouped;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(
        ([letter, group]) => (
          <section key={letter}>
            {/* Letter */}
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-zinc-600">
              {letter}
            </p>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="divide-y divide-zinc-800">
                {group.map((customer) => {
                  const property =
                    customer.properties?.[0];

                  return (
                    <CustomerRow
                      key={customer.id}
                      id={customer.id}
                      name={`${customer.first_name} ${customer.last_name}`}
                      phone={customer.phone}
                      email={customer.email}
                      address={
                        property
                          ? [
                              property.street,
                              property.city,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : null
                      }
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )
      )}
    </div>
  );
}

function CustomerRow({
  id,
  name,
  phone,
  email,
  address,
}: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}) {
  return (
    <Link
      href={`/dashboard/customers/${id}`}
      className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-zinc-800/50"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">
          {name}
        </p>

        {phone && (
          <p className="mt-1 text-sm text-zinc-400">
            {phone}
          </p>
        )}

        {address ? (
          <p className="mt-1 truncate text-sm text-zinc-500">
            {address}
          </p>
        ) : email ? (
          <p className="mt-1 truncate text-sm text-zinc-500">
            {email}
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-600">
            No contact details
          </p>
        )}
      </div>

      <span className="shrink-0 text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
        ›
      </span>
    </Link>
  );
}