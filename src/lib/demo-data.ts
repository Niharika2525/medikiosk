// All data in this file is clearly marked DEMO DATA. No real patients.

export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: "F" | "M" | "O";
  abha: string;
  phone: string;
  uhid: string;
};

export const DEMO_PATIENTS: Patient[] = [
  { id: "p1", name: "Lakshmi Devi", age: 62, sex: "F", abha: "91-2345-6789-0123", phone: "98765 43210", uhid: "UH-2026-00417" },
  { id: "p2", name: "Ramesh Kumar", age: 45, sex: "M", abha: "91-8877-1122-3344", phone: "99887 76655", uhid: "UH-2026-00418" },
  { id: "p3", name: "Fatima Begum", age: 34, sex: "F", abha: "91-5566-7788-9900", phone: "91234 56789", uhid: "UH-2026-00419" },
];

export type LabValue = {
  test: string;
  value: number;
  unit: string;
  low: number;
  high: number;
};

export type ExtractedData = {
  medicines?: { name: string; dose: string; frequency: string; duration?: string }[];
  diagnoses?: string[];
  investigations?: string[];
  labs?: LabValue[];
  dates?: string[];
  doctor?: string;
  facility?: string;
};

export type DocKind = "prescription" | "lab" | "discharge" | "other";

export type MedicalDoc = {
  id: string;
  title: string;
  kind: DocKind;
  date: string; // ISO
  status: "pending" | "scanning" | "done";
  confidence?: number;
  extracted?: ExtractedData;
  demo: boolean;
};

export const DEMO_DOCS: MedicalDoc[] = [
  {
    id: "d1",
    title: "Prescription – Dr. A. Sharma (Medicine OPD)",
    kind: "prescription",
    date: "2026-07-14",
    status: "pending",
    demo: true,
    extracted: {
      doctor: "Dr. A. Sharma, MD",
      facility: "City General Hospital",
      dates: ["2026-07-14"],
      diagnoses: ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
      medicines: [
        { name: "Metformin", dose: "500 mg", frequency: "BD after food", duration: "90 days" },
        { name: "Telmisartan", dose: "40 mg", frequency: "OD morning", duration: "90 days" },
        { name: "Atorvastatin", dose: "10 mg", frequency: "HS", duration: "90 days" },
      ],
      investigations: ["HbA1c in 3 months", "Lipid profile"],
    },
  },
  {
    id: "d2",
    title: "Lab Report – Apex Diagnostics",
    kind: "lab",
    date: "2026-08-02",
    status: "pending",
    demo: true,
    extracted: {
      facility: "Apex Diagnostics Lab",
      dates: ["2026-08-02"],
      investigations: ["Complete Blood Count", "HbA1c", "Renal Function Test", "Lipid Profile"],
      labs: [
        { test: "Haemoglobin", value: 10.4, unit: "g/dL", low: 12, high: 15.5 },
        { test: "HbA1c", value: 8.6, unit: "%", low: 4, high: 5.6 },
        { test: "Fasting Glucose", value: 168, unit: "mg/dL", low: 70, high: 99 },
        { test: "Serum Creatinine", value: 1.4, unit: "mg/dL", low: 0.6, high: 1.1 },
        { test: "LDL Cholesterol", value: 142, unit: "mg/dL", low: 0, high: 100 },
        { test: "TSH", value: 2.8, unit: "mIU/L", low: 0.4, high: 4.0 },
        { test: "Potassium", value: 4.3, unit: "mmol/L", low: 3.5, high: 5.1 },
      ],
    },
  },
  {
    id: "d3",
    title: "Discharge Summary – Cardiology Ward",
    kind: "discharge",
    date: "2025-11-21",
    status: "pending",
    demo: true,
    extracted: {
      facility: "St. Mary's Heart Institute",
      doctor: "Dr. K. Rao, DM Cardiology",
      dates: ["2025-11-18", "2025-11-21"],
      diagnoses: ["Unstable Angina (managed medically)", "Type 2 Diabetes Mellitus"],
      investigations: ["ECG: ST depression V4–V6", "Troponin I: negative", "Echo: EF 55%"],
      medicines: [
        { name: "Aspirin", dose: "75 mg", frequency: "OD" },
        { name: "Clopidogrel", dose: "75 mg", frequency: "OD" },
        { name: "Isosorbide mononitrate", dose: "20 mg", frequency: "BD" },
      ],
    },
  },
];

export const DEMO_VITALS = { bp: "146/92", hr: 88, spo2: 97, temp: 98.4, rr: 18 };

export type QueueItem = {
  patient: Patient;
  arrivedAt: string;
  chiefComplaint: string;
  priority: "emergency" | "urgent" | "routine";
  status: "intake" | "ready" | "reviewed";
};

export const DEMO_QUEUE: QueueItem[] = [
  { patient: DEMO_PATIENTS[1]!, arrivedAt: "09:12", chiefComplaint: "Fever × 3 days, cough", priority: "routine", status: "ready" },
  { patient: DEMO_PATIENTS[2]!, arrivedAt: "09:31", chiefComplaint: "Abdominal pain", priority: "urgent", status: "intake" },
];
