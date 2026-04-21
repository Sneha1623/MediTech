import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Mic, MicOff, Volume2, VolumeX, Globe, ArrowLeft,
  Send, Bot, User, AlertTriangle, Accessibility, RefreshCw,
} from "lucide-react";

type Language = "en" | "hi" | "od";
type UrgencyLevel = "low" | "medium" | "high";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  language?: Language;
  urgency?: UrgencyLevel;
  followUps?: string[];
  timestamp: Date;
}

const LANG_LABELS: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  od: "ଓଡ଼ିଆ",
};

const LANG_SPEECH_CODES: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  od: "or-IN",
};

const QUICK_MESSAGES: Record<Language, string[]> = {
  en: ["I have a fever", "I have a headache", "Stomach pain", "I feel weak", "Chest pain", "Emergency help"],
  hi: ["मुझे बुखार है", "सिर दर्द है", "पेट में दर्द है", "मैं कमज़ोर हूँ", "सीने में दर्द है", "आपातकाल"],
  od: ["ମୋ ଜ୍ୱର ଅଛି", "ମୁଣ୍ଡ ଯନ୍ତ୍ରଣା", "ପେଟ ଦ୍ରଦ", "ଦୁର୍ବଳ ଲାଗୁଛି", "ଛାତି ଯନ୍ତ୍ରଣା", "ଜରୁରୀ ସାହାଯ୍ୟ"],
};

const UI_STRINGS = {
  en: {
    title: "Health Assistant",
    subtitle: "Ask me about symptoms, home care, or finding doctors",
    placeholder: "Type your health question...",
    listening: "Listening... speak now",
    elderly: "Elderly Mode",
    voice: "Voice Output",
    send: "Send",
    quickTitle: "Quick questions:",
    restart: "New Chat",
    langSelect: "Language",
    voiceNotSupported: "Voice not supported in this browser.",
  },
  hi: {
    title: "स्वास्थ्य सहायक",
    subtitle: "लक्षण, घरेलू उपचार या डॉक्टर के बारे में पूछें",
    placeholder: "अपना स्वास्थ्य प्रश्न लिखें...",
    listening: "सुन रहा हूँ... अभी बोलें",
    elderly: "बुजुर्ग मोड",
    voice: "आवाज़ आउटपुट",
    send: "भेजें",
    quickTitle: "त्वरित प्रश्न:",
    restart: "नई बात",
    langSelect: "भाषा",
    voiceNotSupported: "इस ब्राउज़र में आवाज़ समर्थित नहीं है।",
  },
  od: {
    title: "ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ",
    subtitle: "ଲକ୍ଷଣ, ଘରୋଇ ଚିକିତ୍ସା ବା ଡାକ୍ତର ବିଷୟରେ ପଚାର",
    placeholder: "ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ...",
    listening: "ଶୁଣୁଛି... ବର୍ତ୍ତମାନ ବୋଲନ୍ତୁ",
    elderly: "ବୟଷ୍କ ମୋଡ",
    voice: "ଶବ୍ଦ ଆଉଟପୁଟ",
    send: "ପଠାନ୍ତୁ",
    quickTitle: "ଶୀଘ୍ର ପ୍ରଶ୍ନ:",
    restart: "ନୂଆ ଚ୍ୟାଟ",
    langSelect: "ଭାଷା",
    voiceNotSupported: "ଏହି ବ୍ରାଉଜରରେ ଭଏସ ସମର୍ଥ ନୁହେଁ।",
  },
};

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  low: "border-green-200 bg-green-50",
  medium: "border-yellow-200 bg-yellow-50",
  high: "border-red-200 bg-red-50",
};

