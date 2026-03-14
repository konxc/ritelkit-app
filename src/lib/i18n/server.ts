import { translations, type LanguageCode } from "@/lib/i18n/translations";
export type { LanguageCode };

export function getLang(cookies: any): LanguageCode {
  return (cookies.get("rs_lang")?.value as LanguageCode) || "id";
}

export function tServer(lang: LanguageCode, key: string, params?: Record<string, string | number>): string {
  const parts = key.split(".");
  let result: any = translations[lang] || translations.id;

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

export function fServer(lang: LanguageCode) {
  const locale = tServer(lang, "common.lang_code") || "id-ID";
  const currencySymbol = tServer(lang, "common.currency_symbol") || "Rp";

  return {
    currency: (value: number) => {
      return `${currencySymbol} ${value.toLocaleString(locale)}`;
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
}
