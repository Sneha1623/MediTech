export type Lang = "en" | "hi" | "od";

const LANG_BCP47: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  od: "or-IN",
};

const LANG_FALLBACKS: Record<Lang, string[]> = {
  en: ["en-IN", "en-GB", "en-US", "en"],
  hi: ["hi-IN", "hi-US", "hi"],
  od: ["or-IN", "or"],
};

let _voicesCache: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      _voicesCache = voices;
      _voicesLoaded = true;
      resolve(voices);
      return;
    }
    const handler = () => {
      _voicesCache = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve(_voicesCache);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    setTimeout(() => {
      if (!_voicesLoaded) {
        _voicesCache = window.speechSynthesis.getVoices();
        resolve(_voicesCache);
      }
    }, 2000);
  });
}

function findBestVoice(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const targets = LANG_FALLBACKS[lang];

  for (const target of targets) {
    const exact = voices.find((v) => v.lang === target);
    if (exact) return exact;
  }

  const prefix = targets[0].split("-")[0].toLowerCase();
  const partial = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (partial) return partial;

  return null;
}

export async function speakText(text: string, lang: Lang, rate = 0.9): Promise<void> {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[⚠️🚨🤖—•]/g, "")
    .replace(/\n+/g, ". ")
    .trim();

  if (!cleanText) return;

  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  const matchedVoice = findBestVoice(lang, voices);

  if (matchedVoice) {
    utterance.voice = matchedVoice;
    utterance.lang = matchedVoice.lang;
  } else {
    utterance.lang = lang === "od" ? "en-IN" : LANG_BCP47[lang];
  }

  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

export function getRecognitionLang(lang: Lang): string {
  return LANG_BCP47[lang];
}

export function listAvailableVoices(): { lang: string; name: string }[] {
  return window.speechSynthesis.getVoices().map((v) => ({
    lang: v.lang,
    name: v.name,
  }));
}
