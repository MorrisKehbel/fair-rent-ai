// Validation constants
export const MIN_SIZE_SQM = 10;
export const MIN_ROOMS = 1;
export const ZIP_CODE_LENGTH = 5;
export const MIN_YEAR_CONSTRUCTED = 1600;
export const MIN_CITY_NAME_LENGTH = 3;

// Rate limiting
export const UPDATE_COOLDOWN_DAYS = 7;

// Field input rules for numeric fields
export interface FieldRule {
  maxInt: number;
  maxDec: number;
}

export const FIELD_RULES: Record<string, FieldRule> = {
  size: { maxInt: 3, maxDec: 2 },
  rooms: { maxInt: 2, maxDec: 1 },
  zip_code: { maxInt: 5, maxDec: 0 },
  year_constructed: { maxInt: 4, maxDec: 0 },
};

// Form field initial values
export const INITIAL_FORM_DATA = {
  size: "",
  rooms: "",
  city: "",
  region: "",
  zip_code: "",
  year_constructed: "",
  has_kitchen: false,
  has_elevator: false,
  has_garden: false,
  has_balcony: false,
  has_is_new_building: false,
  has_cellar: false,
} as const;

export type FormData = {
  size: string;
  rooms: string;
  city: string;
  region: string;
  zip_code: string;
  year_constructed: string;
  has_kitchen: boolean;
  has_elevator: boolean;
  has_garden: boolean;
  has_balcony: boolean;
  has_is_new_building: boolean;
  has_cellar: boolean;
};

// Validation error messages (German)
export const ERROR_MESSAGES = {
  SIZE_MIN: `Größe muss mind. ${MIN_SIZE_SQM} m² sein.`,
  ROOMS_MIN: "Mindestens 1 Zimmer erforderlich.",
  ZIP_CODE_LENGTH: `PLZ muss ${ZIP_CODE_LENGTH}-stellig sein.`,
  CITY_NO_DATA: "Noch keine Trainingsdaten.",
  CITY_NAME_MIN: `Bitte gültige Stadt eingeben.`,
  CITY_LETTERS_ONLY: "Darf nur Buchstaben enthalten.",
  REGION_LETTERS_ONLY: "Darf nur Buchstaben enthalten.",
  YEAR_INVALID: "Bitte ein gültiges Baujahr angeben.",
  FETCH_ERROR:
    "Preis konnte nicht berechnet werden. Bitte versuche es später erneut.",
  BACKEND_ERROR: "Fehler bei der Anfrage ans Backend",
} as const;
