import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

/*
 * =====================================================
 * TRADUCCIONES
 * =====================================================
 *
 * Vite descubre automáticamente todos los .json
 * dentro de ../i18n/.
 *
 * Para agregar un idioma nuevo:
 *
 *   1. Crear, por ejemplo, ro.json
 *   2. Agregar "ro" en la tabla languages
 *   3. Dejar active = 0 mientras se prepara
 *   4. Cuando esté listo, active = 1
 *
 * No hace falta modificar este archivo.
 */

const translationFiles = import.meta.glob(
    '../i18n/*.json',
    {
        eager: true,
        import: 'default',
    }
);

const translations = Object.entries(
    translationFiles
).reduce(
    (result, [filePath, translation]) => {

        const fileName =
            filePath
                .split('/')
                .pop() || '';

        const languageCode =
            fileName.replace(
                '.json',
                ''
            );

        result[languageCode] =
            translation;

        return result;

    },
    {}
);

const LanguageContext = createContext(null);

const PRE_LOGIN_LANGUAGE_KEY = 'language_preference';

const API_URL =
    'https://kreandoapp.com/api/index.php';

/*
 * =====================================================
 * TRADUCCIONES DE LA INTERFAZ
 * =====================================================
 *
 * Los JSON siguen siendo los recursos de traducción.
 * El catálogo de idiomas disponibles viene de la API.
 */

const isTranslationAvailable = (language) => {
    return Object.prototype.hasOwnProperty.call(
        translations,
        language
    );
};

/*
 * =====================================================
 * DETECTAR IDIOMA DEL NAVEGADOR
 * =====================================================
 */

const detectBrowserLanguage = () => {
    const browserLanguage =
        navigator.language
            ?.toLowerCase()
            ?.split('-')[0];

    if (isTranslationAvailable(browserLanguage)) {
        return browserLanguage;
    }

    if (isTranslationAvailable('es')) {
        return 'es';
    }

    return Object.keys(
        translations
    )[0] || '';
};

/*
 * =====================================================
 * IDIOMA PRE-LOGIN
 * =====================================================
 *
 * Prioridad:
 * 1. language_preference guardado
 * 2. idioma del navegador
 * 3. español
 */

const getPreLoginLanguage = () => {
    const savedLanguage =
        localStorage.getItem(
            PRE_LOGIN_LANGUAGE_KEY
        );

    if (
        savedLanguage &&
        isTranslationAvailable(savedLanguage)
    ) {
        return savedLanguage;
    }

    const detectedLanguage =
        detectBrowserLanguage();

    localStorage.setItem(
        PRE_LOGIN_LANGUAGE_KEY,
        detectedLanguage
    );

    return detectedLanguage;
};

/*
 * =====================================================
 * BUSCAR TRADUCCIÓN
 * =====================================================
 */

const getTranslationValue = (
    object,
    path
) => {
    if (!object || !path) {
        return undefined;
    }

    return path
        .split('.')
        .reduce(
            (current, key) => {
                if (
                    current &&
                    typeof current === 'object' &&
                    key in current
                ) {
                    return current[key];
                }

                return undefined;
            },
            object
        );
};

