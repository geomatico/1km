import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './es.json';
import ca from './ca.json';
import en from './en.json';
import gl from './gl.json';
import eu from './eu.json';

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
            gl: {
                translation: gl
            },
            eu: {
                translation: eu
            }
        },
        load: 'languageOnly',
        whitelist: ['es', 'ca', 'en', 'gl', 'eu'],
        fallbackLng: 'es',
        debug: false,
        keySeparator: false,
        interpolation: {
            escapeValue: false,
            formatSeparator: ','
        }
    });

export default i18n;
