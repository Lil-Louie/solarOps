import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function CreateInvoicePage({
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
        last_name,
        phone,
        email
      ),
      properties (
        street,
        city,
        state,
        zip,
        panel_count
      )
    `)
    .eq("id", id)
    .single();

  if (error || !job) {
    notFound();
  }

  // If an invoice already exists for this job,
  // send the user to it instead of creating another one.
  const { data: existingInvoice } =
  await supabase
    .from("invoices")
    .select("id")
    .eq("job_id", id)
    .maybeSingle();

if (existingInvoice) {
  redirect(
    `/dashboard/invoices/${existingInvoice.id}`
  );
}

  const { count } = await supabase
    .from("invoices")
    .select("*", {
      count: "exact",
      head: true,
    });

  const nextInvoiceNumber =
    `CSC-${String(
      (count ?? 0) + 1
    ).padStart(4, "0")}`;

  const amount = Number(
    job.final_price ??
      job.quoted_price ??
      0
  );

  const today = new Date();

  const issuedDate =
    formatDateForDatabase(today);
  
  const defaultDueDate =
    issuedDate;

  async function createInvoice(
    formData: FormData
  ) {
    "use server";

    const supabase =
      await createClient();

    const invoiceNumber =
      formData.get(
        "invoice_number"
      ) as string;

    const amountInput =
      formData.get(
        "amount"
      ) as string;

    const issuedDate =
      formData.get(
        "issued_date"
      ) as string;

    const dueDate =
      formData.get(
        "due_date"
      ) as string;

    const notes =
      formData.get(
        "notes"
      ) as string;

    const {
      data: invoice,
      error,
    } = await supabase
      .from("invoices")
      .insert({
        job_id: id,

        customer_id:
          job.customers.id,

        invoice_number:
          invoiceNumber,

        amount:
          Number(amountInput),

        status: "draft",

        issued_date:
          issuedDate,

        due_date:
          dueDate || null,

        notes:
          notes || null,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(
        error.message
      );
    }

    redirect(
      `/dashboard/invoices/${invoice.id}`
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-zinc-500">
          Invoice
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Create Invoice
        </h1>

        <p className="mt-2 text-zinc-400">
          Create an invoice for this
          completed job.
        </p>
      </div>

      <form
        action={createInvoice}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        {/* Customer */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Customer
          </h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="font-semibold">
              {job.customers
                ?.first_name}{" "}
              {job.customers
                ?.last_name}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {job.properties?.street}
              {job.properties?.city
                ? `, ${job.properties.city}`
                : ""}
            </p>

            {job.customers?.email && (
              <p className="mt-2 text-sm text-zinc-500">
                {job.customers.email}
              </p>
            )}
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Service */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Service
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Service
              </p>

              <p className="mt-1 font-medium">
                Solar Panel Cleaning
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Panels
              </p>

              <p className="mt-1 font-medium">
                {job.properties
                  ?.panel_count ??
                  "—"}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Invoice Details */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Invoice Details
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Invoice Number
              </label>

              <input
                name="invoice_number"
                required
                defaultValue={
                  nextInvoiceNumber
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

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
                  defaultValue={
                    amount
                  }
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-4"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Issued Date
              </label>

              <input
                type="date"
                name="issued_date"
                required
                defaultValue={
                  issuedDate
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Due Date
              </label>

              <input
                type="date"
                name="due_date"
                defaultValue={
                  defaultDueDate
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
            rows={4}
            placeholder="Thank you for choosing Chico Solar Cleaners!"
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
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

function formatDateForDatabase(
  date: Date
) {
  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}