import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserCheck, ArrowLeft, Search, AlertTriangle, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const QUICK_CONDITIONS = [
  { label: "Skin / Acne", value: "skin" },
  { label: "Wound / Injury", value: "wound" },
  { label: "Fracture / Bone", value: "fracture" },
  { label: "Heart / Chest Pain", value: "heart" },
  { label: "Lungs / Cough", value: "lung" },
  { label: "Stomach / Gut", value: "stomach" },
  { label: "Diabetes / Sugar", value: "diabetes" },
  { label: "Anxiety / Depression", value: "mental" },
  { label: "Eye / Vision", value: "eye redness" },
  { label: "UTI / Kidney", value: "urinary tract infection" },
  { label: "Flu / Fever", value: "influenza" },
  { label: "Migraine", value: "migraine" },
];

interface SpecialistResult {
  recommended_specialist: string;
  matched_condition: string | null;
  query: string;
  disclaimer: string;
}

export default function Specialist() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const diseaseFromQuery = params.get("disease") || "";
  const conditionFromQuery = params.get("condition") || "";
  const { t } = useI18n();
  const s = t.specialist;

  const [query, setQuery] = useState(diseaseFromQuery || conditionFromQuery);
  const [result, setResult] = useState<SpecialistResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialist = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/ai-api/specialist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease: diseaseFromQuery || q,
          condition: conditionFromQuery || q,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to find specialist");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (diseaseFromQuery || conditionFromQuery) {
      fetchSpecialist(diseaseFromQuery || conditionFromQuery);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-teal-600" />
            <h1 className="text-xl font-bold">{s.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{s.searchDisease}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={s.searchDisease}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSpecialist(query)}
            />
            <Button onClick={() => fetchSpecialist(query)} disabled={loading || !query.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? s.finding : s.find}
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setQuery(c.value); fetchSpecialist(c.value); }}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-teal-100 hover:text-teal-700 border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="border-teal-200 bg-teal-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-800">{s.recommended}:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-200 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <p className="text-xl font-bold text-teal-900">{result.recommended_specialist}</p>
                  {result.matched_condition && (
                    <p className="text-sm text-teal-600">For: {result.matched_condition}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Find this specialist near you</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the Hospitals section to find facilities with {result.recommended_specialist} specialists.
                  </p>
                  <Link href="/hospitals">
                    <Button variant="outline" size="sm" className="mt-2">
                      {t.nav.hospitals}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            ⚠️ {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
