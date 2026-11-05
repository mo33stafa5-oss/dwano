/** Small fetch helper for our own JSON API. Never throws; returns {ok,status,data}. */
export interface ApiRes<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  error?: string;
  data: T;
}

export async function api<T = Record<string, any>>(url: string, init?: RequestInit & { json?: unknown }): Promise<ApiRes<T>> {
  const { json, ...rest } = init ?? {};
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const data = (await res.json().catch(() => ({}))) as any;
    return { ok: res.ok && data?.ok !== false, status: res.status, error: data?.error, data };
  } catch {
    return { ok: false, status: 0, error: "network", data: {} as T };
  }
}

const MSG: Record<string, string> = {
  "subscription-required": "اشتراك الصيدلية غير فعّال. تواصل مع الإدارة لتجديده.",
  "pharmacy-not-approved": "حساب الصيدلية بانتظار موافقة الإدارة.",
  "warehouse-not-active": "حساب المخزن غير مفعّل حاليًا.",
  unauthorized: "سجّل الدخول أولًا.",
  forbidden: "غير مسموح لك بهذا الإجراء.",
  duplicate: "هذا الاسم أو الاسم المستخدم مسجّل بالفعل.",
  "in-use": "لا يمكن تنفيذ الإجراء لأن السجل مرتبط ببيانات أخرى.",
  "rate-limited": "محاولات كثيرة. حاول بعد قليل.",
  "db-not-configured": "قاعدة البيانات غير مهيّأة على الخادم.",
  "storage-not-configured": "تخزين الصور غير مهيّأ على الخادم.",
  "file-too-large": "حجم الصورة كبير.",
  "file-type-not-allowed": "نوع الصورة غير مدعوم (JPG أو PNG أو WEBP).",
  "insufficient-stock": "الكمية المتاحة غير كافية.",
  unavailable: "المنتج غير متاح حاليًا.",
  "invalid-transition": "لا يمكن تغيير الحالة بهذه الطريقة.",
  "query-too-short": "اكتب حرفين على الأقل.",
  invalid: "بيانات غير صحيحة. راجع الحقول.",
  network: "تعذّر الاتصال بالخادم.",
};
export const errMsg = (code?: string) => (code && MSG[code]) || "حدث خطأ غير متوقع. حاول مرة أخرى.";
