import type { Dictionary, Locale } from './types';
import { en } from './en';
import { lv } from './lv';

const dictionaries: Record<Locale, Dictionary> = {
  en,
  lv,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary, Locale };
