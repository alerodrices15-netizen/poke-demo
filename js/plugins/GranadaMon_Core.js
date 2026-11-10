/*:
 * @plugindesc v1.0 GranadaMon - Núcleo de datos Pokémon para RPG Maker MV
 * @author OpenAI
 *
 * @help
 * GranadaMon_Core.js
 * ------------------------------------------------------------
 * Requiere GranadaMon_Menu.js.
 *
 * Mantiene separada:
 * - La base de datos de especies.
 * - La Pokédex descubierta por cada jugador.
 * - Los Pokémon individuales capturados.
 *
 * Orden:
 * 1. GranadaMon_Menu.js
 * 2. GranadaMon_Core.js
 * 3. GranadaMon_Data.js
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    GM.version = '1.0';

    GM.SpeciesByNational =
        GM.SpeciesByNational || {};

    GM.SpeciesByGranadaDex =
        GM.SpeciesByGranadaDex || [];

    GM.SpeciesList =
        GM.SpeciesList || [];

    GM.totalSpecies = 0;


    // =========================================================
    // REGISTRAR ESPECIES
    // =========================================================

    GM.registerSpecies = function(data) {

        if (!data) return;

        if (
            data.nationalDex == null ||
            data.granadaDex == null
        ) {
            return;
        }

        GM.SpeciesByNational[
            data.nationalDex
        ] = data;

        GM.SpeciesByGranadaDex[
            data.granadaDex
        ] = data;


        var found = false;

        for (
            var i = 0;
            i < GM.SpeciesList.length;
            i++
        ) {

            if (
                GM.SpeciesList[i].nationalDex ===
                data.nationalDex
            ) {

                GM.SpeciesList[i] = data;

                found = true;

                break;

            }

        }


        if (!found) {

            GM.SpeciesList.push(data);

        }


        GM.SpeciesList.sort(
            function(a, b) {

                return (
                    a.granadaDex -
                    b.granadaDex
                );

            }
        );


        GM.totalSpecies =
            GM.SpeciesList.length;

    };


    // =========================================================
    // CONSULTAR ESPECIES
    // =========================================================

    GM.getSpecies = function(nationalDex) {

        return (
            GM.SpeciesByNational[
                Number(nationalDex)
            ] || null
        );

    };


    GM.getSpeciesByGranadaDex =
        function(granadaDex) {

            return (
                GM.SpeciesByGranadaDex[
                    Number(granadaDex)
                ] || null
            );

        };


    // =========================================================
    // SINCRONIZAR POKÉDEX
    // =========================================================

    GM.syncDex = function() {

        if (!$gameSystem) return;


        if (!$gameSystem._granadaMonDex) {

            $gameSystem._granadaMonDex = [];

        }


        var oldDex =
            $gameSystem._granadaMonDex;

        var newDex = [];


        for (
            var i = 1;
            i <= GM.totalSpecies;
            i++
        ) {

            var species =
                GM.getSpeciesByGranadaDex(i);


            if (!species) continue;


            var previous =
                oldDex[i - 1] || {};


            newDex[i - 1] = {

                id: i,

                speciesId:
                    species.nationalDex,

                name:
                    species.name,

                seen:
                    previous.seen === true,

                caught:
                    previous.caught === true

            };

        }


        $gameSystem._granadaMonDex =
            newDex;

    };


    // =========================================================
    // OBTENER ENTRADA POKÉDEX
    // =========================================================

    GM.getDexEntry =
        function(nationalDex) {

            if (!$gameSystem) {
                return null;
            }


            GM.syncDex();


            var species =
                GM.getSpecies(
                    nationalDex
                );


            if (!species) {
                return null;
            }


            return (
                $gameSystem
                    ._granadaMonDex[
                        species.granadaDex - 1
                    ] || null
            );

        };


    // =========================================================
    // MARCAR COMO VISTO
    // =========================================================

    GM.markSeen =
        function(nationalDex) {

            var entry =
                GM.getDexEntry(
                    nationalDex
                );


            if (!entry) {
                return false;
            }


            entry.seen = true;

            return true;

        };


    // =========================================================
    // MARCAR COMO CAPTURADO
    // =========================================================

    GM.markCaught =
        function(nationalDex) {

            var entry =
                GM.getDexEntry(
                    nationalDex
                );


            if (!entry) {
                return false;
            }


            entry.seen = true;

            entry.caught = true;

            return true;

        };


    // =========================================================
    // CALCULAR ESTADÍSTICAS
    // =========================================================
    //
    // De momento:
    //
    // IV = 15
    // EV = 0
    // Naturaleza neutra
    //
    // Esto podremos ampliar sin tocar GranadaMon_Data.js.
    // =========================================================

    GM.calculateStats =
        function(species, level) {

            level =
                Math.max(
                    1,
                    Math.min(
                        100,
                        Number(level || 1)
                    )
                );


            var b =
                species.baseStats;


            var iv = 15;


            var hp =
                Math.floor(
                    (
                        (
                            2 * b.hp +
                            iv
                        ) *
                        level
                    ) /
                    100
                ) +
                level +
                10;


            function other(base) {

                return (
                    Math.floor(
                        (
                            (
                                2 * base +
                                iv
                            ) *
                            level
                        ) /
                        100
                    ) +
                    5
                );

            }


            return {

                hp:
                    hp,

                attack:
                    other(
                        b.attack
                    ),

                defense:
                    other(
                        b.defense
                    ),

                spAttack:
                    other(
                        b.spAttack
                    ),

                spDefense:
                    other(
                        b.spDefense
                    ),

                speed:
                    other(
                        b.speed
                    )

            };

        };


    // =========================================================
    // ID ÚNICO PARA CADA POKÉMON
    // =========================================================

    GM.makeUid = function() {

        return (
            'GM_' +
            Date.now()
                .toString(36) +
            '_' +
            Math.floor(
                Math.random() *
                1000000000
            ).toString(36)
        );

    };


    // =========================================================
    // CREAR POKÉMON INDIVIDUAL
    // =========================================================

    GM.createPokemon =
        function(
            nationalDex,
            level
        ) {

            var species =
                GM.getSpecies(
                    nationalDex
                );


            if (!species) {
                return null;
            }


            level =
                Math.max(
                    1,
                    Math.min(
                        100,
                        Number(level || 1)
                    )
                );


            var stats =
                GM.calculateStats(
                    species,
                    level
                );


            return {

                uid:
                    GM.makeUid(),

                speciesId:
                    species.nationalDex,

                granadaDex:
                    species.granadaDex,

                name:
                    species.name,

                nickname:
                    null,

                level:
                    level,

                exp:
                    0,

                types:
                    species.types.slice(0),

                hp:
                    stats.hp,

                maxHp:
                    stats.hp,

                attack:
                    stats.attack,

                defense:
                    stats.defense,

                spAttack:
                    stats.spAttack,

                spDefense:
                    stats.spDefense,

                speed:
                    stats.speed,

                status:
                    null,

                moves:
                    [],

                heldItem:
                    null

            };

        };


    // =========================================================
    // AÑADIR POKÉMON
    // =========================================================

    GM.addPokemon =
        function(
            nationalDex,
            level
        ) {

            if (!$gameSystem) {
                return null;
            }


            var pokemon =
                GM.createPokemon(
                    nationalDex,
                    level
                );


            if (!pokemon) {
                return null;
            }


            if (
                !$gameSystem
                    ._granadaMonParty
            ) {

                $gameSystem
                    ._granadaMonParty = [];

            }


            if (
                !$gameSystem
                    ._granadaMonStorage
            ) {

                $gameSystem
                    ._granadaMonStorage = [];

            }


            // EQUIPO MÁXIMO DE 6

            if (
                $gameSystem
                    ._granadaMonParty
                    .length < 6
            ) {

                $gameSystem
                    ._granadaMonParty
                    .push(pokemon);

            }

            else {

                $gameSystem
                    ._granadaMonStorage
                    .push(pokemon);

            }


            GM.markCaught(
                nationalDex
            );


            return pokemon;

        };


    // =========================================================
    // NUEVAS PARTIDAS
    // =========================================================

    var _Game_System_initialize =
        Game_System
            .prototype
            .initialize;


    Game_System
        .prototype
        .initialize =
        function() {

            _Game_System_initialize
                .call(this);


            if (
                !this
                    ._granadaMonParty
            ) {

                this
                    ._granadaMonParty = [];

            }


            if (
                !this
                    ._granadaMonStorage
            ) {

                this
                    ._granadaMonStorage = [];

            }


            GM.syncDex();

        };


    // =========================================================
    // PARTIDAS GUARDADAS ANTIGUAS
    // =========================================================

    var _DataManager_extractSaveContents =
        DataManager
            .extractSaveContents;


    DataManager
        .extractSaveContents =
        function(contents) {

            _DataManager_extractSaveContents
                .call(
                    this,
                    contents
                );


            if (
                !$gameSystem
                    ._granadaMonParty
            ) {

                $gameSystem
                    ._granadaMonParty = [];

            }


            if (
                !$gameSystem
                    ._granadaMonStorage
            ) {

                $gameSystem
                    ._granadaMonStorage = [];

            }


            GM.syncDex();

        };


    // =========================================================
    // COMANDOS PREPARADOS PARA EVENTOS
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


            if (
                command ===
                'GranadaMonSeen'
            ) {

                GM.markSeen(
                    Number(
                        args[0]
                    )
                );

            }


            if (
                command ===
                'GranadaMonCaught'
            ) {

                GM.markCaught(
                    Number(
                        args[0]
                    )
                );

            }


            if (
                command ===
                'GranadaMonGive'
            ) {

                var speciesId =
                    Number(
                        args[0]
                    );


                var level =
                    Number(
                        args[1] || 1
                    );


                GM.addPokemon(
                    speciesId,
                    level
                );

            }

        };


})();