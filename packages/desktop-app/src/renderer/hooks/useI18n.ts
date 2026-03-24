import { useCallback } from 'react';
import { translate, type TranslationKey, type Locale } from '@moc/shared/i18n';

const currentLocale: Locale = 'ko';

export function useI18n() {
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(currentLocale, key, params),
    [],
  );

  return { t, locale: currentLocale };
}
