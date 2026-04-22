import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bot, X, Mic, MicOff, Volume2, VolumeX, Globe, Send,
  Activity, Camera, FileSearch, Stethoscope, Ambulance, ChevronRight,
} from "lucide-react";
import { speakText as speakWithVoice, getRecognitionLang } from "@/lib/voice";

type Language = "en" | "hi" | "od";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  actionLabel?: string;
  actionUrl?: string;
  quickActions?: { label: string; url: string }[];
  urgency?: "low" | "high";
}

const LANG_LABELS: Record<Language, string> = { en: "EN", hi: "HI", od: "OD" };

const UI = {
  en: {
    title: "MediTech Assistant",
    subtitle: "Your health guide",
    placeholder: "Ask me anything... (e.g. I feel sick)",
    listening: "Listening... speak now",
    disclaimer: "This system provides general guidance and is not a medical diagnosis.",
    openBtn: "AI Health Guide",
    send: "Send",
    actions: {
      symptom: "Check Symptoms",
      image: "Upload Image",
      prescription: "Scan Prescription",
      doctor: "Find Doctor",
      emergency: "Emergency Help",
    },
  },
  hi: {
    title: "MediTech सहायक",
    subtitle: "आपका स्वास्थ्य गाइड",
    placeholder: "कुछ भी पूछें... (जैसे मुझे बुखार है)",
    listening: "सुन रहा हूँ... अभी बोलें",
    disclaimer: "यह सिस्टम सामान्य मार्गदर्शन देता है, चिकित्सीय निदान नहीं।",
    openBtn: "AI स्वास्थ्य गाइड",
    send: "भेजें",
    actions: {
      symptom: "लक्षण जांचें",
      image: "फोटो अपलोड करें",
      prescription: "पर्चा स्कैन करें",
      doctor: "डॉक्टर खोजें",
      emergency: "आपातकालीन सहायता",
    },
  },
  od: {
    title: "MediTech ସହାୟକ",
    subtitle: "ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଗାଇଡ",
    placeholder: "ଯେକୌଣସି ପ୍ରଶ୍ନ... (ଯଥା ମୋ ଜ୍ୱର ଅଛି)",
    listening: "ଶୁଣୁଛି... ବର୍ତ୍ତମାନ ବୋଲନ୍ତୁ",
    disclaimer: "ଏହି ସିଷ୍ଟମ ସାଧାରଣ ଗାଇଡ ଦିଏ, ଚିକିତ୍ସା ନିଦାନ ନୁହେଁ।",
    openBtn: "AI ସ୍ୱାସ୍ଥ୍ୟ ଗାଇଡ",
    send: "ପଠାନ୍ତୁ",
    actions: {
      symptom: "ଲକ୍ଷଣ ଯାଞ୍ଚ",
      image: "ଫଟୋ ଅପଲୋଡ",
      prescription: "ପ୍ରେସ୍କ୍ରିପ୍ସନ ସ୍କ୍ୟାନ",
      doctor: "ଡାକ୍ତର ଖୋଜ",
      emergency: "ଜରୁରୀ ସାହାଯ୍ୟ",
    },
  },
};

const ACTION_BUTTONS = [
  { key: "symptom", icon: Activity, url: "/ai/symptom-checker", color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  { key: "image", icon: Camera, url: "/ai/image-detect", color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100" },
  { key: "prescription", icon: FileSearch, url: "/ai/prescription-scanner", color: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100" },
  { key: "doctor", icon: Stethoscope, url: "/ai/specialist", color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100" },
  { key: "emergency", icon: Ambulance, url: "/book", color: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100" },
] as const;

function speakText(text: string, lang: Language, rate = 0.9) {
  speakWithVoice(text, lang, rate);
}

export function GlobalAssistant() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem("meditech-lang") as Language) ?? "en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [, navigate] = useLocation();
  const ui = UI[lang];

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) setSpeechSupported(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string, isGreeting = false) => {
    if (!text.trim()) return;
    if (!isGreeting) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "user", text: text.trim(),
      }]);
    }
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/ai-api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.response,
        actionLabel: data.action_label,
        actionUrl: data.action_url,
        quickActions: data.quick_actions,
        urgency: data.urgency,
      };
      setMessages((prev) => isGreeting ? [botMsg] : [...prev, botMsg]);
      if (voiceOn) speakText(data.response, lang);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: lang === "hi"
            ? "माफ़ करें, कनेक्शन में समस्या है। कृपया पुनः प्रयास करें।"
            : lang === "od"
            ? "ଦୁଃଖିତ, ସଂଯୋଗ ସମସ୍ୟା। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।"
            : "Sorry, I couldn't connect. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [lang, voiceOn]);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      sendMessage("hello", true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleNavigate = (url: string) => {
    handleClose();
    navigate(url);
  };

  const handleSend = () => {
    if (input.trim()) sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = getRecognitionLang(lang);
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput(t);
      setIsListening(false);
      setTimeout(() => sendMessage(t), 200);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const handleLangChange = (l: Language) => {
    setLang(l);
    localStorage.setItem("meditech-lang", l);
    setMessages([]);
    setTimeout(() => sendMessage("hello", true), 100);
  };

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI Health Assistant"
        >
          <Bot className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium hidden sm:inline">{ui.openBtn}</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] flex flex-col shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden border border-gray-200 bg-white max-h-[90vh] sm:max-h-[600px]">
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border border-white" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-none">{ui.title}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{ui.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 bg-indigo-700 rounded-lg px-1 py-0.5">
                <Globe className="h-3 w-3 mr-0.5 text-indigo-300" />
                {(["en", "hi", "od"] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLangChange(l)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium transition-colors",
                      lang === l ? "bg-white text-indigo-700" : "text-indigo-200 hover:text-white"
                    )}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setVoiceOn(!voiceOn); window.speechSynthesis?.cancel(); }}
                className="p-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                title="Toggle voice output"
              >
                {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className="max-w-[88%] space-y-1.5">
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 px-0.5">
                      <Bot className="h-3 w-3 text-indigo-500" />
                      <span className="text-[10px] text-gray-400">MediTech Guide</span>
                      {msg.urgency === "high" && <Badge className="text-[9px] h-3.5 py-0 bg-red-600">Urgent</Badge>}
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : cn("rounded-bl-sm border",
                            msg.urgency === "high"
                              ? "bg-red-50 border-red-200 text-red-900"
                              : "bg-white border-gray-200 text-gray-800")
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.role === "assistant" && msg.actionLabel && msg.actionUrl && (
                    <button
                      onClick={() => handleNavigate(msg.actionUrl!)}
                      className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 hover:bg-indigo-100 transition-colors font-medium"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {msg.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 bg-white border-t border-gray-200">
            <div className="px-3 pt-2 pb-1">
              <div className="grid grid-cols-5 gap-1">
                {ACTION_BUTTONS.map(({ key, icon: Icon, url, color }) => (
                  <button
                    key={key}
                    onClick={() => handleNavigate(url)}
                    className={cn("flex flex-col items-center gap-0.5 rounded-xl border py-2 text-[10px] font-medium transition-colors leading-tight text-center", color)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{(ui.actions as any)[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 pb-3 pt-1.5">
              {isListening && (
                <div className="flex items-center gap-1.5 mb-1.5 text-red-500 text-xs">
                  <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
                  {ui.listening}
                </div>
              )}
              <div className="flex gap-1.5 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={ui.placeholder}
                  rows={1}
                  className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent leading-relaxed"
                />
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 transition-colors",
                      isListening
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                    )}
                  >
                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="h-9 w-9 rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 disabled:opacity-40 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">⚠️ {ui.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
