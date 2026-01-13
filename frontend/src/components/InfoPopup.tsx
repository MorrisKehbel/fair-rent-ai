"use client";

import { useMemo } from "react";
import { ChampionData } from "@/types/index";

interface InfoPopupProps {
  championData: ChampionData | null;
  loading: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  size: "Wohnfläche",
  year_constructed: "Baujahr",
  rooms: "Zimmeranzahl",
  zip_code: "Postleitzahl",
  fitted_kitchen: "Einbauküche",
  balcony_terrace: "Balkon",
  elevator: "Aufzug",
  garden: "Garten/-mitnutzung",
  cellar: "Keller",
  is_new_building: "Erstbezug/Renoviert",
};

const LOCATION_FEATURES = new Set([
  "loc__zip_code",
  "loc__city",
  "loc__region",
]);

const TOP_FEATURES_COUNT = 5;

const getCleanFeatureName = (technicalName: string): string => {
  const coreName = technicalName.replace(/^(num__|loc__|bool__)/, "");
  const match = Object.entries(FEATURE_LABELS).find(([key]) =>
    coreName.includes(key)
  );
  return match?.[1] ?? coreName;
};

/** Aggregates and sorts features by importance, grouping location features */
const aggregateFeatures = (
  features: ChampionData["top_features"] | undefined
): Array<{ name: string; importance: number }> => {
  if (!features?.length) return [];

  const aggregated = features.reduce<Record<string, number>>(
    (acc, { feature, importance }) => {
      const key = LOCATION_FEATURES.has(feature)
        ? "Standort"
        : getCleanFeatureName(feature);
      acc[key] = (acc[key] ?? 0) + importance;
      return acc;
    },
    {}
  );

  return Object.entries(aggregated)
    .map(([name, importance]) => ({ name, importance }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, TOP_FEATURES_COUNT);
};

const Skeleton = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <span
    className={`bg-blue-600/10 text-transparent rounded-md animate-pulse select-none ${
      className ?? ""
    }`}
  >
    {children}
  </span>
);

const ProgressBar = ({
  value,
  label,
  isLoading = false,
}: {
  value: number;
  label: string;
  isLoading?: boolean;
}) => (
  <div
    role="progressbar"
    aria-valuenow={isLoading ? undefined : Math.round(value * 100)}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={label}
    className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden"
  >
    <div
      className={`h-1.5 rounded-full ${
        isLoading
          ? "bg-indigo-500/50 animate-pulse"
          : "bg-indigo-500 transition-all duration-500"
      }`}
      style={{ width: isLoading ? "60%" : `${value * 100}%` }}
    />
  </div>
);

export const InfoPopup = ({ championData, loading }: InfoPopupProps) => {
  const topFeatures = useMemo(
    () => aggregateFeatures(championData?.top_features),
    [championData?.top_features]
  );

  const accuracy = useMemo(() => {
    const mape = championData?.metrics?.mape ?? 0;
    return (100 - Math.min(Math.max(mape * 100, 0), 100)).toFixed(1);
  }, [championData?.metrics?.mape]);

  const formattedDate = useMemo(() => {
    if (!championData?.last_updated) return "-";
    return new Date(championData.last_updated).toLocaleDateString("de-DE");
  }, [championData?.last_updated]);

  return (
    <aside
      role="complementary"
      aria-label="KI-Modell Informationen"
      className="xl:absolute z-10 bottom-full mb-4 left-1/2 w-full xl:bottom-auto xl:mb-0 xl:top-1/2 xl:-translate-y-1/2 xl:left-full xl:ml-6 xl:translate-x-0 xl:w-64"
    >
      <div className="flex flex-col gap-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 relative">
        {/* Arrow indicator */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute w-4 h-4 bg-white border-gray-200 rotate-45 bottom-0 left-1/2 -mb-2 -ml-2 border-b xl:top-1/2 xl:left-0 xl:-ml-2 xl:mb-0 xl:border-b-0 xl:border-l"
        />

        {/* Header */}
        <header>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">
              Rental Predictor AI
            </h3>
            {loading ? (
              <Skeleton className="text-[10px] font-bold bg-blue-600/20">
                v23
              </Skeleton>
            ) : (
              <span className="text-blue-600 text-[10px] font-bold">
                v{championData?.model_version}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Champion Model{" "}
              {loading ? (
                <Skeleton className="text-[10px]">(0.90 R²)</Skeleton>
              ) : (
                championData?.metrics?.r2_score != null && (
                  <span>({championData.metrics.r2_score.toFixed(2)} R²)</span>
                )
              )}
            </p>
            {loading ? (
              <Skeleton className="text-[10px]">01.01.2025</Skeleton>
            ) : (
              <time
                className="text-[10px] text-gray-500"
                dateTime={championData?.last_updated}
              >
                {formattedDate}
              </time>
            )}
          </div>
        </header>

        {/* Metrics */}
        <dl className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded-lg border border-blue-100 text-center">
            <dt className="text-[10px] text-gray-500 font-semibold uppercase">
              Genauigkeit
            </dt>
            {loading ? (
              <Skeleton className="text-lg font-bold">99.9 %</Skeleton>
            ) : (
              <dd className="text-lg font-bold text-blue-600">{accuracy}%</dd>
            )}
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-blue-100 text-center">
            <dt className="text-[10px] text-gray-500 font-semibold uppercase">
              Ø Abweichung
            </dt>
            {loading ? (
              <Skeleton className="text-lg font-bold">±100€</Skeleton>
            ) : (
              <dd className="text-lg font-bold text-gray-700">
                ±{championData?.metrics?.mae?.toFixed(0) ?? 0}€
              </dd>
            )}
          </div>
        </dl>

        {/* Features */}
        <section aria-labelledby="features-heading">
          <h4
            id="features-heading"
            className="text-[11px] font-semibold text-gray-500 mb-1 uppercase"
          >
            Top Einflussfaktoren
          </h4>
          <ul className="space-y-2">
            {loading
              ? Array.from({ length: TOP_FEATURES_COUNT }, (_, index) => (
                  <li key={index}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <Skeleton className="font-medium">
                        Platzhalter Text
                      </Skeleton>
                      <Skeleton>99%</Skeleton>
                    </div>
                    <ProgressBar value={0.6} label="Lädt..." isLoading />
                  </li>
                ))
              : topFeatures.map(({ name, importance }) => (
                  <li key={name}>
                    <div className="flex justify-between text-xs mb-0.5 text-gray-600">
                      <span className="font-medium">{name}</span>
                      <span>{(importance * 100).toFixed(0)}%</span>
                    </div>
                    <ProgressBar
                      value={importance}
                      label={`${name} Wichtigkeit`}
                    />
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </aside>
  );
};
