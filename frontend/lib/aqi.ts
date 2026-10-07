export interface Pm25Advisory {
  category: string;
  color: string;
  message: string;
}

export type DemographicGroup =
  | "general_public"
  | "asthmatic_respiratory"
  | "children_elderly"
  | "outdoor_workers";

export function getPm25Advisory(
  value: number | null | undefined,
  demographic: DemographicGroup = "general_public"
): Pm25Advisory {
  const pm25 = Number(value ?? 0);

  let category = "Good";
  let color = "text-emerald-700";

  if (pm25 <= 30) {
    category = "Good";
    color = "text-emerald-700";
  } else if (pm25 <= 60) {
    category = "Satisfactory";
    color = "text-lime-700";
  } else if (pm25 <= 90) {
    category = "Moderate";
    color = "text-amber-700";
  } else if (pm25 <= 120) {
    category = "Poor";
    color = "text-orange-700";
  } else if (pm25 <= 250) {
    category = "Very poor";
    color = "text-red-700";
  } else {
    category = "Severe";
    color = "text-rose-800";
  }

  const messages: Record<DemographicGroup, Record<string, string>> = {
    general_public: {
      Good: "Air quality is acceptable for normal outdoor activity.",
      Satisfactory: "Air quality is fair. Sensitive people should monitor symptoms.",
      Moderate: "Children, elders, and sensitive users should reduce prolonged outdoor activity.",
      Poor: "Limit outdoor exertion and wear an N95 mask near traffic or dusty roads.",
      "Very poor": "Avoid long outdoor exposure. Sensitive users should stay indoors.",
      Severe: "Emergency air pollution: Avoid outdoor activity entirely."
    },
    asthmatic_respiratory: {
      Good: "Safe for outdoor exercise. Keep standard quick-relief inhaler handy.",
      Satisfactory: "Minor irritants possible. Monitor wheezing or shortness of breath.",
      Moderate: "Increased asthma risk. Reduce prolonged outdoor exercise and stay indoors if coughing.",
      Poor: "High bronchospasm risk. Wear an N95 mask, keep rescue inhaler ready, and avoid outdoor sports.",
      "Very poor": "Dangerous for respiratory patients. Remain indoors in filtered air; seek medical aid if symptoms worsen.",
      Severe: "Severe medical alert: Stay indoors with air purifier, keep inhaler/medication ready."
    },
    children_elderly: {
      Good: "Safe for children playground activities and senior morning walks.",
      Satisfactory: "Good for outdoor play. Ensure children stay hydrated.",
      Moderate: "Limit heavy strenuous outdoor games for school children and long walks for seniors.",
      Poor: "Restrict outdoor recess for school children; seniors should stay indoors during peak hours.",
      "Very poor": "Keep children and elderly indoors entirely. Suspend outdoor school activities.",
      Severe: "Critical vulnerability zone: Children and seniors must stay indoors with windows closed."
    },
    outdoor_workers: {
      Good: "Safe for full-shift outdoor physical work.",
      Satisfactory: "Standard working conditions. Take normal hydration breaks.",
      Moderate: "Take frequent shaded rest breaks during continuous manual labor.",
      Poor: "Mandatory N95 mask requirement for construction, agricultural, and transport workers.",
      "Very poor": "Reduce physical workload intensity; rotate shift hours to avoid peak pollution.",
      Severe: "Halt heavy outdoor physical labor where possible or enforce strict respiratory gear."
    }
  };

  const groupMessages = messages[demographic] ?? messages.general_public;
  const message = groupMessages[category] ?? groupMessages.Good;

  return { category, color, message };
}

export function celsiusToFahrenheit(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  return (Number(value) * 9) / 5 + 32;
}

export function formatTemperature(valueC: number | null | undefined, unit: "C" | "F"): string {
  if (valueC === null || valueC === undefined || Number.isNaN(Number(valueC))) {
    return "--";
  }
  const value = unit === "F" ? celsiusToFahrenheit(valueC) : Number(valueC);
  return `${Math.round(value ?? 0)}\u00b0${unit}`;
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }
  return Number(value).toFixed(digits);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }
  return `${Math.round(Number(value))}%`;
}
