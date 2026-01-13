"use client";

import { FormEvent, useMemo, useState, useRef, useCallback } from "react";
import { Database } from "@/types/supabase";
import { useFormValidation } from "@/hooks/useFormValidation";
import { Checkbox, TextField, Autocomplete } from "./ui";
import { ERROR_MESSAGES } from "@/constants/form";

type StatusRow = Database["public"]["Tables"]["rent_features_agg"]["Row"];

const formatDisplayName = (value: string) => value.replace(/_/g, " ").trim();

interface FormFieldsProps {
  advancedMode: boolean;
  setError: (value: string | null) => void;
  setResult: (value: string | null) => void;
  setCityWindowOpen: (value: boolean) => void;
  data: StatusRow[] | null;
}

export const FormFields = ({
  advancedMode,
  setError,
  setResult,
  setCityWindowOpen,
  data,
}: FormFieldsProps) => {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { formData, formErrors, handleChange, validateForm, updateFormData } =
    useFormValidation({ data });

  // Filter active data (exclude running status)
  const activeData = useMemo(
    () => data?.filter((item) => item.status !== "running") ?? [],
    [data]
  );

  // Memoized ZIP code options
  const zipOptions = useMemo(() => {
    const filtered = activeData.filter((item) => {
      if (formData.city) {
        return (
          formatDisplayName(item.city) === formData.city &&
          item.zip_code.startsWith(formData.zip_code)
        );
      }
      return item.zip_code.startsWith(formData.zip_code);
    });

    return filtered
      .slice()
      .sort((a, b) => parseInt(a.zip_code) - parseInt(b.zip_code))
      .map((item) => ({
        value: item.zip_code,
        label: item.zip_code,
        city: formatDisplayName(item.city),
      }));
  }, [activeData, formData.city, formData.zip_code]);

  // Memoized city options
  const cityOptions = useMemo(() => {
    const filtered = activeData
      .filter((item) => {
        const cityName = formatDisplayName(item.city);
        if (formData.zip_code) {
          return (
            item.zip_code.startsWith(formData.zip_code) &&
            cityName.toLowerCase().includes(formData.city.toLowerCase())
          );
        }
        return cityName.toLowerCase().includes(formData.city.toLowerCase());
      })
      .filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              formatDisplayName(t.city).toLowerCase() ===
              formatDisplayName(item.city).toLowerCase()
          )
      )
      .sort((a, b) =>
        formatDisplayName(a.city).localeCompare(formatDisplayName(b.city))
      );

    return filtered.map((item) => ({
      value: formatDisplayName(item.city),
      label: formatDisplayName(item.city),
    }));
  }, [activeData, formData.zip_code, formData.city]);

  // Memoized region options
  const regionOptions = useMemo(() => {
    const regions = new Set<string>();

    activeData
      .filter((item) => {
        const zipMatch = formData.zip_code
          ? item.zip_code.startsWith(formData.zip_code)
          : true;
        const cityMatch = formData.city
          ? formatDisplayName(item.city).toLowerCase() ===
            formData.city.toLowerCase()
          : true;
        return zipMatch && cityMatch;
      })
      .forEach((item) => {
        (item.regio ?? "")
          .split(",")
          .map((r) => formatDisplayName(r.trim()))
          .filter((r) => r !== "")
          .forEach((r) => regions.add(r));
      });

    return Array.from(regions)
      .filter((region) =>
        formData.region === ""
          ? true
          : region.toLowerCase().includes(formData.region.toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b))
      .map((region) => ({
        value: region,
        label: region,
      }));
  }, [activeData, formData.zip_code, formData.city, formData.region]);

  const handleZipSelect = useCallback(
    (
      value: string,
      option: { value: string; label: string; city?: string }
    ) => {
      updateFormData({
        zip_code: value,
        city: (option as { city?: string }).city || formData.city,
      });
    },
    [updateFormData, formData.city]
  );

  const handleCitySelect = useCallback(
    (value: string) => {
      updateFormData({ city: value });
    },
    [updateFormData]
  );

  const handleRegionSelect = useCallback(
    (value: string) => {
      const matchingItem = activeData.find(
        (d) =>
          (d.regio ?? "")
            .split(",")
            .map((r) => formatDisplayName(r.trim()))
            .includes(value) &&
          (formData.city ? formatDisplayName(d.city) === formData.city : true)
      );

      updateFormData({
        region: value,
        zip_code: matchingItem?.zip_code || "",
        city: matchingItem ? formatDisplayName(matchingItem.city) : "",
      });
    },
    [activeData, formData.city, updateFormData]
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!validateForm()) return;

    // Cancel any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);

    const city =
      data?.find((item) => item.zip_code === formData.zip_code)?.city || "";

    const payload = {
      size: parseFloat(formData.size.replace(",", ".")),
      rooms: parseFloat(formData.rooms.replace(",", ".")),
      year_constructed: parseInt(formData.year_constructed) || 0,
      city,
      zip_code: formData.zip_code,
      region: formData.region,
      elevator: formData.has_elevator,
      garden: formData.has_garden,
      fitted_kitchen: formData.has_kitchen,
      balcony_terrace: formData.has_balcony,
      cellar: formData.has_cellar,
      is_new_building: formData.has_is_new_building,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predict`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.BACKEND_ERROR);
      }

      const result = await response.json();
      setResult(`Empfohlene Kaltmiete: ${result.estimated_rent_cold}€`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setError(ERROR_MESSAGES.FETCH_ERROR);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-2 flex h-full flex-col justify-between md:mt-0"
    >
      <div className="grid w-full grid-cols-2 content-start gap-4">
        {/* Size Field */}
        <TextField
          id="size_input"
          name="size"
          label="Wohnfläche (m²)"
          value={formData.size}
          onChange={handleChange}
          placeholder="60"
          inputMode="decimal"
          error={formErrors.size}
          fullWidth={!advancedMode}
        />

        {/* Rooms Field */}
        <TextField
          id="rooms_input"
          name="rooms"
          label="Zimmer"
          value={formData.rooms}
          onChange={handleChange}
          placeholder="2"
          inputMode="decimal"
          error={formErrors.rooms}
          fullWidth={!advancedMode}
        />

        {/* City Autocomplete */}
        <Autocomplete
          id="city_input"
          name="city"
          label="Stadt"
          value={formData.city}
          options={cityOptions}
          onChange={handleChange}
          onSelect={handleCitySelect}
          placeholder="Leipzig"
          error={formErrors.city}
          emptyMessage="Keine Städte gefunden"
          labelAction={
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap text-[10px] text-gray-400 hover:text-blue-600 focus:text-blue-600 focus:underline underline-offset-2 transition-colors select-none md:px-2 md:text-xs"
              onClick={() => setCityWindowOpen(true)}
            >
              Nicht vorhanden?
            </button>
          }
        />

        {/* Advanced Mode Fields */}
        {advancedMode && (
          <>
            <TextField
              id="year_constructed_input"
              name="year_constructed"
              label="Baujahr"
              value={formData.year_constructed}
              onChange={handleChange}
              placeholder="1990"
              inputMode="numeric"
              error={formErrors.year_constructed}
            />

            <Autocomplete
              id="zip_code_input"
              name="zip_code"
              label="Postleitzahl"
              value={formData.zip_code}
              options={zipOptions}
              onChange={handleChange}
              onSelect={handleZipSelect}
              placeholder="04103"
              inputMode="numeric"
              error={formErrors.zip_code}
              emptyMessage="Keine PLZ gefunden."
              fullWidth={!advancedMode}
            />
            <Autocomplete
              id="region_input"
              name="region"
              label="Region/Bezirk"
              value={formData.region}
              options={regionOptions}
              onChange={handleChange}
              onSelect={handleRegionSelect}
              placeholder="Lindenau"
              error={formErrors.region}
              emptyMessage="Keine Regionen gefunden"
            />
          </>
        )}

        {/* Checkboxes */}

        <Checkbox
          id="custom-check-balcony"
          name="has_balcony"
          label="Balkon / Terrasse:"
          checked={formData.has_balcony}
          onChange={handleChange}
        />
        <Checkbox
          id="custom-check-kitchen"
          name="has_kitchen"
          label="Einbauküche:"
          checked={formData.has_kitchen}
          onChange={handleChange}
        />
        <Checkbox
          id="custom-check-garden"
          name="has_garden"
          label="Garten / -mitnutzung:"
          checked={formData.has_garden}
          onChange={handleChange}
        />
        <Checkbox
          id="custom-check-new"
          name="has_is_new_building"
          label="Erstbezug / Renoviert:"
          checked={formData.has_is_new_building}
          onChange={handleChange}
        />
        {advancedMode && (
          <>
            <Checkbox
              id="custom-check-elevator"
              name="has_elevator"
              label="Personenaufzug:"
              checked={formData.has_elevator}
              onChange={handleChange}
            />
            <Checkbox
              id="custom-check-cellar"
              name="has_cellar"
              label="Keller:"
              checked={formData.has_cellar}
              onChange={handleChange}
            />
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer rounded border border-gray-300 px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600 focus:ring-1"
      >
        {loading ? "Berechne..." : "Preis schätzen"}
      </button>
    </form>
  );
};
