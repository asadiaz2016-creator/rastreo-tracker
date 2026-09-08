import { prisma } from "./prisma";
import { daysBetween, maintenanceStatus } from "./maintenance";
import type { ItemDTO, LocationDTO, MovementDTO } from "./types";

export async function getItemsDTO(): Promise<ItemDTO[]> {
  const items = await prisma.item.findMany({
    include: { currentLocation: true },
    orderBy: { code: "asc" },
  });
  const now = new Date();
  return items.map((item) => {
    const m = maintenanceStatus(item.lastMaintenanceAt, now);
    return {
      id: item.id,
      code: item.code,
      type: item.type,
      locationId: item.currentLocationId,
      locationName: item.currentLocation.name,
      locationSince: item.currentLocationSince.toISOString(),
      daysInLocation: daysBetween(item.currentLocationSince, now),
      lastMaintenanceAt: item.lastMaintenanceAt?.toISOString() ?? null,
      maintenanceStatus: m.status,
      nextMaintenanceDate: m.nextDate?.toISOString() ?? null,
      daysUntilMaintenance: m.daysUntil,
    };
  });
}

export async function getLocationsDTO(): Promise<LocationDTO[]> {
  const locations = await prisma.location.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    isDefault: loc.isDefault,
    itemCount: loc._count.items,
  }));
}

export async function getItemHistorial(
  itemId: string,
): Promise<{ item: ItemDTO; movements: MovementDTO[] } | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { currentLocation: true },
  });
  if (!item) return null;

  const movements = await prisma.movement.findMany({
    where: { itemId },
    include: { fromLocation: true, toLocation: true },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const movementDTOs: MovementDTO[] = movements.map((mv, i) => {
    const next = movements[i + 1];
    const endDate = next ? next.createdAt : now;
    return {
      id: mv.id,
      fromLocationName: mv.fromLocation?.name ?? null,
      toLocationName: mv.toLocation.name,
      note: mv.note,
      createdAt: mv.createdAt.toISOString(),
      durationDays: daysBetween(mv.createdAt, endDate),
      isOngoing: !next,
    };
  });
  movementDTOs.reverse(); // mas reciente primero

  const now2 = new Date();
  const m = maintenanceStatus(item.lastMaintenanceAt, now2);
  const itemDTO: ItemDTO = {
    id: item.id,
    code: item.code,
    type: item.type,
    locationId: item.currentLocationId,
    locationName: item.currentLocation.name,
    locationSince: item.currentLocationSince.toISOString(),
    daysInLocation: daysBetween(item.currentLocationSince, now2),
    lastMaintenanceAt: item.lastMaintenanceAt?.toISOString() ?? null,
    maintenanceStatus: m.status,
    nextMaintenanceDate: m.nextDate?.toISOString() ?? null,
    daysUntilMaintenance: m.daysUntil,
  };

  return { item: itemDTO, movements: movementDTOs };
}

export async function getOverdueMaintenanceCount(): Promise<number> {
  const items = await prisma.item.findMany({ select: { lastMaintenanceAt: true } });
  const now = new Date();
  return items.filter((i) => maintenanceStatus(i.lastMaintenanceAt, now).status === "vencido")
    .length;
}
