"use client";

import { ChangeEvent, useCallback, useState } from "react";
import {
  FIELD_RULES,
  FormData,
  INITIAL_FORM_DATA,
  MIN_SIZE_SQM,
  MIN_ROOMS,
  ZIP_CODE_LENGTH,
  ERROR_MESSAGES,
  MIN_CITY_NAME_LENGTH,
} from "@/constants/form";
import { Database } from "@/types/supabase";

type StatusRow = Database["public"]["Tables"]["rent_features_agg"]["Row"];

const LETTERS_ONLY_REGEX = /^[A-Za-zÄÖÜäöüß\s-]+$/;
const normalizeName = (value: string) => value.replace(/_/g, " ").trim();

export interface FormErrors {
  size?: string;
  rooms?: string;
  zip_code?: string;
  year_constructed?: string;
  city?: string;
  region?: string;
}

interface UseFormValidationProps {
  data: StatusRow[] | null;
}

export function useFormValidation({ data }: UseFormValidationProps) {
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // handle checkboxes
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    const rules = FIELD_RULES[name];

    if (rules) {
      let cleanValue = value;

      if (rules.maxDec > 0) {
        // allow numbers and comma for decimal
        cleanValue = cleanValue.replace(/[^0-9,]/g, "");
        const commaCount = (cleanValue.match(/,/g) || []).length;
        if (commaCount > 1) return;
      } else {
        // only allow integers
        cleanValue = cleanValue.replace(/\D/g, "");
      }

      // validate length constraints
      if (cleanValue.includes(",")) {
        const [integerPart, decimalPart] = cleanValue.split(",");
        if (integerPart.length > rules.maxInt) return;
        if (decimalPart.length > rules.maxDec) return;
      } else {
        if (cleanValue.length > rules.maxInt) return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));
      return;
    }

    // enforce letter-only input for city and region
    if (name === "city" || name === "region") {
      const cleanValue = value.replace(/[^A-Za-zÄÖÜäöüß\s-]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));
      return;
    }

    // default handling for other fields
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // size validation
    if (!formData.size || parseInt(formData.size) < MIN_SIZE_SQM) {
      newErrors.size = ERROR_MESSAGES.SIZE_MIN;
    }

    // rooms validation
    if (!formData.rooms || parseInt(formData.rooms) < MIN_ROOMS) {
      newErrors.rooms = ERROR_MESSAGES.ROOMS_MIN;
    }

    // zip code validation
    if (formData.zip_code.length !== ZIP_CODE_LENGTH) {
      newErrors.zip_code = ERROR_MESSAGES.ZIP_CODE_LENGTH;
    }

    // check if city exists in training data
    const hasCityValue = formData.city.trim().length > 0;
    const cityHasOnlyLetters =
      !hasCityValue || LETTERS_ONLY_REGEX.test(formData.city.trim());
    if (hasCityValue && !cityHasOnlyLetters) {
      newErrors.city = ERROR_MESSAGES.CITY_LETTERS_ONLY;
    } else {
      const cityExists = data?.some(
        (item) =>
          normalizeName(item.city).toLowerCase() ===
          normalizeName(formData.city).toLowerCase()
      );
      if (formData.city.length == 0) {
        newErrors.city = ERROR_MESSAGES.CITY_NAME_MIN;
      } else if (!cityExists) {
        newErrors.city = ERROR_MESSAGES.CITY_NO_DATA;
      }
    }

    // region validation: letters only
    const hasRegionValue = formData.region.trim().length > 0;
    const regionHasOnlyLetters =
      !hasRegionValue || LETTERS_ONLY_REGEX.test(formData.region.trim());
    if (hasRegionValue && !regionHasOnlyLetters) {
      newErrors.region = ERROR_MESSAGES.REGION_LETTERS_ONLY;
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, data]);

  const resetForm = useCallback(() => {
    setFormData({ ...INITIAL_FORM_DATA });
    setFormErrors({});
  }, []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    formData,
    formErrors,
    handleChange,
    validateForm,
    resetForm,
    updateFormData,
    setFormErrors,
  };
}
