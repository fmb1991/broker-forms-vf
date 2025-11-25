'use client';

import { SUPPORTED_LANGUAGES, type FormLanguage } from '@/lib/languages';

interface LanguageSwitcherProps {
  value: FormLanguage;
  onChange: (lang: FormLanguage) => void;
}

export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">Idioma:</span>
      <div className="inline-flex rounded-full border px-1 py-0.5 bg-background">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            className={
              'px-3 py-1 text-sm rounded-full transition ' +
              (value === lang.code
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted')
            }
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
