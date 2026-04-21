import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, Plus, X, AlertTriangle, CheckCircle2 } from "lucide-react";

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
}

export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) return;
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

  const formatSymptomLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Symptom Checker</h1>
          </div>
          <p className="text-sm text-muted-foreground">Select your symptoms to get a disease prediction</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedSymptoms.includes(s)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {selectedSymptoms.includes(s) ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {formatSymptomLabel(s)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    {formatSymptomLabel(s)}
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
                {selectedSymptoms.map((s) => (
                  <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => toggleSymptom(s)}>
                    {formatSymptomLabel(s)} <X className="h-2.5 w-2.5 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            className="mt-4 w-full"
            onClick={handlePredict}
            disabled={selectedSymptoms.length === 0 || loading}
          >
            {loading ? "Analyzing..." : "Predict Disease"}
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
              <CardTitle className="text-base text-blue-800">Primary Prediction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{result.predicted_disease}</p>
                  <p className="text-sm text-blue-700">Confidence: {result.confidence}%</p>
                </div>
                <Badge className="bg-blue-600">{result.confidence}%</Badge>
              </div>
              <Progress value={result.confidence} className="h-2" />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-blue-700">Recommended Specialist:</span>
                <Badge variant="outline" className="border-blue-400 text-blue-700">{result.recommended_specialist}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All Predictions</CardTitle>
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
              <Button variant="outline" className="flex-1">View Home Care Guidance</Button>
            </Link>
            <Link href={`/ai/specialist?disease=${encodeURIComponent(result.predicted_disease)}`}>
              <Button variant="outline" className="flex-1">Find Specialist</Button>
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
