import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
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
        first_name,
        last_name
      ),
      jobs (
        id,
        properties (
          street,
          city,
          state,
          zip
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  async function updateInvoice(
    formData: FormData
  ) {
    "use server";

    const supabase =
      await createClient();

    const amountInput =
      String(
        formData.get(
          "amount"
        ) ?? ""
      ).trim();

    const issuedDate =
      String(
        formData.get(
          "issued_date"
        ) ?? ""
      ).trim();

    const dueDate =
      String(
        formData.get(
          "due_date"
        ) ?? ""
      ).trim();

    const notes =
      String(
        formData.get(
          "notes"
        ) ?? ""
      ).trim();

    const status =
      String(
        formData.get(
          "status"
        ) ?? ""
      ).trim();

    function redirectWithError(
      message: string
    ): never {
      redirect(
        `/dashboard/invoices/${id}/edit?error=${encodeURIComponent(
          message
        )}`
      );
    }

    if (!amountInput) {
      redirectWithError(
        "Invoice amount is required."
      );
    }

    const amount =
      Number(amountInput);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      redirectWithError(
        "Invoice amount must be 0 or greater."
      );
    }

    if (!issuedDate) {
      redirectWithError(
        "Issued date is required."
      );
    }

    const datePattern =
      /^\d{4}-\d{2}-\d{2}$/;

    if (
      !datePattern.test(
        issuedDate
      )
    ) {
      redirectWithError(
        "Please enter a valid issued date."
      );
    }

    if (
      dueDate &&
      !datePattern.test(
        dueDate
      )
    ) {
      redirectWithError(
        "Please enter a valid due date."
      );
    }

    if (
      dueDate &&
      dueDate < issuedDate
    ) {
      redirectWithError(
        "Due date cannot be before the issued date."
      );
    }

    if (notes.length > 1000) {
      redirectWithError(
        "Invoice notes must be 1,000 characters or less."
      );
    }

    const allowedStatuses = [
      "draft",
      "sent",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      redirectWithError(
        "Use the invoice page to mark an invoice paid or cancelled."
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

    if (
      fetchError ||
      !currentInvoice
    ) {
      redirectWithError(
        "Unable to load the invoice."
      );
    }

    if (
      currentInvoice.status ===
        "paid" ||
      currentInvoice.status ===
        "cancelled"
    ) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Paid or cancelled invoices cannot be edited."
        )}`
      );
    }

    const {
      error:
        updateError,
    } = await supabase
      .from("invoices")
      .update({
        amount,
        issued_date:
          issuedDate,
        due_date:
          dueDate || null,
        notes:
          notes || null,
        status,
      })
      .eq("id", id);

    if (updateError) {
      redirectWithError(
        "The invoice could not be updated. Please try again."
      );
    }

    redirect(
      `/dashboard/invoices/${id}?success=${encodeURIComponent(
        "Invoice updated."
      )}`
    );
  }

  const property =
    Array.isArray(
      invoice.jobs?.properties
    )
      ? invoice.jobs
          ?.properties?.[0]
      : invoice.jobs
          ?.properties;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          {
            invoice.invoice_number
          }
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Edit Invoice
        </h1>

        <p className="mt-2 text-zinc-400">
          Update invoice details,
          amount, dates, and notes.
        </p>
      </div>

      {query.error && (
        <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {query.error}
        </div>
      )}

      {invoice.status === "paid" ||
      invoice.status === "cancelled" ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <p className="font-medium">
            This invoice can no longer be edited.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Paid and cancelled invoices
            are locked to preserve their
            final status.
          </p>

          <Link
            href={`/dashboard/invoices/${id}`}
            className="mt-5 inline-flex rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium transition hover:bg-zinc-800"
          >
            Back to Invoice
          </Link>
        </div>
      ) : (
        <form
          action={updateInvoice}
          className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
        >
          {/* Customer */}
          <section>
            <h2 className="mb-5 text-lg font-semibold">
              Customer
            </h2>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="font-semibold">
                {
                  invoice.customers
                    ?.first_name
                }{" "}
                {
                  invoice.customers
                    ?.last_name
                }
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {[
                  property?.street,
                  property?.city,
                  property?.state,
                  property?.zip,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </section>

          <hr className="border-zinc-800" />

          {/* Invoice Details */}
          <section>
            <h2 className="mb-5 text-lg font-semibold">
              Invoice Details
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Amount */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    $
                  </span>

                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={Number(
                      invoice.amount
                    )}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4 outline-none transition focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Status
                </label>

                <select
                  name="status"
                  defaultValue={
                    invoice.status
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="sent">
                    Sent
                  </option>
                </select>

                <p className="mt-2 text-xs text-zinc-500">
                  Use the invoice page
                  to mark an invoice as
                  paid or cancelled.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {/* Issued Date */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Issued Date
                </label>

                <input
                  type="date"
                  name="issued_date"
                  required
                  defaultValue={
                    invoice.issued_date
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Due Date
                </label>

                <input
                  type="date"
                  name="due_date"
                  defaultValue={
                    invoice.due_date ??
                    ""
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>
            </div>
          </section>

          <hr className="border-zinc-800" />

          {/* Notes */}
          <section>
            <h2 className="mb-5 text-lg font-semibold">
              Notes
            </h2>

            <textarea
              name="notes"
              rows={5}
              maxLength={1000}
              defaultValue={
                invoice.notes ??
                ""
              }
              placeholder="Invoice notes"
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
              href={`/dashboard/invoices/${id}`}
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
      )}
    </div>
  );
}
