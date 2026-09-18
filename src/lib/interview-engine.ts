import type { LangCode } from "./i18n";

export type Section =
  | "Chief Complaint"
  | "History of Present Illness"
  | "Past History"
  | "Medicines"
  | "Allergies"
  | "Family & Personal History"
  | "Review of Systems"
  | "Dashavidha Pariksha (AYUSH)";

export type Question = {
  id: string;
  section: Section;
  text: Partial<Record<LangCode, string>> & { en: string };
  type: "choice" | "multi" | "text" | "scale";
  options?: { value: string; label: Partial<Record<LangCode, string>> & { en: string }; icon?: string }[];
  /** Only show when predicate on answers is true */
  when?: (a: Answers) => boolean;
  ayushOnly?: boolean;
};

export type Answers = Record<string, string | string[]>;

export type RedFlag = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "high";
  triggeredBy: string[];
};

const yn = [
  { value: "yes", label: { en: "Yes", hi: "हाँ" }, icon: "✅" },
  { value: "no", label: { en: "No", hi: "नहीं" }, icon: "❌" },
];

export const QUESTIONS: Question[] = [
  {
    id: "cc",
    section: "Chief Complaint",
    text: { en: "What is the main problem that brought you here today?", hi: "आज आप किस मुख्य समस्या के लिए आए हैं?" },
    type: "choice",
    options: [
      { value: "chest_pain", label: { en: "Chest pain", hi: "सीने में दर्द" }, icon: "❤️‍🩹" },
      { value: "fever", label: { en: "Fever", hi: "बुखार" }, icon: "🌡️" },
      { value: "breathless", label: { en: "Breathlessness", hi: "साँस फूलना" }, icon: "🫁" },
      { value: "headache", label: { en: "Headache", hi: "सिरदर्द" }, icon: "🤕" },
      { value: "abdominal", label: { en: "Stomach pain", hi: "पेट दर्द" }, icon: "🤢" },
      { value: "other", label: { en: "Something else", hi: "कुछ और" }, icon: "💬" },
    ],
  },
  {
    id: "cc_other",
    section: "Chief Complaint",
    text: { en: "Please describe your problem in your own words.", hi: "कृपया अपनी समस्या अपने शब्दों में बताएं।" },
    type: "text",
    when: (a) => a["cc"] === "other",
  },
  {
    id: "duration",
    section: "History of Present Illness",
    text: { en: "How long have you had this problem?", hi: "यह समस्या आपको कब से है?" },
    type: "choice",
    options: [
      { value: "<1h", label: { en: "Less than 1 hour", hi: "1 घंटे से कम" }, icon: "⚡" },
      { value: "today", label: { en: "Since today", hi: "आज से" }, icon: "🕐" },
      { value: "days", label: { en: "A few days", hi: "कुछ दिनों से" }, icon: "📅" },
      { value: "weeks", label: { en: "Weeks or longer", hi: "हफ्तों या अधिक" }, icon: "🗓️" },
    ],
  },
  {
    id: "severity",
    section: "History of Present Illness",
    text: { en: "How bad is it right now, from 1 (mild) to 10 (worst ever)?", hi: "अभी यह कितना गंभीर है, 1 (हल्का) से 10 (सबसे बुरा)?" },
    type: "scale",
  },
  // Chest pain branch
  {
    id: "cp_radiate",
    section: "History of Present Illness",
    text: { en: "Does the pain spread to your left arm, jaw or back?", hi: "क्या दर्द बाएं हाथ, जबड़े या पीठ में फैलता है?" },
    type: "choice",
    options: yn,
    when: (a) => a["cc"] === "chest_pain",
  },
  {
    id: "cp_sweat",
    section: "History of Present Illness",
    text: { en: "Are you sweating, feeling sick, or short of breath with the pain?", hi: "क्या दर्द के साथ पसीना, जी मिचलाना या साँस फूल रही है?" },
    type: "choice",
    options: yn,
    when: (a) => a["cc"] === "chest_pain",
  },
  // Fever branch
  {
    id: "fever_symptoms",
    section: "History of Present Illness",
    text: { en: "Do you also have any of these?", hi: "क्या आपको इनमें से कुछ भी है?" },
    type: "multi",
    options: [
      { value: "cough", label: { en: "Cough", hi: "खांसी" }, icon: "😮‍💨" },
      { value: "rash", label: { en: "Rash", hi: "चकत्ते" }, icon: "🔴" },
      { value: "neck_stiff", label: { en: "Stiff neck", hi: "गर्दन अकड़न" }, icon: "🧣" },
      { value: "bleeding", label: { en: "Bleeding gums/nose", hi: "मसूड़ों/नाक से खून" }, icon: "🩸" },
      { value: "none", label: { en: "None of these", hi: "इनमें से कोई नहीं" }, icon: "👌" },
    ],
    when: (a) => a["cc"] === "fever",
  },
  // Breathless branch
  {
    id: "br_rest",
    section: "History of Present Illness",
    text: { en: "Are you breathless even while sitting still?", hi: "क्या बैठे-बैठे भी साँस फूलती है?" },
    type: "choice",
    options: yn,
    when: (a) => a["cc"] === "breathless",
  },
  // Headache branch
  {
    id: "ha_sudden",
    section: "History of Present Illness",
    text: { en: "Did the headache start suddenly, like a thunderclap — the worst of your life?", hi: "क्या सिरदर्द अचानक, बहुत तेज़ शुरू हुआ — जीवन का सबसे बुरा?" },
    type: "choice",
    options: yn,
    when: (a) => a["cc"] === "headache",
  },
  {
    id: "ha_neuro",
    section: "History of Present Illness",
    text: { en: "Any weakness of face/arm/leg, slurred speech, or vision loss?", hi: "चेहरे/हाथ/पैर में कमजोरी, बोलने में दिक्कत या दिखाई कम देना?" },
    type: "choice",
    options: yn,
    when: (a) => a["cc"] === "headache",
  },
  // Abdominal
  {
    id: "abd_blood",
    section: "History of Present Illness",
    text: { en: "Have you vomited blood or passed black/bloody stools?", hi: "क्या खून की उल्टी या काला/खूनी मल हुआ है?" },
    type: "choice",
    options: yn,
    when: (a) => a["cc"] === "abdominal",
  },
  // Past history
  {
    id: "past",
    section: "Past History",
    text: { en: "Have you been told you have any of these conditions?", hi: "क्या आपको इनमें से कोई बीमारी बताई गई है?" },
    type: "multi",
    options: [
      { value: "diabetes", label: { en: "Diabetes (sugar)", hi: "मधुमेह (शुगर)" }, icon: "🍬" },
      { value: "htn", label: { en: "High blood pressure", hi: "उच्च रक्तचाप" }, icon: "💓" },
      { value: "heart", label: { en: "Heart disease", hi: "हृदय रोग" }, icon: "🫀" },
      { value: "asthma", label: { en: "Asthma / lung disease", hi: "दमा / फेफड़ों की बीमारी" }, icon: "🫁" },
      { value: "thyroid", label: { en: "Thyroid", hi: "थायरॉइड" }, icon: "🦋" },
      { value: "tb", label: { en: "Tuberculosis (TB)", hi: "टीबी" }, icon: "🦠" },
      { value: "none", label: { en: "None", hi: "कोई नहीं" }, icon: "👌" },
    ],
  },
  {
    id: "surgery",
    section: "Past History",
    text: { en: "Have you had any surgery or hospital admission before?", hi: "क्या पहले कोई ऑपरेशन या अस्पताल में भर्ती हुए हैं?" },
    type: "choice",
    options: yn,
  },
  // Medicines
  {
    id: "meds",
    section: "Medicines",
    text: { en: "Are you taking any medicines regularly? You can also scan your prescription later.", hi: "क्या आप नियमित दवाएं लेते हैं? आप बाद में पर्ची स्कैन भी कर सकते हैं।" },
    type: "choice",
    options: [
      { value: "yes", label: { en: "Yes", hi: "हाँ" }, icon: "💊" },
      { value: "no", label: { en: "No", hi: "नहीं" }, icon: "❌" },
      { value: "unsure", label: { en: "Not sure of names", hi: "नाम पता नहीं" }, icon: "🤔" },
    ],
  },
  {
    id: "meds_list",
    section: "Medicines",
    text: { en: "Please say or type the medicine names you remember.", hi: "कृपया जो दवाओं के नाम याद हों, बोलें या लिखें।" },
    type: "text",
    when: (a) => a["meds"] === "yes",
  },
  // Allergies
  {
    id: "allergy",
    section: "Allergies",
    text: { en: "Are you allergic to any medicine or food?", hi: "क्या आपको किसी दवा या खाने से एलर्जी है?" },
    type: "choice",
    options: [
      { value: "penicillin", label: { en: "Penicillin / antibiotics", hi: "पेनिसिलिन / एंटीबायोटिक" }, icon: "💊" },
      { value: "painkiller", label: { en: "Painkillers (NSAIDs)", hi: "दर्द निवारक" }, icon: "🩹" },
      { value: "food", label: { en: "Food allergy", hi: "खाद्य एलर्जी" }, icon: "🥜" },
      { value: "no", label: { en: "No known allergy", hi: "कोई ज्ञात एलर्जी नहीं" }, icon: "✅" },
    ],
  },
  // Family/personal
  {
    id: "family",
    section: "Family & Personal History",
    text: { en: "Does anyone in your family have diabetes, heart disease, or cancer?", hi: "क्या परिवार में किसी को मधुमेह, हृदय रोग या कैंसर है?" },
    type: "multi",
    options: [
      { value: "diabetes", label: { en: "Diabetes", hi: "मधुमेह" }, icon: "🍬" },
      { value: "heart", label: { en: "Heart disease", hi: "हृदय रोग" }, icon: "🫀" },
      { value: "cancer", label: { en: "Cancer", hi: "कैंसर" }, icon: "🎗️" },
      { value: "none", label: { en: "None", hi: "कोई नहीं" }, icon: "👌" },
    ],
  },
  {
    id: "habits",
    section: "Family & Personal History",
    text: { en: "Do you use tobacco or alcohol?", hi: "क्या आप तंबाकू या शराब का सेवन करते हैं?" },
    type: "multi",
    options: [
      { value: "smoking", label: { en: "Smoking", hi: "धूम्रपान" }, icon: "🚬" },
      { value: "chewing", label: { en: "Chewing tobacco / gutkha", hi: "गुटखा / तंबाकू" }, icon: "🟤" },
      { value: "alcohol", label: { en: "Alcohol", hi: "शराब" }, icon: "🍺" },
      { value: "none", label: { en: "None", hi: "कोई नहीं" }, icon: "👌" },
    ],
  },
  // ROS
  {
    id: "ros",
    section: "Review of Systems",
    text: { en: "In the last few weeks, have you noticed any of these?", hi: "पिछले कुछ हफ्तों में इनमें से कुछ देखा है?" },
    type: "multi",
    options: [
      { value: "weight_loss", label: { en: "Weight loss", hi: "वजन घटना" }, icon: "⚖️" },
      { value: "night_sweats", label: { en: "Night sweats", hi: "रात में पसीना" }, icon: "🌙" },
      { value: "urine", label: { en: "Urine problems", hi: "पेशाब की समस्या" }, icon: "🚻" },
      { value: "sleep", label: { en: "Poor sleep", hi: "नींद कम" }, icon: "😴" },
      { value: "mood", label: { en: "Low mood / worry", hi: "उदासी / चिंता" }, icon: "🙁" },
      { value: "none", label: { en: "None", hi: "कोई नहीं" }, icon: "👌" },
    ],
  },
  // AYUSH – Dashavidha Pariksha (10-fold examination) – patient-reportable items
  {
    id: "ay_prakriti",
    section: "Dashavidha Pariksha (AYUSH)",
    text: { en: "Prakriti: Which describes your body constitution best?", hi: "प्रकृति: आपकी शारीरिक प्रकृति किससे मिलती है?" },
    type: "choice",
    ayushOnly: true,
    options: [
      { value: "vata", label: { en: "Vata – lean, dry skin, quick", hi: "वात – दुबला, रूखी त्वचा, चंचल" }, icon: "🌬️" },
      { value: "pitta", label: { en: "Pitta – medium, warm, sharp appetite", hi: "पित्त – मध्यम, गर्म, तेज़ भूख" }, icon: "🔥" },
      { value: "kapha", label: { en: "Kapha – sturdy, calm, slow", hi: "कफ – सुदृढ़, शांत, धीमा" }, icon: "💧" },
    ],
  },
  {
    id: "ay_agni",
    section: "Dashavidha Pariksha (AYUSH)",
    text: { en: "Agni (digestive fire): How is your appetite and digestion?", hi: "अग्नि: आपकी भूख और पाचन कैसा है?" },
    type: "choice",
    ayushOnly: true,
    options: [
      { value: "sama", label: { en: "Regular and comfortable", hi: "नियमित और सहज" }, icon: "✅" },
      { value: "manda", label: { en: "Weak / heavy after meals", hi: "कमज़ोर / खाने के बाद भारीपन" }, icon: "🐢" },
      { value: "tikshna", label: { en: "Very strong, burning", hi: "बहुत तेज़, जलन" }, icon: "🔥" },
      { value: "vishama", label: { en: "Irregular", hi: "अनियमित" }, icon: "〰️" },
    ],
  },
  {
    id: "ay_bala",
    section: "Dashavidha Pariksha (AYUSH)",
    text: { en: "Bala (strength) & Vyayama Shakti: How is your stamina for daily work?", hi: "बल एवं व्यायाम शक्ति: दैनिक काम के लिए आपकी ताक़त कैसी है?" },
    type: "choice",
    ayushOnly: true,
    options: [
      { value: "pravara", label: { en: "Good", hi: "अच्छी" }, icon: "💪" },
      { value: "madhyama", label: { en: "Moderate", hi: "मध्यम" }, icon: "🙂" },
      { value: "avara", label: { en: "Poor / tire easily", hi: "कमज़ोर / जल्दी थकान" }, icon: "😮‍💨" },
    ],
  },
  {
    id: "ay_satmya",
    section: "Dashavidha Pariksha (AYUSH)",
    text: { en: "Satmya & Sattva: Diet habit and mental resilience?", hi: "सात्म्य और सत्त्व: आहार आदत और मानसिक दृढ़ता?" },
    type: "multi",
    ayushOnly: true,
    options: [
      { value: "veg", label: { en: "Vegetarian", hi: "शाकाहारी" }, icon: "🥗" },
      { value: "nonveg", label: { en: "Non-vegetarian", hi: "मांसाहारी" }, icon: "🍗" },
      { value: "calm", label: { en: "Calm under stress", hi: "तनाव में शांत" }, icon: "🧘" },
      { value: "anxious", label: { en: "Easily anxious", hi: "जल्दी चिंतित" }, icon: "😟" },
    ],
  },
  {
    id: "ay_vaya",
    section: "Dashavidha Pariksha (AYUSH)",
    text: { en: "Sara, Samhanana, Pramana, Vaya are assessed by the Vaidya at the desk. Any sleep or bowel concerns to note?", hi: "सार, संहनन, प्रमाण, वय की जाँच वैद्य करेंगे। नींद या मल संबंधी कोई समस्या?" },
    type: "text",
    ayushOnly: true,
  },
];

