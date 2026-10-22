/** DEMO accounts. No passwords are stored anywhere; sign-in is simulated on the frontend. */
export type DemoRole = "patient" | "pharmacy" | "admin";

export interface DemoUser {
  id: string;
  name: string;
  role: DemoRole;
  pharmacyId?: string;
}

export const demoUsers: DemoUser[] = [
  { id: "u-patient", name: "مستخدم تجريبي", role: "patient" },
  { id: "u-pharmacy", name: "مدير صيدلية تجريبي", role: "pharmacy", pharmacyId: "ph-09" },
  { id: "u-admin", name: "مشرف المنصة (تجريبي)", role: "admin" },
];
