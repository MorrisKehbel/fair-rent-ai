"use client";

import { useState } from "react";
import { FormFields, AddCity, InfoPopup } from "./index";
import { ChampionData, Database } from "@/types/index";

type StatusRow = Database["public"]["Tables"]["rent_features_agg"]["Row"];

interface FormWindowProps {
  data: StatusRow[] | null;
}

export const FormWindow = ({ data }: FormWindowProps) => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(true);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [cityWindowOpen, setCityWindowOpen] = useState(false);

  const [championData, setChampionData] = useState<ChampionData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadClick = async () => {
    if (loading || championData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/model-info`
      );
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Informationen");
      }

      const data = await response.json();

      setChampionData(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      setInfoWindowOpen(false);
      setResult(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto mt-8 md:mt-12 flex w-full flex-col md:w-190 2xl:w-220">
      <div className="relative w-full rounded-3xl border border-gray-950/30 bg-linear-to-b from-gray-900/20 via-black/20 to-gray-900/20 p-2 shadow backdrop-blur-xs backdrop-grayscale">
        {infoWindowOpen && (
          <InfoPopup championData={championData} loading={loading} />
        )}

        <div className="flex h-130 sm:h-116 flex-col rounded-2xl bg-black/85 px-4 pb-4 md:px-6 md:pb-6">
          <div className="flex justify-end gap-2">
            {!cityWindowOpen && (
              <button
                type="button"
                onClick={() => setAdvancedMode((prev) => !prev)}
                className="w-20 cursor-pointer select-none rounded-b border-b border-l border-r border-gray-800/60 bg-black/50 p-1 text-center text-xs font-bold text-gray-400 transition-colors hover:bg-blue-600/30 hover:text-white hidden"
              >
                {/* removed, add when link input is ready */}
                {advancedMode ? "basic" : "advanced"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setInfoWindowOpen((prev) => !prev);
                handleLoadClick();
              }}
              aria-label="Modellinformationen anzeigen"
              aria-expanded={infoWindowOpen}
              className={`w-14 cursor-pointer select-none rounded-b border-b border-l border-r border-gray-800/60 p-1 text-center text-xs font-bold transition-colors ${
                infoWindowOpen
                  ? "bg-blue-600/30 text-white hover:bg-blue-700/30 hover:text-gray-200"
                  : "bg-black/50 text-gray-400 hover:bg-blue-600/30 hover:text-white"
              }`}
            >
              info
            </button>
          </div>
          {!cityWindowOpen ? (
            <FormFields
              setError={setError}
              setResult={setResult}
              advancedMode={advancedMode}
              setCityWindowOpen={setCityWindowOpen}
              data={data}
            />
          ) : (
            <AddCity
              setCityWindowOpen={setCityWindowOpen}
              setResult={setResult}
              setError={setError}
              data={data}
            />
          )}
        </div>
      </div>
      {/* response window */}
      <div className="mt-4 w-full min-h-28">
        {(result || error) && (
          <div className="w-full rounded-3xl border border-gray-950/30 bg-linear-to-b from-gray-900/20 via-black/20 to-gray-900/20 p-2 text-center shadow backdrop-blur-xs backdrop-grayscale">
            {result && (
              <output
                className="block p-6 font-semibold bg-black/80 text-green-400 rounded-2xl"
                role="status"
                aria-live="polite"
              >
                {result}
              </output>
            )}

            {error && (
              <output
                className="block p-6 font-semibold bg-black/80 text-red-400 rounded-2xl"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </output>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
