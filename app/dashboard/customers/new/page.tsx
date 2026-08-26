import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function NewCustomerPage() {
  async function addCustomer(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    const street = formData.get("street") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zip = formData.get("zip") as string;

    const panelCount = formData.get("panel_count") as string;
    const stories = formData.get("stories") as string;
    const roofType = formData.get("roof_type") as string;
    const roofPitch = formData.get("roof_pitch") as string;
    const notes = formData.get("notes") as string;

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
      })
      .select()
      .single();

    if (customerError) {
      throw new Error(customerError.message);
    }

    const { error: propertyError } = await supabase
      .from("properties")
      .insert({
        customer_id: customer.id,
        street,
        city,
        state,
        zip: zip || null,
        panel_count: panelCount ? Number(panelCount) : null,
        stories: stories ? Number(stories) : null,
        roof_type: roofType || null,
        roof_pitch: roofPitch || null,
        notes: notes || null,
      });

    if (propertyError) {
      throw new Error(propertyError.message);
    }

    redirect("/dashboard/customers");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add Customer</h1>
        <p className="mt-2 text-zinc-400">
          Add customer and property details.
        </p>
      </div>

      <form
        action={addCustomer}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
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
                placeholder="John"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Last Name
              </label>

              <input
                name="last_name"
                required
                placeholder="Smith"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
                placeholder="530-555-1234"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
              placeholder="123 Main St"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                ZIP
              </label>

              <input
                name="zip"
                placeholder="95926"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
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
                placeholder="20"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Stories
              </label>

              <select
                name="stories"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              >
                <option value="">Select</option>
                <option value="1">1 Story</option>
                <option value="2">2 Story</option>
                <option value="3">3 Story</option>
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
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              >
                <option value="">Select roof type</option>
                <option value="Asphalt Shingle">
                  Asphalt Shingle
                </option>
                <option value="Tile">Tile</option>
                <option value="Metal">Metal</option>
                <option value="Flat">Flat</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Roof Pitch
              </label>

              <select
                name="roof_pitch"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
              >
                <option value="">Select pitch</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="Steep">Steep</option>
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
              placeholder="Gate code, dog in yard, panels on garage, difficult access..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <a
            href="/dashboard/customers"
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium hover:bg-zinc-800"
          >
            Cancel
          </a>

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Save Customer
          </button>
        </div>
      </form>
    </div>
  );
}