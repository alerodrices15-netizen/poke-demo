/*:
 * @plugindesc v1.0 GranadaMon - Núcleo matemático de combates Pokémon
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleCore.js
 * ------------------------------------------------------------
 * REQUIERE:
 *
 * GranadaMon_Core
 * GranadaMon_Data
 * GranadaMon_Moves
 *
 * Incluye:
 * - 18 tipos
 * - Efectividades
 * - Doble tipo
 * - STAB
 * - Precisión
 * - Golpes críticos
 * - Daño físico/especial
 * - Variación aleatoria
 * - Modificadores de estadísticas
 *
 * TODAVÍA NO CREA LA PANTALLA DE COMBATE.
 *
 * COMANDO DE PRUEBA:
 *
 * GranadaMonTestDamage SLOT ENEMIGO NIVEL MOVIMIENTO
 *
 * Ejemplo:
 *
 * GranadaMonTestDamage 1 130 20 3
 *
 * Pokémon del slot 1
 * contra Gyarados (#130)
 * nivel 20
 * usando movimiento #3 = Impactrueno
 */

(function() {

    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;


    // =========================================================
    // COMPROBACIONES
    // =========================================================

    if (
        !GM.getSpecies ||
        !GM.createPokemon
    ) {

        throw new Error(
            'GranadaMon_BattleCore necesita GranadaMon_Core.js.'
        );

    }


    if (
        !GM.getMove
    ) {

        throw new Error(
            'GranadaMon_BattleCore necesita GranadaMon_Moves.js.'
        );

    }


    // =========================================================
    // BATTLE CORE
    // =========================================================

    GM.BattleCore =
        GM.BattleCore || {};


    GM.BattleCore.version =
        '1.0';


    // =========================================================
    // TIPOS
    // =========================================================

    GM.Types = {

        NORMAL:
            'NORMAL',

        FUEGO:
            'FUEGO',

        AGUA:
            'AGUA',

        ELECTRICO:
            'ELECTRICO',

        PLANTA:
            'PLANTA',

        HIELO:
            'HIELO',

        LUCHA:
            'LUCHA',

        VENENO:
            'VENENO',

        TIERRA:
            'TIERRA',

        VOLADOR:
            'VOLADOR',

        PSIQUICO:
            'PSIQUICO',

        BICHO:
            'BICHO',

        ROCA:
            'ROCA',

        FANTASMA:
            'FANTASMA',

        DRAGON:
            'DRAGON',

        SINIESTRO:
            'SINIESTRO',

        ACERO:
            'ACERO',

        HADA:
            'HADA'

    };


    // =========================================================
    // TABLA DE EFECTIVIDAD
    // =========================================================
    //
    // Solo guardamos relaciones distintas de x1.
    //
    // =========================================================

    GM.TypeChart = {

        NORMAL: {

            ROCA: 0.5,
            FANTASMA: 0,
            ACERO: 0.5

        },


        FUEGO: {

            FUEGO: 0.5,
            AGUA: 0.5,
            PLANTA: 2,
            HIELO: 2,
            BICHO: 2,
            ROCA: 0.5,
            DRAGON: 0.5,
            ACERO: 2

        },


        AGUA: {

            FUEGO: 2,
            AGUA: 0.5,
            PLANTA: 0.5,
            TIERRA: 2,
            ROCA: 2,
            DRAGON: 0.5

        },


        ELECTRICO: {

            AGUA: 2,
            ELECTRICO: 0.5,
            PLANTA: 0.5,
            TIERRA: 0,
            VOLADOR: 2,
            DRAGON: 0.5

        },


        PLANTA: {

            FUEGO: 0.5,
            AGUA: 2,
            PLANTA: 0.5,
            VENENO: 0.5,
            TIERRA: 2,
            VOLADOR: 0.5,
            BICHO: 0.5,
            ROCA: 2,
            DRAGON: 0.5,
            ACERO: 0.5

        },


        HIELO: {

            FUEGO: 0.5,
            AGUA: 0.5,
            PLANTA: 2,
            HIELO: 0.5,
            TIERRA: 2,
            VOLADOR: 2,
            DRAGON: 2,
            ACERO: 0.5

        },


        LUCHA: {

            NORMAL: 2,
            HIELO: 2,
            VENENO: 0.5,
            VOLADOR: 0.5,
            PSIQUICO: 0.5,
            BICHO: 0.5,
            ROCA: 2,
            FANTASMA: 0,
            SINIESTRO: 2,
            ACERO: 2,
            HADA: 0.5

        },


        VENENO: {

            PLANTA: 2,
            VENENO: 0.5,
            TIERRA: 0.5,
            ROCA: 0.5,
            FANTASMA: 0.5,
            ACERO: 0,
            HADA: 2

        },


        TIERRA: {

            FUEGO: 2,
            ELECTRICO: 2,
            PLANTA: 0.5,
            VENENO: 2,
            VOLADOR: 0,
            BICHO: 0.5,
            ROCA: 2,
            ACERO: 2

        },


        VOLADOR: {

            ELECTRICO: 0.5,
            PLANTA: 2,
            LUCHA: 2,
            BICHO: 2,
            ROCA: 0.5,
            ACERO: 0.5

        },


        PSIQUICO: {

            LUCHA: 2,
            VENENO: 2,
            PSIQUICO: 0.5,
            SINIESTRO: 0,
            ACERO: 0.5

        },


        BICHO: {

            FUEGO: 0.5,
            PLANTA: 2,
            LUCHA: 0.5,
            VENENO: 0.5,
            VOLADOR: 0.5,
            PSIQUICO: 2,
            FANTASMA: 0.5,
            SINIESTRO: 2,
            ACERO: 0.5,
            HADA: 0.5

        },


        ROCA: {

            FUEGO: 2,
            HIELO: 2,
            LUCHA: 0.5,
            TIERRA: 0.5,
            VOLADOR: 2,
            BICHO: 2,
            ACERO: 0.5

        },


        FANTASMA: {

            NORMAL: 0,
            PSIQUICO: 2,
            FANTASMA: 2,
            SINIESTRO: 0.5

        },


        DRAGON: {

            DRAGON: 2,
            ACERO: 0.5,
            HADA: 0

        },


        SINIESTRO: {

            LUCHA: 0.5,
            PSIQUICO: 2,
            FANTASMA: 2,
            SINIESTRO: 0.5,
            HADA: 0.5

        },


        ACERO: {

            FUEGO: 0.5,
            AGUA: 0.5,
            ELECTRICO: 0.5,
            HIELO: 2,
            ROCA: 2,
            ACERO: 0.5,
            HADA: 2

        },


        HADA: {

            FUEGO: 0.5,
            LUCHA: 2,
            VENENO: 0.5,
            DRAGON: 2,
            SINIESTRO: 2,
            ACERO: 0.5

        }

    };


    // =========================================================
    // EFECTIVIDAD CONTRA UN TIPO
    // =========================================================

    GM.typeEffectivenessSingle =
        function(
            attackType,
            defenseType
        ) {

            attackType =
                String(
                    attackType || ''
                ).toUpperCase();


            defenseType =
                String(
                    defenseType || ''
                ).toUpperCase();


            var row =
                GM.TypeChart[
                    attackType
                ];


            if (!row) {

                return 1;

            }


            if (
                row[
                    defenseType
                ] == null
            ) {

                return 1;

            }


            return Number(
                row[
                    defenseType
                ]
            );

        };


    // =========================================================
    // EFECTIVIDAD CONTRA POKÉMON
    // =========================================================

    GM.typeEffectiveness =
        function(
            attackType,
            defender
        ) {

            if (!defender) {

                return 1;

            }


            var types =
                defender.types || [];


            var multiplier =
                1;


            for (
                var i = 0;
                i < types.length;
                i++
            ) {

                multiplier *=
                    GM.typeEffectivenessSingle(

                        attackType,

                        types[i]

                    );

            }


            return multiplier;

        };


    // =========================================================
    // TEXTO DE EFECTIVIDAD
    // =========================================================

    GM.effectivenessMessage =
        function(multiplier) {

            if (
                multiplier === 0
            ) {

                return 'No afecta al Pokémon rival.';

            }


            if (
                multiplier >= 2
            ) {

                return '¡Es supereficaz!';

            }


            if (
                multiplier > 0 &&
                multiplier < 1
            ) {

                return 'No es muy eficaz...';

            }


            return '';

        };


    // =========================================================
    // ETAPAS DE ESTADÍSTICAS
    // =========================================================
    //
    // -6 a +6
    //
    // =========================================================

    GM.clampStatStage =
        function(stage) {

            return Math.max(

                -6,

                Math.min(

                    6,

                    Number(
                        stage || 0
                    )

                )

            );

        };


    GM.statStageMultiplier =
        function(stage) {

            stage =
                GM.clampStatStage(
                    stage
                );


            if (
                stage >= 0
            ) {

                return (
                    2 + stage
                ) / 2;

            }


            return 2 /
                (
                    2 -
                    stage
                );

        };


    // =========================================================
    // PREPARAR ETAPAS DE COMBATE
    // =========================================================

    GM.ensureBattleStages =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            if (
                !pokemon.battleStages
            ) {

                pokemon.battleStages = {

                    attack: 0,

                    defense: 0,

                    spAttack: 0,

                    spDefense: 0,

                    speed: 0,

                    accuracy: 0,

                    evasion: 0

                };

            }

        };


    GM.resetBattleStages =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            pokemon.battleStages = {

                attack: 0,

                defense: 0,

                spAttack: 0,

                spDefense: 0,

                speed: 0,

                accuracy: 0,

                evasion: 0

            };

        };


    // =========================================================
    // ESTADÍSTICA DURANTE COMBATE
    // =========================================================

    GM.battleStat =
        function(
            pokemon,
            stat
        ) {

            if (!pokemon) {

                return 1;

            }


            GM.ensureBattleStages(
                pokemon
            );


            var base =
                Number(
                    pokemon[
                        stat
                    ] || 1
                );


            var stage =
                Number(

                    pokemon
                        .battleStages[
                            stat
                        ] || 0

                );


            return Math.max(

                1,

                Math.floor(

                    base *

                    GM.statStageMultiplier(
                        stage
                    )

                )

            );

        };


    // =========================================================
    // PRECISIÓN
    // =========================================================

    GM.accuracyStageMultiplier =
        function(stage) {

            stage =
                GM.clampStatStage(
                    stage
                );


            if (
                stage >= 0
            ) {

                return (
                    3 + stage
                ) / 3;

            }


            return 3 /
                (
                    3 -
                    stage
                );

        };


    GM.checkMoveAccuracy =
        function(
            attacker,
            defender,
            move
        ) {

            if (!move) {

                return false;

            }


            // Precisión nula = siempre acierta

            if (
                move.accuracy == null ||
                Number(move.accuracy) <= 0
            ) {

                return true;

            }


            GM.ensureBattleStages(
                attacker
            );


            GM.ensureBattleStages(
                defender
            );


            var accuracyStage =
                attacker
                    .battleStages
                    .accuracy || 0;


            var evasionStage =
                defender
                    .battleStages
                    .evasion || 0;


            var accuracyMultiplier =
                GM.accuracyStageMultiplier(
                    accuracyStage
                );


            var evasionMultiplier =
                GM.accuracyStageMultiplier(
                    evasionStage
                );


            var finalAccuracy =

                Number(
                    move.accuracy
                ) *

                accuracyMultiplier /

                evasionMultiplier;


            finalAccuracy =
                Math.max(
                    1,
                    Math.min(
                        100,
                        finalAccuracy
                    )
                );


            var roll =
                Math.random() *
                100;


            return (
                roll <
                finalAccuracy
            );

        };


    // =========================================================
    // STAB
    // =========================================================

    GM.getStab =
        function(
            attacker,
            move
        ) {

            if (
                !attacker ||
                !move ||
                !attacker.types
            ) {

                return 1;

            }


            for (
                var i = 0;
                i < attacker.types.length;
                i++
            ) {

                if (
                    attacker.types[i] ===
                    move.type
                ) {

                    return 1.5;

                }

            }


            return 1;

        };


    // =========================================================
    // CRÍTICO
    // =========================================================

    GM.rollCritical =
        function(move) {

            var stage =
                Number(
                    move &&
                    move.criticalStage != null
                        ? move.criticalStage
                        : 0
                );


            var chance;


            if (
                stage <= 0
            ) {

                chance =
                    1 / 24;

            }

            else if (
                stage === 1
            ) {

                chance =
                    1 / 8;

            }

            else if (
                stage === 2
            ) {

                chance =
                    1 / 2;

            }

            else {

                chance =
                    1;

            }


            return (
                Math.random() <
                chance
            );

        };


    // =========================================================
    // VARIACIÓN ALEATORIA
    // =========================================================

    GM.damageRandomFactor =
        function() {

            return (

                0.85 +

                Math.random() *
                0.15

            );

        };


    // =========================================================
    // DAÑO
    // =========================================================

    GM.calculateDamage =
        function(
            attacker,
            defender,
            move,
            options
        ) {

            options =
                options || {};


            var result = {

                success:
                    false,

                hit:
                    false,

                damage:
                    0,

                critical:
                    false,

                stab:
                    1,

                effectiveness:
                    1,

                randomFactor:
                    1,

                immune:
                    false,

                message:
                    ''

            };


            if (
                !attacker ||
                !defender ||
                !move
            ) {

                return result;

            }


            // =================================================
            // MOVIMIENTOS DE ESTADO
            // =================================================

            if (
                move.category ===
                    'ESTADO' ||
                Number(
                    move.power || 0
                ) <= 0
            ) {

                result.success =
                    true;


                result.hit =
                    GM.checkMoveAccuracy(

                        attacker,

                        defender,

                        move

                    );


                return result;

            }


            // =================================================
            // PRECISIÓN
            // =================================================

            if (
                options.skipAccuracy ===
                true
            ) {

                result.hit =
                    true;

            }

            else {

                result.hit =
                    GM.checkMoveAccuracy(

                        attacker,

                        defender,

                        move

                    );

            }


            result.success =
                true;


            if (
                !result.hit
            ) {

                result.message =
                    '¡El ataque ha fallado!';

                return result;

            }


            // =================================================
            // EFECTIVIDAD
            // =================================================

            result.effectiveness =
                GM.typeEffectiveness(

                    move.type,

                    defender

                );


            if (
                result.effectiveness ===
                0
            ) {

                result.immune =
                    true;


                result.message =
                    GM.effectivenessMessage(
                        0
                    );


                return result;

            }


            // =================================================
            // FÍSICO / ESPECIAL
            // =================================================

            var attackStat;

            var defenseStat;


            if (
                move.category ===
                'FISICO'
            ) {

                attackStat =
                    GM.battleStat(

                        attacker,

                        'attack'

                    );


                defenseStat =
                    GM.battleStat(

                        defender,

                        'defense'

                    );

            }

            else {

                attackStat =
                    GM.battleStat(

                        attacker,

                        'spAttack'

                    );


                defenseStat =
                    GM.battleStat(

                        defender,

                        'spDefense'

                    );

            }


            defenseStat =
                Math.max(
                    1,
                    defenseStat
                );


            // =================================================
            // FÓRMULA BASE
            // =================================================

            var level =
                Number(
                    attacker.level ||
                    1
                );


            var power =
                Number(
                    move.power ||
                    0
                );


            var baseDamage =

                Math.floor(

                    Math.floor(

                        Math.floor(

                            (
                                (
                                    Math.floor(
                                        2 *
                                        level /
                                        5
                                    ) +
                                    2
                                ) *

                                power *

                                attackStat
                            ) /

                            defenseStat

                        ) /

                        50

                    ) +

                    2

                );


            // =================================================
            // STAB
            // =================================================

            result.stab =
                GM.getStab(

                    attacker,

                    move

                );


            // =================================================
            // CRÍTICO
            // =================================================

            if (
                options.forceCritical ===
                true
            ) {

                result.critical =
                    true;

            }

            else if (
                options.disableCritical ===
                true
            ) {

                result.critical =
                    false;

            }

            else {

                result.critical =
                    GM.rollCritical(
                        move
                    );

            }


            var criticalMultiplier =
                result.critical
                    ? 1.5
                    : 1;


            // =================================================
            // ALEATORIO
            // =================================================

            if (
                options.fixedRandom != null
            ) {

                result.randomFactor =
                    Number(
                        options.fixedRandom
                    );

            }

            else {

                result.randomFactor =
                    GM.damageRandomFactor();

            }


            // =================================================
            // QUEMADURA
            // =================================================

            var burnMultiplier =
                1;


            if (

                move.category ===
                    'FISICO' &&

                attacker.status ===
                    'burn'

            ) {

                burnMultiplier =
                    0.5;

            }


            // =================================================
            // DAÑO FINAL
            // =================================================

            var finalDamage =

                baseDamage *

                result.stab *

                result.effectiveness *

                criticalMultiplier *

                result.randomFactor *

                burnMultiplier;


            result.damage =
                Math.max(

                    1,

                    Math.floor(
                        finalDamage
                    )

                );


            result.message =
                GM.effectivenessMessage(

                    result.effectiveness

                );


            return result;

        };


    // =========================================================
    // APLICAR DAÑO
    // =========================================================

    GM.applyDamage =
        function(
            defender,
            damage
        ) {

            if (!defender) {

                return 0;

            }


            damage =
                Math.max(

                    0,

                    Math.floor(
                        Number(
                            damage || 0
                        )
                    )

                );


            defender.hp =
                Math.max(

                    0,

                    Number(
                        defender.hp || 0
                    ) -
                    damage

                );


            return defender.hp;

        };


    // =========================================================
    // ¿DEBILITADO?
    // =========================================================

    GM.isFainted =
        function(pokemon) {

            if (!pokemon) {

                return true;

            }


            return (
                Number(
                    pokemon.hp || 0
                ) <= 0
            );

        };


    // =========================================================
    // VELOCIDAD EFECTIVA
    // =========================================================

    GM.effectiveSpeed =
        function(pokemon) {

            if (!pokemon) {

                return 1;

            }


            var speed =
                GM.battleStat(

                    pokemon,

                    'speed'

                );


            // Parálisis

            if (
                pokemon.status ===
                    'paralysis'
            ) {

                speed =
                    Math.floor(
                        speed *
                        0.5
                    );

            }


            return Math.max(
                1,
                speed
            );

        };


    // =========================================================
    // ORDEN DE TURNO
    // =========================================================

    GM.compareTurnOrder =
        function(
            pokemonA,
            moveA,
            pokemonB,
            moveB
        ) {

            var priorityA =
                Number(
                    moveA &&
                    moveA.priority != null
                        ? moveA.priority
                        : 0
                );


            var priorityB =
                Number(
                    moveB &&
                    moveB.priority != null
                        ? moveB.priority
                        : 0
                );


            if (
                priorityA >
                priorityB
            ) {

                return -1;

            }


            if (
                priorityB >
                priorityA
            ) {

                return 1;

            }


            var speedA =
                GM.effectiveSpeed(
                    pokemonA
                );


            var speedB =
                GM.effectiveSpeed(
                    pokemonB
                );


            if (
                speedA >
                speedB
            ) {

                return -1;

            }


            if (
                speedB >
                speedA
            ) {

                return 1;

            }


            // Empate aleatorio

            return (
                Math.random() <
                0.5
                    ? -1
                    : 1
            );

        };


    // =========================================================
    // MOVIMIENTO EN COMBATE
    // =========================================================

    GM.useMovePP =
        function(moveInstance) {

            if (!moveInstance) {

                return false;

            }


            if (
                moveInstance.currentPP <= 0
            ) {

                return false;

            }


            moveInstance.currentPP =
                Math.max(

                    0,

                    moveInstance.currentPP -
                    1

                );


            return true;

        };


    // =========================================================
    // PRUEBA DESDE EVENTO
    // =========================================================

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter
            .prototype
            .pluginCommand;


    Game_Interpreter.prototype.pluginCommand =
        function(
            command,
            args
        ) {

            _Game_Interpreter_pluginCommand.call(

                this,

                command,

                args

            );


            if (
                command !==
                'GranadaMonTestDamage'
            ) {

                return;

            }


            var slot =
                Number(
                    args[0] || 1
                ) - 1;


            var enemyNationalDex =
                Number(
                    args[1] || 0
                );


            var enemyLevel =
                Number(
                    args[2] || 5
                );


            var moveId =
                Number(
                    args[3] || 1
                );


            var party =
                $gameSystem
                    ._granadaMonParty ||
                [];


            var attacker =
                party[
                    slot
                ];


            if (!attacker) {

                $gameMessage.add(
                    'No hay ningún Pokémon en ese hueco.'
                );

                return;

            }


            var defender =
                GM.createPokemon(

                    enemyNationalDex,

                    enemyLevel

                );


            if (!defender) {

                $gameMessage.add(
                    'No existe ese Pokémon rival.'
                );

                return;

            }


            var move =
                GM.getMove(
                    moveId
                );


            if (!move) {

                $gameMessage.add(
                    'No existe ese movimiento.'
                );

                return;

            }


            GM.resetBattleStages(
                attacker
            );


            GM.resetBattleStages(
                defender
            );


            var result =
                GM.calculateDamage(

                    attacker,

                    defender,

                    move,

                    {
                        skipAccuracy:
                            true,

                        disableCritical:
                            true,

                        fixedRandom:
                            1
                    }

                );


            $gameMessage.add(

                attacker.name +
                ' usa ' +
                move.name +
                '.'

            );


            if (
                result.immune
            ) {

                $gameMessage.add(
                    result.message
                );

                return;

            }


            $gameMessage.add(

                'Daño calculado: ' +
                result.damage +
                ' PS.'

            );


            $gameMessage.add(

                'Efectividad: x' +
                result.effectiveness +
                '.'

            );


            if (
                result.message
            ) {

                $gameMessage.add(
                    result.message
                );

            }

        };


    console.log(
        'GranadaMon BattleCore v1.0 cargado correctamente.'
    );


})();