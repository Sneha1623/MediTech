import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, ArrowLeft, Search, AlertTriangle, Clock, Home, Stethoscope } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const DISEASES = [
  "Influenza", "Common Cold", "Dengue Fever", "Malaria", "Typhoid",
  "Type 2 Diabetes", "Hypertension", "Asthma", "Pneumonia", "Tuberculosis",
  "Food Poisoning", "Urinary Tract Infection", "Migraine", "Anemia",
  "Skin Allergy", "Conjunctivitis", "Arthritis", "Appendicitis", "Gastritis", "Anxiety Disorder",
  "Acne", "Atopic Dermatitis", "Eczema", "Psoriasis / Lichen Planus",
  "Fungal Infection", "Ringworm", "Rosacea", "Actinic Keratosis",
  "Basal Cell Carcinoma", "Melanocytic Nevi", "Melanoma",
  "Benign Keratosis-like Lesions", "Seborrheic Keratoses", "Viral Warts / Molluscum",
];

interface GuidanceResult {
  disease: string;
  home_remedies: string[];
  when_to_visit_doctor: string;
  emergency_warning: string;
  recommended_specialist: string;
  disclaimer: string;
}

export default function HomeCare() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const diseaseFromQuery = params.get("disease") || "";
  const { t } = useI18n();
  const h = t.homeCare;

  const [query, setQuery] = useState(diseaseFromQuery);
  const [result, setResult] = useState<GuidanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuidance = async (disease: string) => {
    if (!disease.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/ai-api/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disease }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get guidance");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (diseaseFromQuery) fetchGuidance(diseaseFromQuery);
  }, []);

  const isEmergencyDisease = (disease: string) =>
    ["Appendicitis", "Dengue Fever", "Malaria"].includes(disease);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-600" />
            <h1 className="text-xl font-bold">{h.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{h.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{h.searchDisease}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={h.searchDisease}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchGuidance(query)}
            />
            <Button onClick={() => fetchGuidance(query)} disabled={loading || !query.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? h.getting : h.getGuidance}
            </Button>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-1.5">
              {DISEASES.map((d) => (
                <button
                  key={d}
                  onClick={() => { setQuery(d); fetchGuidance(d); }}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-700 border border-gray-200 hover:border-green-300 transition-colors"
                >
                  {d}
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
          {isEmergencyDisease(result.disease) && (
            <div className="flex items-center gap-2 bg-red-100 border border-red-300 rounded-lg p-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700">{h.emergency}</p>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{result.disease}</CardTitle>
                <Badge variant="outline">{result.recommended_specialist}</Badge>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-green-600" />
                <CardTitle className="text-base text-green-800">{h.remedies}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.home_remedies.map((remedy, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span>{remedy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base text-blue-800">{h.whenToVisit}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{result.when_to_visit_doctor}</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <CardTitle className="text-base text-red-800">{h.emergency}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">{result.emergency_warning}</p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href={`/ai/specialist?disease=${encodeURIComponent(result.disease)}`}>
              <Button variant="outline">
                <Stethoscope className="h-4 w-4 mr-2" />
                {t.specialist.find}
              </Button>
            </Link>
            <Link href="/hospitals">
              <Button>{t.nav.hospitals}</Button>
            </Link>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            ⚠️ {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
