-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxBookingMinutes" INTEGER NOT NULL DEFAULT 240,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Room" ("capacity", "createdAt", "description", "id", "isActive", "location", "name", "updatedAt") SELECT "capacity", "createdAt", "description", "id", "isActive", "location", "name", "updatedAt" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");
CREATE INDEX "Room_isActive_capacity_idx" ON "Room"("isActive", "capacity");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
