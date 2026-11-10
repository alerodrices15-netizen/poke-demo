/*:
 * @plugindesc v2.0 GranadaMon - Motor universal de efectos y estados de combate
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleEffects.js
 * ------------------------------------------------------------
 *
 * REQUIERE:
 * GranadaMon_Moves.js
 * GranadaMon_BattleCore.js
 * GranadaMon_Battle.js
 *
 * COLOCAR DESPUÉS DE:
 * GranadaMon_BattleSprites.js
 *
 * ------------------------------------------------------------
 * ARQUITECTURA
 * ------------------------------------------------------------
 *
 * Los efectos pertenecen a los MOVIMIENTOS.
 *
 * Este plugin lee:
 *
 * move.effect
 * move.effects
 *
 * desde GranadaMon_Moves.js.
 *
 * Eso permite que posteriormente añadamos todos los movimientos
 * de los 100 Pokémon sin volver a programar el motor de combate.
 *
 * ------------------------------------------------------------
 * EFECTOS SOPORTADOS
 * ------------------------------------------------------------
 *
 * STAT_DOWN
 * STAT_UP
 * STAT_CHANGE
 *
 * STATUS
 * STATUS_CHANCE
 *
 * CONFUSION
 * CONFUSION_CHANCE
 *
 * FLINCH
 * FLINCH_CHANCE
 *
 * DRAIN
 * RECOIL
 * HEAL_HP
 * CURE_STATUS
 *
 * MULTI_HIT
 *
 * FIXED_DAMAGE
 * LEVEL_DAMAGE
 * PERCENT_DAMAGE
 *
 * TRAP
 * TRAP_CHANCE
 *
 * LEECH_SEED
 * PROTECT
 * RESET_STATS
 * SELF_KO
 *
 * ------------------------------------------------------------
 * ESTADOS PERSISTENTES
 * ------------------------------------------------------------
 *
 * paralysis
 * burn
 * poison
 * bad_poison
 * sleep
 * freeze
 *
 * ------------------------------------------------------------
 * ESTADOS VOLÁTILES
 * ------------------------------------------------------------
 *
 * confusion
 * flinch
 * trap
 * leech seed
 * protect
 *
 * ------------------------------------------------------------
 * COMANDO DE PRUEBA
 * ------------------------------------------------------------
 *
 * GranadaMonForceNextSecondary
 *
 * Fuerza el siguiente efecto SECUNDARIO probabilístico.
 *
 * Ejemplo:
 *
 * GranadaMonForceNextSecondary
 *
 * y después usar Impactrueno.
 *
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
        !GM.getMove ||
        !GM.Battle
    ) {

        throw new Error(
            'GranadaMon_BattleEffects necesita GranadaMon_Moves.js y GranadaMon_Battle.js.'
        );

    }


    if (
        !GM.calculateDamage ||
        !GM.useMovePP ||
        !GM.applyDamage ||
        !GM.compareTurnOrder
    ) {

        throw new Error(
            'GranadaMon_BattleEffects necesita GranadaMon_BattleCore.js.'
        );

    }


    if (
        typeof Scene_GranadaMonBattle ===
        'undefined'
    ) {

        throw new Error(
            'GranadaMon_BattleEffects necesita Scene_GranadaMonBattle.'
        );

    }


    GM.BattleEffects =
        GM.BattleEffects || {};


    var FX =
        GM.BattleEffects;


    FX.version =
        '2.0';


    FX.forceNextSecondary =
        false;


    // =========================================================
    // UTILIDADES
    // =========================================================

    FX.clamp =
        function(
            value,
            min,
            max
        ) {

            value =
                Number(
                    value || 0
                );


            return Math.max(
                min,
                Math.min(
                    max,
                    value
                )
            );

        };


    FX.randomInt =
        function(
            min,
            max
        ) {

            min =
                Math.floor(
                    Number(
                        min || 0
                    )
                );


            max =
                Math.floor(
                    Number(
                        max || 0
                    )
                );


            if (
                max < min
            ) {

                var temp =
                    min;

                min =
                    max;

                max =
                    temp;

            }


            return (

                min +

                Math.floor(

                    Math.random() *

                    (
                        max -
                        min +
                        1
                    )

                )

            );

        };


    // =========================================================
    // TIRADA DE EFECTO SECUNDARIO
    // =========================================================

    FX.percentRoll =
        function(chance) {

            chance =
                Number(
                    chance == null
                        ? 100
                        : chance
                );


            // Solo consumimos el FORCE si de verdad
            // estamos ante un efecto probabilístico.

            if (
                chance < 100 &&
                FX.forceNextSecondary
            ) {

                FX.forceNextSecondary =
                    false;


                return true;

            }


            return (

                Math.random() *
                100

                <

                chance

            );

        };


    // =========================================================
    // NORMALIZAR TIPO DE EFECTO
    // =========================================================

    FX.normalizeEffectType =
        function(type) {

            return String(
                type || ''
            )
                .toUpperCase()
                .replace(
                    /[\s\-\.]/g,
                    '_'
                );

        };


    // =========================================================
    // NORMALIZAR ESTADOS
    // =========================================================

    FX.normalizeStatus =
        function(status) {

            var key =
                String(
                    status || ''
                )
                    .toLowerCase()
                    .replace(
                        /[\s_\-\.]/g,
                        ''
                    );


            var map = {

                paralysis:
                    'paralysis',

                paralyzed:
                    'paralysis',

                paralisis:
                    'paralysis',

                'parálisis':
                    'paralysis',


                burn:
                    'burn',

                burned:
                    'burn',

                quemadura:
                    'burn',


                poison:
                    'poison',

                poisoned:
                    'poison',

                veneno:
                    'poison',


                badpoison:
                    'bad_poison',

                toxic:
                    'bad_poison',

                badlypoisoned:
                    'bad_poison',


                sleep:
                    'sleep',

                asleep:
                    'sleep',

                dormido:
                    'sleep',


                freeze:
                    'freeze',

                frozen:
                    'freeze',

                congelado:
                    'freeze'

            };


            return (

                map[
                    key
                ] ||

                String(
                    status || ''
                ).toLowerCase()

            );

        };


    // =========================================================
    // NORMALIZAR ESTADÍSTICAS
    // =========================================================

    FX.normalizeStat =
        function(stat) {

            var key =
                String(
                    stat || ''
                )
                    .toLowerCase()
                    .replace(
                        /[\s_\-\.]/g,
                        ''
                    );


            var map = {

                attack:
                    'attack',

                atk:
                    'attack',

                ataque:
                    'attack',


                defense:
                    'defense',

                defence:
                    'defense',

                def:
                    'defense',

                defensa:
                    'defense',


                spattack:
                    'spAttack',

                specialattack:
                    'spAttack',

                spatk:
                    'spAttack',

                spa:
                    'spAttack',

                ataqueespecial:
                    'spAttack',


                spdefense:
                    'spDefense',

                spdefence:
                    'spDefense',

                specialdefense:
                    'spDefense',

                specialdefence:
                    'spDefense',

                spdef:
                    'spDefense',

                defensaespecial:
                    'spDefense',


                speed:
                    'speed',

                spe:
                    'speed',

                velocidad:
                    'speed',


                accuracy:
                    'accuracy',

                acc:
                    'accuracy',

                precision:
                    'accuracy',

                'precisión':
                    'accuracy',


                evasion:
                    'evasion',

                eva:
                    'evasion',

                evasionstat:
                    'evasion',

                'evasión':
                    'evasion'

            };


            return (
                map[key] ||
                null
            );

        };


    FX.statDisplayName =
        function(stat) {

            var names = {

                attack:
                    'Ataque',

                defense:
                    'Defensa',

                spAttack:
                    'Ataque Especial',

                spDefense:
                    'Defensa Especial',

                speed:
                    'Velocidad',

                accuracy:
                    'Precisión',

                evasion:
                    'Evasión'

            };


            return (
                names[stat] ||
                'estadística'
            );

        };


    // =========================================================
    // ETAPAS DE ESTADÍSTICAS
    // =========================================================

    FX.newStages =
        function() {

            return {

                attack:
                    0,

                defense:
                    0,

                spAttack:
                    0,

                spDefense:
                    0,

                speed:
                    0,

                accuracy:
                    0,

                evasion:
                    0

            };

        };


    FX.ensureStages =
        function(pokemon) {

            if (!pokemon) {

                return null;

            }


            if (
                !pokemon
                    ._granadaMonEffectStages
            ) {

                pokemon
                    ._granadaMonEffectStages =
                    FX.newStages();

            }


            return pokemon
                ._granadaMonEffectStages;

        };


    FX.getStage =
        function(
            pokemon,
            stat
        ) {

            var stages =
                FX.ensureStages(
                    pokemon
                );


            var key =
                FX.normalizeStat(
                    stat
                );


            if (
                !stages ||
                !key
            ) {

                return 0;

            }


            return Number(
                stages[key] ||
                0
            );

        };


    FX.changeStage =
        function(
            pokemon,
            stat,
            amount
        ) {

            var stages =
                FX.ensureStages(
                    pokemon
                );


            var key =
                FX.normalizeStat(
                    stat
                );


            if (
                !stages ||
                !key
            ) {

                return {

                    changed:
                        false,

                    stat:
                        key,

                    oldStage:
                        0,

                    newStage:
                        0

                };

            }


            var oldStage =
                Number(
                    stages[key] ||
                    0
                );


            var newStage =
                FX.clamp(

                    oldStage +
                    Number(
                        amount || 0
                    ),

                    -6,
                    6

                );


            stages[key] =
                newStage;


            return {

                changed:
                    newStage !==
                    oldStage,

                stat:
                    key,

                oldStage:
                    oldStage,

                newStage:
                    newStage

            };

        };


    // =========================================================
    // MULTIPLICADORES
    // =========================================================

    FX.statMultiplier =
        function(stage) {

            stage =
                FX.clamp(
                    stage,
                    -6,
                    6
                );


            if (
                stage >= 0
            ) {

                return (
                    2 +
                    stage
                ) / 2;

            }


            return (
                2 /
                (
                    2 -
                    stage
                )
            );

        };


    FX.accuracyMultiplier =
        function(stage) {

            stage =
                FX.clamp(
                    stage,
                    -6,
                    6
                );


            if (
                stage >= 0
            ) {

                return (
                    3 +
                    stage
                ) / 3;

            }


            return (
                3 /
                (
                    3 -
                    stage
                )
            );

        };


    // =========================================================
    // REINICIAR ETAPAS
    // =========================================================

    FX.resetStages =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            pokemon
                ._granadaMonEffectStages =
                FX.newStages();

        };


    // =========================================================
    // ESTADOS VOLÁTILES
    // =========================================================

    FX.clearVolatile =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            pokemon._gmConfusionTurns =
                0;


            pokemon._gmFlinch =
                false;


            pokemon._gmTrappedTurns =
                0;


            pokemon._gmTrapDamageFraction =
                0;


            pokemon._gmLeechSeeded =
                false;


            pokemon._gmProtected =
                false;


            pokemon._gmActedThisTurn =
                false;

        };


    // =========================================================
    // INTEGRACIÓN CON BATTLECORE
    // =========================================================

    if (
        GM.battleStat &&
        !FX._battleStatWrapped
    ) {

        FX._battleStatWrapped =
            true;


        FX._originalBattleStat =
            GM.battleStat;


        GM.battleStat =
            function(
                pokemon,
                stat
            ) {

                var baseValue =
                    FX
                        ._originalBattleStat
                        .apply(
                            this,
                            arguments
                        );


                var key =
                    FX.normalizeStat(
                        stat
                    );


                if (
                    !key ||
                    key === 'accuracy' ||
                    key === 'evasion'
                ) {

                    return baseValue;

                }


                var multiplier =
                    FX.statMultiplier(

                        FX.getStage(
                            pokemon,
                            key
                        )

                    );


                return Math.max(

                    1,

                    Math.floor(

                        Number(
                            baseValue || 1
                        ) *

                        multiplier

                    )

                );

            };

    }


    // =========================================================
    // RESET DE BATTLECORE + NUESTRO RESET
    // =========================================================

    if (
        GM.resetBattleStages &&
        !FX._resetStagesWrapped
    ) {

        FX._resetStagesWrapped =
            true;


        FX._originalResetBattleStages =
            GM.resetBattleStages;


        GM.resetBattleStages =
            function(pokemon) {

                FX
                    ._originalResetBattleStages
                    .apply(
                        this,
                        arguments
                    );


                FX.resetStages(
                    pokemon
                );


                FX.clearVolatile(
                    pokemon
                );

            };

    }


    // =========================================================
    // PRECISIÓN Y EVASIÓN
    // =========================================================

    if (
        !FX._calculateDamageWrapped
    ) {

        FX._calculateDamageWrapped =
            true;


        FX._originalCalculateDamage =
            GM.calculateDamage;


        GM.calculateDamage =
            function(
                attacker,
                defender,
                move
            ) {

                if (!move) {

                    return FX
                        ._originalCalculateDamage
                        .apply(
                            this,
                            arguments
                        );

                }


                var accuracy =
                    move.accuracy;


                if (
                    accuracy == null ||
                    Number(
                        accuracy
                    ) <= 0
                ) {

                    return FX
                        ._originalCalculateDamage
                        .apply(
                            this,
                            arguments
                        );

                }


                var accStage =
                    FX.getStage(
                        attacker,
                        'accuracy'
                    );


                var evaStage =
                    FX.getStage(
                        defender,
                        'evasion'
                    );


                var combined =
                    FX.clamp(
                        accStage -
                        evaStage,
                        -6,
                        6
                    );


                var adjustedAccuracy =

                    Number(
                        accuracy
                    ) *

                    FX.accuracyMultiplier(
                        combined
                    );


                var moveCopy =
                    {};


                for (
                    var key in move
                ) {

                    if (
                        Object
                            .prototype
                            .hasOwnProperty
                            .call(
                                move,
                                key
                            )
                    ) {

                        moveCopy[key] =
                            move[key];

                    }

                }


                moveCopy.accuracy =
                    Math.max(

                        1,

                        Math.min(
                            100,
                            adjustedAccuracy
                        )

                    );


                return FX
                    ._originalCalculateDamage
                    .call(

                        this,

                        attacker,
                        defender,
                        moveCopy

                    );

            };

    }


    // =========================================================
    // TIPOS DEL POKÉMON
    // =========================================================

    FX.typesOf =
        function(pokemon) {

            if (!pokemon) {

                return [];

            }


            var types =
                pokemon.types;


            if (
                !types &&
                GM.getSpecies
            ) {

                var species =
                    GM.getSpecies(
                        pokemon.speciesId
                    );


                if (species) {

                    types =
                        species.types;

                }

            }


            if (!types) {

                return [];

            }


            if (
                !Array.isArray(
                    types
                )
            ) {

                types =
                    [types];

            }


            return types.map(
                function(type) {

                    return String(
                        type || ''
                    ).toUpperCase();

                }
            );

        };


    FX.hasType =
        function(
            pokemon,
            type
        ) {

            return (

                FX.typesOf(
                    pokemon
                )
                    .indexOf(

                        String(
                            type || ''
                        )
                            .toUpperCase()

                    )

                >= 0

            );

        };


    // =========================================================
    // ¿PUEDE RECIBIR ESTADO?
    // =========================================================

    FX.canReceiveStatus =
        function(
            pokemon,
            status
        ) {

            if (
                !pokemon ||
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                return false;

            }


            status =
                FX.normalizeStatus(
                    status
                );


            if (
                pokemon.status
            ) {

                return false;

            }


            if (
                status ===
                    'paralysis' &&

                FX.hasType(
                    pokemon,
                    'ELECTRICO'
                )
            ) {

                return false;

            }


            if (
                status ===
                    'burn' &&

                FX.hasType(
                    pokemon,
                    'FUEGO'
                )
            ) {

                return false;

            }


            if (
                status ===
                    'freeze' &&

                FX.hasType(
                    pokemon,
                    'HIELO'
                )
            ) {

                return false;

            }


            if (
                (
                    status ===
                        'poison' ||

                    status ===
                        'bad_poison'
                ) &&

                (
                    FX.hasType(
                        pokemon,
                        'VENENO'
                    ) ||

                    FX.hasType(
                        pokemon,
                        'ACERO'
                    )
                )
            ) {

                return false;

            }


            return true;

        };


    // =========================================================
    // APLICAR ESTADO
    // =========================================================

    FX.inflictStatus =
        function(
            pokemon,
            status,
            messages
        ) {

            status =
                FX.normalizeStatus(
                    status
                );


            if (
                !FX.canReceiveStatus(
                    pokemon,
                    status
                )
            ) {

                return false;

            }


            pokemon.status =
                status;


            if (
                status ===
                'sleep'
            ) {

                pokemon
                    ._granadaMonSleepTurns =
                    FX.randomInt(
                        1,
                        3
                    );

            }


            if (
                status ===
                'bad_poison'
            ) {

                pokemon._gmToxicCounter =
                    1;

            }

            else {

                pokemon._gmToxicCounter =
                    0;

            }


            if (messages) {

                var messageMap = {

                    paralysis:
                        '¡' +
                        pokemon.name +
                        ' está paralizado!',


                    burn:
                        '¡' +
                        pokemon.name +
                        ' se ha quemado!',


                    poison:
                        '¡' +
                        pokemon.name +
                        ' ha sido envenenado!',


                    bad_poison:
                        '¡' +
                        pokemon.name +
                        ' ha sido gravemente envenenado!',


                    sleep:
                        '¡' +
                        pokemon.name +
                        ' se ha dormido!',


                    freeze:
                        '¡' +
                        pokemon.name +
                        ' se ha congelado!'

                };


                messages.push(

                    messageMap[
                        status
                    ] ||

                    (
                        pokemon.name +
                        ' sufre un problema de estado.'
                    )

                );

            }


            return true;

        };


    // =========================================================
    // CURAR ESTADO
    // =========================================================

    FX.cureStatus =
        function(
            pokemon,
            status,
            messages
        ) {

            if (
                !pokemon ||
                !pokemon.status
            ) {

                return false;

            }


            var current =
                FX.normalizeStatus(
                    pokemon.status
                );


            var wanted =
                String(
                    status || 'ANY'
                ).toUpperCase();


            if (
                wanted !==
                    'ANY' &&

                FX.normalizeStatus(
                    status
                ) !==
                    current
            ) {

                return false;

            }


            pokemon.status =
                null;


            pokemon
                ._granadaMonSleepTurns =
                0;


            pokemon
                ._gmToxicCounter =
                0;


            if (messages) {

                messages.push(

                    '¡' +
                    pokemon.name +
                    ' se ha recuperado de su estado!'

                );

            }


            return true;

        };


    // =========================================================
    // CONFUSIÓN
    // =========================================================

    FX.inflictConfusion =
        function(
            pokemon,
            messages,
            turns
        ) {

            if (
                !pokemon ||
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                return false;

            }


            if (
                Number(
                    pokemon._gmConfusionTurns ||
                    0
                ) > 0
            ) {

                return false;

            }


            pokemon
                ._gmConfusionTurns =

                Number(
                    turns ||
                    FX.randomInt(
                        2,
                        5
                    )
                );


            if (messages) {

                messages.push(

                    '¡' +
                    pokemon.name +
                    ' está confuso!'

                );

            }


            return true;

        };


    // =========================================================
    // DAÑO DE CONFUSIÓN
    // =========================================================

    FX.confusionDamage =
        function(pokemon) {

            if (!pokemon) {

                return 0;

            }


            var level =
                Math.max(
                    1,
                    Number(
                        pokemon.level || 1
                    )
                );


            var attack =

                GM.battleStat

                    ? GM.battleStat(
                        pokemon,
                        'attack'
                    )

                    : Number(
                        pokemon.attack || 1
                    );


            var defense =

                GM.battleStat

                    ? GM.battleStat(
                        pokemon,
                        'defense'
                    )

                    : Number(
                        pokemon.defense || 1
                    );


            attack =
                Math.max(
                    1,
                    Number(
                        attack || 1
                    )
                );


            defense =
                Math.max(
                    1,
                    Number(
                        defense || 1
                    )
                );


            var damage =
                Math.floor(

                    (
                        (
                            (
                                2 *
                                level /
                                5 +
                                2
                            ) *

                            40 *

                            attack /
                            defense
                        ) /

                        50
                    ) +

                    2

                );


            return Math.max(
                1,
                damage
            );

        };


    // =========================================================
    // ¿PUEDE ACTUAR?
    // =========================================================

    FX.canAct =
        function(
            pokemon,
            messages
        ) {

            if (
                !pokemon ||
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                return false;

            }


            // =================================================
            // FLINCH
            // =================================================

            if (
                pokemon._gmFlinch
            ) {

                pokemon._gmFlinch =
                    false;


                messages.push(

                    '¡' +
                    pokemon.name +
                    ' ha retrocedido y no se puede mover!'

                );


                return false;

            }


            var status =
                FX.normalizeStatus(
                    pokemon.status
                );


            // =================================================
            // PARÁLISIS
            // =================================================

            if (
                status ===
                    'paralysis' &&

                Math.random() <
                    0.25
            ) {

                messages.push(

                    '¡' +
                    pokemon.name +
                    ' está paralizado! ¡No se puede mover!'

                );


                return false;

            }


            // =================================================
            // SUEÑO
            // =================================================

            if (
                status ===
                'sleep'
            ) {

                var sleepTurns =
                    Number(

                        pokemon
                            ._granadaMonSleepTurns ||

                        0

                    );


                if (
                    sleepTurns > 0
                ) {

                    pokemon
                        ._granadaMonSleepTurns =
                        sleepTurns -
                        1;


                    messages.push(

                        pokemon.name +
                        ' está dormido.'

                    );


                    return false;

                }


                pokemon.status =
                    null;


                messages.push(

                    '¡' +
                    pokemon.name +
                    ' se ha despertado!'

                );

            }


            // =================================================
            // CONGELACIÓN
            // =================================================

            if (
                status ===
                'freeze'
            ) {

                if (
                    Math.random() <
                    0.20
                ) {

                    pokemon.status =
                        null;


                    messages.push(

                        '¡' +
                        pokemon.name +
                        ' se ha descongelado!'

                    );

                }

                else {

                    messages.push(

                        pokemon.name +
                        ' está congelado y no se puede mover.'

                    );


                    return false;

                }

            }


            // =================================================
            // CONFUSIÓN
            // =================================================

            var confusionTurns =
                Number(

                    pokemon
                        ._gmConfusionTurns ||

                    0

                );


            if (
                confusionTurns > 0
            ) {

                pokemon
                    ._gmConfusionTurns =
                    confusionTurns -
                    1;


                if (
                    pokemon
                        ._gmConfusionTurns <=
                    0
                ) {

                    messages.push(

                        '¡' +
                        pokemon.name +
                        ' ha dejado de estar confuso!'

                    );

                }

                else {

                    messages.push(

                        pokemon.name +
                        ' está confuso.'

                    );


                    if (
                        Math.random() <
                        (
                            1 /
                            3
                        )
                    ) {

                        var selfDamage =
                            FX.confusionDamage(
                                pokemon
                            );


                        GM.applyDamage(
                            pokemon,
                            selfDamage
                        );


                        messages.push(

                            '¡' +
                            pokemon.name +
                            ' se ha herido a sí mismo!'

                        );


                        if (
                            Number(
                                pokemon.hp || 0
                            ) <= 0
                        ) {

                            messages.push(

                                pokemon.name +
                                ' se ha debilitado.'

                            );

                        }


                        return false;

                    }

                }

            }


            return (
                Number(
                    pokemon.hp || 0
                ) > 0
            );

        };


    // =========================================================
    // OBTENER EFECTOS DE UN MOVIMIENTO
    // =========================================================

    FX.effectsOf =
        function(move) {

            if (!move) {

                return [];

            }


            var result =
                [];


            if (
                move.effect
            ) {

                if (
                    Array.isArray(
                        move.effect
                    )
                ) {

                    result =
                        result.concat(
                            move.effect
                        );

                }

                else {

                    result.push(
                        move.effect
                    );

                }

            }


            if (
                move.effects
            ) {

                if (
                    Array.isArray(
                        move.effects
                    )
                ) {

                    result =
                        result.concat(
                            move.effects
                        );

                }

                else {

                    result.push(
                        move.effects
                    );

                }

            }


            return result.filter(
                function(effect) {

                    return !!effect;

                }
            );

        };


    // =========================================================
    // OBJETIVO DEL EFECTO
    // =========================================================

    FX.effectTarget =
        function(
            effect,
            attacker,
            defender
        ) {

            var target =
                String(
                    effect.target || ''
                ).toUpperCase();


            if (
                target === 'SELF' ||
                target === 'USER' ||
                target === 'ATTACKER'
            ) {

                return attacker;

            }


            return defender;

        };


    // =========================================================
    // PROBABILIDAD
    // =========================================================

    FX.effectChance =
        function(effect) {

            if (
                effect.chance ==
                null
            ) {

                return 100;

            }


            return Number(
                effect.chance || 0
            );

        };


    FX.shouldApplyEffect =
        function(effect) {

            return FX.percentRoll(
                FX.effectChance(
                    effect
                )
            );

        };


    // =========================================================
    // MENSAJE DE ESTADÍSTICAS
    // =========================================================

    FX.stageMessage =
        function(
            pokemon,
            stat,
            amount,
            changed
        ) {

            var statName =
                FX.statDisplayName(
                    stat
                );


            if (!changed) {

                if (
                    amount < 0
                ) {

                    return (

                        'El ' +
                        statName +
                        ' de ' +
                        pokemon.name +
                        ' no puede bajar más.'

                    );

                }


                return (

                    'El ' +
                    statName +
                    ' de ' +
                    pokemon.name +
                    ' no puede subir más.'

                );

            }


            var magnitude =
                Math.abs(
                    Number(
                        amount || 0
                    )
                );


            var adverb =
                magnitude >= 2
                    ? ' mucho'
                    : '';


            if (
                amount < 0
            ) {

                return (

                    '¡El ' +
                    statName +
                    ' de ' +
                    pokemon.name +
                    ' ha bajado' +
                    adverb +
                    '!'

                );

            }


            return (

                '¡El ' +
                statName +
                ' de ' +
                pokemon.name +
                ' ha subido' +
                adverb +
                '!'

            );

        };


    // =========================================================
    // MULTIGOLPE
    // =========================================================

    FX.multiHitInfo =
        function(move) {

            var effects =
                FX.effectsOf(
                    move
                );


            for (
                var i = 0;
                i < effects.length;
                i++
            ) {

                var effect =
                    effects[i];


                var type =
                    FX.normalizeEffectType(
                        effect.type
                    );


                if (
                    type ===
                    'MULTI_HIT'
                ) {

                    return {

                        min:
                            Math.max(

                                1,

                                Number(
                                    effect.min ||
                                    effect.hitsMin ||
                                    2
                                )

                            ),

                        max:
                            Math.max(

                                1,

                                Number(
                                    effect.max ||
                                    effect.hitsMax ||
                                    5
                                )

                            )

                    };

                }

            }


            return null;

        };


    // =========================================================
    // DAÑO ESPECIAL/FIJO
    // =========================================================

    FX.damageOverride =
        function(
            move,
            attacker,
            defender
        ) {

            var effects =
                FX.effectsOf(
                    move
                );


            for (
                var i = 0;
                i < effects.length;
                i++
            ) {

                var effect =
                    effects[i];


                var type =
                    FX.normalizeEffectType(
                        effect.type
                    );


                if (
                    type ===
                    'FIXED_DAMAGE'
                ) {

                    return Math.max(

                        1,

                        Math.floor(

                            Number(

                                effect.amount ||
                                effect.damage ||
                                1

                            )

                        )

                    );

                }


                if (
                    type ===
                    'LEVEL_DAMAGE'
                ) {

                    return Math.max(

                        1,

                        Math.floor(

                            Number(
                                attacker.level ||
                                1
                            )

                        )

                    );

                }


                if (
                    type ===
                    'PERCENT_DAMAGE'
                ) {

                    var basis =
                        String(

                            effect.basis ||
                            'MAX_HP'

                        ).toUpperCase();


                    var baseHp =

                        basis ===
                            'CURRENT_HP'

                            ? Number(
                                defender.hp ||
                                1
                            )

                            : Number(
                                defender.maxHp ||
                                1
                            );


                    return Math.max(

                        1,

                        Math.floor(

                            baseHp *

                            Number(
                                effect.percent ||
                                0
                            ) /

                            100

                        )

                    );

                }

            }


            return null;

        };


    // =========================================================
    // PROTECT
    // =========================================================

    FX.isProtected =
        function(
            defender,
            move
        ) {

            if (
                !defender ||
                !defender._gmProtected ||
                !move
            ) {

                return false;

            }


            // Un movimiento con daño siempre afecta al rival.

            if (
                Number(
                    move.power || 0
                ) > 0
            ) {

                return true;

            }


            var effects =
                FX.effectsOf(
                    move
                );


            for (
                var i = 0;
                i < effects.length;
                i++
            ) {

                var target =
                    String(

                        effects[i].target ||
                        'TARGET'

                    ).toUpperCase();


                if (
                    target !== 'SELF' &&
                    target !== 'USER' &&
                    target !== 'ATTACKER'
                ) {

                    return true;

                }

            }


            return false;

        };


    // =========================================================
    // APLICAR EFECTO
    // =========================================================

    FX.applyEffect =
        function(
            effect,
            attacker,
            defender,
            move,
            damageDealt,
            messages
        ) {

            if (!effect) {

                return;

            }


            var type =
                FX.normalizeEffectType(
                    effect.type
                );


            var target =
                FX.effectTarget(
                    effect,
                    attacker,
                    defender
                );


            if (!target) {

                return;

            }


            // Estos se procesan al calcular daño.

            if (
                type === 'MULTI_HIT' ||
                type === 'FIXED_DAMAGE' ||
                type === 'LEVEL_DAMAGE' ||
                type === 'PERCENT_DAMAGE'
            ) {

                return;

            }


            // =================================================
            // ESTADÍSTICAS
            // =========================================================

            if (
                type === 'STAT_DOWN' ||
                type === 'STAT_UP' ||
                type === 'STAT_CHANGE'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                var stages =
                    Math.abs(

                        Number(

                            effect.stages ||
                            effect.amount ||
                            1

                        )

                    );


                var amount =
                    stages;


                if (
                    type ===
                    'STAT_DOWN'
                ) {

                    amount =
                        -stages;

                }


                if (
                    type ===
                    'STAT_CHANGE'
                ) {

                    amount =
                        Number(

                            effect.stages !=
                            null

                                ? effect.stages

                                : effect.amount ||
                                  0

                        );

                }


                var change =
                    FX.changeStage(

                        target,
                        effect.stat,
                        amount

                    );


                messages.push(

                    FX.stageMessage(

                        target,
                        change.stat,
                        amount,
                        change.changed

                    )

                );


                return;

            }


            // =================================================
            // ESTADO
            // =========================================================

            if (
                type === 'STATUS' ||
                type === 'STATUS_CHANCE'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                FX.inflictStatus(

                    target,
                    effect.status,
                    messages

                );


                return;

            }


            // =================================================
            // CONFUSIÓN
            // =========================================================

            if (
                type === 'CONFUSION' ||
                type === 'CONFUSION_CHANCE'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                FX.inflictConfusion(

                    target,
                    messages,
                    effect.turns

                );


                return;

            }


            // =================================================
            // FLINCH
            // =========================================================

            if (
                type === 'FLINCH' ||
                type === 'FLINCH_CHANCE'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                if (
                    Number(
                        target.hp || 0
                    ) > 0 &&

                    !target
                        ._gmActedThisTurn
                ) {

                    target._gmFlinch =
                        true;

                }


                return;

            }


            // =================================================
            // DRENAJE
            // =========================================================

            if (
                type ===
                'DRAIN'
            ) {

                if (
                    damageDealt <= 0 ||
                    Number(
                        attacker.hp || 0
                    ) <= 0
                ) {

                    return;

                }


                var drainPercent =
                    Number(
                        effect.percent ||
                        50
                    );


                var oldHp =
                    Number(
                        attacker.hp ||
                        0
                    );


                var maxHp =
                    Math.max(
                        1,
                        Number(
                            attacker.maxHp ||
                            1
                        )
                    );


                var heal =
                    Math.max(

                        1,

                        Math.floor(

                            damageDealt *

                            drainPercent /

                            100

                        )

                    );


                attacker.hp =
                    Math.min(
                        maxHp,
                        oldHp +
                        heal
                    );


                var recovered =
                    attacker.hp -
                    oldHp;


                if (
                    recovered > 0
                ) {

                    messages.push(

                        attacker.name +
                        ' ha recuperado ' +
                        recovered +
                        ' PS.'

                    );

                }


                return;

            }


            // =================================================
            // RETROCESO DEL USUARIO
            // =========================================================

            if (
                type ===
                'RECOIL'
            ) {

                if (
                    Number(
                        attacker.hp || 0
                    ) <= 0
                ) {

                    return;

                }


                var recoil =
                    0;


                if (
                    effect
                        .percentOfDamage !=
                    null
                ) {

                    recoil =
                        Math.floor(

                            damageDealt *

                            Number(
                                effect
                                    .percentOfDamage ||
                                0
                            ) /

                            100

                        );

                }

                else if (
                    effect
                        .percentOfMaxHp !=
                    null
                ) {

                    recoil =
                        Math.floor(

                            Number(
                                attacker.maxHp ||
                                1
                            ) *

                            Number(
                                effect
                                    .percentOfMaxHp ||
                                0
                            ) /

                            100

                        );

                }

                else {

                    recoil =
                        Math.floor(

                            damageDealt *

                            Number(
                                effect.percent ||
                                25
                            ) /

                            100

                        );

                }


                recoil =
                    Math.max(
                        1,
                        recoil
                    );


                GM.applyDamage(
                    attacker,
                    recoil
                );


                messages.push(

                    attacker.name +
                    ' también ha sufrido daño por retroceso.'

                );


                if (
                    Number(
                        attacker.hp || 0
                    ) <= 0
                ) {

                    messages.push(

                        attacker.name +
                        ' se ha debilitado.'

                    );

                }


                return;

            }


            // =================================================
            // CURAR PS
            // =========================================================

            if (
                type ===
                'HEAL_HP'
            ) {

                if (
                    Number(
                        target.hp || 0
                    ) <= 0
                ) {

                    return;

                }


                var targetMaxHp =
                    Math.max(

                        1,

                        Number(
                            target.maxHp ||
                            1
                        )

                    );


                var oldTargetHp =
                    Number(
                        target.hp ||
                        0
                    );


                var healAmount;


                if (
                    effect.full
                ) {

                    healAmount =
                        targetMaxHp;

                }

                else if (
                    effect.percent !=
                    null
                ) {

                    healAmount =
                        Math.max(

                            1,

                            Math.floor(

                                targetMaxHp *

                                Number(
                                    effect.percent ||
                                    0
                                ) /

                                100

                            )

                        );

                }

                else {

                    healAmount =
                        Math.max(

                            1,

                            Number(
                                effect.amount ||
                                1
                            )

                        );

                }


                target.hp =
                    Math.min(

                        targetMaxHp,

                        oldTargetHp +
                        healAmount

                    );


                var actualHeal =
                    target.hp -
                    oldTargetHp;


                if (
                    actualHeal > 0
                ) {

                    messages.push(

                        target.name +
                        ' ha recuperado ' +
                        actualHeal +
                        ' PS.'

                    );

                }


                return;

            }


            // =================================================
            // CURAR ESTADO
            // =========================================================

            if (
                type ===
                'CURE_STATUS'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                FX.cureStatus(

                    target,

                    effect.status ||
                    'ANY',

                    messages

                );


                return;

            }


            // =================================================
            // ATRAPAR
            // =========================================================

            if (
                type === 'TRAP' ||
                type === 'TRAP_CHANCE'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                if (
                    Number(
                        target.hp || 0
                    ) <= 0
                ) {

                    return;

                }


                target._gmTrappedTurns =

                    Number(

                        effect.turns ||

                        FX.randomInt(
                            4,
                            5
                        )

                    );


                target
                    ._gmTrapDamageFraction =

                    Number(
                        effect
                            .damageFraction ||
                        8
                    );


                messages.push(

                    '¡' +
                    target.name +
                    ' ha quedado atrapado!'

                );


                return;

            }


            // =================================================
            // DRENADORAS
            // =========================================================

            if (
                type ===
                'LEECH_SEED'
            ) {

                if (
                    !FX.shouldApplyEffect(
                        effect
                    )
                ) {

                    return;

                }


                if (
                    Number(
                        target.hp || 0
                    ) <= 0
                ) {

                    return;

                }


                if (
                    !target
                        ._gmLeechSeeded
                ) {

                    target
                        ._gmLeechSeeded =
                        true;


                    messages.push(

                        '¡' +
                        target.name +
                        ' ha sido infectado por Drenadoras!'

                    );

                }


                return;

            }


            // =================================================
            // PROTECT
            // =========================================================

            if (
                type ===
                'PROTECT'
            ) {

                attacker
                    ._gmProtected =
                    true;


                messages.push(

                    '¡' +
                    attacker.name +
                    ' se está protegiendo!'

                );


                return;

            }


            // =================================================
            // REINICIAR ESTADÍSTICAS
            // =========================================================

            if (
                type ===
                'RESET_STATS'
            ) {

                var scope =
                    String(

                        effect.scope ||
                        'BOTH'

                    ).toUpperCase();


                if (
                    scope === 'SELF' ||
                    scope === 'USER'
                ) {

                    FX.resetStages(
                        attacker
                    );

                }

                else if (
                    scope ===
                    'TARGET'
                ) {

                    FX.resetStages(
                        defender
                    );

                }

                else {

                    FX.resetStages(
                        attacker
                    );


                    FX.resetStages(
                        defender
                    );

                }


                messages.push(
                    'Los cambios de características han desaparecido.'
                );


                return;

            }


            // =================================================
            // AUTODEBILITARSE
            // =========================================================

            if (
                type ===
                'SELF_KO'
            ) {

                if (
                    Number(
                        attacker.hp || 0
                    ) > 0
                ) {

                    attacker.hp =
                        0;


                    messages.push(

                        attacker.name +
                        ' se ha debilitado.'

                    );

                }

            }

        };


    // =========================================================
    // APLICAR TODOS LOS EFECTOS DEL MOVIMIENTO
    // =========================================================

    FX.applyPostMoveEffects =
        function(
            attacker,
            defender,
            move,
            damageDealt,
            messages
        ) {

            var effects =
                FX.effectsOf(
                    move
                );


            for (
                var i = 0;
                i < effects.length;
                i++
            ) {

                FX.applyEffect(

                    effects[i],

                    attacker,
                    defender,
                    move,
                    damageDealt,
                    messages

                );

            }

        };


    // =========================================================
    // DAÑO POR ESTADO
    // =========================================================

    FX.applyPersistentStatusDamage =
        function(
            pokemon,
            messages
        ) {

            if (
                !pokemon ||
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                return;

            }


            var status =
                FX.normalizeStatus(
                    pokemon.status
                );


            var maxHp =
                Math.max(
                    1,
                    Number(
                        pokemon.maxHp ||
                        1
                    )
                );


            var damage =
                0;


            var message =
                '';


            if (
                status ===
                'burn'
            ) {

                damage =
                    Math.max(
                        1,
                        Math.floor(
                            maxHp /
                            16
                        )
                    );


                message =
                    pokemon.name +
                    ' sufre daño por la quemadura.';

            }


            if (
                status ===
                'poison'
            ) {

                damage =
                    Math.max(
                        1,
                        Math.floor(
                            maxHp /
                            8
                        )
                    );


                message =
                    pokemon.name +
                    ' sufre daño por el veneno.';

            }


            if (
                status ===
                'bad_poison'
            ) {

                var counter =
                    Math.max(

                        1,

                        Number(
                            pokemon
                                ._gmToxicCounter ||
                            1
                        )

                    );


                damage =
                    Math.max(

                        1,

                        Math.floor(

                            maxHp *
                            counter /
                            16

                        )

                    );


                pokemon
                    ._gmToxicCounter =

                    Math.min(
                        15,
                        counter +
                        1
                    );


                message =
                    pokemon.name +
                    ' sufre daño por el veneno grave.';

            }


            if (
                damage <= 0
            ) {

                return;

            }


            GM.applyDamage(
                pokemon,
                damage
            );


            messages.push(
                message
            );


            if (
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                messages.push(

                    pokemon.name +
                    ' se ha debilitado.'

                );

            }

        };


    // =========================================================
    // DAÑO DE TRAMPA
    // =========================================================

    FX.applyTrapDamage =
        function(
            pokemon,
            messages
        ) {

            if (
                !pokemon ||
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                return;

            }


            var turns =
                Number(

                    pokemon
                        ._gmTrappedTurns ||

                    0

                );


            if (
                turns <= 0
            ) {

                return;

            }


            var fraction =
                Math.max(

                    1,

                    Number(

                        pokemon
                            ._gmTrapDamageFraction ||

                        8

                    )

                );


            var damage =
                Math.max(

                    1,

                    Math.floor(

                        Math.max(

                            1,

                            Number(
                                pokemon.maxHp ||
                                1
                            )

                        ) /

                        fraction

                    )

                );


            GM.applyDamage(
                pokemon,
                damage
            );


            pokemon
                ._gmTrappedTurns =
                turns -
                1;


            messages.push(

                pokemon.name +
                ' sufre daño por estar atrapado.'

            );


            if (
                pokemon
                    ._gmTrappedTurns <=
                    0 &&

                Number(
                    pokemon.hp || 0
                ) > 0
            ) {

                messages.push(

                    '¡' +
                    pokemon.name +
                    ' se ha liberado!'

                );

            }


            if (
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                messages.push(

                    pokemon.name +
                    ' se ha debilitado.'

                );

            }

        };


    // =========================================================
    // DRENADORAS
    // =========================================================

    FX.applyLeechSeed =
        function(
            victim,
            receiver,
            messages
        ) {

            if (
                !victim ||
                !receiver ||
                !victim
                    ._gmLeechSeeded ||
                Number(
                    victim.hp || 0
                ) <= 0
            ) {

                return;

            }


            var damage =
                Math.max(

                    1,

                    Math.floor(

                        Math.max(

                            1,

                            Number(
                                victim.maxHp ||
                                1
                            )

                        ) /

                        8

                    )

                );


            var oldHp =
                Number(
                    victim.hp ||
                    0
                );


            GM.applyDamage(
                victim,
                damage
            );


            var drained =
                Math.max(

                    0,

                    oldHp -
                    Number(
                        victim.hp ||
                        0
                    )

                );


            if (
                Number(
                    receiver.hp || 0
                ) > 0 &&
                drained > 0
            ) {

                receiver.hp =
                    Math.min(

                        Number(
                            receiver.maxHp ||
                            1
                        ),

                        Number(
                            receiver.hp ||
                            0
                        ) +

                        drained

                    );

            }


            messages.push(

                'Drenadoras absorbe energía de ' +
                victim.name +
                '.'

            );


            if (
                Number(
                    victim.hp || 0
                ) <= 0
            ) {

                messages.push(

                    victim.name +
                    ' se ha debilitado.'

                );

            }

        };


    // =========================================================
    // FINAL DE TURNO
    // =========================================================

    FX.applyEndTurn =
        function(messages) {

            var player =
                GM.Battle.playerPokemon;


            var enemy =
                GM.Battle.enemy;


            // RIVAL

            FX.applyPersistentStatusDamage(
                enemy,
                messages
            );


            if (
                Number(
                    enemy.hp || 0
                ) > 0
            ) {

                FX.applyTrapDamage(
                    enemy,
                    messages
                );

            }


            if (
                Number(
                    enemy.hp || 0
                ) > 0
            ) {

                FX.applyLeechSeed(

                    enemy,
                    player,
                    messages

                );

            }


            // JUGADOR

            FX.applyPersistentStatusDamage(
                player,
                messages
            );


            if (
                Number(
                    player.hp || 0
                ) > 0
            ) {

                FX.applyTrapDamage(
                    player,
                    messages
                );

            }


            if (
                Number(
                    player.hp || 0
                ) > 0
            ) {

                FX.applyLeechSeed(

                    player,
                    enemy,
                    messages

                );

            }


            // Limpiar estados de un turno

            if (player) {

                player._gmProtected =
                    false;


                player._gmFlinch =
                    false;


                player._gmActedThisTurn =
                    false;

            }


            if (enemy) {

                enemy._gmProtected =
                    false;


                enemy._gmFlinch =
                    false;


                enemy._gmActedThisTurn =
                    false;

            }

        };


    // =========================================================
    // REFRESCO DE UI
    // =========================================================

    Scene_GranadaMonBattle
        .prototype
        .refreshGMBattleEffectsUI =
        function() {

            if (
                this._fieldWindow &&
                this._fieldWindow.refresh
            ) {

                this._fieldWindow.refresh();

            }


            if (
                this._playerStatusWindow &&
                this._playerStatusWindow.refresh
            ) {

                this._playerStatusWindow.refresh();

            }


            if (
                this._enemyStatusWindow &&
                this._enemyStatusWindow.refresh
            ) {

                this._enemyStatusWindow.refresh();

            }


            if (
                this._moveWindow &&
                this._moveWindow.refresh
            ) {

                this._moveWindow.refresh();

            }

        };


    // =========================================================
    // ¿MOVIMIENTO DE ESTADO INÚTIL?
    // =========================================================

    FX.isUselessStatusMove =
        function(
            move,
            target
        ) {

            var effects =
                FX.effectsOf(
                    move
                );


            if (
                effects.length === 0
            ) {

                return (
                    Number(
                        move.power || 0
                    ) <= 0
                );

            }


            for (
                var i = 0;
                i < effects.length;
                i++
            ) {

                var effect =
                    effects[i];


                var type =
                    FX.normalizeEffectType(
                        effect.type
                    );


                if (
                    type === 'STAT_DOWN' ||
                    type === 'STAT_CHANGE'
                ) {

                    var amount;


                    if (
                        type ===
                        'STAT_DOWN'
                    ) {

                        amount =
                            -Math.abs(

                                Number(

                                    effect.stages ||
                                    effect.amount ||
                                    1

                                )

                            );

                    }

                    else {

                        amount =
                            Number(

                                effect.stages !=
                                null

                                    ? effect.stages

                                    : effect.amount ||
                                      0

                            );

                    }


                    if (
                        amount < 0 &&
                        FX.getStage(
                            target,
                            effect.stat
                        ) > -6
                    ) {

                        return false;

                    }

                }


                if (
                    type === 'STATUS' ||
                    type === 'STATUS_CHANCE'
                ) {

                    if (
                        FX.canReceiveStatus(
                            target,
                            effect.status
                        )
                    ) {

                        return false;

                    }

                }


                if (
                    type === 'CONFUSION' ||
                    type === 'CONFUSION_CHANCE'
                ) {

                    if (
                        Number(

                            target
                                ._gmConfusionTurns ||

                            0

                        ) <= 0
                    ) {

                        return false;

                    }

                }


                if (
                    type === 'DRAIN' ||
                    type === 'RECOIL' ||
                    type === 'HEAL_HP'
                ) {

                    return false;

                }

            }


            return (
                Number(
                    move.power || 0
                ) <= 0
            );

        };


    // =========================================================
    // IA RIVAL
    // =========================================================

    Scene_GranadaMonBattle
        .prototype
        .enemyMove =
        function() {

            var enemy =
                GM.Battle.enemy;


            var target =
                GM.Battle.playerPokemon;


            if (
                !enemy ||
                !enemy.moves
            ) {

                return null;

            }


            var usable =
                [];


            var damaging =
                [];


            for (
                var i = 0;
                i < enemy.moves.length;
                i++
            ) {

                var instance =
                    enemy.moves[i];


                if (
                    !instance ||
                    Number(
                        instance.currentPP ||
                        0
                    ) <= 0
                ) {

                    continue;

                }


                var move =
                    GM.getMove(
                        instance.id
                    );


                if (!move) {

                    continue;

                }


                if (
                    FX.isUselessStatusMove(
                        move,
                        target
                    )
                ) {

                    continue;

                }


                usable.push(
                    instance
                );


                if (
                    Number(
                        move.power || 0
                    ) > 0
                ) {

                    damaging.push(
                        instance
                    );

                }

            }


            // Fallback para que nunca se quede bloqueado.

            if (
                usable.length === 0
            ) {

                for (
                    var j = 0;
                    j < enemy.moves.length;
                    j++
                ) {

                    var fallback =
                        enemy.moves[j];


                    if (
                        fallback &&
                        Number(
                            fallback.currentPP ||
                            0
                        ) > 0
                    ) {

                        usable.push(
                            fallback
                        );


                        var fallbackMove =
                            GM.getMove(
                                fallback.id
                            );


                        if (
                            fallbackMove &&
                            Number(
                                fallbackMove.power ||
                                0
                            ) > 0
                        ) {

                            damaging.push(
                                fallback
                            );

                        }

                    }

                }

            }


            if (
                usable.length === 0
            ) {

                return null;

            }


            // Normalmente prioriza movimientos ofensivos,
            // pero puede usar movimientos tácticos.

            if (
                damaging.length > 0 &&
                Math.random() < 0.80
            ) {

                return damaging[

                    Math.floor(

                        Math.random() *
                        damaging.length

                    )

                ];

            }


            return usable[

                Math.floor(

                    Math.random() *
                    usable.length

                )

            ];

        };


    // =========================================================
    // EJECUTAR MOVIMIENTO
    // =========================================================

    Scene_GranadaMonBattle
        .prototype
        .performMove =
        function(
            attacker,
            defender,
            instance,
            move,
            messages
        ) {

            if (
                !attacker ||
                !defender ||
                !instance ||
                !move
            ) {

                return null;

            }


            // =================================================
            // CONSUMIR PP
            // =========================================================

            GM.useMovePP(
                instance
            );


            messages.push(

                attacker.name +
                ' usa ' +
                move.name +
                '.'

            );


            // =================================================
            // ¿PUEDE ACTUAR?
            // =========================================================

            if (
                !FX.canAct(
                    attacker,
                    messages
                )
            ) {

                attacker
                    ._gmActedThisTurn =
                    true;


                return {

                    acted:
                        false,

                    hit:
                        false,

                    damage:
                        0

                };

            }


            attacker
                ._gmActedThisTurn =
                true;


            // =================================================
            // PROTECT
            // =========================================================

            if (
                FX.isProtected(
                    defender,
                    move
                )
            ) {

                messages.push(

                    '¡' +
                    defender.name +
                    ' se ha protegido!'

                );


                return {

                    acted:
                        true,

                    hit:
                        true,

                    damage:
                        0,

                    protected:
                        true

                };

            }


            // =================================================
            // MULTIGOLPE
            // =========================================================

            var multi =
                FX.multiHitInfo(
                    move
                );


            var hits =
                multi

                    ? FX.randomInt(
                        multi.min,
                        multi.max
                    )

                    : 1;


            var totalDamage =
                0;


            var finalResult =
                null;


            var landedHits =
                0;


            for (
                var hitIndex = 0;
                hitIndex < hits;
                hitIndex++
            ) {

                if (
                    Number(
                        defender.hp || 0
                    ) <= 0
                ) {

                    break;

                }


                var result =
                    GM.calculateDamage(

                        attacker,
                        defender,
                        move

                    );


                finalResult =
                    result;


                if (
                    !result ||
                    !result.hit
                ) {

                    if (
                        hitIndex === 0
                    ) {

                        messages.push(
                            '¡El ataque ha fallado!'
                        );


                        return (

                            result ||

                            {

                                acted:
                                    true,

                                hit:
                                    false,

                                damage:
                                    0

                            }

                        );

                    }


                    break;

                }


                landedHits++;


                var override =
                    FX.damageOverride(

                        move,
                        attacker,
                        defender

                    );


                var damage =

                    override != null

                        ? override

                        : Math.max(

                            0,

                            Number(
                                result.damage ||
                                0
                            )

                        );


                var oldHp =
                    Math.max(

                        0,

                        Number(
                            defender.hp ||
                            0
                        )

                    );


                if (
                    damage > 0
                ) {

                    GM.applyDamage(
                        defender,
                        damage
                    );

                }


                totalDamage +=
                    Math.max(

                        0,

                        oldHp -

                        Math.max(

                            0,

                            Number(
                                defender.hp ||
                                0
                            )

                        )

                    );


                if (
                    result.critical
                ) {

                    messages.push(
                        '¡Golpe crítico!'
                    );

                }


                if (
                    result.message &&
                    hitIndex === 0
                ) {

                    messages.push(
                        result.message
                    );

                }

            }


            if (
                multi &&
                landedHits > 1
            ) {

                messages.push(

                    'Ha golpeado ' +
                    landedHits +
                    ' veces.'

                );

            }


            // =================================================
            // EFECTOS POSTERIORES
            // =========================================================

            FX.applyPostMoveEffects(

                attacker,
                defender,
                move,
                totalDamage,
                messages

            );


            if (
                Number(
                    defender.hp || 0
                ) <= 0
            ) {

                messages.push(

                    defender.name +
                    ' se ha debilitado.'

                );

            }


            return (

                finalResult ||

                {

                    acted:
                        true,

                    hit:
                        true,

                    damage:
                        totalDamage

                }

            );

        };


    // =========================================================
    // TURNO COMPLETO
    // =========================================================

    Scene_GranadaMonBattle
        .prototype
        .executeTurn =
        function(
            playerInstance,
            playerMove
        ) {

            var player =
                GM.Battle.playerPokemon;


            var enemy =
                GM.Battle.enemy;


            // =================================================
            // PREPARAR TURNO
            // =========================================================

            player
                ._gmActedThisTurn =
                false;


            enemy
                ._gmActedThisTurn =
                false;


            player._gmProtected =
                false;


            enemy._gmProtected =
                false;


            // =================================================
            // MOVIMIENTO RIVAL
            // =========================================================

            var enemyInstance =
                this.enemyMove();


            var enemyMove =

                enemyInstance

                    ? GM.getMove(
                        enemyInstance.id
                    )

                    : null;


            var order =

                enemyMove

                    ? GM.compareTurnOrder(

                        player,
                        playerMove,

                        enemy,
                        enemyMove

                    )

                    : -1;


            var messages =
                [];


            // =================================================
            // ORDEN DEL TURNO
            // =========================================================

            if (
                order <= 0
            ) {

                this.performMove(

                    player,
                    enemy,

                    playerInstance,
                    playerMove,

                    messages

                );


                if (
                    Number(
                        enemy.hp || 0
                    ) > 0 &&
                    enemyMove
                ) {

                    this.performMove(

                        enemy,
                        player,

                        enemyInstance,
                        enemyMove,

                        messages

                    );

                }

            }

            else {

                this.performMove(

                    enemy,
                    player,

                    enemyInstance,
                    enemyMove,

                    messages

                );


                if (
                    Number(
                        player.hp || 0
                    ) > 0
                ) {

                    this.performMove(

                        player,
                        enemy,

                        playerInstance,
                        playerMove,

                        messages

                    );

                }

            }


            // =================================================
            // DEBILITADO POR ATAQUE
            // =========================================================

            if (
                Number(
                    enemy.hp || 0
                ) <= 0
            ) {

                this
                    .refreshGMBattleEffectsUI();


                this
                    ._logWindow
                    .setText(
                        messages.join(
                            '\n'
                        )
                    );


                this.winBattle();


                return;

            }


            if (
                Number(
                    player.hp || 0
                ) <= 0
            ) {

                this
                    .refreshGMBattleEffectsUI();


                this
                    ._logWindow
                    .setText(
                        messages.join(
                            '\n'
                        )
                    );


                this
                    .loseCurrentPokemon();


                return;

            }


            // =================================================
            // FINAL DE TURNO
            // =========================================================

            FX.applyEndTurn(
                messages
            );


            this
                .refreshGMBattleEffectsUI();


            this
                ._logWindow
                .setText(
                    messages.join(
                        '\n'
                    )
                );


            // =================================================
            // DEBILITADO POR ESTADOS
            // =========================================================

            if (
                Number(
                    GM.Battle.enemy.hp ||
                    0
                ) <= 0
            ) {

                this.winBattle();


                return;

            }


            if (
                Number(
                    GM.Battle
                        .playerPokemon
                        .hp ||
                    0
                ) <= 0
            ) {

                this
                    .loseCurrentPokemon();


                return;

            }


            this
                ._commandWindow
                .activate();


            this
                ._commandWindow
                .select(
                    0
                );

        };


    // =========================================================
    // TURNO GRATIS DEL RIVAL
    // =========================================================

    Scene_GranadaMonBattle
        .prototype
        .enemyFreeTurn =
        function() {

            var player =
                GM.Battle.playerPokemon;


            var enemy =
                GM.Battle.enemy;


            player
                ._gmActedThisTurn =
                false;


            enemy
                ._gmActedThisTurn =
                false;


            player._gmProtected =
                false;


            enemy._gmProtected =
                false;


            var enemyInstance =
                this.enemyMove();


            if (!enemyInstance) {

                this
                    ._commandWindow
                    .activate();


                return;

            }


            var move =
                GM.getMove(
                    enemyInstance.id
                );


            var messages =
                [];


            this.performMove(

                enemy,
                player,

                enemyInstance,
                move,

                messages

            );


            if (
                Number(
                    player.hp || 0
                ) > 0 &&

                Number(
                    enemy.hp || 0
                ) > 0
            ) {

                FX.applyEndTurn(
                    messages
                );

            }


            this
                .refreshGMBattleEffectsUI();


            this
                ._logWindow
                .setText(
                    messages.join(
                        '\n'
                    )
                );


            if (
                Number(
                    enemy.hp || 0
                ) <= 0
            ) {

                this.winBattle();

                return;

            }


            if (
                Number(
                    player.hp || 0
                ) <= 0
            ) {

                this
                    .loseCurrentPokemon();


                return;

            }


            this
                ._commandWindow
                .activate();


            this
                ._commandWindow
                .select(
                    0
                );

        };


    // =========================================================
    // REFRESCAR SPRITE TRAS AUTO-CAMBIO
    // =========================================================

    if (
        Scene_GranadaMonBattle
            .prototype
            .loseCurrentPokemon &&

        !FX._loseCurrentWrapped
    ) {

        FX._loseCurrentWrapped =
            true;


        FX._originalLoseCurrentPokemon =
            Scene_GranadaMonBattle
                .prototype
                .loseCurrentPokemon;


        Scene_GranadaMonBattle
            .prototype
            .loseCurrentPokemon =
            function() {

                var oldPokemon =
                    GM.Battle
                        .playerPokemon;


                FX
                    ._originalLoseCurrentPokemon
                    .call(
                        this
                    );


                if (
                    !this._battleEnded &&

                    GM.Battle
                        .playerPokemon &&

                    GM.Battle
                        .playerPokemon !==
                        oldPokemon
                ) {

                    if (
                        this
                            .refreshGMSwitchedPokemonVisual
                    ) {

                        this
                            .refreshGMSwitchedPokemonVisual();

                    }

                    else if (
                        GM.BattleSprites &&
                        GM.BattleSprites
                            .refreshPlayer
                    ) {

                        GM.BattleSprites
                            .refreshPlayer(
                                this
                            );

                    }

                }

            };

    }


    // =========================================================
    // NO CAMBIAR SI ESTÁ ATRAPADO
    // =========================================================

    if (
        Scene_GranadaMonBattle
            .prototype
            .commandPokemon &&

        !FX._commandPokemonWrapped
    ) {

        FX._commandPokemonWrapped =
            true;


        FX._originalCommandPokemon =
            Scene_GranadaMonBattle
                .prototype
                .commandPokemon;


        Scene_GranadaMonBattle
            .prototype
            .commandPokemon =
            function() {

                var active =
                    GM.Battle
                        .playerPokemon;


                if (
                    active &&

                    Number(

                        active
                            ._gmTrappedTurns ||

                        0

                    ) > 0
                ) {

                    SoundManager
                        .playBuzzer();


                    this
                        ._logWindow
                        .setText(

                            '¡' +
                            active.name +
                            ' está atrapado y no puede ser cambiado!'

                        );


                    this
                        ._commandWindow
                        .activate();


                    return;

                }


                FX
                    ._originalCommandPokemon
                    .call(
                        this
                    );

            };

    }


    // =========================================================
    // COMANDOS DE PRUEBA
    // =========================================================

    var _GMBattleEffects_pluginCommand =
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

            _GMBattleEffects_pluginCommand
                .call(
                    this,
                    command,
                    args
                );


            if (
                command ===
                'GranadaMonForceNextSecondary'
            ) {

                FX.forceNextSecondary =
                    true;


                $gameMessage.add(
                    'El siguiente efecto secundario será forzado.'
                );

            }

        };


    // =========================================================
    // CARGADO
    // =========================================================

    console.log(
        'GranadaMon BattleEffects v2.0 cargado correctamente.'
    );


})();