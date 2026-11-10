/*:
 * @plugindesc v2.0 GranadaMon - Google Login + Firebase + seguimiento completo
 * @author OpenAI
 *
 * @help
 * GranadaMon_Telemetry.js
 * Colocar AL FINAL de los plugins GranadaMon.
 *
 * Variables:
 *   #0113 Batallas ganadas
 *   #0114 Poképaradas
 *   #0115 Misiones resueltas
 * Switch:
 *   #0007 Google Login completado
 * Avatar:
 *   Actor #1
 *
 * Comandos:
 *   GranadaMonLogin
 *   GranadaMonTelemetry Sync
 *   GranadaMonTelemetry Logout
 *   GranadaMonTelemetry Debug
 *   GranadaMonGymWin GYM_01 Nombre del gimnasio
 */
(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;
    GM.Telemetry = GM.Telemetry || {};
    var T = GM.Telemetry;

    T.VERSION = '2.0';
    T.FIREBASE_CONFIG = {
        apiKey: 'AIzaSyBL81T6r84kKLVkNx9No4yfUAH9wv7JwQs',
        authDomain: 'granadamon-seguimiento.firebaseapp.com',
        projectId: 'granadamon-seguimiento',
        storageBucket: 'granadamon-seguimiento.firebasestorage.app',
        messagingSenderId: '632138736671',
        appId: '1:632138736671:web:53c2fc4d5429ddc9c5e12a'
    };

    T.LOGIN_SWITCH_ID = 7;
    T.GYM_WINS_VARIABLE_ID = 113;
    T.POKESTOPS_VARIABLE_ID = 114;
    T.MISSIONS_VARIABLE_ID = 115;
    T.AVATAR_ACTOR_ID = 1;

    T.TOTAL_WILD = 85;
    T.TOTAL_EGGS = 9;
    T.TOTAL_SINGULARS = 6;
    T.TOTAL_GYMS = 8;

    T.LOADER_PATH = 'js/libs/firebase/firebase-loader.js';
    T.AUTO_SYNC_MS = 60000;
    T.DEBOUNCE_MS = 700;
    T.RETRY_DELAYS = [5000, 15000, 30000, 60000];

    T.HATCH_DEX = {
        1: true,
        13: true,
        16: true,
        37: true,
        40: true,
        97: true,
        84: true,
        87: true,
        91: true
    };

    T.SINGULAR_DEX = {
        22: true,
        23: true,
        24: true,
        28: true,
        29: true,
        30: true
    };

    T._loaderPromise = null;
    T._initPromise = null;
    T._auth = null;
    T._db = null;
    T._user = null;
    T._initialized = false;
    T._loginBlocking = false;
    T._overlay = null;
    T._loginButton = null;
    T._loginStatus = null;
    T._syncTimer = null;
    T._retryTimer = null;
    T._autoInterval = null;
    T._retryIndex = 0;
    T._syncInFlight = false;
    T._firstConnectionCheckedForUid = null;

    function log() {
        if (!window.console || !console.log) return;

        var args =
            Array.prototype
                .slice
                .call(arguments);

        args.unshift(
            '[GranadaMon Telemetry]'
        );

        console.log.apply(
            console,
            args
        );
    }

    function warn() {
        if (!window.console || !console.warn) return;

        var args =
            Array.prototype
                .slice
                .call(arguments);

        args.unshift(
            '[GranadaMon Telemetry]'
        );

        console.warn.apply(
            console,
            args
        );
    }

    function int0(value) {
        var number =
            Number(
                value || 0
            );

        if (!isFinite(number)) {
            return 0;
        }

        return Math.max(
            0,
            Math.floor(
                number
            )
        );
    }

    function numericKeys(object) {
        var result = [];
        var key;

        object =
            object || {};

        for (
            key in object
        ) {
            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        object,
                        key
                    ) &&
                object[key]
            ) {
                result.push(
                    Number(
                        key
                    )
                );
            }
        }

        result.sort(
            function(
                a,
                b
            ) {
                return (
                    a - b
                );
            }
        );

        return result;
    }

    function textKeys(object) {
        var result = [];
        var key;

        object =
            object || {};

        for (
            key in object
        ) {
            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        object,
                        key
                    ) &&
                object[key]
            ) {
                result.push(
                    String(
                        key
                    )
                );
            }
        }

        result.sort();

        return result;
    }

    function joinArgs(
        args,
        from
    ) {
        if (
            !args ||
            args.length <=
                from
        ) {
            return '';
        }

        return (
            args
                .slice(
                    from
                )
                .join(
                    ' '
                )
        );
    }

    // =========================================================
    // REGISTRO PERSISTENTE
    // =========================================================

    T.ensureRegistry =
        function() {

            if (
                !window
                    .$gameSystem
            ) {
                return null;
            }

            if (
                !$gameSystem
                    ._granadaMonTelemetry
            ) {

                $gameSystem
                    ._granadaMonTelemetry = {

                        version:
                            2,

                        capturedWild:
                            {},

                        eggs:
                            {},

                        singulars:
                            {},

                        gyms:
                            {},

                        legacyMigrated:
                            false

                    };

            }

            var registry =
                $gameSystem
                    ._granadaMonTelemetry;

            registry.version =
                2;

            registry.capturedWild =
                registry.capturedWild ||
                {};

            registry.eggs =
                registry.eggs ||
                {};

            registry.singulars =
                registry.singulars ||
                {};

            registry.gyms =
                registry.gyms ||
                {};

            if (
                registry
                    .legacyMigrated ==
                null
            ) {
                registry
                    .legacyMigrated =
                    false;
            }

            return registry;

        };

    T.getSpecies =
        function(
            nationalDex
        ) {

            if (
                !GM.getSpecies
            ) {
                return null;
            }

            return (
                GM.getSpecies(
                    Number(
                        nationalDex ||
                        0
                    )
                )
            );

        };

    T.getSpeciesByGranadaDex =
        function(
            granadaDex
        ) {

            if (
                !GM
                    .getSpeciesByGranadaDex
            ) {
                return null;
            }

            return (
                GM
                    .getSpeciesByGranadaDex(
                        Number(
                            granadaDex ||
                            0
                        )
                    )
            );

        };

    T.categoryForSpecies =
        function(
            species
        ) {

            if (
                !species
            ) {
                return null;
            }

            var granadaDex =
                Number(
                    species
                        .granadaDex ||
                    0
                );

            if (
                T.HATCH_DEX[
                    granadaDex
                ]
            ) {
                return 'EGG';
            }

            if (
                T.SINGULAR_DEX[
                    granadaDex
                ]
            ) {
                return 'SINGULAR';
            }

            if (
                granadaDex >=
                    1 &&
                granadaDex <=
                    100
            ) {
                return 'WILD';
            }

            return null;

        };

    T.makePokemonRecord =
        function(
            species
        ) {

            return {

                nationalDex:
                    Number(
                        species
                            .nationalDex ||
                        0
                    ),

                granadaDex:
                    Number(
                        species
                            .granadaDex ||
                        0
                    ),

                name:
                    String(
                        species.name ||
                        'Pokémon'
                    )

            };

        };

    T.recordPokemon =
        function(
            nationalDex,
            source
        ) {

            if (
                !window
                    .$gameSystem
            ) {
                return false;
            }

            var species =
                T.getSpecies(
                    nationalDex
                );

            if (
                !species
            ) {
                return false;
            }

            var category =
                T.categoryForSpecies(
                    species
                );

            var registry =
                T.ensureRegistry();

            if (
                !category ||
                !registry
            ) {
                return false;
            }

            var granadaDex =
                Number(
                    species
                        .granadaDex ||
                    0
                );

            var record =
                T.makePokemonRecord(
                    species
                );

            var changed =
                false;

            if (
                category ===
                'EGG'
            ) {

                changed =
                    !registry
                        .eggs[
                            granadaDex
                        ];

                registry
                    .eggs[
                        granadaDex
                    ] =
                    record;

            }

            else if (
                category ===
                'SINGULAR'
            ) {

                changed =
                    !registry
                        .singulars[
                            granadaDex
                        ];

                registry
                    .singulars[
                        granadaDex
                    ] =
                    record;

            }

            else if (
                category ===
                    'WILD' &&
                source ===
                    'CAPTURE'
            ) {

                changed =
                    !registry
                        .capturedWild[
                            granadaDex
                        ];

                registry
                    .capturedWild[
                        granadaDex
                    ] =
                    record;

            }

            if (
                changed
            ) {

                log(
                    'Pokémon registrado:',
                    record.name,
                    category,
                    source || ''
                );

                T.scheduleSync(
                    300
                );

            }

            return changed;

        };

    // =========================================================
    // MIGRACIÓN DE PARTIDAS ANTERIORES
    // =========================================================

    T.migrateLegacyDex =
        function() {

            if (
                !window
                    .$gameSystem
            ) {
                return;
            }

            var registry =
                T.ensureRegistry();

            if (
                !registry ||
                registry
                    .legacyMigrated
            ) {
                return;
            }

            if (
                GM.syncDex
            ) {
                GM.syncDex();
            }

            var dex =
                $gameSystem
                    ._granadaMonDex ||
                [];

            var i;

            for (
                i = 0;
                i < dex.length;
                i++
            ) {

                var entry =
                    dex[i];

                if (
                    !entry ||
                    entry.caught !==
                        true
                ) {
                    continue;
                }

                var species =
                    T.getSpecies(
                        entry
                            .speciesId
                    );

                if (
                    !species
                ) {

                    species =
                        T
                            .getSpeciesByGranadaDex(
                                entry.id ||
                                (i + 1)
                            );

                }

                if (
                    !species
                ) {
                    continue;
                }

                var category =
                    T.categoryForSpecies(
                        species
                    );

                var granadaDex =
                    Number(
                        species
                            .granadaDex ||
                        0
                    );

                var record =
                    T.makePokemonRecord(
                        species
                    );

                if (
                    category ===
                    'EGG'
                ) {

                    registry
                        .eggs[
                            granadaDex
                        ] =
                        record;

                }

                else if (
                    category ===
                    'SINGULAR'
                ) {

                    registry
                        .singulars[
                            granadaDex
                        ] =
                        record;

                }

                else if (
                    category ===
                    'WILD'
                ) {

                    registry
                        .capturedWild[
                            granadaDex
                        ] =
                        record;

                }

            }

            registry
                .legacyMigrated =
                true;

        };

    // =========================================================
    // PROGRESO POKÉMON
    // =========================================================

    T.recordsToProgress =
        function(
            object
        ) {

            var keys =
                numericKeys(
                    object
                );

            var names =
                [];

            var dex =
                [];

            var i;

            for (
                i = 0;
                i < keys.length;
                i++
            ) {

                var record =
                    object[
                        keys[i]
                    ];

                if (
                    !record
                ) {
                    continue;
                }

                names.push(
                    String(
                        record.name ||
                        (
                            'Pokémon #' +
                            keys[i]
                        )
                    )
                );

                dex.push(
                    Number(
                        record
                            .granadaDex ||
                        keys[i]
                    )
                );

            }

            return {

                count:
                    names.length,

                names:
                    names,

                dex:
                    dex

            };

        };

    T.getPokemonProgress =
        function() {

            var registry =
                T.ensureRegistry();

            if (
                !registry
            ) {

                return {

                    wild: {
                        count: 0,
                        names: [],
                        dex: []
                    },

                    eggs: {
                        count: 0,
                        names: [],
                        dex: []
                    },

                    singulars: {
                        count: 0,
                        names: [],
                        dex: []
                    }

                };

            }

            return {

                wild:
                    T.recordsToProgress(
                        registry
                            .capturedWild
                    ),

                eggs:
                    T.recordsToProgress(
                        registry
                            .eggs
                    ),

                singulars:
                    T.recordsToProgress(
                        registry
                            .singulars
                    )

            };

        };

    // =========================================================
    // GIMNASIOS / COMBATES
    // =========================================================

    T.recordGymWin =
        function(
            gymId,
            gymName
        ) {

            if (
                !window
                    .$gameSystem
            ) {
                return false;
            }

            gymId =
                String(
                    gymId ||
                    ''
                )
                    .trim();

            if (
                !gymId
            ) {
                return false;
            }

            var registry =
                T.ensureRegistry();

            if (
                !registry ||
                registry
                    .gyms[
                        gymId
                    ]
            ) {
                return false;
            }

            registry
                .gyms[
                    gymId
                ] = {

                    id:
                        gymId,

                    name:
                        String(
                            gymName ||
                            gymId
                        )

                };

            var count =
                textKeys(
                    registry
                        .gyms
                )
                    .length;

            if (
                window
                    .$gameVariables
            ) {

                $gameVariables
                    .setValue(
                        T
                            .GYM_WINS_VARIABLE_ID,

                        Math.min(
                            T.TOTAL_GYMS,
                            count
                        )
                    );

            }

            log(
                'Gimnasio registrado:',
                gymId,
                gymName || ''
            );

            T.scheduleSync(
                300
            );

            return true;

        };

    T.getGymProgress =
        function() {

            var registry =
                T.ensureRegistry();

            var ids =
                [];

            var names =
                [];

            var variableCount =
                0;

            var keys =
                registry
                    ? textKeys(
                        registry
                            .gyms
                      )
                    : [];

            var i;

            for (
                i = 0;
                i < keys.length;
                i++
            ) {

                var gym =
                    registry
                        .gyms[
                            keys[i]
                        ];

                ids.push(
                    String(
                        gym.id ||
                        keys[i]
                    )
                );

                names.push(
                    String(
                        gym.name ||
                        gym.id ||
                        keys[i]
                    )
                );

            }

            if (
                window
                    .$gameVariables
            ) {

                variableCount =
                    int0(
                        $gameVariables
                            .value(
                                T
                                    .GYM_WINS_VARIABLE_ID
                            )
                    );

            }

            return {

                count:
                    Math.min(
                        T.TOTAL_GYMS,

                        Math.max(
                            variableCount,
                            ids.length
                        )
                    ),

                ids:
                    ids,

                names:
                    names

            };

        };

    // =========================================================
    // AVATAR Y DATOS DEL JUEGO
    // =========================================================

    T.getAvatarName =
        function() {

            if (
                !window
                    .$gameActors
            ) {
                return '';
            }

            var actor =
                $gameActors
                    .actor(
                        T
                            .AVATAR_ACTOR_ID
                    );

            if (
                !actor ||
                !actor.name
            ) {
                return '';
            }

            return (
                String(
                    actor.name() ||
                    ''
                )
                    .trim()
            );

        };

    T.getVariable =
        function(
            id
        ) {

            if (
                !window
                    .$gameVariables
            ) {
                return 0;
            }

            return (
                int0(
                    $gameVariables
                        .value(
                            id
                        )
                )
            );

        };

    T.getMapName =
        function() {

            if (
                !window
                    .$gameMap
            ) {
                return '';
            }

            if (
                typeof $gameMap
                    .displayName ===
                    'function'
            ) {

                var name =
                    String(
                        $gameMap
                            .displayName() ||
                        ''
                    )
                        .trim();

                if (
                    name
                ) {
                    return name;
                }

            }

            if (
                typeof $gameMap
                    .mapId ===
                    'function'
            ) {

                return (
                    'Mapa ' +
                    String(
                        $gameMap
                            .mapId()
                    )
                );

            }

            return '';

        };

    T.getPlayTimeSeconds =
        function() {

            if (
                window
                    .$gameSystem &&
                typeof $gameSystem
                    .playtime ===
                    'function'
            ) {

                return (
                    int0(
                        $gameSystem
                            .playtime()
                    )
                );

            }

            if (
                window
                    .Graphics &&
                isFinite(
                    Number(
                        Graphics
                            .frameCount
                    )
                )
            ) {

                return (
                    Math.max(
                        0,

                        Math.floor(
                            Number(
                                Graphics
                                    .frameCount
                            ) /
                            60
                        )
                    )
                );

            }

            return 0;

        };

    T.buildState =
        function() {

            T.migrateLegacyDex();

            var progress =
                T.getPokemonProgress();

            var gyms =
                T.getGymProgress();

            var user =
                T._user;

            return {

                uid:
                    user
                        ? String(
                            user.uid ||
                            ''
                        )
                        : '',

                name:
                    user
                        ? String(
                            user
                                .displayName ||
                            ''
                        )
                        : '',

                email:
                    user
                        ? String(
                            user.email ||
                            ''
                        )
                        : '',

                avatarName:
                    T.getAvatarName(),

                pokemonCount:
                    Math.min(
                        T.TOTAL_WILD,
                        progress
                            .wild
                            .count
                    ),

                pokemonNames:
                    progress
                        .wild
                        .names,

                pokemonDex:
                    progress
                        .wild
                        .dex,

                eggCount:
                    Math.min(
                        T.TOTAL_EGGS,
                        progress
                            .eggs
                            .count
                    ),

                eggNames:
                    progress
                        .eggs
                        .names,

                eggDex:
                    progress
                        .eggs
                        .dex,

                singularCount:
                    Math.min(
                        T
                            .TOTAL_SINGULARS,

                        progress
                            .singulars
                            .count
                    ),

                singularNames:
                    progress
                        .singulars
                        .names,

                singularDex:
                    progress
                        .singulars
                        .dex,

                gymWins:
                    gyms.count,

                gymWinIds:
                    gyms.ids,

                gymWinNames:
                    gyms.names,

                pokestops:
                    T.getVariable(
                        T
                            .POKESTOPS_VARIABLE_ID
                    ),

                missions:
                    T.getVariable(
                        T
                            .MISSIONS_VARIABLE_ID
                    ),

                mapName:
                    T.getMapName(),

                playTimeSeconds:
                    T.getPlayTimeSeconds()

            };

        };

    // =========================================================
    // FIREBASE
    // =========================================================

    T.loadFirebase =
        function() {

            if (
                window.firebase &&
                firebase.auth &&
                firebase.firestore
            ) {

                return (
                    window
                        .GranadaMonFirebaseReady ||
                    Promise.resolve(
                        firebase
                    )
                );

            }

            if (
                T._loaderPromise
            ) {
                return T._loaderPromise;
            }

            T._loaderPromise =
                new Promise(
                    function(
                        resolve,
                        reject
                    ) {

                        var script =
                            document
                                .querySelector(
                                    'script[data-granadamon-firebase-loader="true"]'
                                );

                        function finish() {

                            if (
                                window
                                    .GranadaMonFirebaseReady
                            ) {

                                window
                                    .GranadaMonFirebaseReady
                                    .then(
                                        resolve
                                    )
                                    .catch(
                                        reject
                                    );

                            }

                            else if (
                                window.firebase &&
                                firebase.auth &&
                                firebase.firestore
                            ) {

                                resolve(
                                    firebase
                                );

                            }

                            else {

                                reject(
                                    new Error(
                                        'Firebase no quedó disponible.'
                                    )
                                );

                            }

                        }

                        if (
                            script
                        ) {

                            if (
                                window
                                    .GranadaMonFirebaseReady ||
                                window.firebase
                            ) {

                                finish();

                            }

                            else {

                                script
                                    .addEventListener(
                                        'load',
                                        finish
                                    );

                                script
                                    .addEventListener(
                                        'error',
                                        function() {

                                            reject(
                                                new Error(
                                                    'No se pudo cargar firebase-loader.js.'
                                                )
                                            );

                                        }
                                    );

                            }

                            return;

                        }

                        script =
                            document
                                .createElement(
                                    'script'
                                );

                        script.src =
                            T.LOADER_PATH;

                        script.async =
                            false;

                        script.setAttribute(
                            'data-granadamon-firebase-loader',
                            'true'
                        );

                        script.onload =
                            finish;

                        script.onerror =
                            function() {

                                reject(
                                    new Error(
                                        'No se encontró ' +
                                        T.LOADER_PATH
                                    )
                                );

                            };

                        document
                            .head
                            .appendChild(
                                script
                            );

                    }
                );

            return (
                T._loaderPromise
            );

        };

    T.init =
        function() {

            if (
                T._initPromise
            ) {
                return T._initPromise;
            }

            T._initPromise =
                T.loadFirebase()

                    .then(
                        function() {

                            var app =
                                firebase.apps &&
                                firebase
                                    .apps
                                    .length

                                    ? firebase
                                        .app()

                                    : firebase
                                        .initializeApp(
                                            T
                                                .FIREBASE_CONFIG
                                        );

                            T._auth =
                                app.auth();

                            T._db =
                                app.firestore();

                            if (
                                T._db &&
                                typeof T._db
                                    .enablePersistence ===
                                    'function'
                            ) {

                                return (
                                    T._db
                                        .enablePersistence({
                                            synchronizeTabs:
                                                true
                                        })

                                        .catch(
                                            function(
                                                error
                                            ) {

                                                warn(
                                                    'Persistencia offline no disponible; se continúa.',
                                                    error &&
                                                    error.code
                                                        ? error.code
                                                        : error
                                                );

                                            }
                                        )
                                );

                            }

                        }
                    )

                    .then(
                        function() {

                            if (
                                !T._auth ||
                                !T._db
                            ) {

                                throw new Error(
                                    'Firebase Auth o Firestore no están disponibles.'
                                );

                            }

                            if (
                                !T._initialized
                            ) {

                                T._initialized =
                                    true;

                                T._auth
                                    .onAuthStateChanged(
                                        function(
                                            user
                                        ) {

                                            T._user =
                                                user ||
                                                null;

                                            if (
                                                T._user
                                            ) {

                                                T.setLoginSwitch(
                                                    true
                                                );

                                                T
                                                    .ensureFirstConnection()

                                                    .catch(
                                                        function(
                                                            error
                                                        ) {

                                                            warn(
                                                                'Primera conexión pendiente.',
                                                                error
                                                            );

                                                        }
                                                    );

                                                T.scheduleSync(
                                                    150
                                                );

                                            }

                                            else {

                                                T.setLoginSwitch(
                                                    false
                                                );

                                            }

                                        }
                                    );

                                T.startAutoSync();

                            }

                            log(
                                'Firebase listo.'
                            );

                            return true;

                        }
                    )

                    .catch(
                        function(
                            error
                        ) {

                            T._initPromise =
                                null;

                            warn(
                                'Error inicializando Firebase.',
                                error
                            );

                            throw error;

                        }
                    );

            return (
                T._initPromise
            );

        };

    T.hasGameObjects =
        function() {

            return !!(
                window
                    .$gameSystem &&

                window
                    .$gameVariables &&

                window
                    .$gameSwitches
            );

        };

    T.setLoginSwitch =
        function(
            value
        ) {

            if (
                window
                    .$gameSwitches
            ) {

                $gameSwitches
                    .setValue(
                        T
                            .LOGIN_SWITCH_ID,

                        value ===
                            true
                    );

            }

        };

    T.playerRef =
        function() {

            if (
                !T._db ||
                !T._user
            ) {
                return null;
            }

            return (
                T._db
                    .collection(
                        'players'
                    )
                    .doc(
                        String(
                            T._user
                                .uid
                        )
                    )
            );

        };

    T.ensureFirstConnection =
        function() {

            if (
                !T._user ||
                !T._db
            ) {

                return (
                    Promise.resolve(
                        false
                    )
                );

            }

            var uid =
                String(
                    T._user
                        .uid
                );

            if (
                T
                    ._firstConnectionCheckedForUid ===
                uid
            ) {

                return (
                    Promise.resolve(
                        true
                    )
                );

            }

            var ref =
                T.playerRef();

            if (
                !ref
            ) {

                return (
                    Promise.resolve(
                        false
                    )
                );

            }

            return (
                ref.get()

                    .then(
                        function(
                            snapshot
                        ) {

                            var data =
                                snapshot.exists
                                    ? snapshot
                                        .data()
                                    : null;

                            if (
                                !snapshot
                                    .exists ||
                                !data ||
                                !data
                                    .firstConnection
                            ) {

                                return (
                                    ref.set(
                                        {

                                            uid:
                                                uid,

                                            name:
                                                String(
                                                    T._user
                                                        .displayName ||
                                                    ''
                                                ),

                                            email:
                                                String(
                                                    T._user
                                                        .email ||
                                                    ''
                                                ),

                                            firstConnection:
                                                firebase
                                                    .firestore
                                                    .FieldValue
                                                    .serverTimestamp()

                                        },

                                        {
                                            merge:
                                                true
                                        }
                                    )

                                    .then(
                                        function() {

                                            T
                                                ._firstConnectionCheckedForUid =
                                                uid;

                                            return true;

                                        }
                                    )
                                );

                            }

                            T
                                ._firstConnectionCheckedForUid =
                                uid;

                            return true;

                        }
                    )
            );

        };

    T.clearRetry =
        function() {

            if (
                T._retryTimer
            ) {

                clearTimeout(
                    T._retryTimer
                );

                T._retryTimer =
                    null;

            }

        };

    T.scheduleRetry =
        function() {

            T.clearRetry();

            var index =
                Math.min(
                    T._retryIndex,
                    T
                        .RETRY_DELAYS
                        .length -
                        1
                );

            var delay =
                T
                    .RETRY_DELAYS[
                        index
                    ];

            T._retryIndex +=
                1;

            T._retryTimer =
                setTimeout(
                    function() {

                        T._retryTimer =
                            null;

                        T.syncNow();

                    },
                    delay
                );

        };

    T.scheduleSync =
        function(
            delay
        ) {

            if (
                T._syncTimer
            ) {

                clearTimeout(
                    T._syncTimer
                );

            }

            T._syncTimer =
                setTimeout(
                    function() {

                        T._syncTimer =
                            null;

                        T.syncNow();

                    },

                    Math.max(
                        0,

                        Number(
                            delay ||
                            0
                        )
                    )
                );

        };

    T.markDirty =
        function() {

            T.scheduleSync(
                T
                    .DEBOUNCE_MS
            );

        };

    T.syncNow =
        function() {

            if (
                T._syncInFlight
            ) {

                T.scheduleSync(
                    1000
                );

                return (
                    Promise.resolve(
                        false
                    )
                );

            }

            return (
                T.init()

                    .then(
                        function() {

                            if (
                                !T._user ||
                                !T._db ||
                                !T
                                    .hasGameObjects()
                            ) {
                                return false;
                            }

                            var ref =
                                T.playerRef();

                            if (
                                !ref
                            ) {
                                return false;
                            }

                            var data =
                                T.buildState();

                            data.updatedAt =
                                firebase
                                    .firestore
                                    .FieldValue
                                    .serverTimestamp();

                            T._syncInFlight =
                                true;

                            return (
                                ref.set(
                                    data,
                                    {
                                        merge:
                                            true
                                    }
                                )

                                .then(
                                    function() {

                                        T._syncInFlight =
                                            false;

                                        T._retryIndex =
                                            0;

                                        T.clearRetry();

                                        log(
                                            'Sync:',
                                            data.avatarName,
                                            data.pokemonCount +
                                                '/85',
                                            data.eggCount +
                                                '/9',
                                            data.singularCount +
                                                '/6',
                                            data.gymWins +
                                                '/8'
                                        );

                                        return true;

                                    }
                                )

                                .catch(
                                    function(
                                        error
                                    ) {

                                        T._syncInFlight =
                                            false;

                                        warn(
                                            'No se pudo sincronizar. Se reintentará.',
                                            error
                                        );

                                        T.scheduleRetry();

                                        return false;

                                    }
                                )
                            );

                        }
                    )

                    .catch(
                        function(
                            error
                        ) {

                            warn(
                                'Firebase todavía no está disponible. Se reintentará.',
                                error
                            );

                            T.scheduleRetry();

                            return false;

                        }
                    )
            );

        };

    T.startAutoSync =
        function() {

            if (
                T._autoInterval
            ) {
                return;
            }

            T._autoInterval =
                setInterval(
                    function() {

                        if (
                            T._user &&
                            T
                                .hasGameObjects()
                        ) {

                            T.syncNow();

                        }

                    },

                    T
                        .AUTO_SYNC_MS
                );

        };

    // =========================================================
    // LOGIN
    // =========================================================

    T.isLoginBlocking =
        function() {

            return (
                T._loginBlocking ===
                true
            );

        };

    T.removeLoginOverlay =
        function() {

            if (
                T._overlay &&
                T._overlay
                    .parentNode
            ) {

                T._overlay
                    .parentNode
                    .removeChild(
                        T._overlay
                    );

            }

            T._overlay =
                null;

            T._loginButton =
                null;

            T._loginStatus =
                null;

        };

    T.loginErrorText =
        function(
            error
        ) {

            var code =
                error &&
                error.code
                    ? String(
                        error.code
                    )
                    : '';

            if (
                code ===
                'auth/popup-closed-by-user'
            ) {

                return (
                    'No se completó el inicio de sesión. Pulsa el botón para intentarlo de nuevo.'
                );

            }

            if (
                code ===
                'auth/popup-blocked'
            ) {

                return (
                    'El navegador bloqueó la ventana de Google. Permite ventanas emergentes y vuelve a intentarlo.'
                );

            }

            if (
                code ===
                'auth/unauthorized-domain'
            ) {

                return (
                    'Este dominio no está autorizado en Firebase Authentication.'
                );

            }

            if (
                code ===
                'auth/network-request-failed'
            ) {

                return (
                    'No hay conexión con Google. Comprueba Internet y vuelve a intentarlo.'
                );

            }

            return (
                'No se pudo iniciar sesión. Vuelve a intentarlo.'
            );

        };

    T.createLoginOverlay =
        function() {

            T.removeLoginOverlay();

            var overlay =
                document
                    .createElement(
                        'div'
                    );

            overlay.id =
                'granadamon-google-login';

            overlay.style.cssText =
                'position:fixed;' +
                'left:0;' +
                'top:0;' +
                'width:100%;' +
                'height:100%;' +
                'z-index:999999;' +
                'display:flex;' +
                'align-items:center;' +
                'justify-content:center;' +
                'background:rgba(5,10,20,.88);' +
                'font-family:Arial,sans-serif;' +
                'box-sizing:border-box';

            var panel =
                document
                    .createElement(
                        'div'
                    );

            panel.style.cssText =
                'width:520px;' +
                'max-width:calc(100% - 40px);' +
                'padding:34px 32px;' +
                'border-radius:18px;' +
                'background:linear-gradient(180deg,#17233d 0%,#0d1425 100%);' +
                'border:1px solid rgba(255,255,255,.16);' +
                'box-shadow:0 24px 70px rgba(0,0,0,.55);' +
                'text-align:center;' +
                'color:#fff;' +
                'box-sizing:border-box';

            var title =
                document
                    .createElement(
                        'div'
                    );

            title.textContent =
                'POKÉMON GRANADA';

            title.style.cssText =
                'font-size:28px;' +
                'font-weight:800;' +
                'letter-spacing:2px;' +
                'margin-bottom:10px';

            var subtitle =
                document
                    .createElement(
                        'div'
                    );

            subtitle.textContent =
                'Identifica tu partida';

            subtitle.style.cssText =
                'font-size:18px;' +
                'font-weight:600;' +
                'margin-bottom:14px';

            var info =
                document
                    .createElement(
                        'div'
                    );

            info.textContent =
                'Inicia sesión con Google para guardar automáticamente tu progreso de Pokémon Granada.';

            info.style.cssText =
                'font-size:14px;' +
                'line-height:1.5;' +
                'opacity:.86;' +
                'margin:0 auto 22px auto;' +
                'max-width:420px';

            var button =
                document
                    .createElement(
                        'button'
                    );

            button.type =
                'button';

            button.textContent =
                'Preparando conexión...';

            button.disabled =
                true;

            button.style.cssText =
                'width:100%;' +
                'max-width:330px;' +
                'padding:14px 18px;' +
                'border:0;' +
                'border-radius:10px;' +
                'background:#fff;' +
                'color:#182033;' +
                'font-size:16px;' +
                'font-weight:700;' +
                'cursor:default;' +
                'opacity:.65;' +
                'box-shadow:0 8px 22px rgba(0,0,0,.22)';

            var status =
                document
                    .createElement(
                        'div'
                    );

            status.textContent =
                'Se registrarán tu nombre, correo y progreso del juego.';

            status.style.cssText =
                'min-height:36px;' +
                'margin-top:18px;' +
                'font-size:12px;' +
                'line-height:1.45;' +
                'opacity:.7';

            panel.appendChild(
                title
            );

            panel.appendChild(
                subtitle
            );

            panel.appendChild(
                info
            );

            panel.appendChild(
                button
            );

            panel.appendChild(
                status
            );

            overlay.appendChild(
                panel
            );

            document
                .body
                .appendChild(
                    overlay
                );

            T._overlay =
                overlay;

            T._loginButton =
                button;

            T._loginStatus =
                status;

            button
                .addEventListener(
                    'click',
                    function() {

                        if (
                            !T._auth
                        ) {
                            return;
                        }

                        button.disabled =
                            true;

                        button.style.cursor =
                            'default';

                        button.style.opacity =
                            '.65';

                        status.textContent =
                            'Abriendo Google...';

                        var provider =
                            new firebase
                                .auth
                                .GoogleAuthProvider();

                        provider
                            .setCustomParameters({
                                prompt:
                                    'select_account'
                            });

                        T._auth
                            .signInWithPopup(
                                provider
                            )

                            .then(
                                function(
                                    result
                                ) {

                                    var user =
                                        result &&
                                        result.user
                                            ? result.user
                                            : T._auth
                                                .currentUser;

                                    if (
                                        !user
                                    ) {

                                        throw new Error(
                                            'Google no devolvió un usuario válido.'
                                        );

                                    }

                                    T._user =
                                        user;

                                    T.setLoginSwitch(
                                        true
                                    );

                                    T._loginBlocking =
                                        false;

                                    T
                                        .ensureFirstConnection()

                                        .catch(
                                            function(
                                                error
                                            ) {

                                                warn(
                                                    'Primera conexión pendiente.',
                                                    error
                                                );

                                            }
                                        );

                                    T.scheduleSync(
                                        100
                                    );

                                    T.removeLoginOverlay();

                                }
                            )

                            .catch(
                                function(
                                    error
                                ) {

                                    warn(
                                        'Inicio de sesión no completado.',
                                        error
                                    );

                                    button.disabled =
                                        false;

                                    button.style.cursor =
                                        'pointer';

                                    button.style.opacity =
                                        '1';

                                    status.textContent =
                                        T.loginErrorText(
                                            error
                                        );

                                    T._loginBlocking =
                                        true;

                                }
                            );

                    }
                );

        };

    T.showLogin =
        function() {

            T._loginBlocking =
                true;

            T.createLoginOverlay();

            T.init()

                .then(
                    function() {

                        if (
                            T._auth &&
                            T._auth
                                .currentUser
                        ) {

                            T._user =
                                T._auth
                                    .currentUser;

                            T.setLoginSwitch(
                                true
                            );

                            T._loginBlocking =
                                false;

                            T.removeLoginOverlay();

                            T.scheduleSync(
                                100
                            );

                            return;

                        }

                        T.setLoginSwitch(
                            false
                        );

                        if (
                            !T._loginButton
                        ) {
                            return;
                        }

                        T._loginButton.disabled =
                            false;

                        T._loginButton.textContent =
                            'Continuar con Google';

                        T._loginButton.style.cursor =
                            'pointer';

                        T._loginButton.style.opacity =
                            '1';

                    }
                )

                .catch(
                    function(
                        error
                    ) {

                        warn(
                            'Firebase no está disponible.',
                            error
                        );

                        if (
                            T._loginButton
                        ) {

                            T._loginButton.textContent =
                                'No se pudo conectar';

                            T._loginButton.disabled =
                                true;

                        }

                        if (
                            T._loginStatus
                        ) {

                            T._loginStatus.textContent =
                                'Comprueba la conexión a Internet y recarga el juego.';

                        }

                    }
                );

        };

    T.logout =
        function() {

            return (
                T.init()

                    .then(
                        function() {

                            if (
                                !T._auth
                            ) {
                                return false;
                            }

                            return (
                                T._auth
                                    .signOut()
                            );

                        }
                    )

                    .then(
                        function() {

                            T._user =
                                null;

                            T
                                ._firstConnectionCheckedForUid =
                                null;

                            T.setLoginSwitch(
                                false
                            );

                            return true;

                        }
                    )

                    .catch(
                        function(
                            error
                        ) {

                            warn(
                                'No se pudo cerrar sesión.',
                                error
                            );

                            return false;

                        }
                    )
            );

        };

    // =========================================================
    // CAPTURAS REALES
    // =========================================================

    if (
        GM.CaptureOnly &&
        typeof GM
            .CaptureOnly
            .storePokemon ===
            'function'
    ) {

        var _GM_CaptureOnly_storePokemon =
            GM
                .CaptureOnly
                .storePokemon;

        GM
            .CaptureOnly
            .storePokemon =
            function(
                pokemon
            ) {

                var destination =
                    _GM_CaptureOnly_storePokemon
                        .call(
                            GM.CaptureOnly,
                            pokemon
                        );

                if (
                    destination &&
                    pokemon &&
                    pokemon
                        .speciesId
                ) {

                    T.recordPokemon(
                        pokemon
                            .speciesId,
                        'CAPTURE'
                    );

                    T.scheduleSync(
                        250
                    );

                }

                return destination;

            };

    }

    else {

        warn(
            'No se encontró GM.CaptureOnly.storePokemon. Telemetry debe estar debajo de CaptureOnly.'
        );

    }

    // Refuerzo para el sistema de captura dentro del combate.
    if (
        GM.Capture &&
        typeof GM
            .Capture
            .storeCapturedPokemon ===
            'function'
    ) {

        var _GM_Capture_storeCapturedPokemon =
            GM
                .Capture
                .storeCapturedPokemon;

        GM
            .Capture
            .storeCapturedPokemon =
            function(
                pokemon
            ) {

                var destination =
                    _GM_Capture_storeCapturedPokemon
                        .call(
                            GM.Capture,
                            pokemon
                        );

                if (
                    destination &&
                    pokemon &&
                    pokemon
                        .speciesId
                ) {

                    T.recordPokemon(
                        pokemon
                            .speciesId,
                        'CAPTURE'
                    );

                    T.scheduleSync(
                        250
                    );

                }

                return destination;

            };

    }

    // =========================================================
    // HUEVOS Y SINGULARES
    // =========================================================

    if (
        typeof GM
            .markCaught ===
            'function'
    ) {

        var _GM_markCaught =
            GM.markCaught;

        GM.markCaught =
            function(
                nationalDex
            ) {

                var result =
                    _GM_markCaught
                        .call(
                            GM,
                            nationalDex
                        );

                if (
                    result
                ) {

                    var category =
                        T.categoryForSpecies(
                            T.getSpecies(
                                nationalDex
                            )
                        );

                    if (
                        category ===
                            'EGG' ||
                        category ===
                            'SINGULAR'
                    ) {

                        T.recordPokemon(
                            nationalDex,
                            'OBTAINED'
                        );

                    }

                }

                return result;

            };

    }

    if (
        typeof GM
            .addPokemon ===
            'function'
    ) {

        var _GM_addPokemon =
            GM.addPokemon;

        GM.addPokemon =
            function(
                nationalDex,
                level
            ) {

                var pokemon =
                    _GM_addPokemon
                        .call(
                            GM,
                            nationalDex,
                            level
                        );

                if (
                    pokemon
                ) {

                    var category =
                        T.categoryForSpecies(
                            T.getSpecies(
                                nationalDex
                            )
                        );

                    if (
                        category ===
                            'EGG' ||
                        category ===
                            'SINGULAR'
                    ) {

                        T.recordPokemon(
                            nationalDex,
                            'OBTAINED'
                        );

                    }

                }

                return pokemon;

            };

    }

    // =========================================================
    // NOMBRE DEL AVATAR
    // =========================================================

    if (
        window
            .Game_Actor &&
        Game_Actor
            .prototype
            .setName
    ) {

        var _Game_Actor_setName =
            Game_Actor
                .prototype
                .setName;

        Game_Actor
            .prototype
            .setName =
            function(
                name
            ) {

                _Game_Actor_setName
                    .call(
                        this,
                        name
                    );

                var actorId =
                    this.actorId
                        ? this
                            .actorId()
                        : this
                            ._actorId;

                if (
                    Number(
                        actorId
                    ) ===
                    T
                        .AVATAR_ACTOR_ID
                ) {

                    T.scheduleSync(
                        300
                    );

                }

            };

    }

    // =========================================================
    // VARIABLES / SAVE / MAPA
    // =========================================================

    var _Game_Variables_setValue =
        Game_Variables
            .prototype
            .setValue;

    Game_Variables
        .prototype
        .setValue =
        function(
            variableId,
            value
        ) {

            _Game_Variables_setValue
                .call(
                    this,
                    variableId,
                    value
                );

            if (
                variableId ===
                    T
                        .GYM_WINS_VARIABLE_ID ||

                variableId ===
                    T
                        .POKESTOPS_VARIABLE_ID ||

                variableId ===
                    T
                        .MISSIONS_VARIABLE_ID
            ) {

                T.markDirty();

            }

        };

    var _Game_System_initialize =
        Game_System
            .prototype
            .initialize;

    Game_System
        .prototype
        .initialize =
        function() {

            _Game_System_initialize
                .call(
                    this
                );

            this
                ._granadaMonTelemetry =
                this
                    ._granadaMonTelemetry ||
                {

                    version:
                        2,

                    capturedWild:
                        {},

                    eggs:
                        {},

                    singulars:
                        {},

                    gyms:
                        {},

                    legacyMigrated:
                        false

                };

        };

    var _DataManager_extractSaveContents =
        DataManager
            .extractSaveContents;

    DataManager
        .extractSaveContents =
        function(
            contents
        ) {

            _DataManager_extractSaveContents
                .call(
                    this,
                    contents
                );

            T.ensureRegistry();

            T.migrateLegacyDex();

            T.setLoginSwitch(
                !!T._user
            );

            T.scheduleSync(
                700
            );

        };

    var _Game_Map_setup =
        Game_Map
            .prototype
            .setup;

    Game_Map
        .prototype
        .setup =
        function(
            mapId
        ) {

            _Game_Map_setup
                .call(
                    this,
                    mapId
                );

            T.scheduleSync(
                900
            );

        };

    var _Game_System_onBeforeSave =
        Game_System
            .prototype
            .onBeforeSave;

    Game_System
        .prototype
        .onBeforeSave =
        function() {

            _Game_System_onBeforeSave
                .call(
                    this
                );

            T.scheduleSync(
                100
            );

        };

    // =========================================================
    // COMANDOS
    // =========================================================

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter
            .prototype
            .pluginCommand;

    Game_Interpreter
        .prototype
        .pluginCommand =
        function(
            command,
            args
        ) {

            _Game_Interpreter_pluginCommand
                .call(
                    this,
                    command,
                    args
                );

            var cmd =
                String(
                    command ||
                    ''
                )
                    .toLowerCase();

            var sub =
                args &&
                args.length
                    ? String(
                        args[0] ||
                        ''
                    )
                        .toLowerCase()
                    : '';

            if (
                cmd ===
                'granadamonlogin'
            ) {

                T.showLogin();

                this.setWaitMode(
                    'granadamonGoogleLogin'
                );

                return;

            }

            if (
                cmd ===
                'granadamongymwin'
            ) {

                T.recordGymWin(

                    args &&
                    args.length
                        ? args[0]
                        : '',

                    joinArgs(
                        args ||
                        [],
                        1
                    )

                );

                return;

            }

            if (
                cmd ===
                'granadamontelemetry'
            ) {

                if (
                    sub ===
                    'login'
                ) {

                    T.showLogin();

                    this.setWaitMode(
                        'granadamonGoogleLogin'
                    );

                }

                else if (
                    sub ===
                    'sync'
                ) {

                    T.syncNow();

                }

                else if (
                    sub ===
                    'logout'
                ) {

                    T.logout();

                }

                else if (
                    sub ===
                    'debug'
                ) {

                    log(
                        'DEBUG:',
                        T.buildState()
                    );

                }

            }

        };

    var _Game_Interpreter_updateWaitMode =
        Game_Interpreter
            .prototype
            .updateWaitMode;

    Game_Interpreter
        .prototype
        .updateWaitMode =
        function() {

            if (
                this
                    ._waitMode ===
                'granadamonGoogleLogin'
            ) {

                if (
                    T
                        .isLoginBlocking()
                ) {
                    return true;
                }

                this._waitMode =
                    '';

                return false;

            }

            return (
                _Game_Interpreter_updateWaitMode
                    .call(
                        this
                    )
            );

        };

    window
        .addEventListener(
            'online',
            function() {

                if (
                    T._user
                ) {

                    T.scheduleSync(
                        250
                    );

                }

            }
        );

    document
        .addEventListener(
            'visibilitychange',
            function() {

                if (
                    !document.hidden &&
                    T._user
                ) {

                    T.scheduleSync(
                        500
                    );

                }

            }
        );

    setTimeout(
        function() {

            T.init()

                .catch(
                    function(
                        error
                    ) {

                        warn(
                            'Firebase se preparará de nuevo cuando haga falta.',
                            error
                        );

                    }
                );

        },
        100
    );

    console.log(
        'GranadaMon Telemetry v2.0 cargado.'
    );

})();