function speakText(text: string, lang: Language, rate: number = 0.9) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const plainText = text.replace(/⚠️|🚨|—/g, "").trim();
  const utterance = new SpeechSynthesisUtterance(plainText);
  utterance.lang = LANG_SPEECH_CODES[lang];
  utterance.rate = rate;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [isListening, setIsListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [elderlyMode, setElderlyMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const ui = UI_STRINGS[language];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      sendMessage("hello");
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    if (text !== "hello") {
      setMessages((prev) => [...prev, userMsg]);
    }
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/ai-api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat error");

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.response,
        language: data.detected_language,
        urgency: data.urgency,
        followUps: data.follow_up_suggestions,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const filtered = text === "hello" ? [] : prev;
        return [...filtered, botMsg];
      });

      if (voiceOutput) {
        const rate = elderlyMode ? 0.75 : 0.9;
        speakText(data.response, data.detected_language || language, rate);
      }
    } catch (e: any) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Sorry, I couldn't connect. Please check your connection and try again.",
        urgency: "low",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [language, voiceOutput, elderlyMode]);

  const handleSend = () => {
    if (input.trim()) sendMessage(input);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LANG_SPEECH_CODES[language];

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => sendMessage(transcript), 300);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    window.speechSynthesis?.cancel();
    setMessages([]);
    setTimeout(() => sendMessage("hello"), 100);
  };

  const textSizeClass = elderlyMode ? "text-xl" : "text-sm";
  const buttonSizeClass = elderlyMode ? "h-14 text-lg px-6" : "";

  return (
    <div className={cn("flex flex-col h-[calc(100vh-120px)]", elderlyMode ? "text-xl" : "")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between pb-3 flex-wrap gap-2", elderlyMode ? "pb-4" : "")}>
        <div className="flex items-center gap-2">
          <Link href="/ai">
            <Button variant="ghost" size={elderlyMode ? "default" : "icon"}>
              <ArrowLeft className={elderlyMode ? "h-6 w-6" : "h-4 w-4"} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Bot className={cn("text-indigo-600", elderlyMode ? "h-8 w-8" : "h-5 w-5")} />
              <h1 className={cn("font-bold", elderlyMode ? "text-2xl" : "text-lg")}>{ui.title}</h1>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            {!elderlyMode && <p className="text-xs text-muted-foreground">{ui.subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language selector */}
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
            <Globe className={elderlyMode ? "h-5 w-5 text-muted-foreground ml-1" : "h-3.5 w-3.5 text-muted-foreground ml-1"} />
            {(["en", "hi", "od"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={cn(
                  "rounded px-2 py-1 font-medium transition-colors",
                  elderlyMode ? "text-base px-3 py-2" : "text-xs",
                  language === l ? "bg-indigo-600 text-white" : "text-muted-foreground hover:bg-gray-100"
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Voice output toggle */}
          <Button
            variant={voiceOutput ? "default" : "outline"}
            size={elderlyMode ? "default" : "sm"}
            onClick={() => { setVoiceOutput(!voiceOutput); window.speechSynthesis?.cancel(); }}
            className={elderlyMode ? "h-12 px-4" : ""}
            title={ui.voice}
          >
            {voiceOutput ? <Volume2 className={elderlyMode ? "h-6 w-6" : "h-3.5 w-3.5"} /> : <VolumeX className={elderlyMode ? "h-6 w-6" : "h-3.5 w-3.5"} />}
            {elderlyMode && <span className="ml-2">{ui.voice}</span>}
          </Button>

          {/* Elderly mode toggle */}
          <Button
            variant={elderlyMode ? "default" : "outline"}
            size={elderlyMode ? "default" : "sm"}
            onClick={() => setElderlyMode(!elderlyMode)}
            className={elderlyMode ? "h-12 px-4" : ""}
          >
            <Accessibility className={elderlyMode ? "h-6 w-6" : "h-3.5 w-3.5"} />
            {!elderlyMode && <span className="ml-1 text-xs">{ui.elderly}</span>}
          </Button>

          {/* Reset */}
          <Button variant="outline" size={elderlyMode ? "default" : "sm"} onClick={resetChat} className={elderlyMode ? "h-12 px-4" : ""}>
            <RefreshCw className={elderlyMode ? "h-5 w-5 mr-2" : "h-3.5 w-3.5"} />
            {elderlyMode ? ui.restart : ""}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%]", msg.role === "user" ? "items-end" : "items-start", "flex flex-col gap-1")}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 px-1">
                  <Bot className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-xs text-muted-foreground">Health Assistant</span>
                  {msg.language && <Badge variant="outline" className="text-[10px] py-0 h-4">{LANG_LABELS[msg.language as Language]}</Badge>}
                  {msg.urgency === "high" && <Badge className="text-[10px] py-0 h-4 bg-red-600">Urgent</Badge>}
                </div>
              )}
              <Card
                className={cn(
                  "px-4 py-3 rounded-2xl border",
                  msg.role === "user"
                    ? "bg-indigo-600 text-white border-indigo-600 rounded-br-sm"
                    : cn("rounded-bl-sm", msg.urgency ? URGENCY_STYLES[msg.urgency] : "bg-gray-50 border-gray-200")
                )}
              >
                <p className={cn("whitespace-pre-wrap leading-relaxed", textSizeClass)}>
                  {msg.text}
                </p>
              </Card>
              {msg.role === "assistant" && msg.followUps && msg.followUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1 mt-1">
                  {msg.followUps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className={cn(
                        "rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors",
                        elderlyMode ? "px-4 py-2 text-base" : "px-2.5 py-1 text-xs"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {msg.role === "assistant" && voiceOutput && (
                <button
                  onClick={() => speakText(msg.text, (msg.language as Language) || language, elderlyMode ? 0.75 : 0.9)}
                  className="px-1 text-xs text-muted-foreground hover:text-indigo-600 flex items-center gap-1"
                >
                  <Volume2 className="h-3 w-3" /> Replay
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Card className="px-4 py-3 bg-gray-50 border-gray-200 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1.5 items-center">
                <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="pt-2 pb-2">
        <p className={cn("text-muted-foreground mb-1.5", elderlyMode ? "text-base" : "text-xs")}>{ui.quickTitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_MESSAGES[language].map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className={cn(
                "rounded-full border transition-colors",
                elderlyMode
                  ? "border-indigo-300 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 text-base"
                  : "border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 text-xs"
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="pt-2 border-t border-gray-200">
        {isListening && (
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            <span className={cn(elderlyMode ? "text-base" : "text-sm")}>{ui.listening}</span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ui.placeholder}
            rows={elderlyMode ? 2 : 1}
            className={cn(
              "flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed",
              elderlyMode ? "text-xl py-4" : "text-sm"
            )}
          />
          <div className="flex gap-2 flex-col sm:flex-row">
            {speechSupported && (
              <Button
                variant={isListening ? "destructive" : "outline"}
                size={elderlyMode ? "default" : "icon"}
                onClick={toggleListening}
                className={cn(
                  "rounded-xl shrink-0",
                  elderlyMode ? "h-14 w-14" : "h-10 w-10"
                )}
                title={isListening ? "Stop" : "Voice Input"}
              >
                {isListening ? <MicOff className={elderlyMode ? "h-7 w-7" : "h-4 w-4"} /> : <Mic className={elderlyMode ? "h-7 w-7" : "h-4 w-4"} />}
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={cn(
                "rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0",
                elderlyMode ? "h-14 w-14" : "h-10 w-10",
                "p-0"
              )}
            >
              <Send className={elderlyMode ? "h-7 w-7" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
        {!speechSupported && (
          <p className="mt-1 text-xs text-muted-foreground">{ui.voiceNotSupported}</p>
        )}
      </div>
    </div>
  );
}
