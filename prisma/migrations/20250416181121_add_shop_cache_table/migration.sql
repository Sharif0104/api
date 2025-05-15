-- CreateTable
CREATE TABLE "ShopCache" (
    "id" SERIAL NOT NULL,
    "page" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "cache_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopCache_page_limit_key" ON "ShopCache"("page", "limit");
