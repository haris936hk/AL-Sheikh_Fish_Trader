import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ur from './ur.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: 'ur', // default language; App.jsx will override from DB
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export default i18n;
