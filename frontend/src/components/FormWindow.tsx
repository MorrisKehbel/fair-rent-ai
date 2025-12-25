"use client";

import { useState, FormEvent } from "react";

export const FormWindow = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);

    const requestData = {
      size: Number(formData.get("size")),
      rooms: Number(formData.get("rooms")),
      zip_code: String(formData.get("zip_code")),
      year_constructed: Number(formData.get("year_constructed")),
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Fehler bei der Anfrage ans Backend");
      }

      const data = await response.json();
      setResult(data.estimated_rent_cold);
    } catch (error) {
      setError("Konnte Preis nicht berechnen. Läuft das Backend?");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-gray-100/80 w-240 rounded mx-auto shadow border border-gray-400">
        <h1 className="text-xl font-bold">Fair-Rent Price Predictor</h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 text-gray-700">
          <label>
            Wohnfläche (m²)
            <input
              name="size"
              type="number"
              step="1"
              required
              className="mt-1 w-full rounded border-gray-300 shadow-sm border p-2"
              defaultValue="60"
            />
          </label>

          <label>
            Zimmer
            <input
              name="rooms"
              type="number"
              step="0.5"
              required
              className="mt-1 w-full rounded border-gray-300 shadow-sm border p-2"
              defaultValue="2"
            />
          </label>

          <label>
            Postleitzahl
            <input
              name="zip_code"
              type="text"
              required
              placeholder="04103"
              className="mt-1 w-full rounded border-gray-300 shadow-sm border p-2"
            />
          </label>

          <label>
            Baujahr
            <input
              name="year_constructed"
              type="number"
              required
              defaultValue="1990"
              className="mt-1 w-full rounded border-gray-300 shadow-sm border p-2"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Berechne..." : "Preis schätzen"}
          </button>
        </form>
      </div>
      <div className="mt-4 w-full min-h-14">
        {result !== null && (
          <div className="p-4 bg-green-50 text-green-800 rounded">
            Geschätzte Kaltmiete: <strong>{result} €</strong>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded">{error}</div>
        )}
      </div>
    </div>
  );
};
