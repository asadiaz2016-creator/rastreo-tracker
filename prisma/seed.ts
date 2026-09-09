import { PrismaClient, ItemType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Catalogo inicial de la flotilla de Custom Crates & Pallets.
// Nota: CZPD328 aparecia en la lista original de cajas por error de
// captura -- es una plataforma, y solo se registra como tal aqui.
const CAJAS = [
  "CCP036", "CCP038", "CCP039", "CCP041", "CCP043", "CCP045", "CCP046",
  "CCP047", "CCP048", "CCP053", "CCP056", "CCP057", "CCP058", "CCP060",
  "CCP102", "CCP103", "CCP137", "CCP138", "CCP154", "CCP155", "CCP156",
  "CCP157", "CCP159", "CCP160", "CCP161", "CCP174", "CCP208", "CCP209",
  "CZPD238", "CZPD239", "CZPD240", "CZPD241", "CZPD242", "CZPD243",
  "CZPD244", "CZPD245", "CZPD246", "CZPD309", "CZPD317", "CZPD319",
  "CZPD248", "CZPD249", "CZPD263", "CZPD269", "CZPD270", "CZPD273",
  "CZPD291", "CZPD292", "CZPD293", "CZPD294", "CZPD298", "CZPD301",
  "CZPD302", "CZPD303", "CZPD304", "CZPD305", "CZPD306", "CZPD307",
  "CZPD308", "CZPD318", "CZPD320", "CZPD321", "CZPD322", "CZPD323",
  "CZPD324", "CZPD325", "CZPD326", "CZPD327", "4076", "232409", "9223",
  "9226", "CZPD331", "CZPD333", "CZPD336", "CZPD335", "CZPD337",
];

const PLATAFORMAS = ["CCP124", "CCP151", "CCP129", "CZPD328", "CZPD329", "01"];

const DESTINOS = [
  "Square D 1", "Square D 2", "Square D 3", "Square D 4", "National Pecan",
  "Toro", "Delfingen", "Southwire", "Ceva", "SDI", "Flagstone", "Amazon",
  "UPS", "Fedex", "Gaytan", "Stampede", "Marshall's", "DC Railroad",
  "Azar Nut", "TYC",
];

async function main() {
  // Solo crea el hash la primera vez -- no pisa un PIN que ya haya sido
  // cambiado en una base de datos existente.
  const existingSettings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!existingSettings) {
    const adminPin = process.env.ADMIN_PIN ?? "2468";
    const adminPinHash = await bcrypt.hash(adminPin, 10);
    await prisma.settings.create({ data: { id: 1, adminPinHash } });
  }

  const patio = await prisma.location.upsert({
    where: { name: "Patio" },
    update: {},
    create: { name: "Patio", isDefault: true, sortOrder: 0 },
  });

  for (const [i, name] of DESTINOS.entries()) {
    await prisma.location.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i + 1 },
    });
  }

  const seedItems = [
    ...CAJAS.map((code) => ({ code, type: ItemType.CAJA })),
    ...PLATAFORMAS.map((code) => ({ code, type: ItemType.PLATAFORMA })),
  ];

  for (const { code, type } of seedItems) {
    await prisma.item.upsert({
      where: { code },
      update: {},
      create: { code, type, currentLocationId: patio.id },
    });
  }

  console.log(
    `Listo: ${DESTINOS.length + 1} destinos, ${CAJAS.length} cajas, ${PLATAFORMAS.length} plataformas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
