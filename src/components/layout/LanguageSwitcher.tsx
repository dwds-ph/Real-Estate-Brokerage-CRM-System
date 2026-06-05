import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fil' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      aria-label={`Switch to ${i18n.language === 'en' ? 'Filipino' : 'English'}`}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <span className="text-base leading-none">
        {i18n.language === 'en' ? '🇵🇭' : '🇺🇸'}
      </span>
      <span className="hidden sm:inline">
        {i18n.language === 'en' ? 'Filipino' : 'English'}
      </span>
    </button>
  );
}
