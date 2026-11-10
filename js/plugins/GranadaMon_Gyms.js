/*:
 * @plugindesc v4.0 GranadaMon - 8 gimnasios sin nombres + sin EXP de combate
 * @author OpenAI
 *
 * @help
 * GranadaMon_Gyms.js
 * ------------------------------------------------------------
 *
 * REGLAS DEFINITIVAS:
 *
 * - 8 gimnasios.
 * - Ningún gimnasio tiene nombre visible.
 * - Ningún líder tiene nombre ni número visible.
 * - En combate se identifica únicamente como "Entrenador".
 * - Si pierdes puedes repetir.
 * - Si ganas queda superado.
 * - Cada gimnasio cuenta una sola vez.
 * - La única recompensa es 1 MEDALLA.
 *
 * MUY IMPORTANTE:
 *
 * LOS COMBATES NO DAN EXPERIENCIA.
 *
 * - Combate salvaje: 0 EXP.
 * - Combate entrenador: 0 EXP.
 * - Gimnasio: 0 EXP.
 *
 * La única forma de subir de nivel es mediante CARAMELOS.
 *
 * NO se elimina GM.gainExp porque GranadaMon_Bag utiliza
 * internamente el sistema de experiencia para hacer que
 * un Caramelo aumente exactamente +1 nivel.
 *
 * VARIABLES:
 *
 * #0113 = Gimnasios ganados
 *
 * COMANDOS:
 *
 * GranadaMonGym 1
 * GranadaMonGym 2
 * GranadaMonGym 3
 * GranadaMonGym 4
 * GranadaMonGym 5
 * GranadaMonGym 6
 * GranadaMonGym 7
 * GranadaMonGym 8
 *
 * Reset de pruebas:
 *
 * GranadaMonGymReset 1
 *
 */

