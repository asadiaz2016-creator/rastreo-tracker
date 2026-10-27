-- AlterTable
ALTER TABLE "Location" ADD COLUMN "pideContenido" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "currentContenidoId" TEXT;

-- AlterTable
ALTER TABLE "Movement" ADD COLUMN "contenidoId" TEXT;

-- CreateTable
CREATE TABLE "Contenido" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contenido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contenido_name_key" ON "Contenido"("name");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_currentContenidoId_fkey" FOREIGN KEY ("currentContenidoId") REFERENCES "Contenido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_contenidoId_fkey" FOREIGN KEY ("contenidoId") REFERENCES "Contenido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Datos iniciales: el catalogo de contenidos y CCP como destino que lo pide.
INSERT INTO "Contenido" ("id", "name", "sortOrder") VALUES
  ('contenido_producto_terminado', 'Producto terminado', 0),
  ('contenido_scrap_pallets', 'Scrap pallets', 1),
  ('contenido_vacia', 'Vacía', 2),
  ('contenido_carton', 'Cartón', 3);

UPDATE "Location" SET "pideContenido" = true WHERE UPPER(TRIM("name")) = 'CCP';
