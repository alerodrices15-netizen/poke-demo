/*:
 * @plugindesc v1.0 GranadaMon - Experiencia y niveles
 * @author OpenAI
 *
 * @help
 * GranadaMon_Experience.js
 * ------------------------------------------------------------
 * ORDEN:
 *
 * GranadaMon_Menu
 * GranadaMon_Core
 * GranadaMon_Data
 * GranadaMon_Moves
 * GranadaMon_Experience
 * GranadaMon_Dex
 *
 * FUNCIONES:
 * - Nivel 1 a 100
 * - Experiencia acumulada
 * - Subida de uno o varios niveles
 * - Recalcula estadísticas
 * - Conserva correctamente los PS
 * - Comprueba movimientos al subir de nivel
 * - Soporta las 6 curvas de EXP de Pokémon
 *
 * COMANDO DE PRUEBA:
 *
 * GranadaMonGainExp SLOT EXP
 *
 * Ejemplo:
 *
 * GranadaMonGainExp 1 100
 *
 * Da 100 EXP al Pokémon del primer hueco del equipo.
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
        !GM.calculateStats
    ) {

        throw new Error(
            'GranadaMon_Experience necesita GranadaMon_Core.js.'
        );

    }


    // =========================================================
    // CONFIGURACIÓN
    // =========================================================

    GM.Experience =
        GM.Experience || {};

    GM.Experience.version =
        '1.0';

    GM.Experience.MAX_LEVEL =
        100;


    // =========================================================
    // CURVAS DE EXPERIENCIA
    // =========================================================

    GM.GrowthRate = {

        FAST:
            'FAST',

        MEDIUM_FAST:
            'MEDIUM_FAST',

        MEDIUM_SLOW:
            'MEDIUM_SLOW',

        SLOW:
            'SLOW',

        ERRATIC:
            'ERRATIC',

        FLUCTUATING:
            'FLUCTUATING'

    };


    // =========================================================
    // NORMALIZAR CURVA
    // =========================================================

    GM.normalizeGrowthRate =
        function(rate) {

            if (!rate) {

                return GM.GrowthRate.MEDIUM_FAST;

            }


            var value =
                String(rate)
                    .toUpperCase()
                    .replace(/-/g, '_')
                    .replace(/ /g, '_');


            switch (value) {

                case 'FAST':
                    return GM.GrowthRate.FAST;

                case 'MEDIUM_FAST':
                    return GM.GrowthRate.MEDIUM_FAST;

                case 'MEDIUM_SLOW':
                    return GM.GrowthRate.MEDIUM_SLOW;

                case 'SLOW':
                    return GM.GrowthRate.SLOW;

                case 'ERRATIC':
                    return GM.GrowthRate.ERRATIC;

                case 'FLUCTUATING':
                    return GM.GrowthRate.FLUCTUATING;

            }


            return GM.GrowthRate.MEDIUM_FAST;

        };


    // =========================================================
    // CURVA DE UNA ESPECIE
    // =========================================================

    GM.getGrowthRate =
        function(species) {

            if (!species) {

                return GM.GrowthRate.MEDIUM_FAST;

            }


            return GM.normalizeGrowthRate(
                species.growthRate
            );

        };


    // =========================================================
    // EXP TOTAL NECESARIA PARA UN NIVEL
    // =========================================================

    GM.expForLevel =
        function(
            level,
            growthRate
        ) {

            level =
                Math.max(
                    1,
                    Math.min(
                        GM.Experience.MAX_LEVEL,
                        Math.floor(
                            Number(level || 1)
                        )
                    )
                );


            // Nivel 1 empieza en 0 EXP

            if (level <= 1) {

                return 0;

            }


            var n =
                level;


            var n2 =
                n * n;


            var n3 =
                n2 * n;


            var rate =
                GM.normalizeGrowthRate(
                    growthRate
                );


            var exp =
                0;


            // -------------------------------------------------
            // FAST
            // -------------------------------------------------

            if (
                rate ===
                GM.GrowthRate.FAST
            ) {

                exp =
                    Math.floor(
                        4 * n3 / 5
                    );

            }


            // -------------------------------------------------
            // MEDIUM FAST
            // -------------------------------------------------

            else if (
                rate ===
                GM.GrowthRate.MEDIUM_FAST
            ) {

                exp =
                    n3;

            }


            // -------------------------------------------------
            // MEDIUM SLOW
            // -------------------------------------------------

            else if (
                rate ===
                GM.GrowthRate.MEDIUM_SLOW
            ) {

                exp =
                    Math.floor(
                        (
                            6 * n3 / 5
                        ) -
                        (
                            15 * n2
                        ) +
                        (
                            100 * n
                        ) -
                        140
                    );

            }


            // -------------------------------------------------
            // SLOW
            // -------------------------------------------------

            else if (
                rate ===
                GM.GrowthRate.SLOW
            ) {

                exp =
                    Math.floor(
                        5 * n3 / 4
                    );

            }


            // -------------------------------------------------
            // ERRATIC
            // -------------------------------------------------

            else if (
                rate ===
                GM.GrowthRate.ERRATIC
            ) {

                if (n <= 50) {

                    exp =
                        Math.floor(
                            n3 *
                            (100 - n) /
                            50
                        );

                }

                else if (n <= 68) {

                    exp =
                        Math.floor(
                            n3 *
                            (150 - n) /
                            100
                        );

                }

                else if (n <= 98) {

                    exp =
                        Math.floor(
                            n3 *
                            Math.floor(
                                (1911 - 10 * n) / 3
                            ) /
                            500
                        );

                }

                else {

                    exp =
                        Math.floor(
                            n3 *
                            (160 - n) /
                            100
                        );

                }

            }


            // -------------------------------------------------
            // FLUCTUATING
            // -------------------------------------------------

            else if (
                rate ===
                GM.GrowthRate.FLUCTUATING
            ) {

                if (n <= 15) {

                    exp =
                        Math.floor(
                            n3 *
                            (
                                Math.floor(
                                    (n + 1) / 3
                                ) +
                                24
                            ) /
                            50
                        );

                }

                else if (n <= 35) {

                    exp =
                        Math.floor(
                            n3 *
                            (n + 14) /
                            50
                        );

                }

                else {

                    exp =
                        Math.floor(
                            n3 *
                            (
                                Math.floor(
                                    n / 2
                                ) +
                                32
                            ) /
                            50
                        );

                }

            }


            return Math.max(
                0,
                exp
            );

        };


    // =========================================================
    // EXP PARA UNA ESPECIE
    // =========================================================

    GM.expForSpeciesLevel =
        function(
            species,
            level
        ) {

            return GM.expForLevel(

                level,

                GM.getGrowthRate(
                    species
                )

            );

        };


    // =========================================================
    // EXP MÍNIMA DEL NIVEL ACTUAL
    // =========================================================

    GM.minimumExpForPokemon =
        function(pokemon) {

            if (!pokemon) {

                return 0;

            }


            var species =
                GM.getSpecies(
                    pokemon.speciesId
                );


            return GM.expForSpeciesLevel(

                species,

                pokemon.level || 1

            );

        };


    // =========================================================
    // EXP NECESARIA PARA EL SIGUIENTE NIVEL
    // =========================================================

    GM.nextLevelExp =
        function(pokemon) {

            if (!pokemon) {

                return 0;

            }


            var level =
                Number(
                    pokemon.level || 1
                );


            var species =
                GM.getSpecies(
                    pokemon.speciesId
                );


            if (
                level >=
                GM.Experience.MAX_LEVEL
            ) {

                return GM.expForSpeciesLevel(
                    species,
                    GM.Experience.MAX_LEVEL
                );

            }


            return GM.expForSpeciesLevel(

                species,

                level + 1

            );

        };


    // =========================================================
    // EXP QUE FALTA
    // =========================================================

    GM.expRemaining =
        function(pokemon) {

            if (!pokemon) {

                return 0;

            }


            if (
                pokemon.level >=
                GM.Experience.MAX_LEVEL
            ) {

                return 0;

            }


            return Math.max(

                0,

                GM.nextLevelExp(
                    pokemon
                ) -
                Number(
                    pokemon.exp || 0
                )

            );

        };


    // =========================================================
    // NIVEL CORRESPONDIENTE A UNA EXP
    // =========================================================

    GM.levelFromExp =
        function(
            species,
            exp
        ) {

            exp =
                Math.max(
                    0,
                    Number(exp || 0)
                );


            var level =
                1;


            for (
                var i = 2;
                i <=
                GM.Experience.MAX_LEVEL;
                i++
            ) {

                var required =
                    GM.expForSpeciesLevel(
                        species,
                        i
                    );


                if (
                    exp >= required
                ) {

                    level =
                        i;

                }

                else {

                    break;

                }

            }


            return level;

        };


    // =========================================================
    // MIGRAR POKÉMON ANTIGUOS
    // =========================================================
    //
    // Los Pokémon que creamos antes de este plugin tenían
    // EXP = 0 aunque fueran de nivel 5.
    //
    // Aquí se corrige una sola vez.
    // =========================================================

    GM.ensurePokemonExperience =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            if (
                pokemon._gmExperienceV1 ===
                true
            ) {

                return;

            }


            var minimum =
                GM.minimumExpForPokemon(
                    pokemon
                );


            if (
                pokemon.exp == null ||
                Number(pokemon.exp) <
                minimum
            ) {

                pokemon.exp =
                    minimum;

            }


            pokemon.pendingMoves =
                pokemon.pendingMoves ||
                [];


            pokemon._gmExperienceV1 =
                true;

        };


    // =========================================================
    // MIGRAR TODO EL EQUIPO Y ALMACENAMIENTO
    // =========================================================

    GM.ensureAllPokemonExperience =
        function() {

            if (!$gameSystem) {

                return;

            }


            var party =
                $gameSystem._granadaMonParty ||
                [];


            var storage =
                $gameSystem._granadaMonStorage ||
                [];


            var i;


            for (
                i = 0;
                i < party.length;
                i++
            ) {

                GM.ensurePokemonExperience(
                    party[i]
                );

            }


            for (
                i = 0;
                i < storage.length;
                i++
            ) {

                GM.ensurePokemonExperience(
                    storage[i]
                );

            }

        };


    // =========================================================
    // RECALCULAR ESTADÍSTICAS AL SUBIR NIVEL
    // =========================================================

    GM.recalculatePokemonStats =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            var species =
                GM.getSpecies(
                    pokemon.speciesId
                );


            if (!species) {

                return;

            }


            var oldMaxHp =
                Number(
                    pokemon.maxHp || 1
                );


            var oldHp =
                Number(
                    pokemon.hp || 0
                );


            var wasFainted =
                oldHp <= 0;


            var missingHp =
                Math.max(
                    0,
                    oldMaxHp - oldHp
                );


            var stats =
                GM.calculateStats(

                    species,

                    pokemon.level

                );


            pokemon.maxHp =
                stats.hp;


            if (wasFainted) {

                pokemon.hp =
                    0;

            }

            else {

                pokemon.hp =
                    Math.max(

                        1,

                        pokemon.maxHp -
                        missingHp

                    );

            }


            pokemon.attack =
                stats.attack;

            pokemon.defense =
                stats.defense;

            pokemon.spAttack =
                stats.spAttack;

            pokemon.spDefense =
                stats.spDefense;

            pokemon.speed =
                stats.speed;

        };


    // =========================================================
    // APRENDER MOVIMIENTOS AL SUBIR
    // =========================================================

    GM.processLevelMoves =
        function(
            pokemon,
            level,
            result
        ) {

            if (
                !GM.getMovesAtLevel ||
                !GM.learnMove
            ) {

                return;

            }


            var moves =
                GM.getMovesAtLevel(

                    pokemon.speciesId,

                    level

                );


            for (
                var i = 0;
                i < moves.length;
                i++
            ) {

                var moveId =
                    moves[i];


                // Ya lo conoce

                if (
                    GM.pokemonKnowsMove &&
                    GM.pokemonKnowsMove(
                        pokemon,
                        moveId
                    )
                ) {

                    continue;

                }


                // ---------------------------------------------
                // Tiene hueco
                // ---------------------------------------------

                if (
                    pokemon.moves.length <
                    4
                ) {

                    if (
                        GM.learnMove(
                            pokemon,
                            moveId
                        )
                    ) {

                        result.learnedMoves.push(
                            moveId
                        );

                    }

                }


                // ---------------------------------------------
                // Ya tiene 4 movimientos
                // ---------------------------------------------

                else {

                    pokemon.pendingMoves =
                        pokemon.pendingMoves ||
                        [];


                    if (
                        pokemon.pendingMoves.indexOf(
                            moveId
                        ) === -1
                    ) {

                        pokemon.pendingMoves.push(
                            moveId
                        );


                        result.pendingMoves.push(
                            moveId
                        );

                    }

                }

            }

        };


    // =========================================================
    // SUBIR UN NIVEL
    // =========================================================

    GM.levelUpPokemon =
        function(
            pokemon,
            newLevel,
            result
        ) {

            if (!pokemon) {

                return;

            }


            pokemon.level =
                newLevel;


            GM.recalculatePokemonStats(
                pokemon
            );


            result.levelsGained++;


            result.newLevels.push(
                newLevel
            );


            GM.processLevelMoves(

                pokemon,

                newLevel,

                result

            );

        };


    // =========================================================
    // GANAR EXPERIENCIA
    // =========================================================

    GM.gainExp =
        function(
            pokemon,
            amount
        ) {

            var result = {

                success:
                    false,

                amount:
                    0,

                oldLevel:
                    pokemon
                        ? pokemon.level
                        : 0,

                newLevel:
                    pokemon
                        ? pokemon.level
                        : 0,

                levelsGained:
                    0,

                newLevels:
                    [],

                learnedMoves:
                    [],

                pendingMoves:
                    []

            };


            if (!pokemon) {

                return result;

            }


            GM.ensurePokemonExperience(
                pokemon
            );


            amount =
                Math.max(
                    0,
                    Math.floor(
                        Number(amount || 0)
                    )
                );


            if (
                amount <= 0
            ) {

                return result;

            }


            var species =
                GM.getSpecies(
                    pokemon.speciesId
                );


            if (!species) {

                return result;

            }


            result.success =
                true;


            result.amount =
                amount;


            var maxExp =
                GM.expForSpeciesLevel(

                    species,

                    GM.Experience.MAX_LEVEL

                );


            pokemon.exp =
                Math.min(

                    maxExp,

                    Number(
                        pokemon.exp || 0
                    ) +
                    amount

                );


            // =================================================
            // SUBIR LOS NIVELES QUE CORRESPONDAN
            // =================================================

            while (
                pokemon.level <
                    GM.Experience.MAX_LEVEL
            ) {

                var required =
                    GM.expForSpeciesLevel(

                        species,

                        pokemon.level + 1

                    );


                if (
                    pokemon.exp <
                    required
                ) {

                    break;

                }


                GM.levelUpPokemon(

                    pokemon,

                    pokemon.level + 1,

                    result

                );

            }


            result.newLevel =
                pokemon.level;


            return result;

        };


    // =========================================================
    // CREAR NUEVOS POKÉMON
    // =========================================================

    var _GM_createPokemon =
        GM.createPokemon;


    GM.createPokemon =
        function(
            nationalDex,
            level
        ) {

            var pokemon =
                _GM_createPokemon.call(

                    GM,

                    nationalDex,

                    level

                );


            if (!pokemon) {

                return null;

            }


            var species =
                GM.getSpecies(
                    nationalDex
                );


            pokemon.exp =
                GM.expForSpeciesLevel(

                    species,

                    pokemon.level

                );


            pokemon.pendingMoves =
                [];


            pokemon._gmExperienceV1 =
                true;


            return pokemon;

        };


    // =========================================================
    // PIKACHU
    // =========================================================
    //
    // Pikachu usa la curva Medium Fast.
    //
    // Las especies que todavía no tengan growthRate definido
    // utilizarán Medium Fast como fallback de seguridad.
    // =========================================================

    var pikachu =
        GM.getSpecies(25);


    if (pikachu) {

        pikachu.growthRate =
            GM.GrowthRate.MEDIUM_FAST;

    }


    // =========================================================
    // CARGAR PARTIDAS
    // =========================================================

    var _DataManager_extractSaveContents =
        DataManager.extractSaveContents;


    DataManager.extractSaveContents =
        function(contents) {

            _DataManager_extractSaveContents.call(
                this,
                contents
            );


            GM.ensureAllPokemonExperience();

        };


    // =========================================================
    // COMANDO DE EVENTO
    // =========================================================

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;


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
                'GranadaMonGainExp'
            ) {

                return;

            }


            GM.ensureAllPokemonExperience();


            var slot =
                Number(
                    args[0] || 1
                ) - 1;


            var amount =
                Number(
                    args[1] || 0
                );


            var party =
                $gameSystem._granadaMonParty ||
                [];


            var pokemon =
                party[slot];


            if (!pokemon) {

                $gameMessage.add(
                    'No hay ningún Pokémon en ese hueco.'
                );

                return;

            }


            var result =
                GM.gainExp(

                    pokemon,

                    amount

                );


            if (!result.success) {

                return;

            }


            $gameMessage.add(

                pokemon.name +
                ' ha ganado ' +
                result.amount +
                ' puntos de EXP.'

            );


            if (
                result.levelsGained > 0
            ) {

                $gameMessage.add(

                    pokemon.name +
                    ' ha subido al nivel ' +
                    pokemon.level +
                    '.'

                );

            }


            // Movimientos aprendidos

            for (
                var i = 0;
                i < result.learnedMoves.length;
                i++
            ) {

                var learned =
                    GM.getMove(
                        result.learnedMoves[i]
                    );


                if (learned) {

                    $gameMessage.add(

                        pokemon.name +
                        ' ha aprendido ' +
                        learned.name +
                        '.'

                    );

                }

            }


            // Movimiento pendiente por tener 4

            for (
                var j = 0;
                j < result.pendingMoves.length;
                j++
            ) {

                var pending =
                    GM.getMove(
                        result.pendingMoves[j]
                    );


                if (pending) {

                    $gameMessage.add(

                        pokemon.name +
                        ' quiere aprender ' +
                        pending.name +
                        ', pero ya conoce 4 movimientos.'

                    );

                }

            }

        };


    // =========================================================
    // MOSTRAR EXP EN LA FICHA
    // =========================================================
    //
    // Añade información en la parte inferior sin tener
    // que sustituir otra vez GranadaMon_Menu.js.
    // =========================================================

    if (
        typeof Scene_GranadaMonSummary !==
        'undefined'
    ) {

        var _Scene_GM_Summary_createSummaryWindow =
            Scene_GranadaMonSummary
                .prototype
                .createSummaryWindow;


        Scene_GranadaMonSummary
            .prototype
            .createSummaryWindow =
            function() {

                _Scene_GM_Summary_createSummaryWindow
                    .call(this);


                var mon =
                    GranadaMon.Menu
                        .selectedPokemon;


                if (!mon) {

                    return;

                }


                GM.ensurePokemonExperience(
                    mon
                );


                var w =
                    this._summaryWindow;


                if (!w) {

                    return;

                }


                var y =
                    w.contentsHeight() -
                    w.lineHeight() -
                    8;


                w.changeTextColor(
                    w.systemColor()
                );


                if (
                    mon.level >=
                    GM.Experience.MAX_LEVEL
                ) {

                    w.drawText(

                        'EXP: NIVEL MÁXIMO',

                        20,

                        y,

                        w.contentsWidth() - 40,

                        'right'

                    );

                }

                else {

                    var next =
                        GM.nextLevelExp(
                            mon
                        );


                    var remaining =
                        GM.expRemaining(
                            mon
                        );


                    w.drawText(

                        'EXP: ' +
                        mon.exp +
                        ' / ' +
                        next +
                        '   |   Faltan: ' +
                        remaining,

                        20,

                        y,

                        w.contentsWidth() - 40,

                        'right'

                    );

                }


                w.resetTextColor();

            };

    }


    // =========================================================
    // MIGRACIÓN INICIAL
    // =========================================================

    if (
        window.$gameSystem
    ) {

        GM.ensureAllPokemonExperience();

    }


    console.log(
        'GranadaMon Experience v1.0 cargado.'
    );


})();