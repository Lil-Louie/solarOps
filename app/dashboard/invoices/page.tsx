import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices, error } =
    await supabase
      .from("invoices")
      .select(`
        *,
        customers (
          first_name,
          last_name
        )
      `)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Invoices
        </h1>

        <p className="mt-4 text-red-400">
          {error.message}
        </p>
      </div>
    );
  }

  const invoiceList = invoices ?? [];

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const outstandingBalance =
    invoiceList.reduce(
      (total, invoice) => {
        if (
          invoice.status === "paid" ||
          invoice.status === "cancelled"
        ) {
          return total;
        }

        return (
          total +
          Number(invoice.amount ?? 0)
        );
      },
      0
    );

  const paidThisMonth =
    invoiceList.reduce(
      (total, invoice) => {
        if (
          invoice.status !== "paid" ||
          !invoice.paid_at
        ) {
          return total;
        }

        const paidAt =
          new Date(invoice.paid_at);

        if (paidAt < startOfMonth) {
          return total;
        }

        return (
          total +
          Number(invoice.amount ?? 0)
        );
      },
      0
    );

  const draftCount =
    invoiceList.filter(
      (invoice) =>
        invoice.status === "draft"
    ).length;

  const sentCount =
    invoiceList.filter(
      (invoice) =>
        invoice.status === "sent"
    ).length;

  const paidCount =
    invoiceList.filter(
      (invoice) =>
        invoice.status === "paid"
    ).length;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Invoices
        </h1>

        <p className="mt-2 text-zinc-400">
          Track customer invoices and
          payments.
        </p>
      </div>

      {/* Summary */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <InvoiceStat
            label="Outstanding"
            value={`$${outstandingBalance.toFixed(
              2
            )}`}
          />

          <InvoiceStat
            label="Paid This Month"
            value={`$${paidThisMonth.toFixed(
              2
            )}`}
          />

          <InvoiceStat
            label="Sent"
            value={String(sentCount)}
          />

          <InvoiceStat
            label="Paid"
            value={String(paidCount)}
          />
        </div>
      </section>

      {/* Invoice List */}
      {invoiceList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
          <p className="font-medium text-zinc-300">
            No invoices yet.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Create an invoice from a
            completed job.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                All Invoices
              </h2>

              <span className="text-sm text-zinc-500">
                {invoiceList.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-zinc-800">
            {invoiceList.map(
              (invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="group block px-5 py-5 transition hover:bg-zinc-800/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold">
                          {
                            invoice.invoice_number
                          }
                        </p>

                        <StatusBadge
                          status={
                            invoice.status
                          }
                        />
                      </div>

                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {
                          invoice.customers
                            ?.first_name
                        }{" "}
                        {
                          invoice.customers
                            ?.last_name
                        }
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          $
                          {Number(
                            invoice.amount
                          ).toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {invoice.status ===
                            "paid" &&
                          invoice.paid_at
                            ? `Paid ${formatShortDate(
                                invoice.paid_at
                              )}`
                            : invoice.due_date
                            ? `Due ${formatDate(
                                invoice.due_date
                              )}`
                            : ""}
                        </p>
                      </div>

                      <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
                        ›
                      </span>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {draftCount > 0 && (
        <p className="mt-4 text-center text-xs text-zinc-600">
          {draftCount} draft{" "}
          {draftCount === 1
            ? "invoice"
            : "invoices"}
        </p>
      )}
    </div>
  );
}

function InvoiceStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const label =
    status === "paid"
      ? "Paid"
      : status === "sent"
      ? "Sent"
      : status === "cancelled"
      ? "Cancelled"
      : "Draft";

  return (
    <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
      {label}
    </span>
  );
}

function formatDate(
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
    }
  );
}

function formatShortDate(
  dateString: string
) {
  return new Date(
    dateString
  ).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}