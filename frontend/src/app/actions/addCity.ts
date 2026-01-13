"use server";

interface AddCityPayload {
  plz: string;
  cityName: string;
}

interface AddCityResponse {
  success: boolean;
  data?: {
    name: string;
    federalState: string;
  };
  error?: string;
}

export async function addCityAction(
  payload: AddCityPayload
): Promise<AddCityResponse> {
  const hookUrl = process.env.MAKE_HOOK_URL;
  const apiKey = process.env.MAKE_API_KEY;

  if (!hookUrl || !apiKey) {
    return {
      success: false,
      error: "Server-Konfiguration fehlt.",
    };
  }

  try {
    const response = await fetch(hookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-apikey": apiKey,
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

      return { success: false, error: errorMessage };
    }

    return {
      success: true,
      data: data?.data,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Stadt konnte nicht hinzugefügt werden.";
    return { success: false, error: message };
  }
}
