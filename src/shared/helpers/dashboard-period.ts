export interface DashboardPeriodParams {
  startDate?: string;
  endDate?: string;
}

export interface DashboardPeriod {
  startDate: string;
  endDate: string;
}

export function getCurrentYearPeriod(): DashboardPeriod {
  const year = new Date().getFullYear();
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

export function buildDashboardQueryUrl(
  endpoint: string,
  baseUrl: string,
  params?: DashboardPeriodParams,
): string {
  const url = new URL(
    endpoint.startsWith("/") ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`,
  );

  if (params?.startDate) {
    url.searchParams.set("startDate", params.startDate);
  }
  if (params?.endDate) {
    url.searchParams.set("endDate", params.endDate);
  }

  return url.toString();
}

/** Convertit une date API (ISO ou YYYY-MM-DD) en valeur pour <input type="date"> */
export function toDateInputValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDashboardPeriodLabel(period?: DashboardPeriod): string {
  if (!period?.startDate || !period?.endDate) {
    return "Année en cours";
  }

  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const start = formatter.format(new Date(period.startDate));
  const end = formatter.format(new Date(period.endDate));

  return `${start} — ${end}`;
}

export function periodToFilterParams(
  period: DashboardPeriod,
): DashboardPeriodParams {
  return {
    startDate: toDateInputValue(period.startDate),
    endDate: toDateInputValue(period.endDate),
  };
}

export function formatFcfa(value: number): string {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}
