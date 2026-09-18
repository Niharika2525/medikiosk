export type LangCode = "en" | "hi" | "te" | "ta" | "kn" | "bn" | "mr";

export const LANGUAGES: { code: LangCode; name: string; native: string; speech: string }[] = [
  { code: "en", name: "English", native: "English", speech: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", speech: "mr-IN" },
];

type Dict = Record<string, string>;

const en: Dict = {
  welcome: "Welcome",
  tapToStart: "Tap to begin",
  continue: "Continue",
  back: "Back",
  yes: "Yes",
  no: "No",
  skip: "Skip",
  next: "Next",
  speak: "Tap & speak",
  listening: "Listening…",
  typeAnswer: "Or type your answer",
  chooseLanguage: "Choose your language",
  consentTitle: "Your consent",
  iAgree: "I agree",
  aiAssistant: "AI Assistant",
  reviewDocs: "Upload documents",
  emergency: "Need urgent help? Tell staff now",
  done: "Done",
};
const hi: Dict = {
  welcome: "स्वागत है",
  tapToStart: "शुरू करने के लिए टैप करें",
  continue: "आगे बढ़ें",
  back: "पीछे",
  yes: "हाँ",
  no: "नहीं",
  skip: "छोड़ें",
  next: "अगला",
  speak: "टैप करें और बोलें",
  listening: "सुन रहा है…",
  typeAnswer: "या अपना उत्तर लिखें",
  chooseLanguage: "अपनी भाषा चुनें",
  consentTitle: "आपकी सहमति",
  iAgree: "मैं सहमत हूँ",
  aiAssistant: "एआई सहायक",
  reviewDocs: "दस्तावेज़ अपलोड करें",
  emergency: "तुरंत मदद चाहिए? अभी स्टाफ को बताएं",
  done: "पूर्ण",
};
const te: Dict = {
  welcome: "స్వాగతం", tapToStart: "ప్రారంభించడానికి నొక్కండి", continue: "కొనసాగించు", back: "వెనుకకు",
  yes: "అవును", no: "కాదు", skip: "దాటవేయి", next: "తదుపరి", speak: "నొక్కి మాట్లాడండి", listening: "వింటున్నాను…",
  typeAnswer: "లేదా మీ సమాధానం టైప్ చేయండి", chooseLanguage: "మీ భాషను ఎంచుకోండి", consentTitle: "మీ సమ్మతి", iAgree: "నేను అంగీకరిస్తున్నాను",
  aiAssistant: "AI సహాయకుడు", reviewDocs: "పత్రాలను అప్‌లోడ్ చేయండి", emergency: "అత్యవసర సహాయం కావాలా? సిబ్బందికి చెప్పండి", done: "పూర్తయింది",
};
const ta: Dict = {
  welcome: "வரவேற்கிறோம்", tapToStart: "தொடங்க தட்டவும்", continue: "தொடரவும்", back: "பின்",
  yes: "ஆம்", no: "இல்லை", skip: "தவிர்", next: "அடுத்து", speak: "தட்டி பேசுங்கள்", listening: "கேட்கிறேன்…",
  typeAnswer: "அல்லது பதிலை தட்டச்சு செய்யவும்", chooseLanguage: "உங்கள் மொழியைத் தேர்வுசெய்க", consentTitle: "உங்கள் ஒப்புதல்", iAgree: "நான் ஒப்புக்கொள்கிறேன்",
  aiAssistant: "AI உதவியாளர்", reviewDocs: "ஆவணங்களை பதிவேற்றவும்", emergency: "அவசர உதவி தேவையா? ஊழியர்களிடம் சொல்லுங்கள்", done: "முடிந்தது",
};
const kn: Dict = {
  welcome: "ಸ್ವಾಗತ", tapToStart: "ಪ್ರಾರಂಭಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ", continue: "ಮುಂದುವರಿಸಿ", back: "ಹಿಂದೆ",
  yes: "ಹೌದು", no: "ಇಲ್ಲ", skip: "ಬಿಟ್ಟುಬಿಡಿ", next: "ಮುಂದೆ", speak: "ಟ್ಯಾಪ್ ಮಾಡಿ ಮಾತನಾಡಿ", listening: "ಕೇಳುತ್ತಿದ್ದೇನೆ…",
  typeAnswer: "ಅಥವಾ ಉತ್ತರವನ್ನು ಟೈಪ್ ಮಾಡಿ", chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ", consentTitle: "ನಿಮ್ಮ ಒಪ್ಪಿಗೆ", iAgree: "ನಾನು ಒಪ್ಪುತ್ತೇನೆ",
  aiAssistant: "AI ಸಹಾಯಕ", reviewDocs: "ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", emergency: "ತುರ್ತು ಸಹಾಯ ಬೇಕೇ? ಸಿಬ್ಬಂದಿಗೆ ತಿಳಿಸಿ", done: "ಮುಗಿದಿದೆ",
};
const bn: Dict = {
  welcome: "স্বাগতম", tapToStart: "শুরু করতে ট্যাপ করুন", continue: "চালিয়ে যান", back: "পিছনে",
  yes: "হ্যাঁ", no: "না", skip: "এড়িয়ে যান", next: "পরবর্তী", speak: "ট্যাপ করে বলুন", listening: "শুনছি…",
  typeAnswer: "অথবা উত্তর টাইপ করুন", chooseLanguage: "আপনার ভাষা বেছে নিন", consentTitle: "আপনার সম্মতি", iAgree: "আমি সম্মত",
  aiAssistant: "AI সহকারী", reviewDocs: "নথি আপলোড করুন", emergency: "জরুরি সাহায্য দরকার? কর্মীদের বলুন", done: "সম্পন্ন",
};
const mr: Dict = {
  welcome: "स्वागत आहे", tapToStart: "सुरू करण्यासाठी टॅप करा", continue: "पुढे जा", back: "मागे",
  yes: "होय", no: "नाही", skip: "वगळा", next: "पुढील", speak: "टॅप करा आणि बोला", listening: "ऐकत आहे…",
  typeAnswer: "किंवा उत्तर टाइप करा", chooseLanguage: "तुमची भाषा निवडा", consentTitle: "तुमची संमती", iAgree: "मी सहमत आहे",
  aiAssistant: "AI सहाय्यक", reviewDocs: "कागदपत्रे अपलोड करा", emergency: "तातडीची मदत हवी? कर्मचाऱ्यांना सांगा", done: "पूर्ण",
};

const dicts: Record<LangCode, Dict> = { en, hi, te, ta, kn, bn, mr };

export function t(lang: LangCode, key: keyof typeof en): string {
  return dicts[lang]?.[key] ?? en[key] ?? key;
}

export function speechLocale(lang: LangCode) {
  return LANGUAGES.find((l) => l.code === lang)?.speech ?? "en-IN";
}
