"use client";

import { useEffect, useState } from "react";
import { IntegrationCard } from "@/components/integration-card";

interface IntegrationStatus {
  status: string;
  validatedAt: string | null;
}

interface IntegrationsMap {
  sevdesk: IntegrationStatus;
  mollie: IntegrationStatus;
}

export default function EinstellungenPage() {
  const [integrations, setIntegrations] = useState<IntegrationsMap | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/integrations/status");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations);
      }
    } catch {
      // Silent fail — cards will show "getrennt" state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">
          Verwalten Sie Ihre Integrationen und API-Verbindungen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <IntegrationCard
          type="sevdesk"
          title="sevdesk"
          description="Buchhaltungs-Backend fuer Belege, Buchungen und Kontakte"
          status={integrations?.sevdesk.status ?? "getrennt"}
          validatedAt={integrations?.sevdesk.validatedAt ?? null}
          loading={loading}
          onStatusChange={fetchStatus}
        />
        <IntegrationCard
          type="mollie"
          title="Mollie"
          description="Payment Provider fuer Settlements und Zahlungsdaten"
          status={integrations?.mollie.status ?? "getrennt"}
          validatedAt={integrations?.mollie.validatedAt ?? null}
          loading={loading}
          onStatusChange={fetchStatus}
        />
      </div>
    </div>
  );
}