export function visibleQuestions(answers: Answers, ayush: boolean): Question[] {
  return QUESTIONS.filter((q) => (ayush || !q.ayushOnly) && (!q.when || q.when(answers)));
}

export function detectRedFlags(a: Answers): RedFlag[] {
  const flags: RedFlag[] = [];
  const has = (id: string, v: string) => {
    const x = a[id];
    return Array.isArray(x) ? x.includes(v) : x === v;
  };
  const sev = Number(a["severity"] ?? 0);

  if (a["cc"] === "chest_pain" && (has("cp_radiate", "yes") || has("cp_sweat", "yes") || sev >= 7)) {
    flags.push({
      id: "acs",
      title: "Possible acute coronary syndrome",
      detail: "Chest pain with radiation/diaphoresis or high severity. Immediate ECG & triage advised.",
      severity: "critical",
      triggeredBy: ["cc", "cp_radiate", "cp_sweat", "severity"],
    });
  }
  if (a["cc"] === "breathless" && has("br_rest", "yes")) {
    flags.push({
      id: "resp",
      title: "Breathlessness at rest",
      detail: "Check SpO2 and respiratory rate immediately.",
      severity: "critical",
      triggeredBy: ["cc", "br_rest"],
    });
  }
  if (a["cc"] === "headache" && (has("ha_sudden", "yes") || has("ha_neuro", "yes"))) {
    flags.push({
      id: "neuro",
      title: "Thunderclap headache / focal neuro deficit",
      detail: "Possible stroke or SAH. Activate stroke pathway per protocol.",
      severity: "critical",
      triggeredBy: ["ha_sudden", "ha_neuro"],
    });
  }
  if (has("fever_symptoms", "neck_stiff") || has("fever_symptoms", "bleeding")) {
    flags.push({
      id: "fever",
      title: "Fever with neck stiffness / bleeding",
      detail: "Rule out meningitis or dengue haemorrhagic features. Urgent evaluation.",
      severity: "high",
      triggeredBy: ["fever_symptoms"],
    });
  }
  if (has("abd_blood", "yes")) {
    flags.push({
      id: "gi_bleed",
      title: "Possible GI bleed",
      detail: "Haematemesis / melaena reported. Check vitals, IV access.",
      severity: "high",
      triggeredBy: ["abd_blood"],
    });
  }
  if (sev >= 9 && flags.length === 0) {
    flags.push({
      id: "pain",
      title: "Severe pain (9–10/10)",
      detail: "Prioritise assessment.",
      severity: "high",
      triggeredBy: ["severity"],
    });
  }
  return flags;
}

export function labelFor(q: Question, value: string, lang: LangCode) {
  const o = q.options?.find((x) => x.value === value);
  return o ? (o.label[lang] ?? o.label.en) : value;
}

export function answerToText(q: Question, a: Answers, lang: LangCode = "en"): string {
  const v = a[q.id];
  if (v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.map((x) => labelFor(q, x, lang)).join(", ");
  if (q.type === "scale") return `${v}/10`;
  return labelFor(q, v, lang);
}
