export const MAINTENANCE_WEEKS = 8;
const MAINTENANCE_MS = MAINTENANCE_WEEKS * 7 * 24 * 60 * 60 * 1000;

export type MaintenanceStatus = "vencido" | "proximo" | "aldia" | "sin_registro";

export function nextMaintenanceDate(lastMaintenanceAt: Date | null): Date | null {
  if (!lastMaintenanceAt) return null;
  return new Date(lastMaintenanceAt.getTime() + MAINTENANCE_MS);
}

export function maintenanceStatus(
  lastMaintenanceAt: Date | null,
  now: Date = new Date(),
): { status: MaintenanceStatus; nextDate: Date | null; daysUntil: number | null } {
  const nextDate = nextMaintenanceDate(lastMaintenanceAt);
  if (!nextDate) {
    return { status: "sin_registro", nextDate: null, daysUntil: null };
  }
  const daysUntil = Math.floor((nextDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (daysUntil < 0) return { status: "vencido", nextDate, daysUntil };
  if (daysUntil <= 7) return { status: "proximo", nextDate, daysUntil };
  return { status: "aldia", nextDate, daysUntil };
}

export function daysBetween(from: Date, to: Date = new Date()): number {
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}
