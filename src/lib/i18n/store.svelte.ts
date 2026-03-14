import { translations, type id, type LanguageCode } from "@lib/i18n/translations";

// --- Type-Safe i18n Magic (Explicit Depth to avoid Svelte AST limits) ---
type Dict = typeof id;

type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends ""
      ? K
      : `${Prefix}.${K}`
    : T[K] extends object
      ? Paths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
      : never;
}[keyof T & string];

export type AllowedTranslations = Paths<Dict>;
// ----------------------------

let currentLang = $state<LanguageCode>("id");

/**
 * Initialize language from cookie or localStorage
 */
export function initI18n(lang?: LanguageCode) {
  if (lang && translations[lang]) {
    currentLang = lang;
    return;
  }

  if (typeof window !== "undefined") {
    const cookieMatch = document.cookie.match(/rs_lang=([^;]+)/);
    if (cookieMatch && translations[cookieMatch[1] as LanguageCode]) {
      currentLang = cookieMatch[1] as LanguageCode;
    } else {
      const saved = localStorage.getItem("rs_lang") as LanguageCode;
      if (saved && translations[saved]) {
        currentLang = saved;
      }
    }
  }
}

/**
 * Type-safe translation function
 * It catches typos for hardcoded strings but still allows dynamic 'string' variables!
 */
export function t(key: AllowedTranslations | (string & {}), params?: Record<string, string | number>): string {
  const parts = key.split(".");
  let result: any = translations[currentLang];

  for (const part of parts) {
    result = result?.[part];
    if (result === undefined) return key;
  }

  if (typeof result !== "string") return key;

  if (params) {
    return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), result);
  }

  return result;
}

/**
 * Global reactive language state
 */
export const i18n = {
  get lang() {
    return currentLang;
  },
  set lang(v: LanguageCode) {
    currentLang = v;
    if (typeof window !== "undefined") {
      localStorage.setItem("rs_lang", v);
      // Update cookie
      const d = new Date();
      d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
      // biome-ignore lint/suspicious/noDocumentCookie: Need classic cookies for server sync
      document.cookie = `rs_lang=${v};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    }
  },
  /**
   * Universal formatter helper
   */
  get f() {
    const locale = t("common.lang_code") || "id-ID";
    const currency = t("common.currency_symbol") || "Rp";

    return {
      currency: (value: number) => {
        return `${currency} ${value.toLocaleString(locale)}`;
      },
      number: (value: number) => {
        return value.toLocaleString(locale);
      },
      date: (date: Date | string | number) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      },
    };
  },
};
