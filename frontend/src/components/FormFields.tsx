"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { Database } from "../types/supabase";

type StatusRow =
  Database["public"]["Tables"]["fairrentpredictor_data_status"]["Row"];

interface FormFieldsProps {
  advancedMode: boolean;
  setError: (value: string | null) => void;
  setResult: (value: string | null) => void;
  setCityWindowOpen: (value: boolean) => void;
  data: StatusRow[] | null;
}

interface FormErrors {
  size?: string;
  rooms?: string;
  zip_code?: string;
  year_constructed?: string;
}

export const FormFields = ({
  advancedMode,
  setError,
  setResult,
  setCityWindowOpen,
  data,
}: FormFieldsProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    size: "",
    rooms: "",
    zip_code: "",
    year_constructed: "",
    has_kitchen: false,
    has_elevator: false,
    has_garage: false,
    has_balcony: false,
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setResult(null);

    const newErrors: FormErrors = {};
    const currentYear = new Date().getFullYear();

    // validation
    if (!formData.size || parseInt(formData.size) < 10) {
      newErrors.size = "Größe muss mind. 10 m² sein.";
    }

    if (!formData.rooms || parseInt(formData.rooms) < 1) {
      newErrors.rooms = "Mindestens 1 Zimmer erforderlich.";
    }

    if (
      !formData.zip_code ||
      formData.zip_code.length < 5 ||
      formData.zip_code.length > 5
    ) {
      newErrors.zip_code = "PLZ muss 5-stellig sein.";
    }

    const zipCheck = data?.some((item) => item.zip_code === formData.zip_code);
    if (!zipCheck) {
      newErrors.zip_code = "Noch keine Trainingsdaten.";
    }

    const inputYear = parseInt(formData.year_constructed);
    if (
      !formData.year_constructed ||
      inputYear <= 1600 ||
      inputYear > currentYear
    ) {
      newErrors.year_constructed = "Bitte ein gültiges Baujahr angeben.";
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // console.log("Validierung fehlgeschlagen:", newErrors);
      return;
    }

    setLoading(true);

    const payload = {
      size: formData.size.replace(",", "."),
      rooms: formData.rooms.replace(",", "."),
      zip_code: formData.zip_code,
      year_constructed: parseInt(formData.year_constructed),
      ...(advancedMode && {
        balcony: formData.has_balcony,
        kitchen: formData.has_kitchen,
        elevator: formData.has_elevator,
        // garage: formData.has_garage,
      }),
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Fehler bei der Anfrage ans Backend");
      }

      const data = await response.json();
      setResult(`Empfohlene Kaltmiete: ${data.estimated_rent_cold}€`);
    } catch (error) {
      setError(
        "Preis konnte nicht berechnet werden. Bitte versuche es später erneut."
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    type FieldConfig = {
      maxInt: number;
      maxDec: number;
    };

    const fieldRules: Record<string, FieldConfig> = {
      size: { maxInt: 3, maxDec: 2 },
      rooms: { maxInt: 2, maxDec: 1 },
      zip_code: { maxInt: 5, maxDec: 0 },
      year_constructed: { maxInt: 4, maxDec: 0 },
    };

    const rules = fieldRules[name] || { maxInt: 99, maxDec: 0 };

    let cleanValue = value;

    if (rules.maxDec > 0) {
      cleanValue = cleanValue.replace(/[^0-9,]/g, "");

      const commaCount = (cleanValue.match(/,/g) || []).length;

      if (commaCount > 1) return;
    } else {
      cleanValue = cleanValue.replace(/\D/g, "");
    }

    if (cleanValue.includes(",")) {
      const parts = cleanValue.split(",");
      const integerPart = parts[0];
      const decimalPart = parts[1];

      if (integerPart.length > rules.maxInt) return;

      if (decimalPart.length > rules.maxDec) return;
    } else {
      if (cleanValue.length > rules.maxInt) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));
  };

  const filteredData =
    formData.zip_code === ""
      ? data
      : data?.filter((item) => item.zip_code.includes(formData.zip_code));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col justify-between h-full mt-4 md:mt-0"
    >
      <div
        className={`w-full grid gap-3 content-start ${
          advancedMode ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <label htmlFor="size_input" className="flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-baseline h-full">
            <span className="text-sm md:text-base font-semibold">
              Wohnfläche (m²)
            </span>
            <span className="text-red-600 text-[10px] md:text-xs whitespace-nowrap mt-auto">
              {formErrors?.size}
            </span>
          </div>
          <input
            name="size"
            id="size_input"
            type="text"
            inputMode="numeric"
            value={formData.size}
            onChange={handleChange}
            className={`mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 ${
              formErrors.size ? "outline outline-red-600/80" : ""
            }  shadow-inner border p-2 focus:outline focus:outline-blue-600 select-none`}
            placeholder="60"
          />
        </label>
        <label htmlFor="rooms_input" className="flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-baseline h-full">
            <span className="text-sm md:text-base font-semibold">Zimmer</span>
            <span className="text-red-600 text-[10px] md:text-xs whitespace-nowrap mt-auto">
              {formErrors?.rooms}
            </span>
          </div>

          <input
            name="rooms"
            id="rooms_input"
            type="text"
            inputMode="numeric"
            value={formData.rooms}
            onChange={handleChange}
            className={`mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 ${
              formErrors.rooms ? "outline outline-red-600/80" : ""
            }  shadow-inner border p-2 focus:outline focus:outline-blue-600 select-none`}
            placeholder="2"
          />
        </label>

        <div ref={wrapperRef} className="relative w-full">
          <label
            htmlFor="zip_code_input"
            className="flex flex-col justify-between"
          >
            <div className="flex flex-wrap justify-between items-baseline h-full">
              <div className="flex flex-wrap items-baseline">
                <span className="text-sm md:text-base font-semibold mr-2 md:mr-0">
                  Postleitzahl
                </span>
                <button
                  className="md:px-2 text-[10px] md:text-xs text-gray-400 hover:text-blue-500 cursor-pointer whitespace-nowrap"
                  onClick={() => setCityWindowOpen(true)}
                >
                  Nicht vorhanden?
                </button>
              </div>
              <span className="text-red-600 text-[10px] md:text-xs whitespace-nowrap mt-auto">
                {formErrors?.zip_code}
              </span>
            </div>

            <input
              name="zip_code"
              id="zip_code_input"
              type="text"
              inputMode="numeric"
              value={formData.zip_code}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                handleChange(e);
                setIsOpen(true);
              }}
              placeholder="04103"
              className={`mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 ${
                formErrors.zip_code ? "outline outline-red-600/80" : ""
              }  shadow-inner border p-2 focus:outline focus:outline-blue-600 select-none`}
            />
          </label>

          {isOpen && filteredData && filteredData.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-gray-100 text-black rounded shadow-lg border border-gray-200">
              {filteredData.map((item, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-blue-100 cursor-pointer transition-colors"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      zip_code: item.zip_code,
                    }));
                    setIsOpen(false);
                  }}
                >
                  {item.zip_code}
                </li>
              ))}
            </ul>
          )}

          {isOpen && filteredData?.length === 0 && (
            <div className="absolute z-10 w-full mt-1 p-2 bg-white rounded shadow text-gray-500">
              Keine PLZ gefunden.
            </div>
          )}
        </div>

        <label
          htmlFor="year_constructed_input"
          className="flex flex-col justify-between"
        >
          <div className="flex flex-wrap justify-between items-baseline h-full">
            <span className="text-sm md:text-base font-semibold">Baujahr</span>
            <span className="text-red-600 text-[10px] md:text-xs whitespace-nowrap mt-auto">
              {formErrors?.year_constructed}
            </span>
          </div>
          <input
            name="year_constructed"
            id="year_constructed_input"
            type="text"
            inputMode="numeric"
            minLength={4}
            value={formData.year_constructed}
            onChange={handleChange}
            placeholder="1990"
            className={`mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 ${
              formErrors.year_constructed ? "outline outline-red-600/80" : ""
            }  shadow-inner border p-2 focus:outline focus:outline-blue-600 select-none`}
          />
        </label>
        {advancedMode && (
          <>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex items-center justify-between w-full">
                <label
                  htmlFor="custom-check-balcony"
                  className="text-sm md:text-base font-semibold"
                >
                  Balkon/Terrasse:
                </label>
                <div className="relative flex items-center">
                  <input
                    name="has_balcony"
                    type="checkbox"
                    id="custom-check-balcony"
                    checked={formData.has_balcony}
                    onChange={handleChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-400 transition-all checked:border-blue-500 checked:bg-blue-500 hover:scale-105 shadow-sm"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <label
                  htmlFor="custom-check-kitchen"
                  className="text-sm md:text-base font-semibold"
                >
                  Einbauküche:
                </label>
                <div className="relative flex items-center">
                  <input
                    name="has_kitchen"
                    type="checkbox"
                    id="custom-check-kitchen"
                    checked={formData.has_kitchen}
                    onChange={handleChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-400 transition-all checked:border-blue-500 checked:bg-blue-500 hover:scale-105 shadow-sm"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex items-center justify-between w-full">
                <label
                  htmlFor="custom-check-elevator"
                  className="text-sm md:text-base font-semibold"
                >
                  Personenaufzug:
                </label>
                <div className="relative flex items-center">
                  <input
                    name="has_elevator"
                    type="checkbox"
                    id="custom-check-elevator"
                    checked={formData.has_elevator}
                    onChange={handleChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-400 transition-all checked:border-blue-500 checked:bg-blue-500 hover:scale-105 shadow-sm"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full">
                <label
                  htmlFor="custom-check-garage"
                  className="text-sm md:text-base font-semibold"
                >
                  Garage/Stellplatz:
                </label>
                <div className="relative flex items-center">
                  <input
                    name="has_garage"
                    type="checkbox"
                    id="custom-check-garage"
                    checked={formData.has_garage}
                    onChange={handleChange}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-400 transition-all checked:border-blue-500 checked:bg-blue-500 hover:scale-105 shadow-sm"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="border border-gray-300 font-semibold py-2 px-4 rounded hover:border hover:border-blue-600 focus:outline-2 focus:outline-blue-600 cursor-pointer disabled:opacity-50"
      >
        {loading ? "Berechne..." : "Preis schätzen"}
      </button>
    </form>
  );
};
