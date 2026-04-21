import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ScanLine, Heart, FileSearch, UserCheck, Stethoscope, MessageCircle } from "lucide-react";

const AI_MODULES = [
  {
    href: "/ai/chatbot",
    icon: MessageCircle,
    title: "Health Chatbot",
    description: "Voice & text AI assistant in English, Hindi, and Odia. Elderly-friendly with voice input/output.",
    badge: "🎤 Voice + Multilingual",
    color: "bg-indigo-50 border-indigo-300 hover:bg-indigo-100 col-span-full md:col-span-2 xl:col-span-3",
    iconColor: "text-indigo-600",
    featured: true,
  },
  {
    href: "/ai/symptom-checker",
    icon: Brain,
    title: "Symptom Checker",
    description: "Enter your symptoms and get an AI-powered disease prediction with confidence scores.",
    badge: "ML Model",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    href: "/ai/image-detect",
    icon: ScanLine,
    title: "Skin & Wound Detection",
    description: "Upload a photo of skin or wound to detect acne, fungal infections, or wound conditions.",
    badge: "Image AI",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    href: "/ai/home-care",
    icon: Heart,
    title: "Home Care Guidance",
    description: "Get home remedies, doctor visit advice, and emergency warnings for any diagnosed condition.",
    badge: "Guidance",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
  },
  {
    href: "/ai/prescription-scanner",
    icon: FileSearch,
    title: "Prescription Scanner",
    description: "Upload a prescription image to extract text and identify medicine names using OCR.",
    badge: "OCR",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    href: "/ai/specialist",
    icon: UserCheck,
    title: "Specialist Finder",
    description: "Find the right type of doctor specialist based on your disease or condition.",
    badge: "Mapping",
    color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
    iconColor: "text-teal-600",
  },
];

export default function AIHub() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Stethoscope className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">AI Health Tools</h1>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <p className="text-muted-foreground">
          AI-powered health analysis tools to help you understand symptoms, detect conditions, and find care.
        </p>
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          ⚠️ This system provides preliminary guidance and is not a medical diagnosis. Always consult a qualified healthcare professional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {AI_MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className={`cursor-pointer border-2 transition-colors ${mod.color} h-full`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <mod.icon className={`h-8 w-8 ${mod.iconColor}`} />
                  <Badge variant="outline" className="text-xs">{mod.badge}</Badge>
                </div>
                <CardTitle className="text-lg">{mod.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
