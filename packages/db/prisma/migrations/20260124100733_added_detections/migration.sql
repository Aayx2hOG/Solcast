-- CreateTable
CREATE TABLE "FraudDetection" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "indicators" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyDetection" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "anomalyScore" DOUBLE PRECISION NOT NULL,
    "severity" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,
    "isAnomaly" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyDetection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FraudDetection_tradeId_key" ON "FraudDetection"("tradeId");

-- CreateIndex
CREATE INDEX "FraudDetection_userId_idx" ON "FraudDetection"("userId");

-- CreateIndex
CREATE INDEX "FraudDetection_marketId_idx" ON "FraudDetection"("marketId");

-- CreateIndex
CREATE INDEX "FraudDetection_recommendation_idx" ON "FraudDetection"("recommendation");

-- CreateIndex
CREATE INDEX "FraudDetection_createdAt_idx" ON "FraudDetection"("createdAt");

-- CreateIndex
CREATE INDEX "AnomalyDetection_marketId_idx" ON "AnomalyDetection"("marketId");

-- CreateIndex
CREATE INDEX "AnomalyDetection_source_idx" ON "AnomalyDetection"("source");

-- CreateIndex
CREATE INDEX "AnomalyDetection_severity_idx" ON "AnomalyDetection"("severity");

-- CreateIndex
CREATE INDEX "AnomalyDetection_createdAt_idx" ON "AnomalyDetection"("createdAt");

-- AddForeignKey
ALTER TABLE "FraudDetection" ADD CONSTRAINT "FraudDetection_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
