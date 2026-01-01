"use client";

import { useState } from "react";

interface FormFieldsProps {
  setCityWindowOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setError: (value: string | null) => void;
  setResult: (value: string | null) => void;
}

interface FormErrors {
  zip_code?: string;
  city_name?: string;
}

export const AddCity = ({
  setCityWindowOpen,
  setResult,
  setError,
}: FormFieldsProps) => {
  const [formData, setFormData] = useState({
    zip_code: "",
    city_name: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "zip_code") {
      const cleanPlz = value.replace(/\D/g, "");

      if (cleanPlz.length <= 5) {
        setFormData((prev) => ({
          ...prev,
          zip_code: cleanPlz,
        }));
      }
    }

    if (name === "city_name") {
      const cleanCity = value.replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "");
      setFormData((prev) => ({
        ...prev,
        city_name: cleanCity,
      }));
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setResult(null);

    // validation
    const newErrors: FormErrors = {};

    if (!formData.zip_code || formData.zip_code.length < 5) {
      newErrors.zip_code = "PLZ muss 5-stellig sein.";
    }

    if (!formData.city_name || formData.city_name.length < 3) {
      newErrors.city_name = "Stadtname muss mindestens 3 Zeichen lang sein.";
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // console.log("Validierung fehlgeschlagen:", newErrors);
      return;
    }

    setLoading(true);

    const payload = {
      plz: formData.zip_code,
      cityName: formData.city_name,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MAKE_HOOK_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-make-apikey": process.env.NEXT_PUBLIC_MAKE_API_KEY || "",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");

      let data;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let errorMessage = "Unbekannter Fehler";

        if (typeof data === "string") {
          errorMessage = data;
        } else if (typeof data === "object" && data !== null) {
          errorMessage = data.message || data.error || JSON.stringify(data);
        }
        throw new Error(errorMessage);
      }

      setResult(
        ` ${data?.data?.name} aus ${data?.data?.federalState} wurde gefunden und wird aktuell hinzugefügt. (ca. 5-10 Minuten)`
      );

      setFormData({
        zip_code: "",
        city_name: "",
      });
    } catch (error) {
      const message = (error as Error).message;
      setError(message || "Stadt konnte nicht hinzugefügt werden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 justify-between h-full mt-4 md:mt-0"
    >
      <div className="flex flex-col gap-3">
        <label>
          <span className="text-sm md:text-base font-semibold">
            Postleitzahl
          </span>
          <input
            name="zip_code"
            type="text"
            inputMode="numeric"
            value={formData.zip_code}
            onChange={handleChange}
            className={`mt-1 w-full rounded bg-gray-600/10 shadow-inner border p-2 focus:outline focus:outline-blue-600 select-non ${
              formErrors.zip_code ? "border-red-600/80" : "border-gray-600/50"
            }`}
          />
        </label>
        <label>
          <span className="text-sm md:text-base font-semibold">Stadtname</span>
          <input
            name="city_name"
            type="text"
            inputMode="text"
            value={formData.city_name}
            onChange={handleChange}
            className={`mt-1 w-full rounded bg-gray-600/10 shadow-inner border p-2 focus:outline focus:outline-blue-600 select-non ${
              formErrors.city_name ? "border-red-600/80" : "border-gray-600/50"
            }`}
          />
        </label>
      </div>
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="border border-gray-300 w-full font-semibold py-2 px-4 rounded hover:border hover:border-blue-600 focus:outline-2 focus:outline-blue-600 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Laden..." : "Hinzufügen"}
        </button>
        <button
          type="button"
          onClick={() => {
            setCityWindowOpen((prev) => !prev);
            setResult(null);
            setError(null);
          }}
          className="border w-full border-gray-300 font-semibold py-2 px-4 rounded hover:border hover:border-blue-600 focus:outline-2 focus:outline-blue-600 cursor-pointer disabled:opacity-50"
        >
          Zurück
        </button>
      </div>
    </form>
  );
};
