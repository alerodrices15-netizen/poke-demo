/*:
 * @plugindesc v3.1 GranadaMon - Movimientos completos para los 100 Pokémon
 * @author OpenAI
 *
 * GranadaMon_Moves.js
 * - 60 movimientos disponibles
 * - Hasta 4 movimientos por Pokémon
 * - Learnsets para los 100 Pokémon
 * - Compatible con BattleCore, Battle, Capture y BattleEffects
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (!GM.getSpecies || !GM.getSpeciesByGranadaDex || !GM.createPokemon) {
        throw new Error('GranadaMon_Moves necesita GranadaMon_Core.js y GranadaMon_Data.js encima.');
    }

    GM.Moves = {};
    GM.MoveList = [];

    GM.registerMove = function(data) {
        if (!data || data.id == null) return;
        GM.Moves[Number(data.id)] = data;
        GM.MoveList.push(data);
    };

    GM.getMove = function(id) {
        return GM.Moves[Number(id)] || null;
    };

    GM.MoveCategory = {
        PHYSICAL: 'FISICO',
        SPECIAL: 'ESPECIAL',
        STATUS: 'ESTADO'
    };

    GM.createMoveInstance = function(moveId) {
        var data = GM.getMove(moveId);
        if (!data) return null;
        return {
            id: data.id,
            name: data.name,
            currentPP: data.pp,
            maxPP: data.pp
        };
    };

    GM.getPokemonMoveData = function(moveInstance) {
        return moveInstance ? GM.getMove(moveInstance.id) : null;
    };

    GM.pokemonKnowsMove = function(pokemon, moveId) {
        if (!pokemon || !pokemon.moves) return false;

        for (var i = 0; i < pokemon.moves.length; i++) {
            if (
                pokemon.moves[i] &&
                Number(pokemon.moves[i].id) === Number(moveId)
            ) {
                return true;
            }
        }

        return false;
    };

    GM.learnMove = function(pokemon, moveId, replaceIndex) {
        if (!pokemon || !GM.getMove(moveId)) return false;

        pokemon.moves = pokemon.moves || [];

        if (GM.pokemonKnowsMove(pokemon, moveId)) return false;

        var instance = GM.createMoveInstance(moveId);

        if (pokemon.moves.length < 4) {
            pokemon.moves.push(instance);
            return true;
        }

        if (
            replaceIndex != null &&
            replaceIndex >= 0 &&
            replaceIndex < 4
        ) {
            pokemon.moves[replaceIndex] = instance;
            return true;
        }

        return false;
    };

    GM.forgetMove = function(pokemon, index) {
        if (
            !pokemon ||
            !pokemon.moves ||
            index < 0 ||
            index >= pokemon.moves.length
        ) {
            return false;
        }

        pokemon.moves.splice(index, 1);
        return true;
    };

    GM.restoreMovePP = function(pokemon) {
        if (!pokemon || !pokemon.moves) return;

        for (var i = 0; i < pokemon.moves.length; i++) {
            if (pokemon.moves[i]) {
                pokemon.moves[i].currentPP =
                    pokemon.moves[i].maxPP;
            }
        }
    };

    // =========================================================
    // 60 MOVIMIENTOS
    // =========================================================

    GM.registerMove({
        id: 1,
        name: 'Placaje',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 2,
        name: 'Gruñido',
        type: 'NORMAL',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 40,
        priority: 0,
        effect: {
            type: 'STAT_DOWN',
            stat: 'attack',
            stages: 1
        }
    });

    GM.registerMove({
        id: 3,
        name: 'Impactrueno',
        type: 'ELECTRICO',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'paralysis',
            chance: 10
        }
    });

    GM.registerMove({
        id: 4,
        name: 'Ataque Rápido',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 1,
        effect: null
    });

    GM.registerMove({
        id: 5,
        name: 'Látigo',
        type: 'NORMAL',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: {
            type: 'STAT_DOWN',
            stat: 'defense',
            stages: 1
        }
    });

    GM.registerMove({
        id: 6,
        name: 'Ascuas',
        type: 'FUEGO',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 25,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'burn',
            chance: 10
        }
    });

    GM.registerMove({
        id: 7,
        name: 'Pistola Agua',
        type: 'AGUA',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 25,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 8,
        name: 'Absorber',
        type: 'PLANTA',
        category: GM.MoveCategory.SPECIAL,
        power: 20,
        accuracy: 100,
        pp: 25,
        priority: 0,
        effect: {
            type: 'DRAIN',
            percent: 50
        }
    });

    GM.registerMove({
        id: 9,
        name: 'Confusión',
        type: 'PSIQUICO',
        category: GM.MoveCategory.SPECIAL,
        power: 50,
        accuracy: 100,
        pp: 25,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 10,
        name: 'Arañazo',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 11,
        name: 'Picotazo',
        type: 'VOLADOR',
        category: GM.MoveCategory.PHYSICAL,
        power: 35,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 12,
        name: 'Viento Cortante',
        type: 'VOLADOR',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 13,
        name: 'Tornado',
        type: 'VOLADOR',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 14,
        name: 'Ataque Arena',
        type: 'TIERRA',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 15,
        name: 'Golpe Cabeza',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 70,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 16,
        name: 'Patada Baja',
        type: 'LUCHA',
        category: GM.MoveCategory.PHYSICAL,
        power: 50,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 17,
        name: 'Puño',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 18,
        name: 'Doble Golpe',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 35,
        accuracy: 90,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 19,
        name: 'Hipervoz',
        type: 'NORMAL',
        category: GM.MoveCategory.SPECIAL,
        power: 90,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 20,
        name: 'Garra Metal',
        type: 'ACERO',
        category: GM.MoveCategory.PHYSICAL,
        power: 50,
        accuracy: 95,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 21,
        name: 'Ataque Furia',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 15,
        accuracy: 85,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 22,
        name: 'Corte',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 50,
        accuracy: 95,
        pp: 30,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 23,
        name: 'Colmillo Ígneo',
        type: 'FUEGO',
        category: GM.MoveCategory.PHYSICAL,
        power: 65,
        accuracy: 95,
        pp: 15,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'burn',
            chance: 10
        }
    });

    GM.registerMove({
        id: 24,
        name: 'Llamarada',
        type: 'FUEGO',
        category: GM.MoveCategory.SPECIAL,
        power: 90,
        accuracy: 85,
        pp: 5,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'burn',
            chance: 10
        }
    });

    GM.registerMove({
        id: 25,
        name: 'Rueda Fuego',
        type: 'FUEGO',
        category: GM.MoveCategory.PHYSICAL,
        power: 60,
        accuracy: 100,
        pp: 25,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 26,
        name: 'Acua Jet',
        type: 'AGUA',
        category: GM.MoveCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 20,
        priority: 1,
        effect: null
    });

    GM.registerMove({
        id: 27,
        name: 'Hidrobomba',
        type: 'AGUA',
        category: GM.MoveCategory.SPECIAL,
        power: 110,
        accuracy: 80,
        pp: 5,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 28,
        name: 'Burbuja',
        type: 'AGUA',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 29,
        name: 'Hoja Afilada',
        type: 'PLANTA',
        category: GM.MoveCategory.PHYSICAL,
        power: 55,
        accuracy: 95,
        pp: 25,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 30,
        name: 'Látigo Cepa',
        type: 'PLANTA',
        category: GM.MoveCategory.PHYSICAL,
        power: 45,
        accuracy: 100,
        pp: 25,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 31,
        name: 'Hoja Aguda',
        type: 'PLANTA',
        category: GM.MoveCategory.PHYSICAL,
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 32,
        name: 'Rayo',
        type: 'ELECTRICO',
        category: GM.MoveCategory.SPECIAL,
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'paralysis',
            chance: 10
        }
    });

    GM.registerMove({
        id: 33,
        name: 'Chispa',
        type: 'ELECTRICO',
        category: GM.MoveCategory.PHYSICAL,
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'paralysis',
            chance: 30
        }
    });

    GM.registerMove({
        id: 34,
        name: 'Colmillo Rayo',
        type: 'ELECTRICO',
        category: GM.MoveCategory.PHYSICAL,
        power: 65,
        accuracy: 95,
        pp: 15,
        priority: 0,
        effect: {
            type: 'STATUS_CHANCE',
            status: 'paralysis',
            chance: 10
        }
    });

    GM.registerMove({
        id: 35,
        name: 'Rayo Confuso',
        type: 'FANTASMA',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 36,
        name: 'Bola Sombra',
        type: 'FANTASMA',
        category: GM.MoveCategory.SPECIAL,
        power: 80,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 37,
        name: 'Lengüetazo',
        type: 'FANTASMA',
        category: GM.MoveCategory.PHYSICAL,
        power: 30,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 38,
        name: 'Psíquico',
        type: 'PSIQUICO',
        category: GM.MoveCategory.SPECIAL,
        power: 90,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 39,
        name: 'Psicorrayo',
        type: 'PSIQUICO',
        category: GM.MoveCategory.SPECIAL,
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 40,
        name: 'Onda Mental',
        type: 'PSIQUICO',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 90,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 41,
        name: 'Picotazo Veneno',
        type: 'VENENO',
        category: GM.MoveCategory.PHYSICAL,
        power: 15,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 42,
        name: 'Ácido',
        type: 'VENENO',
        category: GM.MoveCategory.SPECIAL,
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 43,
        name: 'Polvo Veneno',
        type: 'VENENO',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 75,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 44,
        name: 'Lanzarrocas',
        type: 'ROCA',
        category: GM.MoveCategory.PHYSICAL,
        power: 50,
        accuracy: 90,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 45,
        name: 'Avalancha',
        type: 'ROCA',
        category: GM.MoveCategory.PHYSICAL,
        power: 75,
        accuracy: 90,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 46,
        name: 'Terremoto',
        type: 'TIERRA',
        category: GM.MoveCategory.PHYSICAL,
        power: 100,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 47,
        name: 'Excavar',
        type: 'TIERRA',
        category: GM.MoveCategory.PHYSICAL,
        power: 80,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 48,
        name: 'Rayo Hielo',
        type: 'HIELO',
        category: GM.MoveCategory.SPECIAL,
        power: 90,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 49,
        name: 'Ventisca',
        type: 'HIELO',
        category: GM.MoveCategory.SPECIAL,
        power: 110,
        accuracy: 70,
        pp: 5,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 50,
        name: 'Puño Hielo',
        type: 'HIELO',
        category: GM.MoveCategory.PHYSICAL,
        power: 75,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 51,
        name: 'Pico Taladro',
        type: 'VOLADOR',
        category: GM.MoveCategory.PHYSICAL,
        power: 80,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 52,
        name: 'Ataque Ala',
        type: 'VOLADOR',
        category: GM.MoveCategory.PHYSICAL,
        power: 60,
        accuracy: 100,
        pp: 35,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 53,
        name: 'Doble Equipo',
        type: 'NORMAL',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 54,
        name: 'Protección',
        type: 'NORMAL',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 10,
        priority: 4,
        effect: null
    });

    GM.registerMove({
        id: 55,
        name: 'Descanso',
        type: 'PSIQUICO',
        category: GM.MoveCategory.STATUS,
        power: 0,
        accuracy: 100,
        pp: 5,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 56,
        name: 'Furia',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 20,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 57,
        name: 'Derribo',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 90,
        accuracy: 85,
        pp: 20,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 58,
        name: 'Doble Filo',
        type: 'NORMAL',
        category: GM.MoveCategory.PHYSICAL,
        power: 120,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 59,
        name: 'Golpe Roca',
        type: 'LUCHA',
        category: GM.MoveCategory.PHYSICAL,
        power: 40,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    GM.registerMove({
        id: 60,
        name: 'Demolición',
        type: 'LUCHA',
        category: GM.MoveCategory.PHYSICAL,
        power: 75,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effect: null
    });

    // =========================================================
    // LEARNSETS POR NÚMERO GRANADA DEX
    // =========================================================

    var learnsets = {

        1: [1,2,11,13],
        2: [1,11,13,15],
        3: [1,11,13,52],

        4: [1,3,20,32],
        5: [1,3,20,33],
        6: [20,3,32,33],

        7: [2,9,40,4],
        8: [2,9,39,38],
        9: [9,39,38,55],

        10: [1,16,17,59],
        11: [15,16,59,60],
        12: [16,17,59,60],

        13: [1,5,8,43],
        14: [8,30,42,43],
        15: [8,29,31,42],

        16: [1,5,8,30],
        17: [8,30,29,42],
        18: [29,30,31,42],

        19: [1,3,4,33],
        20: [1,3,33,34],
        21: [3,32,33,34],

        // =====================================================
        // SINGULARES
        // =====================================================

        // #022 MEW
        22: [9,38,4,55],

        // #023 VICTINI
        23: [9,6,24,4],

        // #024 HOOPA
        24: [9,38,35,36],

        25: [1,44,46,16],
        26: [44,45,46,47],
        27: [44,45,46,47],

        // #028 CELEBI
        28: [9,38,8,29],

        // #029 ZERAORA
        29: [3,32,33,4],

        // #030 VOLCANION
        30: [6,24,7,27],

        31: [1,14,44,48],
        32: [44,48,49,50],
        33: [45,46,48,49],

        34: [1,20,44,59],
        35: [20,44,45,60],
        36: [20,45,46,60],

        37: [1,11,41,43],
        38: [11,12,41,52],
        39: [11,13,36,52],

        40: [1,35,37,9],
        41: [35,36,37,39],
        42: [36,37,38,40],

        43: [1,7,28,5],
        44: [7,28,15,26],
        45: [7,26,27,15],

        46: [1,7,8,28],
        47: [7,8,28,30],
        48: [7,8,29,31],

        49: [1,14,46,59],
        50: [14,46,47,60],
        51: [45,46,47,60],

        52: [1,11,13,4],
        53: [11,13,15,52],
        54: [11,13,15,52],

        55: [1,11,20,52],
        56: [11,20,51,52],
        57: [20,45,51,52],

        58: [1,3,4,33],
        59: [3,6,23,32],
        60: [3,23,32,33],

        61: [1,2,6,23],
        62: [6,23,24,25],

        63: [1,2,6,25],
        64: [6,15,23,25],
        65: [6,23,24,25],

        66: [1,2,7,28],
        67: [7,26,28,15],
        68: [7,26,27,45],

        69: [1,7,28,5],
        70: [7,28,26,27],

        71: [1,7,28,8],
        72: [7,27,48,50],

        73: [1,2,4,15],
        74: [7,26,27,48],
        75: [3,32,33,34],
        76: [6,23,24,25],
        77: [9,38,39,40],
        78: [35,36,38,40],
        79: [8,29,30,31],
        80: [48,49,50,15],
        81: [9,38,39,4],

        82: [1,16,17,59],
        83: [16,20,59,60],

        84: [1,11,13,4],
        85: [11,13,15,52],
        86: [15,19,46,58],

        87: [1,9,39,40],
        88: [9,39,38,4],
        89: [9,38,39,55],
        90: [16,38,39,60],

        91: [1,16,44,46],
        92: [44,45,46,60],
        93: [16,45,46,60],

        94: [1,21,11,4],
        95: [1,5,21,53],
        96: [9,12,13,53],

        97: [1,11,20,52],
        98: [20,22,29,60],

        99: [1,4,21,50],
        100: [20,36,46,60]

    };

    // =========================================================
    // CREAR LEARNSETS EN LAS ESPECIES
    // =========================================================

    for (var dex = 1; dex <= 100; dex++) {

        var species =
            GM.getSpeciesByGranadaDex(dex);

        if (!species) continue;

        var ids =
            learnsets[dex] ||
            [1,2,4,10];

        species.learnset = [];

        for (var i = 0; i < ids.length; i++) {

            species.learnset.push({
                level: 1,
                move: ids[i]
            });

        }

    }

    // =========================================================
    // OBTENER LEARNSET
    // =========================================================

    GM.getLearnset = function(nationalDex) {

        var species =
            GM.getSpecies(nationalDex);

        return (
            species &&
            species.learnset
                ? species.learnset
                : []
        );

    };

    // =========================================================
    // MOVIMIENTOS DISPONIBLES A NIVEL
    // =========================================================

    GM.getMovesAtLevel = function(
        nationalDex,
        level
    ) {

        var learnset =
            GM.getLearnset(
                nationalDex
            );

        var result = [];

        for (
            var i = 0;
            i < learnset.length;
            i++
        ) {

            if (
                Number(
                    learnset[i].level
                ) <=
                Number(level)
            ) {

                result.push(
                    learnset[i].move
                );

            }

        }

        return result;

    };

    // =========================================================
    // MOVIMIENTOS INICIALES
    // =========================================================

    GM.getInitialMoves = function(
        nationalDex,
        level
    ) {

        var available =
            GM.getMovesAtLevel(
                nationalDex,
                level
            );

        var unique = [];

        for (
            var i = 0;
            i < available.length;
            i++
        ) {

            if (
                unique.indexOf(
                    available[i]
                ) === -1
            ) {

                unique.push(
                    available[i]
                );

            }

        }

        if (
            unique.length > 4
        ) {

            unique =
                unique.slice(
                    0,
                    4
                );

        }

        if (
            unique.length === 0
        ) {

            unique.push(1);

        }

        return unique;

    };

    // =========================================================
    // ASIGNAR MOVIMIENTOS
    // =========================================================

    GM.assignInitialMoves = function(
        pokemon
    ) {

        if (!pokemon) return;

        pokemon.moves = [];

        var ids =
            GM.getInitialMoves(
                pokemon.speciesId,
                pokemon.level
            );

        for (
            var i = 0;
            i < ids.length;
            i++
        ) {

            var instance =
                GM.createMoveInstance(
                    ids[i]
                );

            if (instance) {

                pokemon.moves.push(
                    instance
                );

            }

        }

        if (
            pokemon.moves.length === 0
        ) {

            var fallback =
                GM.createMoveInstance(1);

            if (fallback) {

                pokemon.moves.push(
                    fallback
                );

            }

        }

    };

    // =========================================================
    // INTERCEPTAR CREACIÓN DE POKÉMON
    // =========================================================

    var _GM_createPokemon =
        GM.createPokemon;

    GM.createPokemon = function(
        nationalDex,
        level
    ) {

        var pokemon =
            _GM_createPokemon.call(
                GM,
                nationalDex,
                level
            );

        if (pokemon) {

            GM.assignInitialMoves(
                pokemon
            );

        }

        return pokemon;

    };

    // =========================================================
    // CORREGIR MOVIMIENTOS DEL EQUIPO SI SE NECESITA
    // =========================================================

    GM.refreshAllPartyMoves =
        function() {

            if (!$gameSystem) return;

            var party =
                $gameSystem._granadaMonParty ||
                [];

            for (
                var i = 0;
                i < party.length;
                i++
            ) {

                if (party[i]) {

                    GM.assignInitialMoves(
                        party[i]
                    );

                }

            }

        };

    // =========================================================
    // LOG
    // =========================================================

    console.log(
        'GranadaMon Moves v3.1: ' +
        GM.MoveList.length +
        ' movimientos cargados.'
    );

})();