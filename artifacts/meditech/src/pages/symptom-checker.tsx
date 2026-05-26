import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, Plus, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const COMMON_SYMPTOMS = [
  "fever", "cough", "headache", "fatigue", "nausea", "vomiting",
  "diarrhea", "chest_pain", "shortness_of_breath", "skin_rash",
  "joint_pain", "muscle_pain", "sore_throat", "runny_nose",
  "loss_of_appetite", "weight_loss", "excessive_thirst", "frequent_urination",
  "eye_redness", "stomach_pain", "back_pain", "dizziness", "sweating",
  "chills", "body_ache", "swollen_lymph_nodes",
];

interface PredictionResult {
  predicted_disease: string;
  confidence: number;
  top_predictions: { disease: string; confidence: number }[];
  recommended_specialist: string;
  symptoms_analyzed: string[];
  disclaimer: string;
  model_source?: string;
  dataset?: {
    name?: string;
    source?: string;
    path?: string;
    classes?: string[];
    record_count?: number;
  };
  model_notes?: string[];
  metrics?: {
    accuracy?: number;
    macro_avg_f1?: number;
  } | null;
}

export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const s = t.symptomChecker;

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((x) => x !== sym) : [...prev, sym]
    );
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setError(s.selectAtLeast);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/ai-api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSymptomLabel = (sym: string) =>
    sym.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">{s.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{s.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{s.selectSymptoms}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((sym) => (
              <button
                key={sym}
                onClick={() => toggleSymptom(sym)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedSymptoms.includes(sym)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {selectedSymptoms.includes(sym) ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {formatSymptomLabel(sym)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    {formatSymptomLabel(sym)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-2">
                Selected: {selectedSymptoms.length} symptom(s)
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedSymptoms.map((sym) => (
                  <Badge key={sym} variant="secondary" className="cursor-pointer" onClick={() => toggleSymptom(sym)}>
                    {formatSymptomLabel(sym)} <X className="h-2.5 w-2.5 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button className="mt-4 w-full" onClick={handlePredict} disabled={selectedSymptoms.length === 0 || loading}>
            {loading ? s.predicting : s.predict}
          </Button>
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
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-800">{s.primaryPrediction}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{result.predicted_disease}</p>
                  <p className="text-sm text-blue-700">{s.confidence}: {result.confidence}%</p>
                </div>
                <Badge className="bg-blue-600">{result.confidence}%</Badge>
              </div>
              <Progress value={result.confidence} className="h-2" />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-blue-700">{t.specialist.recommended}:</span>
                <Badge variant="outline" className="border-blue-400 text-blue-700">{result.recommended_specialist}</Badge>
              </div>
              <div className="text-xs text-blue-800 space-y-1">
                <p>
                  Model source: {result.model_source === "trained_clinical_dataset" ? "Trained clinical dataset" : "Synthetic demo model"}
                </p>
                {result.dataset?.name && <p>Dataset: {result.dataset.name}</p>}
                {typeof result.dataset?.record_count === "number" && (
                  <p>Records in dataset: {result.dataset.record_count}</p>
                )}
                {typeof result.metrics?.accuracy === "number" && (
                  <p>Validation accuracy: {(result.metrics.accuracy * 100).toFixed(1)}%</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{s.allPredictions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.top_predictions.map((p, i) => (
                <div key={p.disease}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={i === 0 ? "font-semibold" : "text-muted-foreground"}>{p.disease}</span>
                    <span>{p.confidence}%</span>
                  </div>
                  <Progress value={p.confidence} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href={`/ai/home-care?disease=${encodeURIComponent(result.predicted_disease)}`}>
              <Button variant="outline" className="flex-1">{t.homeCare.getGuidance}</Button>
            </Link>
            <Link href={`/ai/specialist?disease=${encodeURIComponent(result.predicted_disease)}`}>
              <Button variant="outline" className="flex-1">{t.specialist.find}</Button>
            </Link>
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {result.disclaimer}
          </p>
          {result.model_notes && result.model_notes.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 space-y-1">
                {result.model_notes.map((note) => (
                  <p key={note} className="text-xs text-amber-800">{note}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
