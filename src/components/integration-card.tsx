"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface IntegrationCardProps {
  type: "sevdesk" | "mollie";
  title: string;
  description: string;
  status: string;
  validatedAt: string | null;
  loading: boolean;
  onStatusChange: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  verbunden: { label: "Verbunden", variant: "default" },
  getrennt: { label: "Getrennt", variant: "secondary" },
  ungueltig: { label: "Ungueltig", variant: "destructive" },
  nicht_verifiziert: { label: "Nicht verifiziert", variant: "outline" },
};

export function IntegrationCard({
  type,
  title,
  description,
  status,
  validatedAt,
  loading,
  onStatusChange,
}: IntegrationCardProps) {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  const isConnected = status === "verbunden" || status === "nicht_verifiziert";
  const config = statusConfig[status] ?? statusConfig.getrennt;

  async function handleSave() {
    if (!token.trim()) return;

    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch("/api/integrations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, token: token.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.warning) {
          setMessage({ type: "warning", text: data.warning });
        } else {
          setMessage({ type: "success", text: `${title} erfolgreich verbunden.` });
        }
        setToken("");
        onStatusChange();
      } else {
        setMessage({ type: "error", text: data.error ?? "Verbindung fehlgeschlagen." });
      }
    } catch {
      setMessage({ type: "error", text: "Ein unerwarteter Fehler ist aufgetreten." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setMessage(null);
    setDisconnecting(true);

    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `${title}-Verbindung getrennt.` });
        onStatusChange();
      } else {
        setMessage({ type: "error", text: "Trennung fehlgeschlagen." });
      }
    } catch {
      setMessage({ type: "error", text: "Ein unerwarteter Fehler ist aufgetreten." });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {validatedAt && (
          <p className="text-xs text-muted-foreground">
            Zuletzt validiert:{" "}
            {new Date(validatedAt).toLocaleString("de-DE", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${type}-token`}>API Token</Label>
          <div className="flex gap-2">
            <Input
              id={`${type}-token`}
              type="password"
              placeholder={isConnected ? "Neuen Token eingeben..." : "Token eingeben..."}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
            <Button onClick={handleSave} disabled={saving || !token.trim()}>
              {saving ? "Pruefen..." : "Speichern"}
            </Button>
          </div>
        </div>

        {isConnected && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={disconnecting}
              >
                {disconnecting ? "Trennung..." : "Verbindung trennen"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {title}-Verbindung trennen?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Der gespeicherte API-Token wird geloescht. Sie muessen einen
                  neuen Token eingeben, um die Verbindung wiederherzustellen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Trennen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
