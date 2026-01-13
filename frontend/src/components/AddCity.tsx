"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Database } from "@/types/supabase";
import { addCityAction } from "@/app/actions/addCity";
import { TextField } from "./ui";
import {
  ZIP_CODE_LENGTH,
  MIN_CITY_NAME_LENGTH,
  UPDATE_COOLDOWN_DAYS,
  ERROR_MESSAGES,
} from "@/constants/form";

type StatusRow = Database["public"]["Tables"]["rent_features_agg"]["Row"];

interface AddCityProps {
  setCityWindowOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setError: (value: string | null) => void;
  setResult: (value: string | null) => void;
  data: StatusRow[] | null;
}

interface FormErrors {
  zip_code?: string;
  city_name?: string;
}

export const AddCity = ({
  setCityWindowOpen,
  setResult,
  setError,
  data,
}: AddCityProps) => {
  const [formData, setFormData] = useState({
    zip_code: "",
    city_name: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // only numbers
    if (name === "zip_code") {
      const cleanPlz = value.replace(/\D/g, "");
      if (cleanPlz.length <= ZIP_CODE_LENGTH) {
        setFormData((prev) => ({ ...prev, zip_code: cleanPlz }));
      }
      return;
    }

    // only letters and spaces/hyphens
    if (name === "city_name") {
      const cleanCity = value.replace(/[^a-zA-ZäöüÄÖÜß\s-]/g, "");
      setFormData((prev) => ({ ...prev, city_name: cleanCity }));
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // validation
    const newErrors: FormErrors = {};

    if (formData.zip_code.length !== ZIP_CODE_LENGTH) {
      newErrors.zip_code = ERROR_MESSAGES.ZIP_CODE_LENGTH;
    }

    if (formData.city_name.length < MIN_CITY_NAME_LENGTH) {
      newErrors.city_name = ERROR_MESSAGES.CITY_NAME_MIN;
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // console.log("Validierung fehlgeschlagen:", newErrors);
      return;
    }

    // check if zip is already being processed
    const filteredData =
      formData.zip_code === ""
        ? data
        : data?.filter((item) => item.zip_code.includes(formData.zip_code));

    if (filteredData?.[0]?.status && filteredData?.[0]?.status !== "open") {
      setError(
        `Wohnungen aus ${formData.zip_code} werden gerade aktualisiert.`
      );
      return;
    }

    // check rate limiting
    const lastUpdate = new Date(filteredData?.[0]?.updated_at || 0);
    const now = new Date();
    const diffInMs = now.getTime() - lastUpdate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (filteredData?.[0]?.updated_at && diffInDays < UPDATE_COOLDOWN_DAYS) {
      const daysToWait = Math.ceil(UPDATE_COOLDOWN_DAYS - diffInDays);
      const dayWord = daysToWait === 1 ? "Tag" : "Tage";

      setError(
        `Wohnungen aus ${formData.zip_code} wurden vor kurzem aktualisiert. Bitte warte ${daysToWait} ${dayWord}.`
      );
      return;
    }

    setLoading(true);

    try {
      const result = await addCityAction({
        plz: formData.zip_code,
        cityName: formData.city_name.trim(),
      });

      if (!result.success) {
        setError(result.error || "Stadt konnte nicht hinzugefügt werden.");
        return;
      }

      setResult(
        `${result.data?.name} aus ${result.data?.federalState} wurde gefunden und wird aktuell hinzugefügt. (ca. 5-10 Minuten)`
      );

      setFormData({ zip_code: "", city_name: "" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Stadt konnte nicht hinzugefügt werden.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 justify-between h-full mt-4 md:mt-0"
    >
      <div className="flex flex-col gap-4">
        <TextField
          id="add_zip_code_input"
          name="zip_code"
          label="Postleitzahl"
          value={formData.zip_code}
          onChange={handleChange}
          inputMode="numeric"
          error={formErrors.zip_code}
          fullWidth
        />
        <TextField
          id="city_name_input"
          name="city_name"
          label="Stadtname"
          value={formData.city_name}
          onChange={handleChange}
          error={formErrors.city_name}
          fullWidth
        />
      </div>
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded border border-gray-300 px-4 py-2 font-semibold transition hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="w-full cursor-pointer rounded border border-gray-300 px-4 py-2 font-semibold transition hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1"
        >
          Zurück
        </button>
      </div>
    </form>
  );
};
