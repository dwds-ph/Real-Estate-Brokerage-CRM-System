import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fil' : 'en';
    i18n.changeLanguage(newLang);
  };

  const isEnglish = i18n.language === 'en';

  return (
    <button
      onClick={toggleLanguage}
      aria-label={isEnglish ? t('common.switchToFilipino') : t('common.switchToEnglish')}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <span className="text-base leading-none">
        {isEnglish ? '🇵🇭' : '🇺🇸'}
      </span>
      <span className="hidden sm:inline">
        {isEnglish ? t('settings.filipino') : t('settings.english')}
      </span>
    </button>
  );
}
