import { useState, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScanLine, ArrowLeft, Upload, ImageIcon, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface DetectionResult {
  condition: string;
  label: string;
  description: string;
  confidence: number;
  probabilities: Record<string, number>;
  recommended_specialist: string;
  disclaimer: string;
  model_source?: string;
  dataset?: {
    name?: string;
    source?: string;
    path?: string;
    classes?: string[];
    image_count?: number;
  };
}

const CONDITION_COLORS: Record<string, string> = {
  "Acne": "bg-red-50 border-red-200",
  "Fungal Infection": "bg-yellow-50 border-yellow-200",
  "Normal Skin": "bg-green-50 border-green-200",
  "Wound (Normal)": "bg-orange-50 border-orange-200",
  "Wound (Infected)": "bg-red-100 border-red-300",
};

export default function ImageDetect() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();
  const d = t.imageDetect;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch("/ai-api/image-detect", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Detection failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cardColorClass = result ? (CONDITION_COLORS[result.label] || "bg-blue-50 border-blue-200") : "";
  const modelSourceLabel = result?.model_source && result.model_source !== "fallback_rules"
    ? "Trained model"
    : "Fallback rules";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold">{d.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{d.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{d.uploadPrompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Uploaded" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">{d.uploadPrompt}</p>
                <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</p>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {imageFile ? d.uploadHint : d.uploadPrompt}
            </Button>
            <Button className="flex-1" onClick={handleDetect} disabled={!imageFile || loading}>
              {loading ? d.detecting : d.detect}
            </Button>
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
          <Card className={`border-2 ${cardColorClass}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{result.label}</CardTitle>
                <Badge>{result.confidence}% confidence</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{result.description}</p>
              <Progress value={result.confidence} className="h-2" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t.specialist.recommended}:</span>
                <Badge variant="outline">{result.recommended_specialist}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Model source: {modelSourceLabel}</p>
                {result.dataset?.name && <p>Dataset: {result.dataset.name}</p>}
                {typeof result.dataset?.image_count === "number" && (
                  <p>Images in training dataset: {result.dataset.image_count}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{d.probabilities}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Object.entries(result.probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([label, prob]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={label === result.label ? "font-semibold" : "text-muted-foreground"}>{label}</span>
                      <span>{prob}%</span>
                    </div>
                    <Progress value={prob} className="h-1.5" />
                  </div>
                ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href="/ai/home-care">
              <Button variant="outline">{t.homeCare.getGuidance}</Button>
            </Link>
            <Link href={`/ai/specialist?condition=${encodeURIComponent(result.condition)}`}>
              <Button variant="outline">{t.specialist.find}</Button>
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
