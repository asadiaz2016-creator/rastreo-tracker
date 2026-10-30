import type { ItemType } from "@prisma/client";
import type { MaintenanceStatus } from "./maintenance";

export type ItemDTO = {
  id: string;
  code: string;
  type: ItemType;
  locationId: string;
  locationName: string;
  locationSince: string;
  locationPideContenido: boolean;
  contenidoId: string | null;
  contenidoName: string | null;
  daysInLocation: number;
  lastMaintenanceAt: string | null;
  maintenanceStatus: MaintenanceStatus;
  nextMaintenanceDate: string | null;
  daysUntilMaintenance: number | null;
};

export type LocationDTO = {
  id: string;
  name: string;
  isDefault: boolean;
  pideContenido: boolean;
  itemCount: number;
};

export type ContenidoDTO = {
  id: string;
  name: string;
};

export type MovementDTO = {
  id: string;
  fromLocationName: string | null;
  toLocationName: string;
  contenidoName: string | null;
  note: string | null;
  createdAt: string;
  durationDays: number | null;
  isOngoing: boolean;
};
