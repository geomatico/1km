import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './es.json';
import ca from './ca.json';
import en from './en.json';
import ga from './ga.json';

i18n.use(LanguageDetector)
    .init({
        detection: {
            order: ['querystring', 'navigator'],
            lookupQuerystring: 'lang',
            checkWhitelist: true
        },
        resources: {
            es: {
                translation: es
            },
            ca: {
                translation: ca
            },
            en: {
                translation: en
            },
            ga: {
                translation: ga
            },
        },
        load: 'languageOnly',
        whitelist: ['es', 'ca', 'en', 'ga'],
        fallbackLng: 'es',
        debug: false,
        keySeparator: false,
        interpolation: {
            escapeValue: false,
            formatSeparator: ','
        }
    });

export default i18n;
