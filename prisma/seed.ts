import "dotenv/config";
import { TZDate } from "@date-fns/tz";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { addDays, isWeekend, set } from "date-fns";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const timeZone = process.env["BUSINESS_TIMEZONE"] ?? "America/Sao_Paulo";

const features = [
  { slug: "projector", name: "Projetor" },
  { slug: "videoconf", name: "Videoconferência" },
  { slug: "whiteboard", name: "Quadro branco" },
  { slug: "tv", name: "TV" },
];

const users = [
  { name: "Ana Souza", email: "ana@example.com", role: "USER" },
  { name: "Bruno Lima", email: "bruno@example.com", role: "USER" },
  { name: "Carla Mendes", email: "carla@example.com", role: "ADMIN" },
] as const;

const rooms = [
  {
    name: "Sala Foco",
    capacity: 4,
    location: "2º andar",
    description: "Sala pequena para conversas rápidas e 1:1.",
    features: ["tv", "whiteboard"],
  },
  {
    name: "Sala Ideias",
    capacity: 6,
    location: "2º andar",
    description: "Paredes de quadro branco para brainstorming.",
    features: ["whiteboard"],
  },
  {
    name: "Sala Paulista",
    capacity: 8,
    location: "3º andar",
    description: null,
    features: ["tv", "videoconf"],
  },
  {
    name: "Sala Pinheiros",
    capacity: 10,
    location: "3º andar",
    description: "Ideal para reuniões híbridas.",
    features: ["projector", "videoconf", "whiteboard"],
  },
  {
    name: "Sala Conselho",
    capacity: 12,
    location: "4º andar",
    description: "Mesa única para reuniões de diretoria.",
    features: ["projector", "videoconf", "tv"],
  },
  {
    name: "Auditório",
    capacity: 20,
    location: "Térreo",
    description: "Apresentações e eventos internos.",
    features: ["projector", "videoconf"],
  },
];

function getNextBusinessDays(from: Date, count: number): TZDate[] {
  const days: TZDate[] = [];
  let day = new TZDate(from, timeZone);
  while (days.length < count) {
    day = addDays(day, 1);
    if (!isWeekend(day)) days.push(day);
  }
  return days;
}

function atTime(day: TZDate, hours: number, minutes = 0): TZDate {
  return set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
}

async function main() {
  for (const feature of features) {
    await prisma.feature.upsert({
      where: { slug: feature.slug },
      update: {},
      create: feature,
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  // update: {} keeps the seed from overwriting changes an admin made through the app.
  for (const { features: slugs, ...room } of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: {
        ...room,
        features: {
          create: slugs.map((slug) => ({ feature: { connect: { slug } } })),
        },
      },
    });
  }

  // Reservations have no natural key and their dates are relative to today,
  // so they are only created on an empty table to keep the seed idempotent.
  if ((await prisma.reservation.count()) > 0) return;

  const ana = await prisma.user.findUniqueOrThrow({
    where: { email: "ana@example.com" },
  });
  const bruno = await prisma.user.findUniqueOrThrow({
    where: { email: "bruno@example.com" },
  });
  const paulista = await prisma.room.findUniqueOrThrow({
    where: { name: "Sala Paulista" },
  });
  const conselho = await prisma.room.findUniqueOrThrow({
    where: { name: "Sala Conselho" },
  });
  const [day1, day2] = getNextBusinessDays(new Date(), 2);
  if (!day1 || !day2) throw new Error("Could not compute business days");

  await prisma.reservation.createMany({
    data: [
      {
        roomId: paulista.id,
        userId: ana.id,
        title: "Daily do time",
        startsAt: atTime(day1, 9),
        endsAt: atTime(day1, 10),
      },
      {
        roomId: conselho.id,
        userId: bruno.id,
        title: "Revisão trimestral",
        startsAt: atTime(day1, 14),
        endsAt: atTime(day1, 15, 30),
      },
      {
        roomId: paulista.id,
        userId: bruno.id,
        title: "1:1 com a liderança",
        startsAt: atTime(day2, 10),
        endsAt: atTime(day2, 11),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
