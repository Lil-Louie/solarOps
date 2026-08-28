import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/app/dashboard/invoices/[id]/print/printButton";

export default async function PrintableInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: invoice,
    error,
  } = await supabase
    .from("invoices")
    .select(`
      *,
      customers (
        first_name,
        last_name,
        phone,
        email
      ),
      jobs (
        id,
        scheduled_date,
        properties (
          street,
          city,
          state,
          zip,
          panel_count
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const property =
    invoice.jobs?.properties;

  const customerName = [
    invoice.customers?.first_name,
    invoice.customers?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const propertyAddress = [
    property?.street,
    property?.city,
    property?.state,
    property?.zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950 print:bg-white print:p-0">
      {/* Screen Actions */}
      <div className="mx-auto mb-5 flex max-w-4xl items-center justify-between print:hidden">
        <Link
          href={`/dashboard/invoices/${invoice.id}`}
          className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium transition hover:bg-zinc-50"
        >
          ← Back to Invoice
        </Link>

        <PrintButton />
      </div>

      {/* Invoice */}
      <main className="mx-auto max-w-4xl bg-white p-8 shadow-sm sm:p-12 print:max-w-none print:shadow-none">
        {/* Header */}
        <header className="flex flex-col gap-8 border-b border-zinc-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Chico Solar Cleaners
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Professional Solar Panel Cleaning
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Invoice
            </p>

            <p className="mt-1 text-2xl font-bold">
              {invoice.invoice_number}
            </p>
          </div>
        </header>

        {/* Customer + Dates */}
        <section className="grid gap-8 border-b border-zinc-200 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Bill To
            </p>

            <p className="mt-3 text-lg font-semibold">
              {customerName}
            </p>

            {propertyAddress && (
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {propertyAddress}
              </p>
            )}

            {invoice.customers?.email && (
              <p className="mt-2 text-sm text-zinc-600">
                {invoice.customers.email}
              </p>
            )}

            {invoice.customers?.phone && (
              <p className="mt-1 text-sm text-zinc-600">
                {invoice.customers.phone}
              </p>
            )}
          </div>

          <div className="space-y-3 sm:text-right">
            <InvoiceDetail
              label="Invoice Date"
              value={formatDate(
                invoice.issued_date
              )}
            />

            <InvoiceDetail
              label="Payment Due"
              value={
                invoice.due_date
                  ? formatDate(
                      invoice.due_date
                    )
                  : "Due upon receipt"
              }
            />

            <InvoiceDetail
              label="Status"
              value={formatStatus(
                invoice.status
              )}
            />
          </div>
        </section>

        {/* Service */}
        <section className="py-8">
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="grid grid-cols-[1fr_auto] gap-4 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span>Description</span>
              <span>Amount</span>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-5">
              <div>
                <p className="font-semibold">
                  Solar Panel Cleaning
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {property?.panel_count
                    ? `${property.panel_count} solar panels`
                    : "Solar panel cleaning service"}
                </p>

                {invoice.jobs?.scheduled_date && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Service date:{" "}
                    {formatDate(
                      invoice.jobs
                        .scheduled_date
                    )}
                  </p>
                )}
              </div>

              <p className="font-semibold">
                $
                {Number(
                  invoice.amount
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        {/* Total */}
        <section className="flex justify-end border-t border-zinc-200 pt-6">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">
                Total
              </span>

              <span className="font-semibold">
                $
                {Number(
                  invoice.amount
                ).toFixed(2)}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
              <span className="text-lg font-bold">
                {invoice.status ===
                "paid"
                  ? "Amount Paid"
                  : "Amount Due"}
              </span>

              <span className="text-2xl font-bold">
                $
                {Number(
                  invoice.amount
                ).toFixed(2)}
              </span>
            </div>

            {invoice.status === "paid" &&
              invoice.payment_method && (
                <p className="mt-2 text-right text-sm text-zinc-500">
                  Paid via{" "}
                  {formatPaymentMethod(
                    invoice.payment_method
                  )}
                </p>
              )}
          </div>
        </section>

        {/* Notes */}
        {invoice.notes && (
          <section className="mt-10 border-t border-zinc-200 pt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Notes
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
              {invoice.notes}
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-zinc-200 pt-6 text-center">
          <p className="font-semibold">
            Thank you for choosing Chico Solar Cleaners!
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            We appreciate your business.
          </p>
        </footer>
      </main>
    </div>
  );
}

function InvoiceDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>
    </div>
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
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatStatus(
  status: string
) {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "sent") {
    return "Sent";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Draft";
}

function formatPaymentMethod(
  method: string
) {
  const methods: Record<
    string,
    string
  > = {
    cash: "Cash",
    card: "Card",
    check: "Check",
    zelle: "Zelle",
    other: "Other",
  };

  return (
    methods[method] ??
    method
  );
}