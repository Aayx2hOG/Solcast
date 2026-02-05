"use client";

import { OracleChart } from "@/components/charts/OracleChart";
import { OracleStats } from "@/components/oracle/OracleStats";
import { OracleFeed } from "@/components/oracle/OracleFeed";

export default function OraclePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Oracle Price Feed</h1>
          <p className="text-muted-foreground">
            Real-time price data from decentralized oracle sources
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <OracleStats />
      </div>

      <OracleChart className="col-span-full" />

      <OracleFeed />
    </div>
  );
}
