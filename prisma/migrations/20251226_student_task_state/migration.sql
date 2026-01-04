-- CreateTable
CREATE TABLE "StudentTaskState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "currentTaskIndex" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "confusedCount" INTEGER NOT NULL DEFAULT 0,
    "skillLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "isObserver" BOOLEAN NOT NULL DEFAULT 0,
    "observerTaskId" INTEGER,
    "editorUnlocked" BOOLEAN NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentTaskState_userId_projectId_key" ON "StudentTaskState"("userId", "projectId");
