import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  async function updateSettings(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const laborRate = Number(formData.get("labor_rate"));
    const vehicleMpg = Number(formData.get("vehicle_mpg"));
    const gasPrice = Number(formData.get("gas_price"));
    const resinCostPerGallon = Number(
      formData.get("resin_cost_per_gallon")
    );

    const { error } = await supabase
      .from("settings")
      .update({
        labor_rate: laborRate,
        vehicle_mpg: vehicleMpg,
        gas_price: gasPrice,
        resin_cost_per_gallon: resinCostPerGallon,
      })
      .eq("id", settings.id);

    if (error) {
      throw new Error(error.message);
    }

    redirect("/dashboard/settings");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        <p className="mt-2 text-zinc-400">
          Configure the business values SolarOps uses for job-cost calculations.
        </p>
      </div>

      <form
        action={updateSettings}
        className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <section>
          <h2 className="text-lg font-semibold">Labor</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your internal labor cost for calculating job profitability.
          </p>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Labor Rate
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                $
              </span>

              <input
                type="number"
                name="labor_rate"
                min="0"
                step="0.01"
                defaultValue={settings?.labor_rate ?? 40}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-20"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                / hour
              </span>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        <section>
          <h2 className="text-lg font-semibold">Vehicle</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Used to estimate fuel cost from job mileage.
          </p>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Vehicle MPG
              </label>

              <div className="relative">
                <input
                  type="number"
                  name="vehicle_mpg"
                  min="0"
                  step="0.1"
                  defaultValue={settings?.vehicle_mpg ?? ""}
                  placeholder="30"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-16"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  MPG
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Gas Price
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  $
                </span>

                <input
                  type="number"
                  name="gas_price"
                  min="0"
                  step="0.01"
                  defaultValue={settings?.gas_price ?? ""}
                  placeholder="4.50"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-20"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  / gal
                </span>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800" />

        <section>
          <h2 className="text-lg font-semibold">DI Resin</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Estimated resin cost per gallon of purified water used.
          </p>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">
              Resin Cost Per Gallon
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                $
              </span>

              <input
                type="number"
                name="resin_cost_per_gallon"
                min="0"
                step="0.0001"
                defaultValue={settings?.resin_cost_per_gallon ?? ""}
                placeholder="0.20"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-8 pr-24"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                / gallon
              </span>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}