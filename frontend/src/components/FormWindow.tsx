"use client";

import { useState } from "react";
import { FormFields, AddCity, InfoPopup } from "./index";

export const FormWindow = () => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(false);
  const [cityWindowOpen, setCityWindowOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col mx-auto w-full md:w-180 lg:w-240">
      <div className="relative p-2 w-full backdrop-blur-xs backdrop-grayscale bg-linear-to-b from-gray-900/20 via-black/20 to-gray-900/20 rounded-3xl shadow border border-gray-950/30">
        {infoWindowOpen && <InfoPopup setInfoWindowOpen={setInfoWindowOpen} />}
        <div className="flex flex-col px-6 pb-6 h-108 bg-black/80 rounded-2xl">
          <div className="self-end space-x-2">
            <button
              onClick={() => setAdvancedMode((prev) => !prev)}
              className={`text-gray-400 p-1 bg-black/50 border-r border-l border-b border-gray-800/60 rounded-b text-xs font-bold w-20 text-center cursor-pointer hover:bg-blue-600/30 hover:text-white transition select-none ${
                cityWindowOpen ? "hidden" : "visible"
              }`}
            >
              {advancedMode ? "basic" : "advanced"}
            </button>
            <button
              onClick={() => setInfoWindowOpen((prev) => !prev)}
              className={`${
                infoWindowOpen
                  ? "bg-blue-600/30 text-white hover:bg-blue-700/30 hover:text-gray-400"
                  : "bg-black/50 text-gray-400 hover:bg-blue-600/30 hover:text-white"
              } p-1 border-r border-l border-b border-gray-800/60 rounded-b text-xs font-bold w-10 text-center cursor-pointer transition select-none`}
            >
              ?
            </button>
          </div>
          {!cityWindowOpen ? (
            <FormFields
              setError={setError}
              setResult={setResult}
              advancedMode={advancedMode}
              setCityWindowOpen={setCityWindowOpen}
            />
          ) : (
            <AddCity
              setCityWindowOpen={setCityWindowOpen}
              setResult={setResult}
              setError={setError}
            />
          )}
        </div>
      </div>
      {/* response window */}
      <div className="mt-4 w-full min-h-28">
        {result !== null || error ? (
          <div className="p-2 backdrop-blur-xs backdrop-grayscale bg-linear-to-b from-gray-900/20 via-black/20 to-gray-900/20 w-full rounded-3xl text-center shadow border border-gray-950/30">
            {result !== null && (
              <div className="p-6 font-semibold bg-black/80 text-green-400 rounded-2xl">
                {result}
              </div>
            )}

            {error && (
              <div className="p-6 font-semibold bg-black/80 text-red-400 rounded-2xl">
                {error}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
