import { useState, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSearch, ArrowLeft, Upload, FileText, Pill, AlertTriangle, Info } from "lucide-react";

interface ScanResult {
  extracted_text: string;
  detected_medicines: string[];
  medicines_count: number;
  ocr_available: boolean;
  disclaimer: string;
}

export default function PrescriptionScanner() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleScan = async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch("/ai-api/scan-prescription", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/ai">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-orange-600" />
            <h1 className="text-xl font-bold">Prescription Scanner</h1>
          </div>
          <p className="text-sm text-muted-foreground">Upload a prescription to extract text and detect medicines</p>
        </div>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Upload a clear, well-lit photo of a prescription. Handwritten or printed prescriptions both work.
              OCR accuracy depends on image quality.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Prescription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Prescription"
                className="max-h-64 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500">Click to upload prescription image</p>
                <p className="text-xs text-gray-400">PNG, JPG, JPEG — clear & readable preferred</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {imageFile ? "Change Image" : "Select Image"}
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              onClick={handleScan}
              disabled={!imageFile || loading}
            >
              {loading ? "Scanning..." : "Scan Prescription"}
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
          {!result.ocr_available && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    OCR engine (Tesseract) is not installed in this environment. Install it to enable full text extraction.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {result.detected_medicines.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-base text-orange-800">
                    Detected Medicines ({result.medicines_count})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.detected_medicines.map((med) => (
                    <Badge key={med} className="bg-orange-100 text-orange-800 border-orange-300 text-sm py-1 px-3">
                      <Pill className="h-3 w-3 mr-1.5" />
                      {med}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.detected_medicines.length === 0 && result.ocr_available && (
            <Card className="border-gray-200">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  No known medicines detected in the extracted text.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <CardTitle className="text-base">Extracted Text</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono border border-gray-200 max-h-64 overflow-y-auto">
                {result.extracted_text || "(No text extracted)"}
              </pre>
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
