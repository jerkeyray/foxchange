import type { Currency } from "@/types/graph";

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: "USD", label: "US Dollar", flag: "🇺🇸", color: "#3b82f6" },
  { code: "EUR", label: "Euro", flag: "🇪🇺", color: "#8b5cf6" },
  { code: "GBP", label: "British Pound", flag: "🇬🇧", color: "#ec4899" },
  { code: "JPY", label: "Japanese Yen", flag: "🇯🇵", color: "#f43f5e" },
  { code: "INR", label: "Indian Rupee", flag: "🇮🇳", color: "#f97316" },
  { code: "AUD", label: "Australian Dollar", flag: "🇦🇺", color: "#eab308" },
  { code: "SGD", label: "Singapore Dollar", flag: "🇸🇬", color: "#22c55e" },
  { code: "CHF", label: "Swiss Franc", flag: "🇨🇭", color: "#14b8a6" },
];

export const CURRENCY_CODES = DEFAULT_CURRENCIES.map((c) => c.code);

export const CURRENCY_MAP = Object.fromEntries(
  DEFAULT_CURRENCIES.map((c) => [c.code, c])
) as Record<string, Currency>;
