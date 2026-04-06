import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Uebersicht</h1>
      <Card>
        <CardHeader>
          <CardTitle>Willkommen bei APA</CardTitle>
          <CardDescription>
            Ihr persoenlicher Buchhaltungsassistent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Verbinden Sie zuerst Ihre Integrationen unter{" "}
            <a
              href="/dashboard/einstellungen"
              className="text-primary underline underline-offset-4"
            >
              Einstellungen
            </a>
            , um loszulegen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
