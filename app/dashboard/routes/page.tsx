import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type RouteJob = {
  id: string;
  customer: string;
  address: string;
  panels: number;
  scheduledTime: string | null;
};

type GoogleRouteResponse = {
  routes?: {
    distanceMeters?: number;
    duration?: string;
    optimizedIntermediateWaypointIndex?: number[];
  }[];
};

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    start?: string;
  }>;
}) {
  const supabase = await createClient();

  const params = await searchParams;

  const today = new Date();

  const selectedDate =
    params.date ??
    formatDateForDatabase(today);

  const startAddress =
    params.start?.trim() ?? "";

  const { data: jobs, error } =
    await supabase
      .from("jobs")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        customers (
          first_name,
          last_name
        ),
        properties (
          street,
          city,
          state,
          zip,
          panel_count
        )
      `)
      .eq(
        "scheduled_date",
        selectedDate
      )
      .in("status", [
        "scheduled",
        "in_progress",
      ])
      .order("scheduled_time", {
        ascending: true,
      });

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Routes
        </h1>

        <p className="mt-4 text-red-400">
          {error.message}
        </p>
      </div>
    );
  }

  const routeJobs: RouteJob[] =
  (jobs ?? [])
    .map((job) => {
      const property =
        Array.isArray(job.properties)
          ? job.properties[0]
          : job.properties;

      const customer =
        Array.isArray(job.customers)
          ? job.customers[0]
          : job.customers;

      const address = [
        property?.street,
        property?.city,
        property?.state,
        property?.zip,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        id: job.id,

        customer: [
          customer?.first_name,
          customer?.last_name,
        ]
          .filter(Boolean)
          .join(" "),

        address,

        panels: Number(
          property?.panel_count ?? 0
        ),

        scheduledTime:
          job.scheduled_time,
      };
    })
    .filter(
      (job) =>
        job.address.length > 0
    );

  let optimizedJobs =
    routeJobs;

  let totalDistanceMiles:
    | number
    | null = null;

  let totalDurationMinutes:
    | number
    | null = null;

  let routeError:
    | string
    | null = null;

  if (
    startAddress &&
    routeJobs.length > 0
  ) {
    try {
      const result =
        await optimizeRoute(
          startAddress,
          routeJobs
        );

      optimizedJobs =
        result.jobs;

      totalDistanceMiles =
        result.distanceMiles;

      totalDurationMinutes =
        result.durationMinutes;
    } catch (error) {
      routeError =
        error instanceof Error
          ? error.message
          : "Unable to optimize route.";
    }
  }

  const googleMapsUrl =
    startAddress &&
    optimizedJobs.length > 0
      ? buildGoogleMapsUrl(
          startAddress,
          optimizedJobs
        )
      : null;

  const selectedDateObject =
    parseLocalDate(selectedDate);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Routes
        </h1>

        <p className="mt-2 text-zinc-400">
          Optimize your daily job
          route and reduce driving.
        </p>
      </div>

      {/* Route Controls */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <form
          method="GET"
          className="grid gap-4 md:grid-cols-[180px_1fr_auto]"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Date
            </label>

            <input
              type="date"
              name="date"
              defaultValue={
                selectedDate
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Starting Address
            </label>

            <input
              type="text"
              name="start"
              defaultValue={
                startAddress
              }
              placeholder="Your home, shop, or starting location"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 md:w-auto"
            >
              Optimize Route
            </button>
          </div>
        </form>
      </section>

      {/* Date */}
      <div className="my-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            Route for
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            {selectedDateObject.toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
              }
            )}
          </h2>
        </div>

        <span className="text-sm text-zinc-500">
          {routeJobs.length}{" "}
          {routeJobs.length === 1
            ? "job"
            : "jobs"}
        </span>
      </div>

      {routeError && (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/20 px-5 py-4 text-sm text-red-400">
          {routeError}
        </div>
      )}

      {routeJobs.length === 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
          <p className="font-medium text-zinc-300">
            No jobs to route.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Schedule jobs for this
            date and they'll appear
            here.
          </p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Route */}
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 lg:col-span-2">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="font-semibold">
                {startAddress
                  ? "Optimized Route"
                  : "Scheduled Jobs"}
              </h2>

              {!startAddress && (
                <p className="mt-1 text-sm text-zinc-500">
                  Enter your starting
                  address to optimize
                  these stops.
                </p>
              )}
            </div>

            {startAddress && (
              <div className="border-b border-zinc-800 px-5 py-4">
                <RouteLocation
                  marker="S"
                  title="Start"
                  address={
                    startAddress
                  }
                />
              </div>
            )}

            <div className="divide-y divide-zinc-800">
              {optimizedJobs.map(
                (job, index) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="group block px-5 py-5 transition hover:bg-zinc-800/50"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 font-semibold">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {
                                job.customer
                              }
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                              {
                                job.address
                              }
                            </p>
                          </div>

                          <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
                            ›
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                          <span>
                            {job.panels}{" "}
                            panels
                          </span>

                          {job.scheduledTime && (
                            <span>
                              {formatTime(
                                job.scheduledTime
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>

            {startAddress && (
              <div className="border-t border-zinc-800 px-5 py-4">
                <RouteLocation
                  marker="E"
                  title="Return"
                  address={
                    startAddress
                  }
                />
              </div>
            )}
          </section>

          {/* Summary */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="font-semibold">
                Route Summary
              </h2>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  label="Stops"
                  value={String(
                    optimizedJobs.length
                  )}
                />

                <SummaryRow
                  label="Distance"
                  value={
                    totalDistanceMiles !==
                    null
                      ? `${totalDistanceMiles.toFixed(
                          1
                        )} mi`
                      : "—"
                  }
                />

                <SummaryRow
                  label="Drive Time"
                  value={
                    totalDurationMinutes !==
                    null
                      ? formatDuration(
                          totalDurationMinutes
                        )
                      : "—"
                  }
                />
              </div>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Open in Google Maps
                </a>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm font-medium">
                Route behavior
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                SolarOps starts from
                your entered address,
                visits each job in the
                optimized order, then
                returns to your
                starting location.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

async function optimizeRoute(
  startAddress: string,
  jobs: RouteJob[]
) {
  const apiKey =
    process.env
      .GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not configured."
    );
  }

  /*
   * With only one job there is
   * nothing to reorder.
   */
  if (jobs.length === 1) {
    const route =
      await requestGoogleRoute({
        apiKey,
        startAddress,
        destination:
          startAddress,
        intermediates: [
          jobs[0].address,
        ],
        optimize: false,
      });

    return {
      jobs,
      distanceMiles:
        metersToMiles(
          route.distanceMeters ?? 0
        ),
      durationMinutes:
        parseDurationSeconds(
          route.duration
        ) / 60,
    };
  }

  /*
   * All jobs are intermediate
   * stops. Start address is both
   * origin and destination.
   */
  const route =
    await requestGoogleRoute({
      apiKey,
      startAddress,
      destination:
        startAddress,
      intermediates:
        jobs.map(
          (job) => job.address
        ),
      optimize: true,
    });

  const optimizedIndexes =
    route
      .optimizedIntermediateWaypointIndex ??
    jobs.map(
      (_, index) => index
    );

  const optimizedJobs =
    optimizedIndexes.map(
      (index) => jobs[index]
    );

  return {
    jobs: optimizedJobs,

    distanceMiles:
      metersToMiles(
        route.distanceMeters ?? 0
      ),

    durationMinutes:
      parseDurationSeconds(
        route.duration
      ) / 60,
  };
}

async function requestGoogleRoute({
  apiKey,
  startAddress,
  destination,
  intermediates,
  optimize,
}: {
  apiKey: string;
  startAddress: string;
  destination: string;
  intermediates: string[];
  optimize: boolean;
}) {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "X-Goog-Api-Key":
          apiKey,

        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.optimizedIntermediateWaypointIndex",
      },

      body: JSON.stringify({
        origin: {
          address:
            startAddress,
        },

        destination: {
          address:
            destination,
        },

        intermediates:
          intermediates.map(
            (address) => ({
              address,
            })
          ),

        travelMode:
          "DRIVE",

        routingPreference:
          "TRAFFIC_AWARE",

        optimizeWaypointOrder:
          optimize,
      }),

      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as
      GoogleRouteResponse & {
        error?: {
          message?: string;
        };
      };

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        "Google could not calculate this route."
    );
  }

  const route =
    data.routes?.[0];

  if (!route) {
    throw new Error(
      "No route was found."
    );
  }

  return route;
}

function buildGoogleMapsUrl(
  startAddress: string,
  jobs: RouteJob[]
) {
  /*
   * Google Maps URLs support
   * directions without exposing
   * our API key.
   */

  const params =
    new URLSearchParams();

  params.set(
    "api",
    "1"
  );

  params.set(
    "origin",
    startAddress
  );

  params.set(
    "destination",
    startAddress
  );

  params.set(
    "travelmode",
    "driving"
  );

  if (jobs.length > 0) {
    params.set(
      "waypoints",
      jobs
        .map(
          (job) =>
            job.address
        )
        .join("|")
    );
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function RouteLocation({
  marker,
  title,
  address,
}: {
  marker: string;
  title: string;
  address: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
        {marker}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="truncate text-sm text-zinc-500">
          {address}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

function metersToMiles(
  meters: number
) {
  return (
    meters / 1609.344
  );
}

function parseDurationSeconds(
  duration?: string
) {
  if (!duration) {
    return 0;
  }

  return Number(
    duration.replace(
      "s",
      ""
    )
  );
}

function formatDuration(
  minutes: number
) {
  const rounded =
    Math.round(minutes);

  const hours =
    Math.floor(
      rounded / 60
    );

  const remaining =
    rounded % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

function formatTime(
  time: string
) {
  const [hours, minutes] =
    time.split(":");

  const date =
    new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function formatDateForDatabase(
  date: Date
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}

function parseLocalDate(
  dateString: string
) {
  const [
    year,
    month,
    day,
  ] =
    dateString
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}