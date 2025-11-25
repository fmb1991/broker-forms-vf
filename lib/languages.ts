// lib/languages.ts
export type FormLanguage = 'pt-BR' | 'en' | 'es';

export const SUPPORTED_LANGUAGES: { code: FormLanguage; label: string }[] = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export const DEFAULT_LANGUAGE: FormLanguage = 'pt-BR';
