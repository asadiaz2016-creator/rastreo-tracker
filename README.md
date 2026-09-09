# Rastreo de Cajas y Plataformas -- Custom Crates & Pallets

App web para rastrear la ubicacion de las cajas de trailer y plataformas
de la flotilla. Todo el equipo (choferes desde el celular, despacho desde
computadora) ve y edita la misma informacion en vivo, desde un solo link.

## Pantallas

- **Estado actual**: lista de todas las unidades con su ubicacion y dias
  ahi. Buscador, filtro por tipo, y orden por "mas tiempo en el mismo
  destino primero" (para detectar unidades posiblemente olvidadas).
- **Registrar movimiento**: elegir unidad + nuevo destino + nota opcional.
  Queda fecha y hora automaticamente.
- **Historial**: por unidad, todos los movimientos pasados con cuanto
  tiempo estuvo en cada destino.
- **Mantenimiento**: cada unidad requiere mantenimiento cada 8 semanas.
  Vista ordenada por urgencia (vencido / proximo a vencer / al dia / sin
  registro) con boton "marcar hecho hoy". Si hay unidades vencidas,
  aparece un banner rojo en todas las pantallas.
- **Administrar**: agregar unidades nuevas (una por una o pegando una
  lista), agregar/quitar destinos, ver totales.

No requiere iniciar sesion -- cualquiera con el link puede ver y editar.

## Correr en tu computadora (para probar antes de desplegar)

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop)
abierto y corriendo. No necesitas instalar Node ni Postgres en tu maquina.

Este proyecto usa el **puerto 3002** (app) y **5434** (Postgres) para no
chocar con otros proyectos locales (como `pallet-repair-tracker`, que usa
3001/5433).

```bash
docker compose up -d db                                   # arranca Postgres
docker compose run --rm app npx prisma migrate deploy      # crea las tablas
docker compose run --rm app npx prisma db seed             # carga el catalogo inicial (cajas, plataformas, destinos)
docker compose up -d app                                   # arranca la app con hot reload
```

Abre http://localhost:3002 en el navegador.

Ver logs: `docker compose logs -f app`
Detener: `docker compose down` (los datos de Postgres se quedan guardados
en un volumen; agrega `-v` si tambien quieres borrarlos).

## Cuando cambies el modelo de datos (`prisma/schema.prisma`)

```bash
docker compose run --rm app npx prisma migrate dev --name describe_el_cambio
```

Esto crea un archivo de migracion en `prisma/migrations/` (se sube a git)
y lo aplica a la base de datos local.

## Desplegar en Render con una base de datos Neon (gratis)

`render.yaml` en este repo es un [Render Blueprint](https://render.com/docs/blueprint-spec)
para el servicio web -- deliberadamente **no** crea una base de datos de
Render, porque Render borra las bases de datos gratuitas despues de 90
dias. En su lugar usamos [Neon](https://neon.tech): su plan gratis no
expira (solo se "duerme" tras unos minutos sin uso y despierta solo en la
siguiente peticion, agregando un par de segundos a esa primera carga).

1. Crea una cuenta gratis en [neon.tech](https://neon.tech) y un proyecto
   nuevo. Copia el connection string que te da (empieza con
   `postgresql://`, ya incluye `?sslmode=require` -- Prisma lo necesita
   para Neon, no lo quites).
2. Sube este proyecto a GitHub (Render despliega desde un repo git):
   ```bash
   git init
   git add .
   git commit -m "Version inicial"
   git remote add origin <la-url-de-tu-repo-nuevo-en-github>
   git push -u origin main
   ```
3. En el dashboard de Render: **New +** -> **Blueprint** -> conecta ese
   repo. Render lee `render.yaml` y crea el servicio web.
4. Cuando Render te pida las variables de entorno (o despues, en la
   pestana **Environment** del servicio), define:
   - `DATABASE_URL` -- el connection string de Neon del paso 1
5. En el primer despliegue, `docker-entrypoint.sh` corre
   `prisma migrate deploy` y `prisma db seed` automaticamente contra
   Neon, asi que las tablas y el catalogo inicial (cajas, plataformas,
   destinos) quedan listos solos.
6. Cuando termine, Render te da un link publico (algo como
   `https://rastreo-tracker.onrender.com`) -- eso es lo que compartes con
   tu equipo.

**Nota sobre el plan gratis de Render**: el servicio "se duerme" tras 15
minutos sin trafico y tarda unos segundos en despertar en la siguiente
visita. Si eso es un problema para tu equipo, el plan pagado mas barato
de Render lo mantiene siempre activo.

## Notas de diseno

- **Sin inicio de sesion, a proposito**: cualquiera con el link ve y edita
  los mismos datos -- coincide con como se usa hoy (chofer + despacho
  compartiendo info en tiempo real). Si mas adelante quieres restringir
  quien puede editar, se puede agregar un PIN simple como en
  `pallet-repair-tracker`.
- **"En vivo" = actualizacion automatica cada 20 segundos**, no
  websockets. Para el uso real (consultar ubicaciones, registrar un
  movimiento ocasional) es suficiente y mucho mas simple de mantener; si
  el equipo crece y se necesita instantaneo, se puede agregar mas
  adelante.
- **"Patio" nunca se puede eliminar** (`Location.isDefault`): es el
  destino base al que vuelve cada unidad. Un destino con unidades
  asignadas tampoco se puede eliminar (hay que mover esas unidades
  primero).
- **El mantenimiento solo guarda la ultima fecha** (`Item.lastMaintenanceAt`);
  la proxima fecha (8 semanas despues) se calcula al vuelo, no se
  duplica en la base de datos.
