"use client";

import { useState } from "react";
import { FormFields, FormFieldsAdv } from "./index";

export const FormWindow = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    size: "",
    rooms: "",
    zip_code: "",
    year_constructed: "",
  });

  return (
    <div className="flex flex-col mx-auto w-full md:w-180 lg:w-240">
      <div className="p-2 w-full backdrop-blur-xs backdrop-grayscale bg-linear-to-b from-gray-900/20 via-black/20 to-gray-900/20 rounded-3xl shadow border border-gray-950/30">
        <div className="flex flex-col px-6 pb-6 bg-black/80 rounded-2xl">
          <div
            onClick={() => setAdvancedMode(!advancedMode)}
            className="self-end text-gray-400 p-1 bg-black/50 rounded-b text-xs font-bold w-20 text-center cursor-pointer hover:bg-blue-600/30 hover:text-white transition select-none"
          >
            {advancedMode ? "basic" : "advanced"}
          </div>

          {advancedMode ? (
            <FormFieldsAdv
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setResult={setResult}
              formData={formData}
              setFormData={setFormData}
            />
          ) : (
            <FormFields
              loading={loading}
              setLoading={setLoading}
              setError={setError}
              setResult={setResult}
              formData={formData}
              setFormData={setFormData}
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
                Empfohlene Kaltmiete: <strong>{result} €</strong>
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
