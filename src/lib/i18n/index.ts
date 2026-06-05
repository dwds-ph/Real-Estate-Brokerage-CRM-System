import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fil from './locales/fil.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
const browserLang = typeof window !== 'undefined' ? navigator.language?.split('-')[0] : 'en';
const detectedLang = savedLang || (browserLang === 'fil' || browserLang === 'tl' ? 'fil' : 'en');

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fil: { translation: fil },
  },
  lng: detectedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
