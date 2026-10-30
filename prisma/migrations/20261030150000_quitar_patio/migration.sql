-- Quitar el destino "Patio": todo lo que estaba en Patio pasa a CCP, y CCP
-- queda como el destino base (donde llegan las cajas nuevas). El
-- historial que decia Patio ahora dice CCP.
DO $$
DECLARE
  patio_id TEXT;
  ccp_id TEXT;
BEGIN
  SELECT "id" INTO patio_id FROM "Location" WHERE "name" = 'Patio';
  SELECT "id" INTO ccp_id FROM "Location" WHERE UPPER(TRIM("name")) = 'CCP' LIMIT 1;

  IF ccp_id IS NULL THEN
    ccp_id := 'location_ccp';
    INSERT INTO "Location" ("id", "name", "isDefault", "sortOrder", "pideContenido")
    VALUES (ccp_id, 'CCP', false, 0, true);
  END IF;

  IF patio_id IS NOT NULL THEN
    UPDATE "Item" SET "currentLocationId" = ccp_id WHERE "currentLocationId" = patio_id;
    UPDATE "Movement" SET "fromLocationId" = ccp_id WHERE "fromLocationId" = patio_id;
    UPDATE "Movement" SET "toLocationId" = ccp_id WHERE "toLocationId" = patio_id;
    DELETE FROM "Location" WHERE "id" = patio_id;
  END IF;

  UPDATE "Location" SET "isDefault" = false WHERE "id" <> ccp_id;
  UPDATE "Location" SET "isDefault" = true, "sortOrder" = 0 WHERE "id" = ccp_id;
END $$;
