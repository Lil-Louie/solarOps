import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
  }>;
}) {
  const params = await searchParams;

  async function addCustomer(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const firstName =
      String(formData.get("first_name") ?? "").trim();

    const lastName =
      String(formData.get("last_name") ?? "").trim();

    const phone =
      String(formData.get("phone") ?? "").trim();

    const email =
      String(formData.get("email") ?? "").trim();

    const street =
      String(formData.get("street") ?? "").trim();

    const city =
      String(formData.get("city") ?? "").trim();

    const state =
      String(formData.get("state") ?? "").trim();

    const zip =
      String(formData.get("zip") ?? "").trim();

    const panelCountInput =
      String(formData.get("panel_count") ?? "").trim();

    const storiesInput =
      String(formData.get("stories") ?? "").trim();

    const roofType =
      String(formData.get("roof_type") ?? "").trim();

    const roofPitch =
      String(formData.get("roof_pitch") ?? "").trim();

    const notes =
      String(formData.get("notes") ?? "").trim();

    function redirectWithError(
      message: string
    ): never {
      redirect(
        `/dashboard/customers/new?error=${encodeURIComponent(
          message
        )}`
      );
    }

    if (!firstName) {
      redirectWithError(
        "First name is required."
      );
    }

    if (!lastName) {
      redirectWithError(
        "Last name is required."
      );
    }

    if (!street) {
      redirectWithError(
        "Street address is required."
      );
    }

    if (!city) {
      redirectWithError(
        "City is required."
      );
    }

    if (!state) {
      redirectWithError(
        "State is required."
      );
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      redirectWithError(
        "Please enter a valid email address."
      );
    }

    if (
      phone &&
      !/^[0-9()+\-\s.]{7,25}$/.test(
        phone
      )
    ) {
      redirectWithError(
        "Please enter a valid phone number."
      );
    }

    if (
      zip &&
      !/^\d{5}(-\d{4})?$/.test(
        zip
      )
    ) {
      redirectWithError(
        "Please enter a valid ZIP code."
      );
    }

    const panelCount =
      panelCountInput === ""
        ? null
        : Number(panelCountInput);

    if (
      panelCount !== null &&
      (
        !Number.isInteger(panelCount) ||
        panelCount < 1 ||
        panelCount > 500
      )
    ) {
      redirectWithError(
        "Panel count must be a whole number between 1 and 500."
      );
    }

    const stories =
      storiesInput === ""
        ? null
        : Number(storiesInput);

    if (
      stories !== null &&
      ![1, 2, 3].includes(stories)
    ) {
      redirectWithError(
        "Stories must be 1, 2, or 3."
      );
    }

    const allowedRoofTypes = [
      "",
      "Asphalt Shingle",
      "Tile",
      "Metal",
      "Flat",
      "Other",
    ];

    if (
      !allowedRoofTypes.includes(
        roofType
      )
    ) {
      redirectWithError(
        "Please select a valid roof type."
      );
    }

    const allowedRoofPitches = [
      "",
      "Low",
      "Moderate",
      "Steep",
    ];

    if (
      !allowedRoofPitches.includes(
        roofPitch
      )
    ) {
      redirectWithError(
        "Please select a valid roof pitch."
      );
    }

    if (notes.length > 1000) {
      redirectWithError(
        "Property notes must be 1,000 characters or less."
      );
    }

    const {
      data: customer,
      error: customerError,
    } = await supabase
      .from("customers")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
      })
      .select("id")
      .single();

    if (
      customerError ||
      !customer
    ) {
      redirectWithError(
        "The customer could not be saved. Please try again."
      );
    }

    const {
      error: propertyError,
    } = await supabase
      .from("properties")
      .insert({
        customer_id:
          customer.id,

        street,
        city,
        state: state.toUpperCase(),

        zip:
          zip || null,

        panel_count:
          panelCount,

        stories,

        roof_type:
          roofType || null,

        roof_pitch:
          roofPitch || null,

        notes:
          notes || null,
      });

    if (propertyError) {
      /*
        The customer insert succeeded but
        the property insert failed.

        Remove the customer so we do not
        leave behind a customer with no
        property in this V1 workflow.
      */
      await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);

      redirectWithError(
        "The property could not be saved. Please try again."
      );
    }

    redirect(
      `/dashboard/customers/${customer.id}`
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Add Customer
        </h1>

        <p className="mt-2 text-zinc-400">
          Add customer and property
          details.
        </p>
      </div>

      {params.error && (
        <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {params.error}
        </div>
      )}

      <form
        action={addCustomer}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
      >
        {/* Customer Information */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Customer Information
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                First Name
              </label>

              <input
                name="first_name"
                required
                maxLength={80}
                autoComplete="given-name"
                placeholder="John"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Last Name
              </label>

              <input
                name="last_name"
                required
                maxLength={80}
                autoComplete="family-name"
                placeholder="Smith"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Phone
              </label>

              <input
                name="phone"
                type="tel"
                maxLength={25}
                autoComplete="tel"
                placeholder="530-555-1234"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                name="email"
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="john@example.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Property Information */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Property Details
          </h2>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Street Address
            </label>

            <input
              name="street"
              required
              maxLength={160}
              autoComplete="street-address"
              placeholder="123 Main St"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                City
              </label>

              <input
                name="city"
                defaultValue="Chico"
                required
                maxLength={100}
                autoComplete="address-level2"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                State
              </label>

              <input
                name="state"
                defaultValue="CA"
                required
                maxLength={2}
                autoComplete="address-level1"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 uppercase outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                ZIP
              </label>

              <input
                name="zip"
                inputMode="numeric"
                maxLength={10}
                autoComplete="postal-code"
                placeholder="95926"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        {/* Solar Setup */}
        <section>
          <h2 className="mb-5 text-lg font-semibold">
            Solar & Roof Details
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Panel Count
              </label>

              <input
                name="panel_count"
                type="number"
                min="1"
                max="500"
                step="1"
                inputMode="numeric"
                placeholder="20"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Stories
              </label>

              <select
                name="stories"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              >
                <option value="">
                  Select
                </option>

                <option value="1">
                  1 Story
                </option>

                <option value="2">
                  2 Story
                </option>

                <option value="3">
                  3 Story
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Roof Type
              </label>

              <select
                name="roof_type"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              >
                <option value="">
                  Select roof type
                </option>

                <option value="Asphalt Shingle">
                  Asphalt Shingle
                </option>

                <option value="Tile">
                  Tile
                </option>

                <option value="Metal">
                  Metal
                </option>

                <option value="Flat">
                  Flat
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Roof Pitch
              </label>

              <select
                name="roof_pitch"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
              >
                <option value="">
                  Select pitch
                </option>

                <option value="Low">
                  Low
                </option>

                <option value="Moderate">
                  Moderate
                </option>

                <option value="Steep">
                  Steep
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">
              Property Notes
            </label>

            <textarea
              name="notes"
              rows={4}
              maxLength={1000}
              placeholder="Gate code, dog in yard, panels on garage, difficult access..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            />

            <p className="mt-2 text-xs text-zinc-500">
              Optional. Maximum 1,000
              characters.
            </p>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/customers"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-center text-sm font-medium transition hover:bg-zinc-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Save Customer
          </button>
        </div>
      </form>
    </div>
  );
}
