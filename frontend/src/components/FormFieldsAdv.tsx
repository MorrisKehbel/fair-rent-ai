import { FormEvent } from "react";

type FormDataType = {
  size: string;
  rooms: string;
  zip_code: string;
  year_constructed: string;
};

interface FormFieldsProps {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  loading: boolean;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  setResult: (value: number | null) => void;
}

export const FormFieldsAdv = ({
  loading,
  setLoading,
  setError,
  setResult,
  formData,
  setFormData,
}: FormFieldsProps) => {
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      size: formData.size.replace(",", "."),
      rooms: formData.rooms.replace(",", "."),
      zip_code: formData.zip_code,
      year_constructed: parseInt(formData.year_constructed),
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
      setResult(data.estimated_rent_cold);
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
    const { name, value } = e.target;

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

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
      <label>
        <span className="font-semibold">Wohnfläche (m²)</span>
        <input
          name="size"
          type="text"
          inputMode="numeric"
          value={formData.size}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 shadow-inner border p-2 focus:outline-2 focus:outline-blue-600"
          placeholder="60"
        />
      </label>

      <label>
        <span className="font-semibold">Zimmer</span>
        <input
          name="rooms"
          type="text"
          inputMode="numeric"
          value={formData.rooms}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 shadow-inner border p-2 focus:outline-2 focus:outline-blue-600"
          placeholder="2"
        />
      </label>

      <label>
        <span className="font-semibold">Postleitzahl</span>
        <input
          name="zip_code"
          type="text"
          inputMode="numeric"
          value={formData.zip_code}
          onChange={handleChange}
          required
          placeholder="04103"
          className="mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 shadow-inner border p-2 focus:outline-2 focus:outline-blue-600"
        />
      </label>

      <label>
        <span className="font-semibold">Baujahr</span>
        <input
          name="year_constructed"
          type="text"
          inputMode="numeric"
          value={formData.year_constructed}
          onChange={handleChange}
          required
          placeholder="1990"
          className="mt-1 w-full rounded bg-gray-600/10 border-gray-600/50 shadow-inner border p-2 focus:outline-2 focus:outline-blue-600"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 font-semibold py-2 px-4 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50 col-span-2"
      >
        {loading ? "Berechne..." : "Preis schätzen"}
      </button>
    </form>
  );
};
