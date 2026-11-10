/*:
 * @plugindesc v2.1 GranadaMon - Team Rocket remoto: robos múltiples y devoluciones desde Firebase
 * @author OpenAI
 *
 * @param MinPokemonLevel
 * @text Nivel mínimo robable
 * @type number
 * @min 1
 * @max 100
 * @default 18
 *
 * @help
 * GranadaMon_TeamRocket.js
 * ============================================================
 *
 * COLOCAR DEBAJO DE:
 * - GranadaMon_DexRecovery
 * - GranadaMon_DexListVisual
 * - GranadaMon_Telemetry
 *
 * ============================================================
 * FIREBASE / FIRESTORE
 * ============================================================
 *
 * COLECCIÓN:
 *
 * teamRocketEvents
 *
 *
 * EJEMPLO DE ROBO:
 *
 * Documento:
 * ROCKET_01
 *
 * enabled = true
 * action = "THEFT"
 * order = 10
 * title = "ALERTA TEAM ROCKET"
 * message = "El Team Rocket ha iniciado una operación en Granada."
 *
 *
 * EJEMPLO SEGUNDO ROBO:
 *
 * Documento:
 * ROCKET_02
 *
 * enabled = true
 * action = "THEFT"
 * order = 20
 * title = "ALERTA TEAM ROCKET"
 * message = "El Team Rocket vuelve a actuar."
 *
 *
 * DEVOLVER EL POKÉMON ROBADO EN ROCKET_01:
 *
 * Documento:
 * RETURN_01
 *
 * enabled = true
 * action = "RETURN"
 * order = 60
 * targetEventId = "ROCKET_01"
 * title = "MENSAJE TEAM ROCKET"
 * message = "El Team Rocket ha liberado a uno de los Pokémon."
 *
 *
 * DEVOLVER TODOS LOS POKÉMON ROBADOS:
 *
 * Documento:
 * RETURN_ALL
 *
 * enabled = true
 * action = "RETURN"
 * order = 100
 * targetEventId = "ALL"
 * title = "MENSAJE TEAM ROCKET"
 * message = "El Team Rocket ha liberado a todos los Pokémon."
 *
 *
 * ============================================================
 * REGLAS
 * ============================================================
 *
 * - NO depende de zonas.
 *
 * - NO depende de la variable 125.
 *
 * - Se pueden añadir nuevos eventos ROCKET_01, ROCKET_02,
 *   ROCKET_03, etc. desde Firebase incluso después de haber
 *   publicado el videojuego en itch.io.
 *
 * - Cada evento se procesa una sola vez por jugador.
 *
 * - Si un jugador estaba desconectado cuando se activó un robo,
 *   podrá recibirlo cuando vuelva a entrar.
 *
 * IMPORTANTE:
 * Para que esto funcione, el documento debe seguir:
 *
 * enabled = true
 *
 * No lo desactives después de lanzarlo si quieres que los
 * jugadores que estaban desconectados también lo reciban.
 *
 * - Puede haber varios Pokémon robados simultáneamente.
 *
 * - Cada Pokémon robado queda guardado dentro de la partida.
 *
 * - Se conserva el objeto exacto:
 *   nivel, PS, PP, movimientos, etc.
 *
 * - Protege los Pokémon exclusivos de huevo.
 *
 * - Protege los Pokémon singulares.
 *
 * - No roba Pokémon por debajo de MinPokemonLevel.
 *
 * - Busca entre equipo + almacenamiento.
 *
 * - Roba el Pokémon elegible de MAYOR NIVEL.
 *
 * - Si roba uno del equipo, nunca deja al jugador sin otro
 *   Pokémon utilizable.
 *
 * - Los Pokémon robados continúan registrados como capturados,
 *   pero la Pokédex muestra:
 *
 *   ROBADO
 *
 * - No existe devolución manual desde RPG Maker.
 *
 * - Las devoluciones se ordenan exclusivamente desde Firebase.
 *
 * - RETURN puede devolver:
 *
 *   targetEventId = "ROCKET_01"
 *
 *   o
 *
 *   targetEventId = "ALL"
 *
 *
 * ============================================================
 * COMANDOS DE DIAGNÓSTICO
 * ============================================================
 *
 * GranadaMonRocket Status
 *
 * GranadaMonRocket Check
 *
 * GranadaMonRocket TestTheft
 *
 *
 * ============================================================
 * CONDITIONAL BRANCH -> SCRIPT
 * ============================================================
 *
 * GranadaMon.TeamRocket.hasStolen()
 *
 * GranadaMon.TeamRocket.stolenCount()
 *
 * GranadaMon.TeamRocket.hasPending()
 *
 * GranadaMon.TeamRocket.isSpeciesStolen(306)
 *
 * ============================================================
 */