export const LanguageProvider = ({
    children,
}) => {

    /*
     * =================================================
     * IDIOMA ACTUAL
     * =================================================
     */

    const [
        language,
        setLanguageState,
    ] = useState(
        getPreLoginLanguage()
    );

    /*
     * =================================================
     * CATÁLOGO DE IDIOMAS
     * =================================================
     *
     * Viene de:
     *
     * GET ?action=catalogs
     */

    const [
        supportedLanguages,
        setSupportedLanguages,
    ] = useState([]);

    const [
        catalogsLoaded,
        setCatalogsLoaded,
    ] = useState(false);

    /*
     * =================================================
     * CARGAR CATÁLOGO
     * =================================================
     */

    useEffect(() => {

        let cancelled = false;

        const loadCatalogs = async () => {

            try {

                const response =
                    await fetch(
                        `${API_URL}?action=catalogs`
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                            'No se pudieron cargar los catálogos'
                    );
                }

                const languages =
                    data.data?.languages || [];

                /*
                 * La DB/API decide qué idiomas están
                 * disponibles.
                 *
                 * El JSON debe existir para poder
                 * traducir realmente la interfaz.
                 */

                const availableLanguages =
                    languages.filter(
                        (item) =>
                            item?.code &&
                            isTranslationAvailable(
                                item.code
                            )
                    );

                if (cancelled) {
                    return;
                }

                setSupportedLanguages(
                    availableLanguages
                );

                setCatalogsLoaded(true);

                /*
                 * Si el idioma actual ya no está
                 * disponible en DB, usamos el primero
                 * disponible que tenga traducción.
                 */

                setLanguageState(
                    (currentLanguage) => {

                        const currentIsAvailable =
                            availableLanguages.some(
                                (item) =>
                                    item.code ===
                                    currentLanguage
                            );

                        if (
                            currentIsAvailable
                        ) {
                            return currentLanguage;
                        }

                        return (
                            availableLanguages[0]?.code ||
                            'es'
                        );
                    }
                );

            } catch (error) {

                console.error(
                    'Error cargando catálogo de idiomas:',
                    error
                );

                if (!cancelled) {
                    /*
                     * Si falla temporalmente la API,
                     * mantenemos el idioma actual para
                     * no bloquear la aplicación.
                     */
                    setCatalogsLoaded(false);
                }
            }
        };

        loadCatalogs();

        return () => {
            cancelled = true;
        };

    }, []);

    /*
     * =================================================
     * CAMBIAR PREFERENCIA PRE-LOGIN
     * =================================================
     */

    const setLanguagePreference =
        useCallback(
            (newLanguage) => {

                const catalogAllowsLanguage =
                    !catalogsLoaded ||
                    supportedLanguages.some(
                        (item) =>
                            item.code ===
                            newLanguage
                    );

                if (
                    !isTranslationAvailable(
                        newLanguage
                    ) ||
                    !catalogAllowsLanguage
                ) {
                    return;
                }

                localStorage.setItem(
                    PRE_LOGIN_LANGUAGE_KEY,
                    newLanguage
                );

                setLanguageState(
                    newLanguage
                );

                window.dispatchEvent(
                    new Event(
                        'language-changed'
                    )
                );
            },
            [
                catalogsLoaded,
                supportedLanguages,
            ]
        );

    /*
     * =================================================
     * CAMBIAR IDIOMA DESDE BUSINESS
     * =================================================
     *
     * El idioma autenticado viene de:
     *
     * user.business.language
     *
     * No modifica language_preference.
     */

    const setLanguageFromBusiness =
        useCallback(
            (businessLanguage) => {

                const catalogAllowsLanguage =
                    !catalogsLoaded ||
                    supportedLanguages.some(
                        (item) =>
                            item.code ===
                            businessLanguage
                    );

                if (
                    !isTranslationAvailable(
                        businessLanguage
                    ) ||
                    !catalogAllowsLanguage
                ) {
                    return;
                }

                setLanguageState(
                    businessLanguage
                );
            },
            [
                catalogsLoaded,
                supportedLanguages,
            ]
        );

    /*
     * =================================================
     * VOLVER AL IDIOMA PRE-LOGIN
     * =================================================
     */

    const syncLanguage =
        useCallback(() => {

            const currentLanguage =
                getPreLoginLanguage();

            const catalogAllowsLanguage =
                !catalogsLoaded ||
                supportedLanguages.some(
                    (item) =>
                        item.code ===
                        currentLanguage
                );

            const finalLanguage =
                catalogAllowsLanguage
                    ? currentLanguage
                    : (
                        supportedLanguages[0]?.code ||
                        'es'
                    );

            setLanguageState(
                finalLanguage
            );

            return finalLanguage;

        }, [
            catalogsLoaded,
            supportedLanguages,
        ]);

    /*
     * =================================================
     * FUNCIÓN DE TRADUCCIÓN
     * =================================================
     */

    const t = useCallback(
        (path, fallback = null) => {

            const currentTranslations =
                translations[language];

            const value =
                getTranslationValue(
                    currentTranslations,
                    path
                );

            if (
                value !== undefined &&
                value !== null
            ) {
                return value;
            }

            /*
             * Fallback automático a español.
             */

            const spanishValue =
                getTranslationValue(
                    translations.es,
                    path
                );

            if (
                spanishValue !== undefined &&
                spanishValue !== null
            ) {
                return spanishValue;
            }

            /*
             * Si español no existe temporalmente,
             * usamos el primer idioma disponible.
             */

            const firstLanguage =
                Object.keys(
                    translations
                )[0];

            const firstLanguageValue =
                getTranslationValue(
                    translations[firstLanguage],
                    path
                );

            if (
                firstLanguageValue !== undefined &&
                firstLanguageValue !== null
            ) {
                return firstLanguageValue;
            }

            /*
             * Fallback manual.
             */

            if (fallback !== null) {
                return fallback;
            }

            /*
             * Último fallback.
             */

            return path;

        },
        [language]
    );

    /*
     * =================================================
     * ESCUCHAR CAMBIOS DE IDIOMA
     * =================================================
     */

    useEffect(() => {

        const handleLanguageChanged =
            () => {

                const currentLanguage =
                    localStorage.getItem(
                        PRE_LOGIN_LANGUAGE_KEY
                    );

                const catalogAllowsLanguage =
                    !catalogsLoaded ||
                    supportedLanguages.some(
                        (item) =>
                            item.code ===
                            currentLanguage
                    );

                if (
                    currentLanguage &&
                    isTranslationAvailable(
                        currentLanguage
                    ) &&
                    catalogAllowsLanguage
                ) {
                    setLanguageState(
                        currentLanguage
                    );
                }
            };

        window.addEventListener(
            'language-changed',
            handleLanguageChanged
        );

        return () => {

            window.removeEventListener(
                'language-changed',
                handleLanguageChanged
            );

        };

    }, [
        catalogsLoaded,
        supportedLanguages,
    ]);

    /*
     * =================================================
     * CONTEXT VALUE
     * =================================================
     */

    const value = useMemo(
        () => ({
            language,
            supportedLanguages,
            catalogsLoaded,
            t,
            setLanguagePreference,
            setLanguageFromBusiness,
            syncLanguage,
        }),
        [
            language,
            supportedLanguages,
            catalogsLoaded,
            t,
            setLanguagePreference,
            setLanguageFromBusiness,
            syncLanguage,
        ]
    );

    return (
        <LanguageContext.Provider
            value={value}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {

    const context =
        useContext(
            LanguageContext
        );

    if (!context) {
        throw new Error(
            'useLanguage must be used inside LanguageProvider'
        );
    }

    return context;
};
