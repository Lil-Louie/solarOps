import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function InvoicePage({
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

  const {
    data: invoice,
    error,
  } = await supabase
    .from("invoices")
    .select(`
      *,
      customers (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      jobs (
        id,
        scheduled_date,
        final_price,
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

  async function markSent() {
    "use server";

    const supabase = await createClient();

    const {
      data: currentInvoice,
      error: fetchError,
    } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !currentInvoice) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Unable to load this invoice."
        )}`
      );
    }

    if (currentInvoice.status !== "draft") {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Only draft invoices can be marked as sent."
        )}`
      );
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "sent",
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Could not mark the invoice as sent. Please try again."
        )}`
      );
    }

    redirect(
      `/dashboard/invoices/${id}?success=${encodeURIComponent(
        "Invoice marked as sent."
      )}`
    );
  }

  async function markPaid(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const paymentMethod =
      String(
        formData.get(
          "payment_method"
        ) ?? ""
      ).trim();

    const allowedPaymentMethods = [
      "cash",
      "card",
      "check",
      "zelle",
      "other",
    ];

    if (
      !allowedPaymentMethods.includes(
        paymentMethod
      )
    ) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Please select a valid payment method."
        )}`
      );
    }

    const {
      data: currentInvoice,
      error: fetchError,
    } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !currentInvoice) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Unable to load this invoice."
        )}`
      );
    }

    if (
      currentInvoice.status === "paid"
    ) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "This invoice is already marked as paid."
        )}`
      );
    }

    if (
      currentInvoice.status ===
      "cancelled"
    ) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "A cancelled invoice cannot be marked as paid."
        )}`
      );
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at:
          new Date().toISOString(),
        payment_method:
          paymentMethod,
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Could not mark the invoice as paid. Please try again."
        )}`
      );
    }

    redirect(
      `/dashboard/invoices/${id}?success=${encodeURIComponent(
        "Invoice marked as paid."
      )}`
    );
  }

  async function cancelInvoice() {
    "use server";

    const supabase = await createClient();

    const {
      data: currentInvoice,
      error: fetchError,
    } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !currentInvoice) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Unable to load this invoice."
        )}`
      );
    }

    if (
      currentInvoice.status === "paid"
    ) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Paid invoices cannot be cancelled."
        )}`
      );
    }

    if (
      currentInvoice.status ===
      "cancelled"
    ) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "This invoice is already cancelled."
        )}`
      );
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "cancelled",
        paid_at: null,
        payment_method: null,
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Could not cancel the invoice. Please try again."
        )}`
      );
    }

    redirect(
      `/dashboard/invoices/${id}?success=${encodeURIComponent(
        "Invoice cancelled."
      )}`
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusBadge
            status={invoice.status}
          />

          <h1 className="mt-3 text-3xl font-bold">
            {invoice.invoice_number}
          </h1>

          <p className="mt-1 text-zinc-400">
            {invoice.customers
              ?.first_name}{" "}
            {invoice.customers
              ?.last_name}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {invoice.status !== "cancelled" && (
            <Link
              href={`/dashboard/invoices/${invoice.id}/edit`}
              className="inline-flex h-11 items-center rounded-xl border border-zinc-700 px-4 text-sm font-medium transition hover:bg-zinc-800"
            >
              Edit
            </Link>
          )}

            <Link
                href={`/dashboard/invoices/${invoice.id}/print`}
                className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
                View Invoice
            </Link>

            <Link
                href={`/dashboard/jobs/${invoice.job_id}`}
                className="inline-flex h-11 items-center rounded-xl border border-zinc-700 px-4 text-sm font-medium transition hover:bg-zinc-800"
            >
                View Job
            </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Amount */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <p className="text-sm text-zinc-500">
            Amount
          </p>

          <p className="mt-2 text-4xl font-bold">
            $
            {Number(
              invoice.amount
            ).toFixed(2)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-5">
            <Detail
              label="Issued"
              value={formatDate(
                invoice.issued_date
              )}
            />

            <Detail
              label="Due"
              value={
                invoice.due_date
                  ? formatDate(
                      invoice.due_date
                    )
                  : null
              }
            />
          </div>
        </section>

        {/* Customer */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">
            Customer
          </h2>

          <div className="mt-5 space-y-4">
            <Detail
              label="Name"
              value={`${invoice.customers?.first_name ?? ""} ${
                invoice.customers?.last_name ?? ""
              }`}
            />

            <Detail
              label="Email"
              value={
                invoice.customers
                  ?.email
              }
            />

            <Detail
              label="Phone"
              value={
                invoice.customers
                  ?.phone
              }
            />
          </div>
        </section>

        {/* Service */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">
            Service
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Detail
              label="Service"
              value="Solar Panel Cleaning"
            />

            <Detail
              label="Panels"
              value={
                invoice.jobs
                  ?.properties
                  ?.panel_count
                  ? String(
                      invoice.jobs
                        .properties
                        .panel_count
                    )
                  : null
              }
            />
          </div>

          <div className="mt-5">
            <Detail
              label="Property"
              value={[
                invoice.jobs
                  ?.properties?.street,
                invoice.jobs
                  ?.properties?.city,
                invoice.jobs
                  ?.properties?.state,
                invoice.jobs
                  ?.properties?.zip,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          </div>
        </section>

        {invoice.notes && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              Notes
            </h2>

            <p className="mt-4 whitespace-pre-wrap text-zinc-400">
              {invoice.notes}
            </p>
          </section>
        )}

        {/* Actions */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold">
            Invoice Status
          </h2>

          {invoice.status !== "paid" &&
          invoice.status !== "cancelled" ? (
            <div className="mt-5 space-y-4">
              {invoice.status === "draft" && (
                <form action={markSent}>
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-zinc-700 px-5 py-3 font-semibold transition hover:bg-zinc-800"
                  >
                    Mark Sent
                  </button>
                </form>
              )}

              <form
                action={markPaid}
                className="space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Payment Method
                  </label>

                  <select
                    name="payment_method"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select payment method
                    </option>

                    <option value="cash">
                      Cash
                    </option>

                    <option value="card">
                      Card
                    </option>

                    <option value="check">
                      Check
                    </option>

                    <option value="zelle">
                      Zelle
                    </option>

                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
                >
                  Mark Paid
                </button>
              </form>

              <form action={cancelInvoice}>
                <button
                  type="submit"
                  className="w-full rounded-xl border border-red-900/60 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-950/30"
                >
                  Cancel Invoice
                </button>
              </form>
            </div>
          ) : invoice.status === "paid" ? (
            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Paid"
                  value={
                    invoice.paid_at
                      ? formatDateTime(
                          new Date(
                            invoice.paid_at
                          )
                        )
                      : null
                  }
                />

                <Detail
                  label="Payment Method"
                  value={
                    invoice.payment_method
                      ? formatPaymentMethod(
                          invoice.payment_method
                        )
                      : null
                  }
                />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-400">
                This invoice has been cancelled.
              </p>
            </div>
          )}
        </section>
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
    <span className="inline-flex rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium capitalize text-zinc-300">
      {status}
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
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value || "—"}
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
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatDateTime(
    date: Date
  ) {
    return date.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }
  
  function formatPaymentMethod(
    method: string
  ) {
    const labels: Record<
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
      labels[method] ??
      method
    );
  }