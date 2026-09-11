export interface Pm25Advisory {
  category: string;
  color: string;
  message: string;
}

export function getPm25Advisory(value: number | null | undefined): Pm25Advisory {
  const pm25 = Number(value ?? 0);

  if (pm25 <= 30) {
    return {
      category: "Good",
      color: "text-emerald-700",
      message: "Air is acceptable for normal outdoor activity."
    };
  }

  if (pm25 <= 60) {
    return {
      category: "Satisfactory",
      color: "text-lime-700",
      message: "Sensitive people should keep long outdoor exertion moderate."
    };
  }

  if (pm25 <= 90) {
    return {
      category: "Moderate",
      color: "text-amber-700",
      message: "Children, elders, and asthma-sensitive users should reduce prolonged outdoor activity."
    };
  }

  if (pm25 <= 120) {
    return {
      category: "Poor",
      color: "text-orange-700",
      message: "Limit outdoor exertion and consider a mask near traffic or dusty roads."
    };
  }

  if (pm25 <= 250) {
    return {
      category: "Very poor",
      color: "text-red-700",
      message: "Avoid long outdoor exposure. Sensitive users should stay indoors where possible."
    };
  }

  return {
    category: "Severe",
    color: "text-rose-800",
    message: "Avoid outdoor activity and follow official health guidance."
  };
}

export function celsiusToFahrenheit(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value) * 9 / 5 + 32;
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