(function() {

    'use strict';


    // =========================================================
    // GRANADAMON
    // =========================================================

    window.GranadaMon =
        window.GranadaMon ||
        {};


    var GM =
        window.GranadaMon;


    GM.Gyms =
        GM.Gyms ||
        {};


    var G =
        GM.Gyms;


    G.VERSION =
        '4.0';


    G.TOTAL =
        8;


    G.GYM_VARIABLE_ID =
        113;


    G._activeGymNumber =
        null;


    G._activeEventContext =
        null;


    // =========================================================
    // REGLA GLOBAL:
    // LOS COMBATES NO DAN EXPERIENCIA
    // =========================================================
    //
    // IMPORTANTE:
    //
    // NO tocamos GM.gainExp.
    //
    // GranadaMon_Bag necesita GM.gainExp para que el
    // Caramelo pueda llevar al Pokémon exactamente
    // al siguiente nivel.
    //
    // Lo que anulamos son exclusivamente las funciones
    // que entregan EXP después de los combates.
    //
    // =========================================================


    if (
        GM.BattleClassic
    ) {

        GM.BattleClassic
            .awardVictoryExp =
            function() {

                return [];

            };

    }


    if (
        GM.BattlePremium
    ) {

        GM.BattlePremium
            .awardTrainerExp =
            function() {

                return [];

            };

    }


    // =========================================================
    // DATOS DE LOS 8 GIMNASIOS
    // =========================================================
    //
    // gd = GranadaDex.
    //
    // NO HAY NOMBRES VISIBLES.
    //
    // "Entrenador" es únicamente la etiqueta genérica
    // necesaria para BattlePremium.
    //
    // No aparece:
    //
    // - Líder 1
    // - Líder 2
    // - Gimnasio 1
    // - Gimnasio 2
    // - Alhambra
    // - Albaicín
    // - Genil
    // etc.
    //
    // IDs GYM_01...GYM_08 son INTERNOS.
    //
    // =========================================================


    G.DATA = {


        // =====================================================
        // GIMNASIO INTERNO 01
        // AS NV.12
        // =====================================================

        1: {

            id:
                'GYM_01',

            trainerLabel:
                'Entrenador',

            theme:
                'Volador',

            recommendedLevel:
                10,

            aceLevel:
                12,

            team: [

                {
                    gd: 55,
                    level: 10
                },

                {
                    gd: 2,
                    level: 12
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 02
        // AS NV.20
        // =====================================================

        2: {

            id:
                'GYM_02',

            trainerLabel:
                'Entrenador',

            theme:
                'Roca / Acero',

            recommendedLevel:
                17,

            aceLevel:
                20,

            team: [

                {
                    gd: 25,
                    level: 16
                },

                {
                    gd: 34,
                    level: 18
                },

                {
                    gd: 26,
                    level: 20
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 03
        // AS NV.28
        // =====================================================

        3: {

            id:
                'GYM_03',

            trainerLabel:
                'Entrenador',

            theme:
                'Agua',

            recommendedLevel:
                24,

            aceLevel:
                28,

            team: [

                {
                    gd: 47,
                    level: 23
                },

                {
                    gd: 44,
                    level: 25
                },

                {
                    gd: 69,
                    level: 28
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 04
        // AS NV.36
        // =====================================================

        4: {

            id:
                'GYM_04',

            trainerLabel:
                'Entrenador',

            theme:
                'Eléctrico',

            recommendedLevel:
                31,

            aceLevel:
                36,

            team: [

                {
                    gd: 20,
                    level: 30
                },

                {
                    gd: 59,
                    level: 32
                },

                {
                    gd: 5,
                    level: 34
                },

                {
                    gd: 60,
                    level: 36
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 05
        // AS NV.44
        // =====================================================

        5: {

            id:
                'GYM_05',

            trainerLabel:
                'Entrenador',

            theme:
                'Fantasma / Siniestro',

            recommendedLevel:
                39,

            aceLevel:
                44,

            team: [

                {
                    gd: 41,
                    level: 38
                },

                {
                    gd: 50,
                    level: 40
                },

                {
                    gd: 78,
                    level: 42
                },

                {
                    gd: 42,
                    level: 44
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 06
        // AS NV.52
        // =====================================================

        6: {

            id:
                'GYM_06',

            trainerLabel:
                'Entrenador',

            theme:
                'Lucha / Acero',

            recommendedLevel:
                47,

            aceLevel:
                52,

            team: [

                {
                    gd: 11,
                    level: 46
                },

                {
                    gd: 57,
                    level: 48
                },

                {
                    gd: 98,
                    level: 50
                },

                {
                    gd: 83,
                    level: 51
                },

                {
                    gd: 90,
                    level: 52
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 07
        // AS NV.60
        // =====================================================

        7: {

            id:
                'GYM_07',

            trainerLabel:
                'Entrenador',

            theme:
                'Hielo / Dragón',

            recommendedLevel:
                55,

            aceLevel:
                60,

            team: [

                {
                    gd: 32,
                    level: 54
                },

                {
                    gd: 80,
                    level: 56
                },

                {
                    gd: 100,
                    level: 58
                },

                {
                    gd: 85,
                    level: 59
                },

                {
                    gd: 33,
                    level: 60
                }

            ]

        },


        // =====================================================
        // GIMNASIO INTERNO 08
        // AS NV.68
        // =====================================================

        8: {

            id:
                'GYM_08',

            trainerLabel:
                'Entrenador',

            theme:
                'Mixto',

            recommendedLevel:
                63,

            aceLevel:
                68,

            team: [

                {
                    gd: 72,
                    level: 62
                },

                {
                    gd: 62,
                    level: 63
                },

                {
                    gd: 6,
                    level: 64
                },

                {
                    gd: 65,
                    level: 65
                },

                {
                    gd: 89,
                    level: 66
                },

                {
                    gd: 93,
                    level: 68
                }

            ]

        }

    };


    // =========================================================
    // ESTADO PERSISTENTE
    // =========================================================

    G.ensureState =
        function() {

            if (
                !window.$gameSystem
            ) {

                return null;

            }


            if (
                !$gameSystem
                    ._granadaMonGyms
            ) {

                $gameSystem
                    ._granadaMonGyms = {

                        wins: {}

                    };

            }


            $gameSystem
                ._granadaMonGyms
                .wins =

                $gameSystem
                    ._granadaMonGyms
                    .wins ||

                {};


            return (
                $gameSystem
                    ._granadaMonGyms
            );

        };


    // =========================================================
    // INICIALIZAR
    // =========================================================

    var _G_Game_System_initialize =
        Game_System
            .prototype
            .initialize;


    Game_System
        .prototype
        .initialize =
        function() {

            _G_Game_System_initialize
                .call(
                    this
                );


            this
                ._granadaMonGyms =

                this
                    ._granadaMonGyms ||

                {

                    wins: {}

                };

        };


    // =========================================================
    // OBTENER GIMNASIO
    // =========================================================

    G.getGym =
        function(
            number
        ) {

            number =
                Math.floor(
                    Number(
                        number ||
                        0
                    )
                );


            return (
                G.DATA[
                    number
                ] ||
                null
            );

        };


    // =========================================================
    // MENSAJE
    // =========================================================

    G.message =
        function(
            text
        ) {

            if (
                window.$gameMessage
            ) {

                $gameMessage
                    .add(
                        String(
                            text ||
                            ''
                        )
                    );

            }

        };


    // =========================================================
    // ¿COMPLETADO?
    // =========================================================

    G.isCompleted =
        function(
            number
        ) {

            var gym =
                G.getGym(
                    number
                );


            if (
                !gym
            ) {

                return false;

            }


            // -------------------------------------------------
            // TELEMETRY
            // -------------------------------------------------

            if (

                window.$gameSystem &&

                $gameSystem
                    ._granadaMonTelemetry &&

                $gameSystem
                    ._granadaMonTelemetry
                    .gyms &&

                $gameSystem
                    ._granadaMonTelemetry
                    .gyms[
                        gym.id
                    ]

            ) {

                return true;

            }


            // -------------------------------------------------
            // ESTADO PROPIO
            // -------------------------------------------------

            var state =
                G.ensureState();


            return !!(

                state &&

                state.wins &&

                state.wins[
                    gym.id
                ]

            );

        };


    // =========================================================
    // CREAR EQUIPO RIVAL
    // =========================================================

    G.buildTrainerTeam =
        function(
            gym
        ) {

            var result =
                [];


            if (
                !gym ||
                !gym.team
            ) {

                return result;

            }


            for (

                var i = 0;

                i <
                gym.team.length;

                i++

            ) {

                var entry =
                    gym.team[
                        i
                    ];


                var species =

                    GM
                        .getSpeciesByGranadaDex

                        ? GM
                            .getSpeciesByGranadaDex(
                                entry.gd
                            )

                        : null;


                if (
                    !species
                ) {

                    continue;

                }


                result.push({

                    nationalDex:
                        Number(
                            species
                                .nationalDex ||
                            0
                        ),

                    level:
                        Math.max(

                            1,

                            Math.floor(
                                Number(
                                    entry
                                        .level ||
                                    1
                                )
                            )

                        )

                });

            }


            return result;

        };


    // =========================================================
    // CONTEXTO DEL EVENTO
    // =========================================================

    G.buildEventContext =
        function(
            interpreter
        ) {

            return {

                mapId:

                    window.$gameMap

                        ? Number(
                            $gameMap
                                .mapId() ||
                            0
                          )

                        : 0,


                eventId:

                    interpreter

                        ? Number(
                            interpreter
                                ._eventId ||
                            0
                          )

                        : 0

            };

        };


    // =========================================================
    // SELF SWITCH A
    // =========================================================

    G.setEventCompleted =
        function(
            context
        ) {

            if (

                !context ||

                !context.mapId ||

                !context.eventId ||

                !window
                    .$gameSelfSwitches

            ) {

                return;

            }


            $gameSelfSwitches
                .setValue(

                    [

                        Number(
                            context
                                .mapId
                        ),

                        Number(
                            context
                                .eventId
                        ),

                        'A'

                    ],

                    true

                );

        };


    // =========================================================
    // INICIAR COMBATE
    // =========================================================

    G.startBattle =
        function(
            number,
            interpreter
        ) {

            var gym =
                G.getGym(
                    number
                );


            if (
                !gym
            ) {

                G.message(
                    'Este combate no está disponible.'
                );

                return false;

            }


            // -------------------------------------------------
            // YA SUPERADO
            // -------------------------------------------------

            if (
                G.isCompleted(
                    number
                )
            ) {

                G.message(
                    'Ya has superado este gimnasio.'
                );

                return false;

            }


            // -------------------------------------------------
            // COMPROBAR SISTEMA DE COMBATE
            // -------------------------------------------------

            if (

                !GM
                    .BattlePremium ||

                typeof GM
                    .BattlePremium
                    .startTrainerBattle !==
                    'function'

            ) {

                G.message(
                    'El sistema de combate no está disponible.'
                );

                return false;

            }


            // -------------------------------------------------
            // CREAR EQUIPO
            // -------------------------------------------------

            var team =
                G.buildTrainerTeam(
                    gym
                );


            if (
                team.length !==
                gym.team.length
            ) {

                G.message(
                    'No se ha podido preparar el combate.'
                );

                return false;

            }


            // -------------------------------------------------
            // CONTEXTO
            // -------------------------------------------------

            var context =
                G.buildEventContext(
                    interpreter
                );


            // -------------------------------------------------
            // SEGURIDAD SELF SWITCH
            // -------------------------------------------------

            if (

                context.mapId &&

                context.eventId &&

                window
                    .$gameSelfSwitches &&

                $gameSelfSwitches
                    .value(

                        [

                            context
                                .mapId,

                            context
                                .eventId,

                            'A'

                        ]

                    )

            ) {

                G.message(
                    'Ya has superado este gimnasio.'
                );

                return false;

            }


            // -------------------------------------------------
            // GUARDAR CONTEXTO
            // -------------------------------------------------

            G._activeGymNumber =
                Number(
                    number
                );


            G._activeEventContext =
                context;


            // -------------------------------------------------
            // COMBATE
            // -------------------------------------------------
            //
            // Siempre usamos exactamente la misma etiqueta.
            //
            // No hay:
            //
            // Entrenador 1
            // Entrenador 2
            // Líder 1
            // etc.
            //
            // -------------------------------------------------

            var started =

                GM
                    .BattlePremium
                    .startTrainerBattle(

                        gym
                            .trainerLabel,

                        team,

                        context

                    );


            if (
                !started
            ) {

                G._activeGymNumber =
                    null;


                G._activeEventContext =
                    null;

            }


            return !!started;

        };


    // =========================================================
    // DAR MEDALLA
    // =========================================================

    G.giveBadge =
        function() {

            if (
                typeof GM
                    .gainItem ===
                    'function'
            ) {

                GM.gainItem(
                    'GYM_BADGE',
                    1
                );


                return true;

            }


            console.warn(
                '[GranadaMon Gyms] No se pudo entregar GYM_BADGE.'
            );


            return false;

        };


    // =========================================================
    // VARIABLE #113
    // =========================================================

    G.updateGymVariableFallback =
        function() {

            if (
                !window
                    .$gameVariables
            ) {

                return;

            }


            var state =
                G.ensureState();


            if (
                !state
            ) {

                return;

            }


            var count =
                0;


            for (
                var key in
                state.wins
            ) {

                if (

                    Object
                        .prototype
                        .hasOwnProperty
                        .call(
                            state.wins,
                            key
                        ) &&

                    state
                        .wins[
                            key
                        ]

                ) {

                    count++;

                }

            }


            $gameVariables
                .setValue(

                    G
                        .GYM_VARIABLE_ID,

                    Math.min(
                        G.TOTAL,
                        count
                    )

                );

        };


    // =========================================================
    // VICTORIA
    // =========================================================

    G.completeGym =
        function(
            number
        ) {

            var gym =
                G.getGym(
                    number
                );


            if (
                !gym
            ) {

                return false;

            }


            // -------------------------------------------------
            // NO DUPLICAR
            // -------------------------------------------------

            if (
                G.isCompleted(
                    number
                )
            ) {

                return false;

            }


            // -------------------------------------------------
            // GUARDAR VICTORIA
            // -------------------------------------------------

            var state =
                G.ensureState();


            if (
                state
            ) {

                state
                    .wins[
                        gym.id
                    ] =
                    true;

            }


            // -------------------------------------------------
            // TELEMETRY
            // -------------------------------------------------
            //
            // gym.id es un identificador interno.
            //
            // No se muestra al jugador.
            //
            // -------------------------------------------------

            if (

                GM.Telemetry &&

                typeof GM
                    .Telemetry
                    .recordGymWin ===
                    'function'

            ) {

                GM
                    .Telemetry
                    .recordGymWin(

                        gym.id,

                        gym.id

                    );

            }


            // -------------------------------------------------
            // FALLBACK VARIABLE
            // -------------------------------------------------

            else {

                G.updateGymVariableFallback();

            }


            // -------------------------------------------------
            // EVENTO COMPLETADO
            // -------------------------------------------------

            G.setEventCompleted(
                G
                    ._activeEventContext
            );


            // -------------------------------------------------
            // ÚNICA RECOMPENSA
            // -------------------------------------------------

            G.giveBadge();


            // -------------------------------------------------
            // FIREBASE
            // -------------------------------------------------

            if (

                GM.Telemetry &&

                typeof GM
                    .Telemetry
                    .scheduleSync ===
                    'function'

            ) {

                GM
                    .Telemetry
                    .scheduleSync(
                        200
                    );

            }


            console.log(
                '[GranadaMon Gyms] Gimnasio completado. Recompensa: 1 medalla. EXP: 0.'
            );


            return true;

        };


    // =========================================================
    // DETECTAR VICTORIA REAL
    // =========================================================

    if (

        GM.BattlePremium &&

        typeof GM
            .BattlePremium
            .resolveTrainerEvent ===
            'function'

    ) {

        var _G_resolveTrainerEvent =

            GM
                .BattlePremium
                .resolveTrainerEvent;


        GM
            .BattlePremium
            .resolveTrainerEvent =
            function() {

                var gymNumber =
                    G
                        ._activeGymNumber;


                var result =

                    _G_resolveTrainerEvent
                        .apply(
                            this,
                            arguments
                        );


                if (
                    gymNumber
                ) {

                    G.completeGym(
                        gymNumber
                    );

                }


                G._activeGymNumber =
                    null;


                G._activeEventContext =
                    null;


                return result;

            };

    }


    // =========================================================
    // FINALIZAR ESCENA
    // =========================================================

    if (

        typeof Scene_GranadaMonBattle !==
            'undefined' &&

        Scene_GranadaMonBattle
            .prototype
            .terminate

    ) {

        var _G_Scene_terminate =

            Scene_GranadaMonBattle
                .prototype
                .terminate;


        Scene_GranadaMonBattle
            .prototype
            .terminate =
            function() {

                var result =

                    _G_Scene_terminate
                        .call(
                            this
                        );


                G._activeGymNumber =
                    null;


                G._activeEventContext =
                    null;


                return result;

            };

    }


    // =========================================================
    // INFO - SOLO PARA DESARROLLO
    // =========================================================
    //
    // No uses este comando dentro del juego final.
    //
    // Sirve únicamente para que tú puedas comprobar
    // el equipo durante el desarrollo.
    //
    // =========================================================

    G.showInfo =
        function(
            number
        ) {

            var gym =
                G.getGym(
                    number
                );


            if (
                !gym
            ) {

                return;

            }


            var names =
                [];


            for (

                var i = 0;

                i <
                gym.team.length;

                i++

            ) {

                var entry =
                    gym.team[
                        i
                    ];


                var species =

                    GM
                        .getSpeciesByGranadaDex

                        ? GM
                            .getSpeciesByGranadaDex(
                                entry.gd
                            )

                        : null;


                names.push(

                    (
                        species

                            ? species.name

                            : (
                                'GD ' +
                                entry.gd
                              )
                    ) +

                    ' Nv.' +

                    entry.level

                );

            }


            console.log(

                '[GranadaMon Gyms DEBUG] ' +

                gym.id +

                ' | ' +

                gym.theme +

                ' | Equipo: ' +

                names.join(
                    ', '
                )

            );

        };


    // =========================================================
    // RESET DE PRUEBAS
    // =========================================================

    G.resetGym =
        function(
            number,
            interpreter
        ) {

            var gym =
                G.getGym(
                    number
                );


            if (
                !gym
            ) {

                return false;

            }


            // -------------------------------------------------
            // ESTADO INTERNO
            // -------------------------------------------------

            var state =
                G.ensureState();


            if (
                state &&
                state.wins
            ) {

                delete state
                    .wins[
                        gym.id
                    ];

            }


            // -------------------------------------------------
            // TELEMETRY
            // -------------------------------------------------

            if (

                window.$gameSystem &&

                $gameSystem
                    ._granadaMonTelemetry &&

                $gameSystem
                    ._granadaMonTelemetry
                    .gyms

            ) {

                delete $gameSystem
                    ._granadaMonTelemetry
                    .gyms[
                        gym.id
                    ];

            }


            // -------------------------------------------------
            // SELF SWITCH
            // -------------------------------------------------

            if (

                interpreter &&

                window.$gameMap &&

                window.$gameSelfSwitches

            ) {

                $gameSelfSwitches
                    .setValue(

                        [

                            $gameMap
                                .mapId(),

                            Number(
                                interpreter
                                    ._eventId ||
                                0
                            ),

                            'A'

                        ],

                        false

                    );

            }


            // -------------------------------------------------
            // RECALCULAR VARIABLE
            // -------------------------------------------------

            var count =
                0;


            var source =

                window.$gameSystem &&

                $gameSystem
                    ._granadaMonTelemetry &&

                $gameSystem
                    ._granadaMonTelemetry
                    .gyms

                    ? $gameSystem
                        ._granadaMonTelemetry
                        .gyms

                    : (
                        state
                            ? state.wins
                            : {}
                      );


            for (
                var key in
                source
            ) {

                if (

                    Object
                        .prototype
                        .hasOwnProperty
                        .call(
                            source,
                            key
                        ) &&

                    source[
                        key
                    ]

                ) {

                    count++;

                }

            }


            if (
                window.$gameVariables
            ) {

                $gameVariables
                    .setValue(

                        G
                            .GYM_VARIABLE_ID,

                        Math.min(
                            G.TOTAL,
                            count
                        )

                    );

            }


            // -------------------------------------------------
            // FIREBASE
            // -------------------------------------------------

            if (

                GM.Telemetry &&

                typeof GM
                    .Telemetry
                    .scheduleSync ===
                    'function'

            ) {

                GM
                    .Telemetry
                    .scheduleSync(
                        200
                    );

            }


            return true;

        };


    // =========================================================
    // PLUGIN COMMANDS
    // =========================================================

    var _G_pluginCommand =

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

            _G_pluginCommand
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


            args =
                args ||
                [];


            // -------------------------------------------------
            // GIMNASIO
            // -------------------------------------------------

            if (
                cmd ===
                'granadamongym'
            ) {

                G.startBattle(

                    Number(

                        args.length

                            ? args[0]

                            : 0

                    ),

                    this

                );


                return;

            }


            // -------------------------------------------------
            // DEBUG
            // -------------------------------------------------

            if (
                cmd ===
                'granadamongyminfo'
            ) {

                G.showInfo(

                    Number(

                        args.length

                            ? args[0]

                            : 0

                    )

                );


                return;

            }


            // -------------------------------------------------
            // RESET
            // -------------------------------------------------

            if (
                cmd ===
                'granadamongymreset'
            ) {

                G.resetGym(

                    Number(

                        args.length

                            ? args[0]

                            : 0

                    ),

                    this

                );

            }

        };


    // =========================================================
    // FINAL
    // =========================================================

    console.log(
        'GranadaMon Gyms v4.0: sin nombres visibles, sin EXP de combate, medalla única.'
    );

})();