(function() {

    'use strict';


    // =========================================================
    // NAMESPACE
    // =========================================================

    window.GranadaMon =
        window.GranadaMon || {};


    var GM =
        window.GranadaMon;


    GM.TeamRocket =
        GM.TeamRocket || {};


    var TR =
        GM.TeamRocket;


    TR.VERSION =
        '2.1';


    // =========================================================
    // PARÁMETROS
    // =========================================================

    var params =
        PluginManager.parameters(
            'GranadaMon_TeamRocket'
        ) || {};


    TR.MIN_POKEMON_LEVEL =
        Math.max(
            1,
            Number(
                params.MinPokemonLevel ||
                18
            )
        );


    // Colección nueva de Firestore.
    TR.EVENT_COLLECTION =
        'teamRocketEvents';


    // Cada 120 frames comprueba eventos pendientes.
    // Aproximadamente cada 2 segundos a 60 FPS.
    TR.PENDING_CHECK_FRAMES =
        120;


    TR.FIREBASE_RETRY_MS =
        10000;


    // =========================================================
    // POKÉMON PROTEGIDOS
    // GranadaDex
    // =========================================================

    TR.FALLBACK_EGG_GDEX = {

        1:true,
        13:true,
        16:true,
        37:true,
        40:true,
        84:true,
        87:true,
        91:true,
        97:true

    };


    TR.FALLBACK_SINGULAR_GDEX = {

        22:true,
        23:true,
        24:true,
        28:true,
        29:true,
        30:true

    };


    // =========================================================
    // ESTADO INTERNO DEL PLUGIN
    // =========================================================

    TR._unsubscribe =
        null;


    TR._firebaseRetryTimer =
        null;


    TR._connecting =
        false;


    TR._frameCounter =
        0;


    // =========================================================
    // LOG
    // =========================================================

    function log() {

        if (
            !window.console ||
            !console.log
        ) {
            return;
        }


        var args =
            Array.prototype.slice.call(
                arguments
            );


        args.unshift(
            '[GranadaMon TeamRocket v2.1]'
        );


        console.log.apply(
            console,
            args
        );
    }


    function warn() {

        if (
            !window.console ||
            !console.warn
        ) {
            return;
        }


        var args =
            Array.prototype.slice.call(
                arguments
            );


        args.unshift(
            '[GranadaMon TeamRocket v2.1]'
        );


        console.warn.apply(
            console,
            args
        );
    }


    function asString(value) {

        return String(
            value == null
                ? ''
                : value
        );
    }


    function nowMs() {

        return Date.now
            ? Date.now()
            : new Date().getTime();
    }


    // =========================================================
    // NORMALIZAR EVENTO FIREBASE
    // =========================================================

    TR.normalizeEvent =
        function(payload) {

            payload =
                payload || {};


            var action =
                asString(
                    payload.action ||
                    'THEFT'
                )
                .trim()
                .toUpperCase();


            if (
                action !== 'RETURN'
            ) {

                action =
                    'THEFT';
            }


            return {

                eventId:
                    asString(
                        payload.eventId ||
                        ''
                    ).trim(),

                enabled:
                    payload.enabled === true,

                action:
                    action,

                order:
                    Number(
                        payload.order ||
                        0
                    ),

                targetEventId:
                    asString(
                        payload.targetEventId ||
                        ''
                    ).trim(),

                title:
                    asString(
                        payload.title ||
                        ''
                    ).trim(),

                message:
                    asString(
                        payload.message ||
                        ''
                    ).trim()

            };
        };


    // =========================================================
    // EQUIPO
    // =========================================================

    TR.party =
        function() {

            if (
                !window.$gameSystem
            ) {
                return [];
            }


            $gameSystem._granadaMonParty =
                $gameSystem._granadaMonParty ||
                [];


            return (
                $gameSystem._granadaMonParty
            );
        };


    // =========================================================
    // ALMACENAMIENTO
    // =========================================================

    TR.storage =
        function() {

            if (
                !window.$gameSystem
            ) {
                return [];
            }


            $gameSystem._granadaMonStorage =
                $gameSystem._granadaMonStorage ||
                [];


            return (
                $gameSystem._granadaMonStorage
            );
        };


    // =========================================================
    // HELPERS POKÉMON
    // =========================================================

    TR.nationalDexOf =
        function(pokemon) {

            return Number(
                pokemon &&
                pokemon.speciesId ||
                0
            );
        };


    TR.levelOf =
        function(pokemon) {

            return Math.max(

                1,

                Number(
                    pokemon &&
                    pokemon.level ||
                    1
                )

            );
        };


    TR.speciesOf =
        function(pokemon) {

            var nationalDex =
                TR.nationalDexOf(
                    pokemon
                );


            if (
                !nationalDex ||
                !GM.getSpecies
            ) {
                return null;
            }


            return GM.getSpecies(
                nationalDex
            );
        };


    TR.granadaDexOf =
        function(pokemon) {

            var species =
                TR.speciesOf(
                    pokemon
                );


            return species
                ? Number(
                    species.granadaDex ||
                    0
                )
                : 0;
        };


    TR.nameOf =
        function(pokemon) {

            if (
                pokemon &&
                (
                    pokemon.nickname ||
                    pokemon.name
                )
            ) {

                return String(

                    pokemon.nickname ||
                    pokemon.name

                );
            }


            var species =
                TR.speciesOf(
                    pokemon
                );


            if (
                species &&
                species.name
            ) {

                return String(
                    species.name
                );
            }


            return 'Pokemon';
        };


    TR.isUsable =
        function(pokemon) {

            if (!pokemon) {
                return false;
            }


            if (
                GM.State &&
                typeof GM.State.ensurePokemon ===
                'function'
            ) {

                pokemon =
                    GM.State.ensurePokemon(
                        pokemon
                    );
            }


            if (
                pokemon.fainted === true
            ) {

                return false;
            }


            if (
                pokemon.hp == null
            ) {

                return true;
            }


            return (
                Number(
                    pokemon.hp ||
                    0
                ) > 0
            );
        };


    // =========================================================
    // ESTADO NUEVO
    // =========================================================

    TR.newState =
        function() {

            return {

                version: 2,

                pendingEvents: [],

                stolenRecords: [],

                history: {}

            };
        };


    // =========================================================
    // ORDENAR EVENTOS
    // =========================================================

    TR.sortEvents =
        function(list) {

            if (
                !Array.isArray(
                    list
                )
            ) {

                return list;
            }


            list.sort(
                function(a, b) {

                    var orderA =
                        Number(
                            a &&
                            a.order ||
                            0
                        );


                    var orderB =
                        Number(
                            b &&
                            b.order ||
                            0
                        );


                    if (
                        orderA !==
                        orderB
                    ) {

                        return (
                            orderA -
                            orderB
                        );
                    }


                    return asString(
                        a &&
                        a.eventId
                    ).localeCompare(
                        asString(
                            b &&
                            b.eventId
                        )
                    );
                }
            );


            return list;
        };


    // =========================================================
    // ESTADO GUARDADO
    // =========================================================

    TR.ensureState =
        function() {

            if (
                !window.$gameSystem
            ) {

                return null;
            }


            if (
                !$gameSystem
                    ._granadaMonTeamRocket
            ) {

                $gameSystem
                    ._granadaMonTeamRocket =
                    TR.newState();
            }


            var state =
                $gameSystem
                    ._granadaMonTeamRocket;


            // =================================================
            // MIGRACIÓN DEL SISTEMA ANTIGUO
            // =================================================

            if (
                !Array.isArray(
                    state.stolenRecords
                )
            ) {

                state.stolenRecords =
                    [];


                var oldStolen =
                    state.stolen;


                if (
                    oldStolen &&
                    oldStolen.pokemon
                ) {

                    var legacyEventId =
                        asString(

                            oldStolen.eventId ||

                            (
                                'LEGACY_THEFT_' +
                                nowMs()
                            )

                        );


                    state.stolenRecords.push({

                        eventId:
                            legacyEventId,

                        pokemon:
                            oldStolen.pokemon,

                        source:
                            asString(
                                oldStolen.source ||
                                'STORAGE'
                            ),

                        originalIndex:
                            Number(
                                oldStolen.originalIndex ||
                                0
                            ),

                        nationalDex:
                            Number(

                                oldStolen.nationalDex ||

                                TR.nationalDexOf(
                                    oldStolen.pokemon
                                )

                            ),

                        granadaDex:
                            Number(

                                oldStolen.granadaDex ||

                                TR.granadaDexOf(
                                    oldStolen.pokemon
                                )

                            ),

                        name:
                            asString(

                                oldStolen.name ||

                                TR.nameOf(
                                    oldStolen.pokemon
                                )

                            ),

                        level:
                            Number(

                                oldStolen.level ||

                                TR.levelOf(
                                    oldStolen.pokemon
                                )

                            ),

                        stolenAt:
                            Number(
                                oldStolen.stolenAt ||
                                nowMs()
                            ),

                        status:
                            'STOLEN',

                        returnedAt:
                            null,

                        returnEventId:
                            null,

                        returnDestination:
                            null

                    });
                }
            }


            if (
                !Array.isArray(
                    state.pendingEvents
                )
            ) {

                state.pendingEvents =
                    [];
            }


            state.history =
                state.history ||
                {};


            state.version =
                2;


            // Campos antiguos ya no usados.
            state.stolen =
                null;


            state.lastRecovered =
                null;


            state.pendingEventId =
                null;


            state.pendingPayload =
                null;


            state.pendingNoticeShownFor =
                null;


            TR.sortEvents(
                state.pendingEvents
            );


            return state;
        };


    // =========================================================
    // ROBADOS ACTIVOS
    // =========================================================

    TR.activeStolenRecords =
        function() {

            var state =
                TR.ensureState();


            if (!state) {
                return [];
            }


            var result =
                [];


            for (
                var i = 0;
                i < state.stolenRecords.length;
                i++
            ) {

                var record =
                    state.stolenRecords[i];


                if (
                    record &&
                    record.status ===
                    'STOLEN' &&
                    record.pokemon
                ) {

                    result.push(
                        record
                    );
                }
            }


            return result;
        };


    TR.hasStolen =
        function() {

            return (
                TR.activeStolenRecords()
                    .length > 0
            );
        };


    TR.stolenCount =
        function() {

            return (
                TR.activeStolenRecords()
                    .length
            );
        };


    TR.hasPending =
        function() {

            var state =
                TR.ensureState();


            return !!(

                state &&

                state.pendingEvents &&

                state.pendingEvents.length

            );
        };


    // =========================================================
    // ¿ESPECIE ROBADA?
    // =========================================================

    TR.isSpeciesStolen =
        function(nationalDex) {

            nationalDex =
                Number(
                    nationalDex ||
                    0
                );


            var stolen =
                TR.activeStolenRecords();


            for (
                var i = 0;
                i < stolen.length;
                i++
            ) {

                if (
                    Number(
                        stolen[i].nationalDex ||
                        0
                    ) ===
                    nationalDex
                ) {

                    return true;
                }
            }


            return false;
        };


    // =========================================================
    // EVENTO YA PENDIENTE
    // =========================================================

    TR.pendingContains =
        function(eventId) {

            var state =
                TR.ensureState();


            if (!state) {
                return false;
            }


            eventId =
                asString(
                    eventId
                );


            for (
                var i = 0;
                i < state.pendingEvents.length;
                i++
            ) {

                if (
                    asString(
                        state.pendingEvents[i]
                            .eventId
                    ) ===
                    eventId
                ) {

                    return true;
                }
            }


            return false;
        };


    // =========================================================
    // CATEGORÍA
    // =========================================================

    TR.categoryOf =
        function(pokemon) {

            var species =
                TR.speciesOf(
                    pokemon
                );


            if (!species) {
                return null;
            }


            if (
                GM.Telemetry &&
                typeof GM.Telemetry
                    .categoryForSpecies ===
                    'function'
            ) {

                try {

                    return (
                        GM.Telemetry
                            .categoryForSpecies(
                                species
                            )
                    );

                } catch (e) {}
            }


            var gd =
                Number(
                    species.granadaDex ||
                    0
                );


            if (
                TR.FALLBACK_EGG_GDEX[
                    gd
                ]
            ) {

                return 'EGG';
            }


            if (
                TR.FALLBACK_SINGULAR_GDEX[
                    gd
                ]
            ) {

                return 'SINGULAR';
            }


            return 'WILD';
        };


    // =========================================================
    // PROTECCIÓN
    // =========================================================

    TR.isProtected =
        function(pokemon) {

            var category =
                TR.categoryOf(
                    pokemon
                );


            return (

                category ===
                'EGG' ||

                category ===
                'SINGULAR'

            );
        };


    // =========================================================
    // ELEGIBLE
    // =========================================================

    TR.isEligible =
        function(pokemon) {

            if (!pokemon) {
                return false;
            }


            if (
                TR.isProtected(
                    pokemon
                )
            ) {

                return false;
            }


            if (
                TR.levelOf(
                    pokemon
                ) <
                TR.MIN_POKEMON_LEVEL
            ) {

                return false;
            }


            return true;
        };


    // =========================================================
    // NO DEJAR AL EQUIPO VACÍO
    // =========================================================

    TR.partyHasAnotherUsablePokemon =
        function(candidateIndex) {

            var party =
                TR.party();


            for (
                var i = 0;
                i < party.length;
                i++
            ) {

                if (
                    i ===
                    candidateIndex
                ) {

                    continue;
                }


                if (
                    TR.isUsable(
                        party[i]
                    )
                ) {

                    return true;
                }
            }


            return false;
        };


    // =========================================================
    // BUSCAR CANDIDATO
    // =========================================================

    TR.findCandidate =
        function() {

            var party =
                TR.party();


            var storage =
                TR.storage();


            var candidates =
                [];


            var i;
            var pokemon;


            // EQUIPO
            for (
                i = 0;
                i < party.length;
                i++
            ) {

                pokemon =
                    party[i];


                if (
                    !TR.isEligible(
                        pokemon
                    )
                ) {

                    continue;
                }


                if (
                    !TR.partyHasAnotherUsablePokemon(
                        i
                    )
                ) {

                    continue;
                }


                candidates.push({

                    pokemon:
                        pokemon,

                    source:
                        'PARTY',

                    index:
                        i,

                    level:
                        TR.levelOf(
                            pokemon
                        )

                });
            }


            // ALMACENAMIENTO
            for (
                i = 0;
                i < storage.length;
                i++
            ) {

                pokemon =
                    storage[i];


                if (
                    !TR.isEligible(
                        pokemon
                    )
                ) {

                    continue;
                }


                candidates.push({

                    pokemon:
                        pokemon,

                    source:
                        'STORAGE',

                    index:
                        i,

                    level:
                        TR.levelOf(
                            pokemon
                        )

                });
            }


            if (
                !candidates.length
            ) {

                return null;
            }


            // MAYOR NIVEL
            candidates.sort(

                function(a, b) {

                    if (
                        b.level !==
                        a.level
                    ) {

                        return (
                            b.level -
                            a.level
                        );
                    }


                    // En empate priorizamos equipo.
                    if (
                        a.source !==
                        b.source
                    ) {

                        if (
                            a.source ===
                            'PARTY'
                        ) {

                            return -1;
                        }


                        if (
                            b.source ===
                            'PARTY'
                        ) {

                            return 1;
                        }
                    }


                    return (
                        a.index -
                        b.index
                    );
                }

            );


            return candidates[0];
        };


    // =========================================================
    // DECORAR POKÉDEX
    // =========================================================

    TR.decorateDex =
        function() {

            if (
                !window.$gameSystem ||
                !$gameSystem
                    ._granadaMonDex
            ) {

                return;
            }


            var stolen =
                TR.activeStolenRecords();


            var stolenSpecies =
                {};


            for (
                var i = 0;
                i < stolen.length;
                i++
            ) {

                stolenSpecies[

                    Number(
                        stolen[i].nationalDex ||
                        0
                    )

                ] = true;
            }


            var dex =
                $gameSystem
                    ._granadaMonDex;


            for (
                var j = 0;
                j < dex.length;
                j++
            ) {

                var entry =
                    dex[j];


                if (!entry) {
                    continue;
                }


                entry.teamRocketStolen =
                    !!stolenSpecies[

                        Number(
                            entry.speciesId ||
                            0
                        )

                    ];
            }
        };


    // =========================================================
    // ENVOLVER syncDex
    // =========================================================

    if (
        typeof GM.syncDex ===
        'function'
    ) {

        var _TR_syncDex =
            GM.syncDex;


        GM.syncDex =
            function() {

                var result =
                    _TR_syncDex.apply(
                        GM,
                        arguments
                    );


                TR.decorateDex();


                return result;
            };
    }


    // =========================================================
    // MARCA EN FICHA INDIVIDUAL
    // =========================================================

    TR.drawDexMarker =
        function(win) {

            if (
                !win ||
                !win.contents
            ) {

                return;
            }


            var species =
                win.getSpecies
                    ? win.getSpecies()
                    : null;


            if (
                !species ||
                !TR.isSpeciesStolen(
                    species.nationalDex
                )
            ) {

                return;
            }


            var W =
                win.contentsWidth();


            var H =
                win.contentsHeight();


            var line =
                win.lineHeight();


            var y =
                H - line;


            var x =
                Math.floor(
                    W * 0.50
                );


            var width =
                Math.floor(
                    W * 0.48
                ) - 10;


            win.contents.clearRect(

                x,

                y - 2,

                width,

                line + 4

            );


            win.contents.fontSize =
                16;


            if (
                win.textColor
            ) {

                win.changeTextColor(
                    win.textColor(
                        18
                    )
                );
            }


            win.drawText(

                'TEAM ROCKET: ROBADO',

                x,

                y,

                width,

                'right'

            );


            win.resetTextColor();


            win.contents.fontSize =
                win.standardFontSize();
        };


    // =========================================================
    // FICHA POKÉDEX
    // =========================================================

    if (
        typeof Scene_GranadaDexEntry !==
        'undefined' &&

        Scene_GranadaDexEntry
            .prototype
            .createEntryWindow
    ) {

        var _TR_createEntryWindow =
            Scene_GranadaDexEntry
                .prototype
                .createEntryWindow;


        Scene_GranadaDexEntry
            .prototype
            .createEntryWindow =
            function() {

                _TR_createEntryWindow
                    .call(
                        this
                    );


                var win =
                    this._entryWindow;


                if (
                    !win ||
                    !win.refresh
                ) {

                    return;
                }


                var previousRefresh =
                    win.refresh.bind(
                        win
                    );


                win.refresh =
                    function() {

                        previousRefresh();

                        TR.drawDexMarker(
                            this
                        );
                    };


                win.refresh();
            };
    }


    // =========================================================
    // AÑADIR EVENTO A COLA
    // =========================================================

    TR.queueEvent =
        function(payload) {

            var state =
                TR.ensureState();


            if (!state) {
                return false;
            }


            var event =
                TR.normalizeEvent(
                    payload
                );


            if (
                !event.eventId ||
                event.enabled !== true
            ) {

                return false;
            }


            // Ya ejecutado.
            if (
                state.history[
                    event.eventId
                ]
            ) {

                return false;
            }


            // Ya en cola.
            if (
                TR.pendingContains(
                    event.eventId
                )
            ) {

                return false;
            }


            state.pendingEvents.push(
                event
            );


            TR.sortEvents(
                state.pendingEvents
            );


            log(

                'Evento pendiente:',

                event.eventId,

                event.action,

                'order=' +
                event.order

            );


            TR.syncPlayerRocketState();


            return true;
        };


    // =========================================================
    // QUITAR EVENTO DE COLA
    // =========================================================

    TR.removePendingEvent =
        function(eventId) {

            var state =
                TR.ensureState();


            if (!state) {
                return;
            }


            eventId =
                asString(
                    eventId
                );


            for (

                var i =
                    state.pendingEvents.length -
                    1;

                i >= 0;

                i--

            ) {

                if (
                    asString(
                        state.pendingEvents[i]
                            .eventId
                    ) ===
                    eventId
                ) {

                    state.pendingEvents.splice(
                        i,
                        1
                    );
                }
            }
        };


    // =========================================================
    // MOMENTO SEGURO
    // =========================================================

    TR.isSafeMoment =
        function() {

            if (
                typeof Scene_Map ===
                'undefined'
            ) {

                return false;
            }


            if (
                !(
                    SceneManager._scene
                    instanceof
                    Scene_Map
                )
            ) {

                return false;
            }


            if (
                SceneManager.isSceneChanging &&
                SceneManager.isSceneChanging()
            ) {

                return false;
            }


            if (
                window.$gameMessage &&
                $gameMessage.isBusy &&
                $gameMessage.isBusy()
            ) {

                return false;
            }


            if (
                window.$gameMap &&
                $gameMap.isEventRunning &&
                $gameMap.isEventRunning()
            ) {

                return false;
            }


            return true;
        };


    // =========================================================
    // MENSAJE DE ROBO
    // =========================================================

    TR.showTheftMessage =
        function(record, event) {

            if (
                !window.$gameMessage ||
                !record
            ) {

                return;
            }


            var title =
                event &&
                event.title

                    ? asString(
                        event.title
                    )

                    : 'ALERTA TEAM ROCKET';


            var message =
                event &&
                event.message

                    ? asString(
                        event.message
                    )

                    : '';


            $gameMessage.add(
                title
            );


            if (message) {

                $gameMessage.add(
                    message
                );
            }


            $gameMessage.add(

                '¡El Team Rocket ha robado a ' +

                record.name +

                ' (Nv. ' +

                record.level +

                ')!'

            );


            $gameMessage.add(

                'Su estado aparece como ROBADO en la Pokédex.'

            );
        };


    // =========================================================
    // MENSAJE DE DEVOLUCIÓN
    // =========================================================

    TR.showReturnMessage =
        function(records, event) {

            if (
                !window.$gameMessage
            ) {

                return;
            }


            var title =
                event &&
                event.title

                    ? asString(
                        event.title
                    )

                    : 'MENSAJE TEAM ROCKET';


            var message =
                event &&
                event.message

                    ? asString(
                        event.message
                    )

                    : '';


            $gameMessage.add(
                title
            );


            if (message) {

                $gameMessage.add(
                    message
                );
            }


            if (
                !records ||
                !records.length
            ) {

                $gameMessage.add(

                    'No había ningún Pokémon pendiente de devolución.'

                );


                return;
            }


            for (
                var i = 0;
                i < records.length;
                i++
            ) {

                $gameMessage.add(

                    '¡Has recuperado a ' +

                    records[i].name +

                    ' (Nv. ' +

                    records[i].level +

                    ')!'

                );
            }
        };


    // =========================================================
    // EJECUTAR ROBO
    // =========================================================

    TR.performTheft =
        function(event) {

            var state =
                TR.ensureState();


            if (
                !state ||
                !event
            ) {

                return false;
            }


            var eventId =
                asString(
                    event.eventId
                ).trim();


            if (!eventId) {
                return false;
            }


            // Ya ejecutado.
            if (
                state.history[
                    eventId
                ]
            ) {

                TR.removePendingEvent(
                    eventId
                );


                return true;
            }


            var candidate =
                TR.findCandidate();


            // Si todavía no tiene Pokémon adecuado:
            // SE QUEDA PENDIENTE.
            if (!candidate) {

                log(

                    'Robo pendiente sin candidato:',

                    eventId

                );


                return false;
            }


            var party =
                TR.party();


            var storage =
                TR.storage();


            var pokemon =
                null;


            if (
                candidate.source ===
                'PARTY'
            ) {

                pokemon =
                    party.splice(

                        candidate.index,

                        1

                    )[0];

            } else {

                pokemon =
                    storage.splice(

                        candidate.index,

                        1

                    )[0];
            }


            if (!pokemon) {

                warn(

                    'No se pudo extraer el Pokémon candidato.',

                    eventId

                );


                return false;
            }


            // =================================================
            // GUARDAR POKÉMON EXACTO
            // =================================================

            var record = {

                eventId:
                    eventId,

                pokemon:
                    pokemon,

                source:
                    candidate.source,

                originalIndex:
                    candidate.index,

                nationalDex:
                    TR.nationalDexOf(
                        pokemon
                    ),

                granadaDex:
                    TR.granadaDexOf(
                        pokemon
                    ),

                name:
                    TR.nameOf(
                        pokemon
                    ),

                level:
                    TR.levelOf(
                        pokemon
                    ),

                stolenAt:
                    nowMs(),

                status:
                    'STOLEN',

                returnedAt:
                    null,

                returnEventId:
                    null,

                returnDestination:
                    null

            };


            state.stolenRecords.push(
                record
            );


            // =================================================
            // HISTORIAL
            // =================================================

            state.history[
                eventId
            ] = {

                action:
                    'THEFT',

                status:
                    'STOLEN',

                order:
                    Number(
                        event.order ||
                        0
                    ),

                nationalDex:
                    record.nationalDex,

                granadaDex:
                    record.granadaDex,

                name:
                    record.name,

                level:
                    record.level,

                source:
                    record.source,

                stolenAt:
                    record.stolenAt

            };


            TR.removePendingEvent(
                eventId
            );


            if (
                GM.State &&
                typeof GM.State.normalizeAll ===
                'function'
            ) {

                GM.State.normalizeAll();
            }


            if (
                typeof GM.syncDex ===
                'function'
            ) {

                GM.syncDex();
            }


            TR.decorateDex();


            TR.showTheftMessage(
                record,
                event
            );


            TR.syncPlayerRocketState();


            log(

                'ROBADO:',

                record.name,

                'Nv.' +
                record.level,

                'desde ' +
                record.source,

                'eventId=' +
                eventId,

                'robados activos=' +
                TR.stolenCount()

            );


            return true;
        };


    // =========================================================
    // DEVOLVER UN REGISTRO
    // =========================================================

    TR.returnRecord =
        function(
            record,
            returnEventId
        ) {

            if (
                !record ||
                record.status !==
                'STOLEN' ||
                !record.pokemon
            ) {

                return false;
            }


            var pokemon =
                record.pokemon;


            var party =
                TR.party();


            var storage =
                TR.storage();


            var destination =
                'STORAGE';


            // =================================================
            // INTENTAR DEVOLVER A SU SITIO
            // =================================================

            if (
                record.source ===
                'PARTY' &&

                party.length < 6
            ) {

                var partyIndex =
                    Math.max(

                        0,

                        Math.min(

                            Number(
                                record.originalIndex ||
                                0
                            ),

                            party.length

                        )

                    );


                party.splice(

                    partyIndex,

                    0,

                    pokemon

                );


                destination =
                    'PARTY';

            }

            else if (
                record.source ===
                'STORAGE'
            ) {

                var storageIndex =
                    Math.max(

                        0,

                        Math.min(

                            Number(
                                record.originalIndex ||
                                0
                            ),

                            storage.length

                        )

                    );


                storage.splice(

                    storageIndex,

                    0,

                    pokemon

                );


                destination =
                    'STORAGE';

            }

            else if (
                party.length < 6
            ) {

                party.push(
                    pokemon
                );


                destination =
                    'PARTY';

            }

            else {

                storage.push(
                    pokemon
                );


                destination =
                    'STORAGE';
            }


            // =================================================
            // ACTUALIZAR REGISTRO
            // =================================================

            record.status =
                'RETURNED';


            record.returnedAt =
                nowMs();


            record.returnEventId =
                asString(
                    returnEventId
                );


            record.returnDestination =
                destination;


            // El Pokémon ya vuelve a estar en party/storage.
            // Eliminamos la copia guardada para no duplicarlo.
            record.pokemon =
                null;


            var state =
                TR.ensureState();


            if (
                state &&
                state.history[
                    record.eventId
                ]
            ) {

                state.history[
                    record.eventId
                ].status =
                    'RETURNED';


                state.history[
                    record.eventId
                ].returnedAt =
                    record.returnedAt;


                state.history[
                    record.eventId
                ].returnEventId =
                    record.returnEventId;


                state.history[
                    record.eventId
                ].returnDestination =
                    destination;
            }


            return true;
        };


    // =========================================================
    // EJECUTAR DEVOLUCIÓN
    // =========================================================

    TR.performReturn =
        function(event) {

            var state =
                TR.ensureState();


            if (
                !state ||
                !event
            ) {

                return false;
            }


            var eventId =
                asString(
                    event.eventId
                ).trim();


            if (!eventId) {
                return false;
            }


            // Ya ejecutado.
            if (
                state.history[
                    eventId
                ]
            ) {

                TR.removePendingEvent(
                    eventId
                );


                return true;
            }


            var target =
                asString(
                    event.targetEventId ||
                    ''
                ).trim();


            if (!target) {

                warn(

                    'Evento RETURN sin targetEventId:',

                    eventId

                );


                state.history[
                    eventId
                ] = {

                    action:
                        'RETURN',

                    status:
                        'INVALID',

                    order:
                        Number(
                            event.order ||
                            0
                        ),

                    targetEventId:
                        '',

                    returnedCount:
                        0,

                    processedAt:
                        nowMs()

                };


                TR.removePendingEvent(
                    eventId
                );


                TR.syncPlayerRocketState();


                return true;
            }


            var active =
                TR.activeStolenRecords();


            var selected =
                [];


            var i;


            // =================================================
            // DEVOLVER TODOS
            // =================================================

            if (
                target.toUpperCase() ===
                'ALL'
            ) {

                selected =
                    active.slice();

            }

            // =================================================
            // DEVOLVER EL ROBO CONCRETO
            // =================================================

            else {

                for (
                    i = 0;
                    i < active.length;
                    i++
                ) {

                    if (
                        asString(
                            active[i].eventId
                        ) ===
                        target
                    ) {

                        selected.push(
                            active[i]
                        );
                    }
                }
            }


            var returned =
                [];


            for (
                i = 0;
                i < selected.length;
                i++
            ) {

                if (
                    TR.returnRecord(

                        selected[i],

                        eventId

                    )
                ) {

                    returned.push(
                        selected[i]
                    );
                }
            }


            // =================================================
            // HISTORIAL DEL EVENTO RETURN
            // =================================================

            state.history[
                eventId
            ] = {

                action:
                    'RETURN',

                status:
                    'DONE',

                order:
                    Number(
                        event.order ||
                        0
                    ),

                targetEventId:
                    target,

                returnedCount:
                    returned.length,

                processedAt:
                    nowMs()

            };


            TR.removePendingEvent(
                eventId
            );


            if (
                GM.State &&
                typeof GM.State.normalizeAll ===
                'function'
            ) {

                GM.State.normalizeAll();
            }


            if (
                typeof GM.syncDex ===
                'function'
            ) {

                GM.syncDex();
            }


            TR.decorateDex();


            TR.showReturnMessage(
                returned,
                event
            );


            TR.syncPlayerRocketState();


            log(

                'DEVOLUCIÓN:',

                eventId,

                'target=' +
                target,

                'devueltos=' +
                returned.length,

                'robados activos=' +
                TR.stolenCount()

            );


            return true;
        };


    // =========================================================
    // PROCESAR EVENTO PENDIENTE
    // =========================================================

    TR.processPending =
        function() {

            var state =
                TR.ensureState();


            if (
                !state ||
                !state.pendingEvents.length
            ) {

                return false;
            }


            if (
                !TR.isSafeMoment()
            ) {

                return false;
            }


            TR.sortEvents(
                state.pendingEvents
            );


            var event =
                state.pendingEvents[0];


            if (!event) {
                return false;
            }


            if (
                asString(
                    event.action
                ).toUpperCase() ===
                'RETURN'
            ) {

                return TR.performReturn(
                    event
                );
            }


            return TR.performTheft(
                event
            );
        };


    // =========================================================
    // IDS PROCESADOS
    // =========================================================

    TR.processedIds =
        function() {

            var state =
                TR.ensureState();


            if (!state) {
                return [];
            }


            var result =
                [];


            for (
                var key in state.history
            ) {

                if (
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            state.history,
                            key
                        )
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
        };


    // =========================================================
    // IDS PENDIENTES
    // =========================================================

    TR.pendingIds =
        function() {

            var state =
                TR.ensureState();


            if (!state) {
                return [];
            }


            var result =
                [];


            for (
                var i = 0;
                i < state.pendingEvents.length;
                i++
            ) {

                result.push(

                    asString(
                        state.pendingEvents[i]
                            .eventId
                    )

                );
            }


            return result;
        };


    // =========================================================
    // METADATOS DE ROBADOS
    // =========================================================

    TR.stolenMetadata =
        function() {

            var stolen =
                TR.activeStolenRecords();


            var result =
                [];


            for (
                var i = 0;
                i < stolen.length;
                i++
            ) {

                result.push({

                    eventId:
                        asString(
                            stolen[i].eventId
                        ),

                    nationalDex:
                        Number(
                            stolen[i].nationalDex ||
                            0
                        ),

                    granadaDex:
                        Number(
                            stolen[i].granadaDex ||
                            0
                        ),

                    name:
                        asString(
                            stolen[i].name
                        ),

                    level:
                        Number(
                            stolen[i].level ||
                            0
                        ),

                    source:
                        asString(
                            stolen[i].source
                        ),

                    stolenAt:
                        Number(
                            stolen[i].stolenAt ||
                            0
                        )

                });
            }


            return result;
        };


    // =========================================================
    // SINCRONIZAR ESTADO DEL JUGADOR
    // =========================================================

    TR.syncPlayerRocketState =
        function() {

            var T =
                GM.Telemetry;


            var state =
                TR.ensureState();


            if (
                !T ||
                !state ||
                typeof T.playerRef !==
                'function'
            ) {

                return Promise.resolve(
                    false
                );
            }


            var ref =
                T.playerRef();


            if (!ref) {

                return Promise.resolve(
                    false
                );
            }


            var payload = {

                teamRocket: {

                    version:
                        2,

                    stolenCount:
                        TR.stolenCount(),

                    stolenPokemon:
                        TR.stolenMetadata(),

                    pendingEventIds:
                        TR.pendingIds(),

                    processedEventIds:
                        TR.processedIds()

                }

            };


            if (
                window.firebase &&
                firebase.firestore &&
                firebase.firestore.FieldValue
            ) {

                payload.teamRocket.updatedAt =
                    firebase
                        .firestore
                        .FieldValue
                        .serverTimestamp();
            }


            return ref.set(

                payload,

                {
                    merge:true
                }

            )

            .then(
                function() {

                    return true;
                }
            )

            .catch(
                function(error) {

                    warn(

                        'No se pudo sincronizar el estado Team Rocket.',

                        error

                    );


                    return false;
                }
            );
        };


    // =========================================================
    // FIREBASE RETRY
    // =========================================================

    TR.clearFirebaseRetry =
        function() {

            if (
                TR._firebaseRetryTimer
            ) {

                clearTimeout(
                    TR._firebaseRetryTimer
                );


                TR._firebaseRetryTimer =
                    null;
            }
        };


    TR.scheduleFirebaseRetry =
        function() {

            if (
                TR._firebaseRetryTimer ||
                TR._unsubscribe
            ) {

                return;
            }


            TR._firebaseRetryTimer =
                setTimeout(

                    function() {

                        TR._firebaseRetryTimer =
                            null;


                        TR.connectFirebaseWatch();

                    },

                    TR.FIREBASE_RETRY_MS

                );
        };


    // =========================================================
    // CONVERTIR DOCUMENTO FIREBASE
    // =========================================================

    TR.eventFromDoc =
        function(doc) {

            if (!doc) {
                return null;
            }


            var data =
                doc.data
                    ? doc.data()
                    : null;


            if (!data) {
                return null;
            }


            return TR.normalizeEvent({

                eventId:
                    data.eventId ||
                    doc.id,

                enabled:
                    data.enabled === true,

                action:
                    data.action ||
                    'THEFT',

                order:
                    Number(
                        data.order ||
                        0
                    ),

                targetEventId:
                    data.targetEventId ||
                    '',

                title:
                    data.title ||
                    '',

                message:
                    data.message ||
                    ''

            });
        };


    // =========================================================
    // SNAPSHOT COLECCIÓN
    // =========================================================

    TR.handleCollectionSnapshot =
        function(snapshot) {

            if (!snapshot) {
                return;
            }


            // No ejecutamos eventos basándonos únicamente
            // en caché local.
            if (
                snapshot.metadata &&
                snapshot.metadata.fromCache ===
                true
            ) {

                log(

                    'Snapshot de caché ignorado. Esperando servidor.'

                );


                return;
            }


            var T =
                GM.Telemetry;


            if (
                !T ||
                !T._user
            ) {

                return;
            }


            var incoming =
                [];


            snapshot.forEach(

                function(doc) {

                    var event =
                        TR.eventFromDoc(
                            doc
                        );


                    if (
                        event &&
                        event.enabled ===
                        true &&
                        event.eventId
                    ) {

                        incoming.push(
                            event
                        );
                    }
                }

            );


            TR.sortEvents(
                incoming
            );


            // Añadir todos los enabled=true
            // que este jugador todavía no haya procesado.
            for (
                var i = 0;
                i < incoming.length;
                i++
            ) {

                TR.queueEvent(
                    incoming[i]
                );
            }


            TR.processPending();
        };


    // =========================================================
    // CONEXIÓN FIREBASE
    // =========================================================

    TR.connectFirebaseWatch =
        function() {

            if (
                TR._unsubscribe ||
                TR._connecting
            ) {

                return;
            }


            var T =
                GM.Telemetry;


            if (
                !T ||
                typeof T.init !==
                'function'
            ) {

                warn(

                    'GranadaMon_Telemetry no está disponible.'

                );


                TR.scheduleFirebaseRetry();


                return;
            }


            TR._connecting =
                true;


            T.init()

            .then(
                function() {

                    TR._connecting =
                        false;


                    if (
                        !T._db ||
                        !T._user
                    ) {

                        TR.scheduleFirebaseRetry();

                        return;
                    }


                    TR.clearFirebaseRetry();


                    var ref =
                        T._db.collection(
                            TR.EVENT_COLLECTION
                        );


                    TR._unsubscribe =
                        ref.onSnapshot(

                            {
                                includeMetadataChanges:
                                    true
                            },

                            function(snapshot) {

                                TR.handleCollectionSnapshot(
                                    snapshot
                                );
                            },

                            function(error) {

                                warn(

                                    'Listener Firestore interrumpido.',

                                    error

                                );


                                if (
                                    TR._unsubscribe
                                ) {

                                    try {

                                        TR._unsubscribe();

                                    } catch (e) {}
                                }


                                TR._unsubscribe =
                                    null;


                                TR.scheduleFirebaseRetry();
                            }

                        );


                    log(

                        'Escuchando Firestore:',

                        TR.EVENT_COLLECTION

                    );
                }
            )

            .catch(
                function(error) {

                    TR._connecting =
                        false;


                    warn(

                        'Firebase no disponible. No se ejecutarán eventos Team Rocket.',

                        error

                    );


                    TR.scheduleFirebaseRetry();
                }
            );
        };


    // =========================================================
    // ACTUALIZACIÓN DEL MAPA
    // =========================================================

    if (
        typeof Scene_Map !==
        'undefined'
    ) {

        var _TR_SceneMap_update =
            Scene_Map
                .prototype
                .update;


        Scene_Map
            .prototype
            .update =
            function() {

                _TR_SceneMap_update
                    .call(
                        this
                    );


                TR._frameCounter++;


                if (

                    TR._frameCounter %

                    TR.PENDING_CHECK_FRAMES ===

                    0

                ) {

                    TR.processPending();


                    // Por si el login de Google terminó
                    // después de cargar el juego.
                    if (
                        !TR._unsubscribe
                    ) {

                        TR.connectFirebaseWatch();
                    }
                }
            };
    }


    // =========================================================
    // NUEVA PARTIDA
    // =========================================================

    if (
        typeof Game_System !==
        'undefined'
    ) {

        var _TR_GameSystem_initialize =
            Game_System
                .prototype
                .initialize;


        Game_System
            .prototype
            .initialize =
            function() {

                _TR_GameSystem_initialize
                    .call(
                        this
                    );


                this._granadaMonTeamRocket =
                    this._granadaMonTeamRocket ||
                    TR.newState();
            };
    }


    // =========================================================
    // CARGAR PARTIDA
    // =========================================================

    if (
        typeof DataManager !==
        'undefined' &&

        DataManager.extractSaveContents
    ) {

        var _TR_extractSaveContents =
            DataManager.extractSaveContents;


        DataManager.extractSaveContents =
            function(contents) {

                _TR_extractSaveContents
                    .call(
                        this,
                        contents
                    );


                TR.ensureState();


                TR.decorateDex();


                setTimeout(

                    function() {

                        TR.connectFirebaseWatch();

                        TR.syncPlayerRocketState();

                    },

                    500

                );
            };
    }


    // =========================================================
    // COMANDOS RPG MAKER
    // SOLO DIAGNÓSTICO
    // =========================================================

    if (
        typeof Game_Interpreter !==
        'undefined'
    ) {

        var _TR_pluginCommand =
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

                _TR_pluginCommand.call(

                    this,

                    command,

                    args

                );


                var cmd =
                    asString(
                        command
                    )
                    .toLowerCase();


                if (
                    cmd !==
                    'granadamonrocket'
                ) {

                    return;
                }


                var sub =
                    args &&
                    args.length

                        ? asString(
                            args[0]
                        )
                        .toLowerCase()

                        : '';


                // =============================================
                // TEST LOCAL DE ROBO
                // =============================================

                if (
                    sub ===
                    'testtheft' ||

                    sub ===
                    'test'
                ) {

                    var testId =

                        'LOCAL_TEST_' +

                        asString(
                            nowMs()
                        );


                    TR.queueEvent({

                        eventId:
                            testId,

                        enabled:
                            true,

                        action:
                            'THEFT',

                        order:
                            999999,

                        title:
                            'ALERTA TEAM ROCKET',

                        message:
                            'Prueba local del sistema de robo.'

                    });


                    TR.processPending();


                    return;
                }


                // =============================================
                // COMPROBAR FIREBASE
                // =============================================

                if (
                    sub ===
                    'check'
                ) {

                    TR.connectFirebaseWatch();

                    TR.processPending();

                    return;
                }


                // =============================================
                // ESTADO
                // =============================================

                if (
                    sub ===
                    'status'
                ) {

                    var state =
                        TR.ensureState();


                    if (
                        !$gameMessage ||
                        !state
                    ) {

                        return;
                    }


                    $gameMessage.add(

                        'Team Rocket: ' +

                        TR.stolenCount() +

                        ' Pokémon robado(s).'

                    );


                    if (
                        state.pendingEvents.length
                    ) {

                        $gameMessage.add(

                            'Eventos pendientes: ' +

                            TR.pendingIds()
                                .join(', ')

                        );

                    }

                    else {

                        $gameMessage.add(

                            'No hay eventos Team Rocket pendientes.'

                        );
                    }


                    return;
                }
            };
    }


    // =========================================================
    // ARRANQUE
    // =========================================================

    setTimeout(

        function() {

            TR.ensureState();

            TR.decorateDex();

            TR.connectFirebaseWatch();

        },

        800

    );


    log(

        'GranadaMon TeamRocket v2.1 cargado correctamente.'

    );

})();