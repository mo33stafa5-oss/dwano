import type { Medicine } from "@/types";

/**
 * 50 medicine catalog records for the DEMO. Names are common market brands used
 * only so search feels realistic. No medical claims or substitutes are implied.
 */
type Row = [id: string, ar: string, en: string, strength: string, form: string, pack: string, cat: string, aliases?: string[]];

const rows: Row[] = [
  ["cataflam-50", "كتافلام ٥٠ مجم", "Cataflam", "50 mg", "أقراص", "٢٠ قرصًا", "مسكنات", ["كتافلام", "كاتافلام", "cataflam"]],
  ["cataflam-25", "كتافلام ٢٥ مجم", "Cataflam", "25 mg", "أقراص", "٢٠ قرصًا", "مسكنات", ["كتافلام", "كاتافلام", "cataflam"]],
  ["panadol-extra", "بانادول إكسترا", "Panadol Extra", "500 mg + 65 mg", "أقراص", "٢٤ قرصًا", "مسكنات", ["بنادول", "panadol"]],
  ["panadol-advance", "بانادول أدفانس", "Panadol Advance", "500 mg", "أقراص", "٢٤ قرصًا", "مسكنات", ["بنادول", "panadol"]],
  ["augmentin-1g", "أوجمنتين ١ جم", "Augmentin", "1 g", "أقراص", "١٤ قرصًا", "مضادات حيوية", ["اوجمنتين", "augmentin"]],
  ["flagyl-500", "فلاجيل ٥٠٠ مجم", "Flagyl", "500 mg", "أقراص", "٢٠ قرصًا", "مضادات حيوية", ["flagyl"]],
  ["brufen-400", "بروفين ٤٠٠ مجم", "Brufen", "400 mg", "أقراص", "٣٠ قرصًا", "مسكنات", ["brufen"]],
  ["voltaren-75", "فولتارين ٧٥ مجم", "Voltaren", "75 mg", "أمبولات", "٥ أمبولات", "مسكنات", ["voltaren"]],
  ["antinal-200", "أنتينال ٢٠٠ مجم", "Antinal", "200 mg", "كبسولات", "٢٠ كبسولة", "الجهاز الهضمي", ["antinal"]],
  ["buscopan", "بوسكوبان", "Buscopan", "10 mg", "أقراص", "٢٠ قرصًا", "الجهاز الهضمي", ["بوسكوبان"]],
  ["controloc-40", "كونترولوك ٤٠ مجم", "Controloc", "40 mg", "أقراص", "١٤ قرصًا", "الجهاز الهضمي", ["controloc"]],
  ["nexium-40", "نكسيوم ٤٠ مجم", "Nexium", "40 mg", "أقراص", "١٤ قرصًا", "الجهاز الهضمي", ["nexium"]],
  ["gaviscon", "جافيسكون", "Gaviscon", "—", "شراب", "١٥٠ مل", "الجهاز الهضمي", ["gaviscon"]],
  ["claritine", "كلاريتين", "Claritine", "10 mg", "أقراص", "١٠ أقراص", "الحساسية", ["claritine"]],
  ["zyrtec", "زيرتك", "Zyrtec", "10 mg", "أقراص", "٢٠ قرصًا", "الحساسية", ["zyrtec"]],
  ["telfast-120", "تلفاست ١٢٠ مجم", "Telfast", "120 mg", "أقراص", "١٠ أقراص", "الحساسية", ["telfast"]],
  ["ventolin", "فنتولين", "Ventolin", "100 mcg", "بخاخ", "١٢٠ جرعة", "الجهاز التنفسي", ["ventolin"]],
  ["mucosolvan", "موكوسولفان", "Mucosolvan", "30 mg", "شراب", "١٢٠ مل", "الجهاز التنفسي", ["mucosolvan"]],
  ["comtrex", "كومتريكس", "Comtrex", "—", "كبسولات", "٢٤ كبسولة", "البرد والإنفلونزا", ["comtrex"]],
  ["fluchek", "فلوتشيك", "Fluchek", "—", "أكياس", "١٠ أكياس", "البرد والإنفلونزا", ["fluchek"]],
  ["cetal-500", "سيتال ٥٠٠ مجم", "Cetal", "500 mg", "أقراص", "٢٠ قرصًا", "مسكنات", ["cetal"]],
  ["adol-500", "أدول ٥٠٠ مجم", "Adol", "500 mg", "أقراص", "٢٠ قرصًا", "مسكنات", ["adol"]],
  ["concor-5", "كونكور ٥ مجم", "Concor", "5 mg", "أقراص", "٣٠ قرصًا", "القلب والأوعية", ["concor"]],
  ["glucophage-500", "جلوكوفاج ٥٠٠ مجم", "Glucophage", "500 mg", "أقراص", "٣٠ قرصًا", "السكر", ["glucophage"]],
  ["lantus", "لانتوس", "Lantus", "100 IU/ml", "قلم حقن", "٣ مل", "السكر", ["lantus"]],
  ["amaryl-2", "أماريل ٢ مجم", "Amaryl", "2 mg", "أقراص", "٣٠ قرصًا", "السكر", ["amaryl"]],
  ["lipitor-20", "ليبيتور ٢٠ مجم", "Lipitor", "20 mg", "أقراص", "٣٠ قرصًا", "القلب والأوعية", ["lipitor"]],
  ["aspocid-75", "أسبوسيد ٧٥ مجم", "Aspocid", "75 mg", "أقراص", "٣٠ قرصًا", "القلب والأوعية", ["aspocid"]],
  ["plavix-75", "بلافيكس ٧٥ مجم", "Plavix", "75 mg", "أقراص", "٢٨ قرصًا", "القلب والأوعية", ["plavix"]],
  ["amlor-5", "أملور ٥ مجم", "Amlor", "5 mg", "كبسولات", "٣٠ كبسولة", "القلب والأوعية", ["amlor"]],
  ["vitamin-c-1000", "فيتامين سي ١٠٠٠", "Vitamin C", "1000 mg", "أقراص فوارة", "٢٠ قرصًا", "فيتامينات", ["فيتامين سي", "vitamin c"]],
  ["vitamin-d3", "فيتامين د٣", "Vitamin D3", "5000 IU", "كبسولات", "٣٠ كبسولة", "فيتامينات", ["فيتامين د", "vitamin d"]],
  ["neurobion", "نيوروبيون", "Neurobion", "—", "أقراص", "٣٠ قرصًا", "فيتامينات", ["neurobion"]],
  ["ferrous-iron", "حديد فيروس", "Ferrous Iron", "—", "كبسولات", "٣٠ كبسولة", "فيتامينات", ["حديد"]],
  ["calcium-d", "كالسيوم د", "Calcium D", "—", "أقراص", "٣٠ قرصًا", "فيتامينات", ["كالسيوم"]],
  ["omega-3", "أوميجا ٣", "Omega 3", "1000 mg", "كبسولات", "٣٠ كبسولة", "مكملات", ["اوميجا"]],
  ["zinc-50", "زنك ٥٠ مجم", "Zinc", "50 mg", "كبسولات", "٣٠ كبسولة", "مكملات", ["زنك"]],
  ["betadine", "بيتادين", "Betadine", "10%", "محلول", "١٢٠ مل", "مطهرات", ["betadine"]],
  ["dettol", "ديتول", "Dettol", "—", "سائل", "٢٥٠ مل", "مطهرات", ["dettol"]],
  ["fucidin", "فيوسيدين", "Fucidin", "2%", "كريم", "١٥ جم", "الجلدية", ["fucidin"]],
  ["voltaren-gel", "فولتارين جل", "Voltaren Emulgel", "1%", "جل", "٥٠ جم", "مسكنات موضعية", ["voltaren gel"]],
  ["otrivin", "أوتريفين", "Otrivin", "0.1%", "نقط أنف", "١٠ مل", "الأنف", ["otrivin"]],
  ["visine", "فيزين", "Visine", "—", "نقط عين", "١٥ مل", "العين", ["visine"]],
  ["orsalit", "أورسالايت", "Orsalit", "—", "أكياس", "١٠ أكياس", "الجهاز الهضمي", ["orsalit"]],
  ["enterogermina", "إنتيروجرمينا", "Enterogermina", "—", "أمبولات شرب", "١٠ أمبولات", "الجهاز الهضمي", ["enterogermina"]],
  ["pedialyte", "بيديالايت", "Pedialyte", "—", "محلول", "٢٣٠ مل", "الجهاز الهضمي", ["pedialyte"]],
  ["biogaia", "بيوجايا", "BioGaia", "—", "نقط", "٥ مل", "مكملات", ["biogaia"]],
  ["strepsils", "ستربسلز", "Strepsils", "—", "أقراص مص", "٢٤ قرصًا", "الحلق", ["strepsils"]],
  ["dolo-forte", "دولو فورت", "Dolo Forte", "—", "أقراص", "٢٠ قرصًا", "مسكنات", ["dolo"]],
  ["thyroxine-100", "ثيروكسين ١٠٠", "Thyroxine", "100 mcg", "أقراص", "٥٠ قرصًا", "الغدة", ["thyroxine"]],
];

export const medicines: Medicine[] = rows.map(([id, nameAr, nameEn, strength, form, pack, category, aliases]) => ({
  id,
  nameAr,
  nameEn,
  strength,
  form,
  pack,
  category,
  aliases: aliases ?? [],
}));

export const getMedicine = (id: string) => medicines.find((m) => m.id === id);
