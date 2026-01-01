"use client";

import { ChampionData } from "@/types/modelTypes";

interface InfoPopupProps {
  championData: ChampionData | null;
  loading: boolean;
}

const FEATURE_NAMES: Record<string, string> = {
  size: "Wohnfläche",
  year_constructed: "Baujahr",
  location_lat: "Geografische Lage",
  rooms: "Zimmeranzahl",
  zip_code: "Postleitzahl",
  kitchen: "Einbauküche",
  balcony: "Balkon",
  elevator: "Aufzug",
  condition: "Zustand",
  energy: "Energieeffizienz",
};

export const InfoPopup = ({ championData, loading }: InfoPopupProps) => {
  const getCleanFeatureName = (technicalName: string): string => {
    const coreName = technicalName.replace(/^(num__|cat__)/, "");
    const foundEntry = Object.entries(FEATURE_NAMES).find(([key]) =>
      coreName.includes(key)
    );
    return foundEntry ? foundEntry[1] : coreName;
  };
  return (
    <>
      <div
        className="
          sm:absolute sm:-translate-x-1/2 z-10 
          
          /* --- MOBILE: Oben --- */
          bottom-full mb-4 left-1/2  w-full 

          /* --- DESKTOP: Rechts --- */
          xl:bottom-auto xl:mb-0 xl:top-1/2 xl:-translate-y-1/2 xl:left-full xl:ml-6 xl:translate-x-0 xl:w-64
        "
      >
        <div className="flex flex-col gap-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 relative">
          {/* arrow */}
          <div
            className="
              hidden sm:block absolute w-4 h-4 bg-white border-gray-200 transform rotate-45

              /* MOBILE: Pfeil unten mittig */
              bottom-0 left-1/2 -mb-2 -ml-2 border-b

              /* DESKTOP: Pfeil links mittig */
              xl:top-1/2 xl:left-0 xl:-ml-2 xl:mb-0 xl:border-b-0 xl:border-l
            "
          ></div>

          {/* header */}
          <div className="flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Rent Predictor AI
                </h3>
              </div>
              {loading ? (
                <span className="bg-blue-600/20 text-[10px] text-transparent font-bold rounded-md animate-pulse">
                  v23
                </span>
              ) : (
                <span className=" text-blue-600 text-[10px] font-bold rounded-md">
                  v{championData?.model_version}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Champion Model
              </p>
              {loading ? (
                <p className="bg-blue-600/10 text-[10px] text-transparent rounded-md animate-pulse">
                  01.01.2025
                </p>
              ) : (
                <p className="text-[10px] text-gray-500">
                  {championData?.last_updated
                    ? new Date(championData.last_updated).toLocaleDateString(
                        "de-DE"
                      )
                    : "-"}
                </p>
              )}
            </div>
          </div>

          {/* metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-2 rounded-lg border border-blue-100 text-center">
              <span className="block text-[10px] text-gray-500 font-semibold uppercase">
                Genauigkeit (R²)
              </span>
              {loading ? (
                <span className="bg-blue-600/10 text-lg font-bold text-transparent rounded-md animate-pulse">
                  99.9 %
                </span>
              ) : (
                <span className="block text-lg font-bold text-blue-600">
                  {(championData?.metrics?.r2_score ?? 0) * 100 > 0
                    ? ((championData?.metrics.r2_score ?? 0) * 100).toFixed(1)
                    : "0.0"}
                  %
                </span>
              )}
            </div>
            <div className="bg-gray-50 p-2 rounded-lg border border-blue-100 text-center">
              <span className="block text-[10px] text-gray-500 font-semibold uppercase">
                Ø Abweichung
              </span>
              {loading ? (
                <span className="bg-blue-600/10 text-lg font-bold text-transparent rounded-md animate-pulse">
                  ±100€
                </span>
              ) : (
                <span className="text-lg font-bold text-slate-700">
                  ±{championData?.metrics?.mae?.toFixed(0) ?? 0}€
                </span>
              )}
            </div>
          </div>

          {/* features */}
          <div>
            <h4 className="text-[11px] font-semibold text-gray-500 mb-1 uppercase">
              Top Einflussfaktoren
            </h4>
            <div className="space-y-2">
              {loading
                ? [...Array(5)].map((_, index) => (
                    <div key={index} className="relative">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="bg-blue-600/10 text-transparent rounded animate-pulse font-medium">
                          Platzhalter Text
                        </span>
                        <span className="bg-blue-600/10 text-transparent rounded animate-pulse">
                          99%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500/50 h-1.5 rounded-full animate-pulse"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                  ))
                : championData?.top_features?.slice(0, 5).map((feat, i) => (
                    <div key={i} className="relative">
                      <div className="flex justify-between text-xs mb-0.5 text-gray-600">
                        <span className="font-medium">
                          {getCleanFeatureName(feat.feature)}
                        </span>
                        <span className="text-gray-600">
                          {(feat.importance * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${feat.importance * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
