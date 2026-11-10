/*:
 * @plugindesc v1.7 GranadaMon - Combate por turnos + encuentros persistentes + UI limpia + faint claro
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleClassic.js
 * ------------------------------------------------------------
 * REQUIERE:
 * - GranadaMon_Core
 * - GranadaMon_Data
 * - GranadaMon_Moves
 * - GranadaMon_State
 * - GranadaMon_Experience
 * - GranadaMon_BattleCore
 * - GranadaMon_Battle
 * - GranadaMon_BattleUI
 * - GranadaMon_Capture
 * - GranadaMon_BattleParty
 * - GranadaMon_BattleSprites
 * - GranadaMon_BattleEffects
 * - GranadaMon_BattleAnimations
 * - GranadaMon_Dex
 *
 * COLOCAR:
 * Después de GranadaMon_Dex y antes de GranadaMon_DexRecovery.
 *
 * DEJAR OFF:
 * - GranadaMon_BattleOutcome
 * - GranadaMon_BattlePersistence
 * - GranadaMon_BattleRealism
 * - GranadaMon_BattleUIPlus
 *
 * FONDO NECESARIO:
 *   img/pictures/GM_Battle_BG.png
 *
 * COMANDOS:
 *   GranadaMonBattle 25 5
 *   GranadaMonBattleGD 59 5
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (!GM.State) {
        throw new Error(
            'GranadaMon_BattleClassic necesita GranadaMon_State.js'
        );
    }

    if (
        !GM.Battle ||
        typeof Scene_GranadaMonBattle === 'undefined'
    ) {
        throw new Error(
            'GranadaMon_BattleClassic necesita GranadaMon_Battle.js'
        );
    }

    if (!GM.BattleUI) {
        throw new Error(
            'GranadaMon_BattleClassic necesita GranadaMon_BattleUI.js'
        );
    }

    GM.BattleClassic =
        GM.BattleClassic || {};

    var BC =
        GM.BattleClassic;

    BC.VERSION =
        '1.7';

    BC.BATTLE_BG_NAME =
        'GM_Battle_BG';

    BC.context =
        null;

    BC.pendingBattleEvent =
        null;

    BC._lastCaptureDestination =
        null;


    // =========================================================
    // UTILIDADES
    // =========================================================

    BC.clamp =
        function(
            value,
            min,
            max
        ) {
            return Math.max(
                min,
                Math.min(
                    max,
                    Number(
                        value || 0
                    )
                )
            );
        };


    BC.ensurePokemon =
        function(pokemon) {

            return pokemon
                ? GM.State.ensurePokemon(
                    pokemon
                )
                : null;
        };


    BC.statusText =
        function(pokemon) {

            pokemon =
                BC.ensurePokemon(
                    pokemon
                );

            if (!pokemon) {
                return '—';
            }

            if (
                Number(
                    pokemon.hp || 0
                ) <= 0 ||
                pokemon.fainted
            ) {
                return 'DEBILITADO';
            }

            var s =
                String(
                    pokemon.status || ''
                ).toUpperCase();

            var map = {
                PARALYSIS:
                    'PARÁLISIS',

                PARALYZED:
                    'PARÁLISIS',

                PARALISIS:
                    'PARÁLISIS',

                POISON:
                    'VENENO',

                POISONED:
                    'VENENO',

                VENENO:
                    'VENENO',

                BURN:
                    'QUEMADO',

                BURNED:
                    'QUEMADO',

                QUEMADURA:
                    'QUEMADO',

                SLEEP:
                    'DORMIDO',

                ASLEEP:
                    'DORMIDO',

                SUENO:
                    'DORMIDO',

                FREEZE:
                    'CONGELADO',

                FROZEN:
                    'CONGELADO',

                CONGELADO:
                    'CONGELADO'
            };

            return (
                map[s] ||
                (
                    s ||
                    'OK'
                )
            );
        };


    BC.statusColor =
        function(text) {

            switch (
                String(
                    text || ''
                ).toUpperCase()
            ) {
                case 'PARÁLISIS':
                    return '#d8b83c';

                case 'VENENO':
                    return '#9362b6';

                case 'QUEMADO':
                    return '#d46849';

                case 'DORMIDO':
                    return '#718195';

                case 'CONGELADO':
                    return '#62b5ce';

                case 'DEBILITADO':
                    return '#bd5050';

                default:
                    return '#64975a';
            }
        };


    BC.hpColor =
        function(rate) {

            if (
                rate <=
                0.20
            ) {
                return '#e34e49';
            }

            if (
                rate <=
                0.50
            ) {
                return '#e2c247';
            }

            return '#63ca65';
        };


    BC.roundedPath =
        function(
            ctx,
            x,
            y,
            w,
            h,
            radius
        ) {
            radius =
                Math.max(
                    0,
                    Math.min(
                        radius,
                        w / 2,
                        h / 2
                    )
                );

            ctx.beginPath();

            ctx.moveTo(
                x + radius,
                y
            );

            ctx.lineTo(
                x + w - radius,
                y
            );

            ctx.quadraticCurveTo(
                x + w,
                y,
                x + w,
                y + radius
            );

            ctx.lineTo(
                x + w,
                y + h - radius
            );

            ctx.quadraticCurveTo(
                x + w,
                y + h,
                x + w - radius,
                y + h
            );

            ctx.lineTo(
                x + radius,
                y + h
            );

            ctx.quadraticCurveTo(
                x,
                y + h,
                x,
                y + h - radius
            );

            ctx.lineTo(
                x,
                y + radius
            );

            ctx.quadraticCurveTo(
                x,
                y,
                x + radius,
                y
            );

            ctx.closePath();
        };


    BC.roundRect =
        function(
            bitmap,
            x,
            y,
            w,
            h,
            radius,
            fill,
            alpha,
            stroke,
            lineWidth
        ) {
            if (
                !bitmap ||
                !bitmap._context
            ) {
                return;
            }

            var ctx =
                bitmap._context;

            ctx.save();

            BC.roundedPath(
                ctx,
                x,
                y,
                w,
                h,
                radius
            );

            ctx.globalAlpha =
                alpha == null
                    ? 1
                    : alpha;

            ctx.fillStyle =
                fill;

            ctx.fill();

            if (stroke) {
                ctx.globalAlpha =
                    1;

                ctx.strokeStyle =
                    stroke;

                ctx.lineWidth =
                    Number(
                        lineWidth || 2
                    );

                ctx.stroke();
            }

            ctx.restore();

            bitmap._setDirty();
        };


    BC.drawPanel =
        function(
            bitmap,
            x,
            y,
            w,
            h,
            selected
        ) {
            if (
                !bitmap ||
                !bitmap._context
            ) {
                return;
            }

            var ctx =
                bitmap._context;

            ctx.save();

            BC.roundedPath(
                ctx,
                x,
                y,
                w,
                h,
                10
            );

            ctx.clip();

            var grad =
                ctx.createLinearGradient(
                    x,
                    y,
                    x,
                    y + h
                );

            grad.addColorStop(
                0,
                selected
                    ? 'rgba(39,91,84,0.96)'
                    : 'rgba(33,51,47,0.92)'
            );

            grad.addColorStop(
                1,
                selected
                    ? 'rgba(29,72,67,0.96)'
                    : 'rgba(20,35,32,0.92)'
            );

            ctx.fillStyle =
                grad;

            ctx.fillRect(
                x,
                y,
                w,
                h
            );

            ctx.restore();

            ctx.save();

            BC.roundedPath(
                ctx,
                x + 1,
                y + 1,
                w - 2,
                h - 2,
                9
            );

            ctx.strokeStyle =
                selected
                    ? '#a7dcf4'
                    : '#83b9e7';

            ctx.lineWidth =
                selected
                    ? 3
                    : 2;

            ctx.stroke();

            ctx.restore();

            bitmap._setDirty();
        };


    BC.drawWrappedText =
        function(
            win,
            text,
            x,
            y,
            maxWidth,
            lineHeight,
            maxLines
        ) {
            var blocks =
                String(
                    text || ''
                ).split('\n');

            var used =
                0;

            for (
                var b = 0;
                b < blocks.length &&
                used < maxLines;
                b++
            ) {
                var words =
                    blocks[b].split(
                        /\s+/
                    );

                var line =
                    '';

                if (
                    !blocks[b]
                ) {
                    y +=
                        lineHeight;

                    used++;

                    continue;
                }

                for (
                    var i = 0;
                    i < words.length;
                    i++
                ) {
                    var test =
                        line
                            ? line +
                              ' ' +
                              words[i]
                            : words[i];

                    if (
                        line &&
                        win.textWidth(
                            test
                        ) >
                        maxWidth
                    ) {
                        win.drawText(
                            line,
                            x,
                            y,
                            maxWidth,
                            'left'
                        );

                        y +=
                            lineHeight;

                        used++;

                        if (
                            used >=
                            maxLines
                        ) {
                            return;
                        }

                        line =
                            words[i];

                    } else {
                        line =
                            test;
                    }
                }

                if (
                    line &&
                    used <
                    maxLines
                ) {
                    win.drawText(
                        line,
                        x,
                        y,
                        maxWidth,
                        'left'
                    );

                    y +=
                        lineHeight;

                    used++;
                }
            }
        };


    // =========================================================
    // FONDO EXTERNO
    // =========================================================

    BC.fitBattleBackground =
        function(sprite) {

            if (
                !sprite ||
                !sprite.bitmap ||
                !sprite.bitmap.width ||
                !sprite.bitmap.height
            ) {
                return;
            }

            var sx =
                Graphics.boxWidth /
                sprite.bitmap.width;

            var sy =
                Graphics.boxHeight /
                sprite.bitmap.height;

            var scale =
                Math.max(
                    sx,
                    sy
                );

            sprite.scale.x =
                scale;

            sprite.scale.y =
                scale;

            sprite.x =
                Math.round(
                    (
                        Graphics.boxWidth -
                        sprite.bitmap.width *
                        scale
                    ) /
                    2
                );

            sprite.y =
                Math.round(
                    (
                        Graphics.boxHeight -
                        sprite.bitmap.height *
                        scale
                    ) /
                    2
                );
        };


    Scene_GranadaMonBattle.prototype.createBackground =
        function() {

            var self =
                this;

            this._backgroundSprite =
                new Sprite(
                    ImageManager.loadPicture(
                        BC.BATTLE_BG_NAME
                    )
                );

            this.addChild(
                this._backgroundSprite
            );

            this._backgroundSprite.bitmap.addLoadListener(
                function() {

                    BC.fitBattleBackground(
                        self._backgroundSprite
                    );
                }
            );


            var overlay =
                new Bitmap(
                    Graphics.boxWidth,
                    Graphics.boxHeight
                );

            var ctx =
                overlay._context;

            ctx.save();


            var top =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    150
                );

            top.addColorStop(
                0,
                'rgba(10,25,30,0.13)'
            );

            top.addColorStop(
                1,
                'rgba(10,25,30,0)'
            );

            ctx.fillStyle =
                top;

            ctx.fillRect(
                0,
                0,
                Graphics.boxWidth,
                150
            );


            var bottom =
                ctx.createLinearGradient(
                    0,
                    Graphics.boxHeight -
                    190,
                    0,
                    Graphics.boxHeight
                );

            bottom.addColorStop(
                0,
                'rgba(8,28,20,0)'
            );

            bottom.addColorStop(
                1,
                'rgba(8,28,20,0.16)'
            );

            ctx.fillStyle =
                bottom;

            ctx.fillRect(
                0,
                Graphics.boxHeight -
                190,
                Graphics.boxWidth,
                190
            );


            ctx.restore();

            overlay._setDirty();


            this._gmBattleBackgroundOverlay =
                new Sprite(
                    overlay
                );

            this.addChild(
                this._gmBattleBackgroundOverlay
            );
        };


    // =========================================================
    // ENCUENTROS DE BATALLA PERSISTENTES
    // =========================================================

    BC.ensureResolvedBattleRegistry =
        function() {

            if (
                !$gameSystem
            ) {
                return {};
            }

            if (
                !$gameSystem._granadaMonResolvedBattleEvents
            ) {
                $gameSystem._granadaMonResolvedBattleEvents =
                    {};
            }

            return (
                $gameSystem._granadaMonResolvedBattleEvents
            );
        };


    BC.battleEventKey =
        function(
            mapId,
            eventId
        ) {
            return (
                String(
                    Number(
                        mapId || 0
                    )
                ) +
                ':' +
                String(
                    Number(
                        eventId || 0
                    )
                )
            );
        };


    BC.markBattleEventResolved =
        function(
            mapId,
            eventId
        ) {
            mapId =
                Number(
                    mapId || 0
                );

            eventId =
                Number(
                    eventId || 0
                );

            if (
                !mapId ||
                !eventId ||
                !$gameSystem
            ) {
                return;
            }

            var registry =
                BC.ensureResolvedBattleRegistry();

            registry[
                BC.battleEventKey(
                    mapId,
                    eventId
                )
            ] =
                true;
        };


    BC.isBattleEventResolved =
        function(
            mapId,
            eventId
        ) {
            mapId =
                Number(
                    mapId || 0
                );

            eventId =
                Number(
                    eventId || 0
                );

            if (
                !mapId ||
                !eventId
            ) {
                return false;
            }

            var registry =
                BC.ensureResolvedBattleRegistry();

            if (
                registry[
                    BC.battleEventKey(
                        mapId,
                        eventId
                    )
                ]
            ) {
                return true;
            }

            if (
                $gameSelfSwitches &&
                $gameSelfSwitches.value(
                    [
                        mapId,
                        eventId,
                        'A'
                    ]
                )
            ) {
                return true;
            }

            return false;
        };


    BC.resolveBattleEvent =
        function(context) {

            if (
                !context
            ) {
                return;
            }

            var mapId =
                Number(
                    context.mapId || 0
                );

            var eventId =
                Number(
                    context.eventId || 0
                );

            if (
                !mapId ||
                !eventId
            ) {
                return;
            }


            BC.markBattleEventResolved(
                mapId,
                eventId
            );


            if (
                $gameSelfSwitches
            ) {
                $gameSelfSwitches.setValue(
                    [
                        mapId,
                        eventId,
                        'A'
                    ],
                    true
                );
            }


            if (
                $gameMap &&
                $gameMap.mapId() ===
                mapId
            ) {
                var ev =
                    $gameMap.event(
                        eventId
                    );

                if (
                    ev &&
                    ev.erase
                ) {
                    ev.erase();
                }
            }
        };


    BC.eventDataUsesGranadaBattle =
        function(eventData) {

            if (
                !eventData ||
                !eventData.pages
            ) {
                return false;
            }


            for (
                var p = 0;
                p < eventData.pages.length;
                p++
            ) {
                var page =
                    eventData.pages[p];

                if (
                    !page ||
                    !page.list
                ) {
                    continue;
                }


                for (
                    var i = 0;
                    i < page.list.length;
                    i++
                ) {
                    var command =
                        page.list[i];

                    if (
                        !command ||
                        command.code !==
                        356
                    ) {
                        continue;
                    }


                    var line =
                        String(
                            command.parameters &&
                            command.parameters.length
                                ? command.parameters[0]
                                : ''
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        line.indexOf(
                            'granadamonbattlegd'
                        ) ===
                        0 ||

                        line.indexOf(
                            'granadamonbattle'
                        ) ===
                        0
                    ) {
                        return true;
                    }
                }
            }


            return false;
        };


    BC.shouldEraseBattleEvent =
        function(gameEvent) {

            if (
                !gameEvent
            ) {
                return false;
            }


            var mapId =
                Number(
                    gameEvent._mapId || 0
                );

            var eventId =
                Number(
                    gameEvent._eventId || 0
                );


            if (
                !mapId ||
                !eventId
            ) {
                return false;
            }


            var registry =
                BC.ensureResolvedBattleRegistry();


            if (
                registry[
                    BC.battleEventKey(
                        mapId,
                        eventId
                    )
                ]
            ) {
                return true;
            }


            var eventData =
                gameEvent.event
                    ? gameEvent.event()
                    : null;


            if (
                BC.eventDataUsesGranadaBattle(
                    eventData
                ) &&

                $gameSelfSwitches &&

                $gameSelfSwitches.value(
                    [
                        mapId,
                        eventId,
                        'A'
                    ]
                )
            ) {
                BC.markBattleEventResolved(
                    mapId,
                    eventId
                );

                return true;
            }


            return false;
        };


    var _BC17_GameEvent_refresh =
        Game_Event.prototype.refresh;


    Game_Event.prototype.refresh =
        function() {

            _BC17_GameEvent_refresh.call(
                this
            );


            if (
                !this._erased &&
                BC.shouldEraseBattleEvent(
                    this
                )
            ) {
                this._erased =
                    true;

                _BC17_GameEvent_refresh.call(
                    this
                );
            }
        };


    // =========================================================
    // POKÉDEX / RESULTADOS PERSISTENTES
    // =========================================================

    BC.ensureDexStatsTable =
        function() {

            if (
                !$gameSystem
            ) {
                return {};
            }


            if (
                !$gameSystem._granadaMonBattleDexStats
            ) {
                $gameSystem._granadaMonBattleDexStats =
                    {};
            }


            return (
                $gameSystem._granadaMonBattleDexStats
            );
        };


    BC.getDexStats =
        function(nationalDex) {

            var table =
                BC.ensureDexStatsTable();

            var key =
                String(
                    Number(
                        nationalDex ||
                        0
                    )
                );


            if (
                !table[key]
            ) {
                table[key] = {
                    encounteredCount:
                        0,

                    defeatedCount:
                        0,

                    capturedCount:
                        0,

                    playerEscapedCount:
                        0,

                    playerLostCount:
                        0,

                    lastOutcome:
                        null
                };
            }


            return (
                table[key]
            );
        };


    BC.decorateDex =
        function() {

            if (
                !$gameSystem ||
                !$gameSystem._granadaMonDex
            ) {
                return;
            }


            var dex =
                $gameSystem._granadaMonDex;


            for (
                var i = 0;
                i < dex.length;
                i++
            ) {
                var entry =
                    dex[i];

                if (
                    !entry
                ) {
                    continue;
                }


                var stats =
                    BC.getDexStats(
                        entry.speciesId
                    );


                entry.encounteredCount =
                    Number(
                        stats.encounteredCount ||
                        0
                    );


                entry.defeatedCount =
                    Number(
                        stats.defeatedCount ||
                        0
                    );


                entry.capturedCount =
                    Number(
                        stats.capturedCount ||
                        0
                    );


                entry.playerEscapedCount =
                    Number(
                        stats.playerEscapedCount ||
                        0
                    );


                entry.playerLostCount =
                    Number(
                        stats.playerLostCount ||
                        0
                    );


                entry.defeated =
                    entry.defeatedCount >
                    0;


                entry.lastBattleOutcome =
                    stats.lastOutcome ||
                    null;
            }
        };


    GM.BattlePersistence =
        GM.BattlePersistence ||
        {};


    GM.BattlePersistence.getDexStats =
        function(nationalDex) {

            return BC.getDexStats(
                nationalDex
            );
        };


    if (
        GM.syncDex
    ) {
        var _BC_syncDex =
            GM.syncDex;


        GM.syncDex =
            function() {

                _BC_syncDex.call(
                    GM
                );

                BC.decorateDex();
            };
    }


    BC.recordEncounter =
        function(enemy) {

            if (
                !enemy
            ) {
                return;
            }


            var stats =
                BC.getDexStats(
                    enemy.speciesId
                );


            stats.encounteredCount =
                Number(
                    stats.encounteredCount ||
                    0
                ) +
                1;


            stats.lastOutcome =
                'ENCOUNTER';


            if (
                GM.markSeen
            ) {
                GM.markSeen(
                    enemy.speciesId
                );
            }


            if (
                GM.syncDex
            ) {
                GM.syncDex();
            }
        };


    BC.recordDefeat =
        function(enemy) {

            if (
                !enemy
            ) {
                return;
            }


            var stats =
                BC.getDexStats(
                    enemy.speciesId
                );


            stats.defeatedCount =
                Number(
                    stats.defeatedCount ||
                    0
                ) +
                1;


            stats.lastOutcome =
                'DEFEATED';


            if (
                GM.markSeen
            ) {
                GM.markSeen(
                    enemy.speciesId
                );
            }


            if (
                GM.syncDex
            ) {
                GM.syncDex();
            }
        };


    BC.recordCapture =
        function(enemy) {

            if (
                !enemy
            ) {
                return;
            }


            var stats =
                BC.getDexStats(
                    enemy.speciesId
                );


            stats.capturedCount =
                Number(
                    stats.capturedCount ||
                    0
                ) +
                1;


            stats.lastOutcome =
                'CAPTURED';


            if (
                GM.markCaught
            ) {
                GM.markCaught(
                    enemy.speciesId
                );
            }


            if (
                GM.syncDex
            ) {
                GM.syncDex();
            }
        };


    BC.recordRun =
        function(enemy) {

            if (
                !enemy
            ) {
                return;
            }


            var stats =
                BC.getDexStats(
                    enemy.speciesId
                );


            stats.playerEscapedCount =
                Number(
                    stats.playerEscapedCount ||
                    0
                ) +
                1;


            stats.lastOutcome =
                'RUN';


            if (
                GM.syncDex
            ) {
                GM.syncDex();
            }
        };


    BC.recordLoss =
        function(enemy) {

            if (
                !enemy
            ) {
                return;
            }


            var stats =
                BC.getDexStats(
                    enemy.speciesId
                );


            stats.playerLostCount =
                Number(
                    stats.playerLostCount ||
                    0
                ) +
                1;


            stats.lastOutcome =
                'LOSE';


            if (
                GM.syncDex
            ) {
                GM.syncDex();
            }
        };


    // =========================================================
    // CONTEXTO / EXP
    // =========================================================

    BC.beginContext =
        function(eventContext) {

            eventContext =
                eventContext ||
                {};


            BC.context = {
                participants:
                    {},

                resolved:
                    false,

                outcome:
                    null,

                mapId:
                    Number(
                        eventContext.mapId ||
                        0
                    ),

                eventId:
                    Number(
                        eventContext.eventId ||
                        0
                    )
            };


            if (
                GM.Battle.enemy
            ) {
                BC.recordEncounter(
                    GM.Battle.enemy
                );
            }


            BC.noteParticipant(
                GM.Battle.playerPokemon
            );
        };


    BC.noteParticipant =
        function(pokemon) {

            pokemon =
                BC.ensurePokemon(
                    pokemon
                );


            if (
                !pokemon ||
                !pokemon.uid
            ) {
                return;
            }


            if (
                !BC.context
            ) {
                BC.context = {
                    participants:
                        {},

                    resolved:
                        false,

                    outcome:
                        null
                };
            }


            var key =
                String(
                    pokemon.uid
                );


            if (
                !BC.context.participants[
                    key
                ]
            ) {
                BC.context.participants[
                    key
                ] =
                    true;


                pokemon.battleRecord =
                    pokemon.battleRecord ||
                    {};


                pokemon.battleRecord.battles =
                    Number(
                        pokemon.battleRecord.battles ||
                        0
                    ) +
                    1;
            }
        };


    BC.participants =
        function() {

            var result =
                [];


            if (
                !BC.context ||
                !BC.context.participants
            ) {
                return result;
            }


            for (
                var uid in
                BC.context.participants
            ) {
                if (
                    !BC.context.participants.hasOwnProperty(
                        uid
                    )
                ) {
                    continue;
                }


                var pokemon =
                    GM.State.findByUid(
                        uid
                    );


                if (
                    pokemon
                ) {
                    result.push(
                        GM.State.ensurePokemon(
                            pokemon
                        )
                    );
                }
            }


            return result;
        };


    BC.baseExpYield =
        function(enemy) {

            if (
                !enemy ||
                !GM.getSpecies
            ) {
                return 50;
            }


            var species =
                GM.getSpecies(
                    enemy.speciesId
                );


            if (
                !species ||
                !species.baseStats
            ) {
                return 50;
            }


            var s =
                species.baseStats;


            var total =
                Number(
                    s.hp || 0
                ) +

                Number(
                    s.attack || 0
                ) +

                Number(
                    s.defense || 0
                ) +

                Number(
                    s.spAttack || 0
                ) +

                Number(
                    s.spDefense || 0
                ) +

                Number(
                    s.speed || 0
                );


            return Math.max(
                20,
                Math.floor(
                    total /
                    3
                )
            );
        };


    BC.awardVictoryExp =
        function(enemy) {

            var participants =
                BC.participants();


            var messages =
                [];


            if (
                !enemy ||
                !participants.length ||
                !GM.gainExp
            ) {
                return messages;
            }


            var total =
                Math.max(
                    1,
                    Math.floor(
                        (
                            BC.baseExpYield(
                                enemy
                            ) *

                            Math.max(
                                1,
                                Number(
                                    enemy.level ||
                                    1
                                )
                            )
                        ) /
                        7
                    )
                );


            var each =
                Math.max(
                    1,
                    Math.floor(
                        total /
                        participants.length
                    )
                );


            for (
                var i = 0;
                i < participants.length;
                i++
            ) {
                var pokemon =
                    participants[i];


                var oldLevel =
                    Number(
                        pokemon.level ||
                        1
                    );


                var result =
                    GM.gainExp(
                        pokemon,
                        each
                    );


                if (
                    !result ||
                    !result.success
                ) {
                    continue;
                }


                messages.push(
                    pokemon.name +
                    ' gana ' +
                    result.amount +
                    ' EXP.'
                );


                if (
                    Number(
                        pokemon.level ||
                        1
                    ) >
                    oldLevel
                ) {
                    messages.push(
                        '¡' +
                        pokemon.name +
                        ' sube al nivel ' +
                        pokemon.level +
                        '!'
                    );
                }


                GM.State.ensurePokemon(
                    pokemon
                );
            }


            return messages;
        };


    if (
        GM.Battle.startWildBattle
    ) {
        var _BC_startWildBattle =
            GM.Battle.startWildBattle;


        GM.Battle.startWildBattle =
            function(
                nationalDex,
                level
            ) {

                GM.State.normalizeAll();


                var eventContext =
                    BC.pendingBattleEvent;


                BC.pendingBattleEvent =
                    null;


                if (
                    eventContext &&
                    BC.isBattleEventResolved(
                        eventContext.mapId,
                        eventContext.eventId
                    )
                ) {
                    if (
                        $gameMessage
                    ) {
                        $gameMessage.add(
                            'Este encuentro ya ha terminado.'
                        );
                    }

                    return false;
                }


                var started =
                    _BC_startWildBattle.call(
                        GM.Battle,
                        nationalDex,
                        level
                    );


                if (
                    started
                ) {
                    BC.beginContext(
                        eventContext
                    );
                }


                return started;
            };
    }


    if (
        Scene_GranadaMonBattle.prototype
            .executeGMPokemonSwitch
    ) {
        var _BC_executeSwitch =
            Scene_GranadaMonBattle.prototype
                .executeGMPokemonSwitch;


        Scene_GranadaMonBattle.prototype
            .executeGMPokemonSwitch =
            function(nextPokemon) {

                BC.noteParticipant(
                    nextPokemon
                );


                return _BC_executeSwitch.call(
                    this,
                    nextPokemon
                );
            };
    }


    // =========================================================
    // CAPTURA EN COMBATE
    // =========================================================

    if (
        GM.Capture
    ) {
        GM.Capture.storeCapturedPokemon =
            function(pokemon) {

                if (
                    !pokemon ||
                    !$gameSystem
                ) {
                    return null;
                }


                if (
                    GM.resetBattleStages
                ) {
                    GM.resetBattleStages(
                        pokemon
                    );
                }


                GM.State.ensurePokemon(
                    pokemon
                );


                $gameSystem._granadaMonParty =
                    $gameSystem._granadaMonParty ||
                    [];


                $gameSystem._granadaMonStorage =
                    $gameSystem._granadaMonStorage ||
                    [];


                var destination;


                if (
                    $gameSystem._granadaMonParty.length <
                    6
                ) {
                    $gameSystem._granadaMonParty.push(
                        pokemon
                    );

                    destination =
                        'PARTY';

                } else {
                    $gameSystem._granadaMonStorage.push(
                        pokemon
                    );

                    destination =
                        'STORAGE';
                }


                if (
                    GM.markCaught
                ) {
                    GM.markCaught(
                        pokemon.speciesId
                    );
                }


                if (
                    GM.syncDex
                ) {
                    GM.syncDex();
                }


                BC._lastCaptureDestination =
                    destination;


                return destination;
            };
    }


    // =========================================================
    // UI DE ESTADO
    // =========================================================

    BC.styleStatusWindow =
        function(win) {

            if (
                !win
            ) {
                return;
            }


            win.opacity =
                0;


            win.backOpacity =
                0;


            win.padding =
                8;


            win.refresh =
                function() {

                    this.contents.clear();


                    var mon =
                        this.pokemon
                            ? this.pokemon()
                            : null;


                    if (
                        !mon
                    ) {
                        return;
                    }


                    mon =
                        GM.State.ensurePokemon(
                            mon
                        );


                    var w =
                        this.contentsWidth();


                    var h =
                        this.contentsHeight();


                    var isEnemy =
                        !!this._enemy;


                    BC.drawPanel(
                        this.contents,
                        1,
                        1,
                        w - 2,
                        h - 2,
                        false
                    );


                    this.contents.fontSize =
                        22;


                    this.contents.fontBold =
                        true;


                    this.contents.textColor =
                        '#f5dc61';


                    this.contents.outlineColor =
                        'rgba(0,0,0,0.65)';


                    this.contents.outlineWidth =
                        3;


                    this.drawText(
                        mon.name ||
                        'Pokémon',
                        12,
                        5,
                        w - 106,
                        28,
                        'left'
                    );


                    this.contents.fontSize =
                        18;


                    this.contents.fontBold =
                        false;


                    this.contents.textColor =
                        '#ffffff';


                    this.drawText(
                        'Nv. ' +
                        Number(
                            mon.level ||
                            1
                        ),
                        w - 95,
                        6,
                        82,
                        27,
                        'right'
                    );


                    this.contents.fontSize =
                        16;


                    this.contents.textColor =
                        '#91bde7';


                    this.drawText(
                        'PS',
                        13,
                        36,
                        34,
                        22,
                        'left'
                    );


                    var maxHp =
                        Math.max(
                            1,
                            Number(
                                mon.maxHp ||
                                1
                            )
                        );


                    var visualHp =
                        mon._gmVisualHpOverride !=
                        null
                            ? Math.max(
                                0,
                                Number(
                                    mon._gmVisualHpOverride ||
                                    0
                                )
                              )
                            : Math.max(
                                0,
                                Number(
                                    mon.hp ||
                                    0
                                )
                              );


                    var rate =
                        BC.clamp(
                            visualHp /
                            maxHp,
                            0,
                            1
                        );


                    var gaugeX =
                        48;


                    var gaugeY =
                        43;


                    var gaugeW =
                        w -
                        61;


                    BC.roundRect(
                        this.contents,
                        gaugeX,
                        gaugeY,
                        gaugeW,
                        14,
                        7,
                        '#121918',
                        0.98,
                        '#506d70',
                        1
                    );


                    var fillW =
                        Math.max(
                            0,
                            Math.floor(
                                (
                                    gaugeW -
                                    4
                                ) *
                                rate
                            )
                        );


                    if (
                        fillW >
                        0
                    ) {
                        BC.roundRect(
                            this.contents,
                            gaugeX + 2,
                            gaugeY + 2,
                            fillW,
                            10,
                            5,
                            BC.hpColor(
                                rate
                            ),
                            1
                        );
                    }


                    var status =
                        (
                            visualHp >
                            0 &&
                            Number(
                                mon.hp ||
                                0
                            ) <=
                            0
                        )
                            ? 'OK'
                            : BC.statusText(
                                mon
                              );


                    if (
                        !isEnemy
                    ) {
                        this.contents.fontSize =
                            15;


                        this.contents.textColor =
                            '#ffffff';


                        this.drawText(
                            Math.round(
                                visualHp
                            ) +
                            ' / ' +
                            Number(
                                mon.maxHp ||
                                0
                            ),
                            w - 112,
                            h - 27,
                            100,
                            22,
                            'right'
                        );
                    }


                    if (
                        status !==
                        'OK'
                    ) {
                        var badgeW =
                            Math.min(
                                105,
                                Math.max(
                                    64,
                                    status.length *
                                    7 +
                                    16
                                )
                            );


                        BC.roundRect(
                            this.contents,
                            12,
                            h - 25,
                            badgeW,
                            19,
                            8,
                            BC.statusColor(
                                status
                            ),
                            0.97
                        );


                        this.contents.fontSize =
                            12;


                        this.contents.textColor =
                            '#ffffff';


                        this.drawText(
                            status,
                            12,
                            h - 27,
                            badgeW,
                            19,
                            'center'
                        );
                    }


                    this.contents.fontBold =
                        false;


                    this.contents.fontSize =
                        this.standardFontSize();


                    this.resetTextColor();
                };


            win.refresh();
        };


    BC.styleLogWindow =
        function(win) {

            if (
                !win
            ) {
                return;
            }


            win.opacity =
                0;


            win.backOpacity =
                0;


            win.padding =
                9;


            win.refresh =
                function() {

                    this.contents.clear();


                    var w =
                        this.contentsWidth();


                    var h =
                        this.contentsHeight();


                    BC.drawPanel(
                        this.contents,
                        1,
                        1,
                        w - 2,
                        h - 2,
                        false
                    );


                    this.contents.fontSize =
                        19;


                    this.contents.fontBold =
                        false;


                    this.contents.textColor =
                        '#ffffff';


                    this.contents.outlineColor =
                        'rgba(0,0,0,0.66)';


                    this.contents.outlineWidth =
                        3;


                    BC.drawWrappedText(
                        this,
                        String(
                            this._text ||
                            ''
                        ),
                        15,
                        14,
                        w - 30,
                        28,
                        5
                    );


                    this.contents.fontSize =
                        this.standardFontSize();


                    this.resetTextColor();
                };


            win.refresh();
        };


    // =========================================================
    // COLORES MENÚ
    // =========================================================

    BC.commandColor =
        function(
            symbol,
            index
        ) {
            var map = {
                fight:
                    '#D85A5A',

                bag:
                    '#DCAA43',

                pokemon:
                    '#5BA75A',

                run:
                    '#4D91BF'
            };


            return (
                map[
                    String(
                        symbol ||
                        ''
                    ).toLowerCase()
                ] ||

                [
                    '#D85A5A',
                    '#DCAA43',
                    '#5BA75A',
                    '#4D91BF'
                ][
                    index %
                    4
                ]
            );
        };


    BC.drawPokemonCommandPanel =
        function(
            bitmap,
            x,
            y,
            w,
            h,
            color,
            selected
        ) {

            if (
                !bitmap ||
                !bitmap._context
            ) {
                return;
            }


            var ctx =
                bitmap._context;


            ctx.save();


            BC.roundedPath(
                ctx,
                x,
                y,
                w,
                h,
                13
            );


            ctx.clip();


            var grad =
                ctx.createLinearGradient(
                    x,
                    y,
                    x,
                    y + h
                );


            if (
                selected
            ) {
                grad.addColorStop(
                    0,
                    color
                );

                grad.addColorStop(
                    1,
                    color
                );

            } else {
                grad.addColorStop(
                    0,
                    color
                );

                grad.addColorStop(
                    1,
                    'rgba(20,30,32,0.46)'
                );
            }


            ctx.fillStyle =
                grad;


            ctx.globalAlpha =
                selected
                    ? 1
                    : 0.88;


            ctx.fillRect(
                x,
                y,
                w,
                h
            );


            var shine =
                ctx.createLinearGradient(
                    x,
                    y,
                    x,
                    y +
                    h *
                    0.52
                );


            shine.addColorStop(
                0,
                'rgba(255,255,255,0.22)'
            );


            shine.addColorStop(
                1,
                'rgba(255,255,255,0)'
            );


            ctx.globalAlpha =
                1;


            ctx.fillStyle =
                shine;


            ctx.fillRect(
                x,
                y,
                w,
                h *
                0.52
            );


            ctx.restore();


            ctx.save();


            BC.roundedPath(
                ctx,
                x + 1,
                y + 1,
                w - 2,
                h - 2,
                12
            );


            ctx.strokeStyle =
                selected
                    ? '#ffffff'
                    : 'rgba(255,255,255,0.62)';


            ctx.lineWidth =
                selected
                    ? 3
                    : 2;


            ctx.stroke();


            ctx.restore();


            if (
                selected
            ) {
                ctx.save();


                BC.roundedPath(
                    ctx,
                    x + 4,
                    y + 4,
                    w - 8,
                    h - 8,
                    10
                );


                ctx.strokeStyle =
                    'rgba(255,255,255,0.32)';


                ctx.lineWidth =
                    2;


                ctx.stroke();


                ctx.restore();
            }


            bitmap._setDirty();
        };


    BC.styleCommandWindow =
        function(win) {

            if (
                !win
            ) {
                return;
            }


            win.opacity =
                0;


            win.backOpacity =
                0;


            win.padding =
                8;


            win.maxCols =
                function() {
                    return 1;
                };


            win.numVisibleRows =
                function() {
                    return 4;
                };


            win.spacing =
                function() {
                    return 0;
                };


            win.itemHeight =
                function() {

                    return Math.max(
                        30,
                        Math.floor(
                            this.contentsHeight() /
                            4
                        )
                    );
                };


            win.drawItem =
                function(index) {

                    var rect =
                        this.itemRect(
                            index
                        );


                    var selected =
                        this.index() ===
                        index;


                    var enabled =
                        this.isCommandEnabled(
                            index
                        );


                    var symbol =
                        this.commandSymbol
                            ? this.commandSymbol(
                                index
                              )
                            : '';


                    var color =
                        BC.commandColor(
                            symbol,
                            index
                        );


                    BC.drawPokemonCommandPanel(
                        this.contents,
                        rect.x + 3,
                        rect.y + 3,
                        rect.width - 6,
                        rect.height - 6,
                        color,
                        selected
                    );


                    this.changePaintOpacity(
                        enabled
                    );


                    this.contents.fontSize =
                        selected
                            ? 19
                            : 18;


                    this.contents.fontBold =
                        true;


                    this.contents.textColor =
                        '#ffffff';


                    this.contents.outlineColor =
                        'rgba(0,0,0,0.68)';


                    this.contents.outlineWidth =
                        4;


                    this.drawText(
                        (
                            selected
                                ? '▶  '
                                : ''
                        ) +
                        this.commandName(
                            index
                        ),
                        rect.x + 8,
                        rect.y,
                        rect.width - 16,
                        rect.height,
                        'center'
                    );


                    this.changePaintOpacity(
                        true
                    );


                    this.contents.fontBold =
                        false;


                    this.contents.fontSize =
                        this.standardFontSize();


                    this.resetTextColor();
                };


            var originalUpdate =
                win.update;


            win.update =
                function() {

                    originalUpdate.call(
                        this
                    );


                    if (
                        this._gmClassicIndex !==
                        this.index()
                    ) {
                        this._gmClassicIndex =
                            this.index();


                        this.refresh();
                    }
                };


            win.refresh();
        };


    // =========================================================
    // MOVIMIENTOS
    // =========================================================

    BC.styleMoveWindow =
        function(win) {

            if (
                !win
            ) {
                return;
            }


            win.opacity =
                0;


            win.backOpacity =
                0;


            win.padding =
                8;


            win.maxCols =
                function() {
                    return 2;
                };


            win.itemHeight =
                function() {

                    return Math.max(
                        62,
                        Math.floor(
                            this.contentsHeight() /
                            2
                        )
                    );
                };


            win.drawItem =
                function(index) {

                    var mon =
                        GM.Battle.playerPokemon;


                    if (
                        !mon ||
                        !mon.moves ||
                        !mon.moves[index]
                    ) {
                        return;
                    }


                    var instance =
                        mon.moves[
                            index
                        ];


                    var move =
                        GM.getMove(
                            instance.id
                        );


                    if (
                        !move
                    ) {
                        return;
                    }


                    var rect =
                        this.itemRect(
                            index
                        );


                    var selected =
                        this.index() ===
                        index;


                    var currentPP =
                        Number(
                            instance.currentPP ||
                            0
                        );


                    var maxPP =
                        Number(
                            instance.maxPP !=
                            null
                                ? instance.maxPP
                                : move.pp ||
                                  0
                        );


                    var enabled =
                        currentPP >
                        0;


                    var typeColor =
                        GM.BattleUI.typeColor(
                            move.type
                        );


                    var typeText =
                        String(
                            move.type ||
                            '—'
                        ).toUpperCase();


                    BC.drawPanel(
                        this.contents,
                        rect.x + 4,
                        rect.y + 4,
                        rect.width - 8,
                        rect.height - 8,
                        selected
                    );


                    this.changePaintOpacity(
                        enabled
                    );


                    this.contents.fontSize =
                        18;


                    this.contents.fontBold =
                        true;


                    this.contents.textColor =
                        '#ffffff';


                    this.contents.outlineColor =
                        'rgba(0,0,0,0.55)';


                    this.contents.outlineWidth =
                        3;


                    this.drawText(
                        move.name,
                        rect.x + 14,
                        rect.y + 6,
                        rect.width - 28,
                        26,
                        'left'
                    );


                    var chipY =
                        rect.y +
                        37;


                    var typeW =
                        Math.min(
                            112,
                            Math.max(
                                70,
                                typeText.length *
                                7 +
                                20
                            )
                        );


                    BC.roundRect(
                        this.contents,
                        rect.x + 14,
                        chipY,
                        typeW,
                        22,
                        11,
                        typeColor,
                        0.92,
                        'rgba(255,255,255,0.45)',
                        1
                    );


                    this.contents.fontSize =
                        11;


                    this.contents.fontBold =
                        true;


                    this.contents.textColor =
                        '#ffffff';


                    this.contents.outlineWidth =
                        2;


                    this.drawText(
                        typeText,
                        rect.x + 14,
                        chipY - 2,
                        typeW,
                        22,
                        'center'
                    );


                    var ppW =
                        92;


                    var ppX =
                        rect.x +
                        rect.width -
                        ppW -
                        14;


                    BC.roundRect(
                        this.contents,
                        ppX,
                        chipY,
                        ppW,
                        22,
                        11,
                        currentPP >
                        0
                            ? '#243b42'
                            : '#5b3232',
                        0.94,
                        'rgba(255,255,255,0.28)',
                        1
                    );


                    this.contents.fontSize =
                        11;


                    this.contents.fontBold =
                        false;


                    this.contents.textColor =
                        '#ffffff';


                    this.drawText(
                        currentPP +
                        '/' +
                        maxPP +
                        ' PP',
                        ppX,
                        chipY - 2,
                        ppW,
                        22,
                        'center'
                    );


                    this.changePaintOpacity(
                        true
                    );


                    this.contents.fontBold =
                        false;


                    this.contents.fontSize =
                        this.standardFontSize();


                    this.resetTextColor();
                };


            var originalUpdate =
                win.update;


            win.update =
                function() {

                    originalUpdate.call(
                        this
                    );


                    if (
                        this._gmClassicIndex !==
                        this.index()
                    ) {
                        this._gmClassicIndex =
                            this.index();


                        this.refresh();
                    }
                };


            win.refresh();
        };


    // =========================================================
    // BALLS
    // =========================================================

    BC.styleBallWindow =
        function(win) {

            if (
                !win
            ) {
                return;
            }


            win.opacity =
                0;


            win.backOpacity =
                0;


            win.padding =
                8;


            win.itemHeight =
                function() {
                    return 44;
                };


            win.drawItem =
                function(index) {

                    var rect =
                        this.itemRect(
                            index
                        );


                    var item =
                        (
                            this._data ||
                            []
                        )[
                            index
                        ];


                    if (
                        !item
                    ) {
                        if (
                            index ===
                            0
                        ) {
                            BC.drawPanel(
                                this.contents,
                                rect.x + 3,
                                rect.y + 3,
                                rect.width - 6,
                                rect.height - 6,
                                false
                            );


                            this.changePaintOpacity(
                                false
                            );


                            this.drawText(
                                'No tienes Poké Balls.',
                                rect.x + 8,
                                rect.y,
                                rect.width - 16,
                                rect.height,
                                'center'
                            );


                            this.changePaintOpacity(
                                true
                            );
                        }


                        return;
                    }


                    var selected =
                        this.index() ===
                        index;


                    BC.drawPanel(
                        this.contents,
                        rect.x + 3,
                        rect.y + 3,
                        rect.width - 6,
                        rect.height - 6,
                        selected
                    );


                    if (
                        GM.BallVisuals &&
                        GM.BallVisuals.draw
                    ) {
                        GM.BallVisuals.draw(
                            this.contents,
                            rect.x + 22,
                            rect.y +
                            Math.floor(
                                rect.height /
                                2
                            ),
                            24,
                            item.key,
                            null
                        );
                    }


                    this.contents.fontSize =
                        16;


                    this.contents.textColor =
                        '#ffffff';


                    this.drawText(
                        item.name,
                        rect.x + 42,
                        rect.y,
                        rect.width - 100,
                        rect.height,
                        'left'
                    );


                    this.drawText(
                        '× ' +
                        GM.getItemQuantity(
                            item.key
                        ),
                        rect.x,
                        rect.y,
                        rect.width - 12,
                        rect.height,
                        'right'
                    );


                    this.contents.fontSize =
                        this.standardFontSize();


                    this.resetTextColor();
                };


            var originalUpdate =
                win.update;


            win.update =
                function() {

                    originalUpdate.call(
                        this
                    );


                    if (
                        this._gmClassicIndex !==
                        this.index()
                    ) {
                        this._gmClassicIndex =
                            this.index();


                        this.refresh();
                    }
                };


            win.refresh();
        };


    // =========================================================
    // LAYOUT
    // =========================================================

    BC.applyLayout =
        function(scene) {

            if (
                !scene
            ) {
                return;
            }


            var W =
                Graphics.boxWidth;


            var H =
                Graphics.boxHeight;


            var bottomH =
                Math.max(
                    184,
                    Math.min(
                        198,
                        Math.floor(
                            H *
                            0.305
                        )
                    )
                );


            var bottomY =
                H -
                bottomH -
                8;


            var commandW =
                Math.max(
                    210,
                    Math.min(
                        242,
                        Math.floor(
                            W *
                            0.285
                        )
                    )
                );


            var gap =
                8;


            if (
                scene._enemyPokemonSprite
            ) {
                scene._enemyPokemonSprite.x =
                    Math.floor(
                        W *
                        0.72
                    );


                scene._enemyPokemonSprite.y =
                    Math.floor(
                        H *
                        0.49
                    );


                scene._enemyPokemonSprite.scale.x =
                    0.76;


                scene._enemyPokemonSprite.scale.y =
                    0.76;
            }


            if (
                scene._playerPokemonSprite
            ) {
                scene._playerPokemonSprite.x =
                    Math.floor(
                        W *
                        0.23
                    );


                scene._playerPokemonSprite.y =
                    Math.floor(
                        H *
                        0.72
                    );


                scene._playerPokemonSprite.scale.x =
                    0.92;


                scene._playerPokemonSprite.scale.y =
                    0.92;
            }


            if (
                scene._enemyStatusWindow
            ) {
                scene._enemyStatusWindow.move(
                    48,
                    30,
                    Math.max(
                        265,
                        Math.floor(
                            W *
                            0.34
                        )
                    ),
                    100
                );


                scene._enemyStatusWindow.createContents();


                BC.styleStatusWindow(
                    scene._enemyStatusWindow
                );
            }


            if (
                scene._playerStatusWindow
            ) {
                var pW =
                    Math.max(
                        265,
                        Math.floor(
                            W *
                            0.34
                        )
                    );


                scene._playerStatusWindow.move(
                    W -
                    pW -
                    48,
                    bottomY -
                    112,
                    pW,
                    100
                );


                scene._playerStatusWindow.createContents();


                BC.styleStatusWindow(
                    scene._playerStatusWindow
                );
            }


            if (
                scene._logWindow
            ) {
                scene._logWindow.move(
                    8,
                    bottomY,
                    W -
                    commandW -
                    gap -
                    16,
                    bottomH
                );


                scene._logWindow.createContents();


                BC.styleLogWindow(
                    scene._logWindow
                );
            }


            if (
                scene._commandWindow
            ) {
                scene._commandWindow.move(
                    W -
                    commandW -
                    8,
                    bottomY,
                    commandW,
                    bottomH
                );


                scene._commandWindow.createContents();


                BC.styleCommandWindow(
                    scene._commandWindow
                );
            }


            if (
                scene._moveWindow
            ) {
                scene._moveWindow.move(
                    8,
                    bottomY,
                    W -
                    16,
                    bottomH
                );


                scene._moveWindow.createContents();


                BC.styleMoveWindow(
                    scene._moveWindow
                );
            }


            if (
                scene._gmBallWindow
            ) {
                scene._gmBallWindow.move(
                    W -
                    commandW -
                    8,
                    bottomY,
                    commandW,
                    bottomH
                );


                scene._gmBallWindow.createContents();


                BC.styleBallWindow(
                    scene._gmBallWindow
                );
            }
        };


    var _BC_sceneCreate =
        Scene_GranadaMonBattle.prototype.create;


    Scene_GranadaMonBattle.prototype.create =
        function() {

            _BC_sceneCreate.call(
                this
            );


            BC.applyLayout(
                this
            );
        };


    if (
        Scene_GranadaMonBattle.prototype
            .refreshGMSwitchedPokemonVisual
    ) {
        var _BC_switchVisual =
            Scene_GranadaMonBattle.prototype
                .refreshGMSwitchedPokemonVisual;


        Scene_GranadaMonBattle.prototype
            .refreshGMSwitchedPokemonVisual =
            function() {

                var result =
                    _BC_switchVisual.call(
                        this
                    );


                if (
                    this._playerPokemonSprite
                ) {
                    this._playerPokemonSprite.x =
                        Math.floor(
                            Graphics.boxWidth *
                            0.23
                        );


                    this._playerPokemonSprite.y =
                        Math.floor(
                            Graphics.boxHeight *
                            0.72
                        );


                    this._playerPokemonSprite.scale.x =
                        0.92;


                    this._playerPokemonSprite.scale.y =
                        0.92;
                }


                if (
                    this._playerStatusWindow
                ) {
                    this._playerStatusWindow.refresh();
                }


                if (
                    this._moveWindow
                ) {
                    this._moveWindow.refresh();
                }


                return result;
            };
    }


    // =========================================================
    // TURNOS SECUENCIALES
    // =========================================================

    BC.finishSequentialRound =
        function(scene) {

            scene._gmSequentialTurn =
                null;


            if (
                scene.refreshBattleUI
            ) {
                scene.refreshBattleUI();
            }


            if (
                scene._enemyStatusWindow
            ) {
                scene._enemyStatusWindow.refresh();
            }


            if (
                scene._playerStatusWindow
            ) {
                scene._playerStatusWindow.refresh();
            }


            if (
                scene._moveWindow
            ) {
                scene._moveWindow.refresh();
            }


            if (
                !scene._battleEnded &&
                !scene._gmOutcomeState &&
                !scene._gmPlayerFaintState
            ) {
                if (
                    scene._logWindow &&
                    GM.Battle.playerPokemon
                ) {
                    scene._logWindow.setText(
                        '¿Qué hará ' +
                        GM.Battle.playerPokemon.name +
                        '?'
                    );
                }


                if (
                    scene._commandWindow
                ) {
                    scene._commandWindow.show();

                    scene._commandWindow.activate();

                    scene._commandWindow.select(
                        0
                    );
                }
            }
        };


    BC.startSequentialAction =
        function(scene) {

            var state =
                scene._gmSequentialTurn;


            if (
                !state
            ) {
                return;
            }


            while (
                state.index <
                state.actions.length
            ) {
                var action =
                    state.actions[
                        state.index
                    ];


                if (
                    !action ||
                    !action.attacker ||
                    !action.defender ||

                    Number(
                        action.attacker.hp ||
                        0
                    ) <=
                    0 ||

                    Number(
                        action.defender.hp ||
                        0
                    ) <=
                    0 ||

                    !action.instance ||
                    !action.move
                ) {
                    state.index++;

                    continue;
                }


                var messages =
                    [];


                scene.performMove(
                    action.attacker,
                    action.defender,
                    action.instance,
                    action.move,
                    messages
                );


                if (
                    Number(
                        action.defender.hp ||
                        0
                    ) <=
                    0 &&

                    messages.length
                ) {
                    var last =
                        String(
                            messages[
                                messages.length -
                                1
                            ] ||
                            ''
                        ).toLowerCase();


                    if (
                        last.indexOf(
                            'se ha debilitado'
                        ) >=
                        0
                    ) {
                        messages.pop();
                    }
                }


                if (
                    scene._logWindow
                ) {
                    scene._logWindow.setText(
                        messages.join(
                            '\n'
                        )
                    );
                }


                if (
                    scene.refreshBattleUI
                ) {
                    scene.refreshBattleUI();
                }


                state.current =
                    action;


                state.phase =
                    'WAIT_VISUAL';


                state.frame =
                    0;


                return;
            }


            state.phase =
                'ROUND_END';


            state.frame =
                0;
        };


    BC.beginSequentialTurn =
        function(
            scene,
            actions
        ) {

            if (
                !scene ||
                scene._battleEnded ||
                scene._gmOutcomeState
            ) {
                return;
            }


            if (
                scene._commandWindow
            ) {
                scene._commandWindow.deactivate();
            }


            if (
                scene._moveWindow
            ) {
                scene._moveWindow.deactivate();

                scene._moveWindow.hide();
            }


            scene._gmSequentialTurn = {
                actions:
                    actions ||
                    [],

                index:
                    0,

                current:
                    null,

                phase:
                    'START',

                frame:
                    0
            };


            BC.startSequentialAction(
                scene
            );
        };


    // =========================================================
    // DEBILITADO DEL JUGADOR
    // =========================================================

    BC.startPlayerFaintTransition =
        function(
            scene,
            pokemon
        ) {

            if (
                !scene ||
                scene._gmPlayerFaintState
            ) {
                return;
            }


            var sprite =
                scene._playerPokemonSprite;


            scene._gmPlayerFaintState = {
                pokemon:
                    pokemon,

                sprite:
                    sprite ||
                    null,

                frame:
                    0,

                phase:
                    'FAINT',

                base:
                    sprite
                        ? {
                            x:
                                Number(
                                    sprite.x ||
                                    0
                                ),

                            y:
                                Number(
                                    sprite.y ||
                                    0
                                ),

                            sx:
                                Number(
                                    sprite.scale.x ||
                                    1
                                ),

                            sy:
                                Number(
                                    sprite.scale.y ||
                                    1
                                ),

                            alpha:
                                Number(
                                    sprite.alpha ==
                                    null
                                        ? 1
                                        : sprite.alpha
                                )
                          }
                        : null
            };


            if (
                scene._commandWindow
            ) {
                scene._commandWindow.deactivate();
            }


            if (
                scene._moveWindow
            ) {
                scene._moveWindow.deactivate();

                scene._moveWindow.hide();
            }


            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    '¡' +
                    pokemon.name +
                    ' se ha debilitado!'
                );
            }


            BC.showFaintBanner(
                scene,
                pokemon.name
            );


            if (
                SoundManager.playActorCollapse
            ) {
                SoundManager.playActorCollapse();

            } else {
                SoundManager.playBuzzer();
            }
        };


    BC.updatePlayerFaintTransition =
        function(scene) {

            var st =
                scene
                    ? scene._gmPlayerFaintState
                    : null;


            if (
                !st
            ) {
                return;
            }


            st.frame++;


            var s =
                st.sprite;


            var b =
                st.base;


            if (
                st.phase ===
                'FAINT'
            ) {
                if (
                    s &&
                    b
                ) {
                    if (
                        st.frame <=
                        18
                    ) {
                        s.x =
                            b.x +
                            Math.sin(
                                st.frame *
                                2.8
                            ) *
                            (
                                7 -
                                st.frame *
                                0.18
                            );


                        if (
                            s.setBlendColor
                        ) {
                            var a =
                                Math.floor(
                                    80 +
                                    Math.sin(
                                        st.frame *
                                        1.7
                                    ) *
                                    65
                                );


                            s.setBlendColor(
                                [
                                    255,
                                    255,
                                    255,
                                    Math.max(
                                        0,
                                        a
                                    )
                                ]
                            );
                        }


                    } else if (
                        st.frame <=
                        52
                    ) {
                        var t =
                            BC.clamp(
                                (
                                    st.frame -
                                    18
                                ) /
                                34,
                                0,
                                1
                            );


                        s.x =
                            b.x;


                        s.y =
                            b.y +
                            30 *
                            t;


                        s.alpha =
                            b.alpha *
                            (
                                1 -
                                t
                            );


                        s.scale.x =
                            b.sx *
                            (
                                1 -
                                0.08 *
                                t
                            );


                        s.scale.y =
                            b.sy *
                            (
                                1 -
                                0.12 *
                                t
                            );
                    }
                }


                if (
                    st.frame >=
                    58
                ) {
                    if (
                        s
                    ) {
                        s.visible =
                            false;


                        s.alpha =
                            0;


                        if (
                            s.setBlendColor
                        ) {
                            s.setBlendColor(
                                [
                                    0,
                                    0,
                                    0,
                                    0
                                ]
                            );
                        }
                    }


                    var next =
                        GM.Battle.firstUsablePokemon();


                    if (
                        !next ||
                        next ===
                        st.pokemon
                    ) {
                        scene._gmPlayerFaintState =
                            null;


                        scene._gmLossFaintAlreadyShown =
                            true;


                        scene.loseBattle();


                        return;
                    }


                    GM.Battle.playerPokemon =
                        next;


                    if (
                        GM.resetBattleStages
                    ) {
                        GM.resetBattleStages(
                            next
                        );
                    }


                    if (
                        GM.Battle.ensureUsableMove
                    ) {
                        GM.Battle.ensureUsableMove(
                            next
                        );
                    }


                    BC.noteParticipant(
                        next
                    );


                    if (
                        scene.refreshGMSwitchedPokemonVisual
                    ) {
                        scene.refreshGMSwitchedPokemonVisual();
                    }


                    if (
                        scene._logWindow
                    ) {
                        scene._logWindow.setText(
                            '¡Adelante, ' +
                            next.name +
                            '!'
                        );
                    }


                    if (
                        SoundManager.playOk
                    ) {
                        SoundManager.playOk();
                    }


                    st.phase =
                        'SEND';


                    st.frame =
                        0;
                }


                return;
            }


            if (
                st.phase ===
                'SEND'
            ) {
                if (
                    st.frame >=
                    42
                ) {
                    scene._gmPlayerFaintState =
                        null;


                    BC.finishSequentialRound(
                        scene
                    );
                }
            }
        };


    BC.updateSequentialTurn =
        function(scene) {

            var state =
                scene
                    ? scene._gmSequentialTurn
                    : null;


            if (
                !state
            ) {
                return;
            }


            if (
                state.phase ===
                'WAIT_VISUAL'
            ) {
                if (
                    BC.isAnimationBusy(
                        scene
                    )
                ) {
                    return;
                }


                state.frame++;


                if (
                    state.frame <
                    8
                ) {
                    return;
                }


                var action =
                    state.current;


                if (
                    !action
                ) {
                    state.index++;


                    state.phase =
                        'BETWEEN';


                    state.frame =
                        0;


                    return;
                }


                if (
                    scene.refreshBattleUI
                ) {
                    scene.refreshBattleUI();
                }


                if (
                    Number(
                        action.defender.hp ||
                        0
                    ) <=
                    0
                ) {
                    scene._gmSequentialTurn =
                        null;


                    if (
                        action.defender ===
                        GM.Battle.enemy
                    ) {
                        scene.winBattle();

                    } else {
                        BC.startPlayerFaintTransition(
                            scene,
                            action.defender
                        );
                    }


                    return;
                }


                state.index++;


                if (
                    state.index >=
                    state.actions.length
                ) {
                    state.phase =
                        'ROUND_END';


                    state.frame =
                        0;

                } else {
                    state.phase =
                        'BETWEEN';


                    state.frame =
                        0;
                }


                return;
            }


            if (
                state.phase ===
                'BETWEEN'
            ) {
                state.frame++;


                if (
                    state.frame >=
                    12
                ) {
                    BC.startSequentialAction(
                        scene
                    );
                }


                return;
            }


            if (
                state.phase ===
                'ROUND_END'
            ) {
                state.frame++;


                if (
                    state.frame >=
                    10
                ) {
                    BC.finishSequentialRound(
                        scene
                    );
                }
            }
        };


    // =========================================================
    // TURNO
    // =========================================================

    Scene_GranadaMonBattle.prototype.executeTurn =
        function(
            playerInstance,
            playerMove
        ) {

            if (
                this._gmSequentialTurn ||
                this._gmOutcomeState ||
                this._battleEnded
            ) {
                return;
            }


            var player =
                GM.Battle.playerPokemon;


            var enemy =
                GM.Battle.enemy;


            var enemyInstance =
                this.enemyMove();


            var enemyMove =
                enemyInstance
                    ? GM.getMove(
                        enemyInstance.id
                    )
                    : null;


            var actions =
                [];


            if (
                !enemyMove
            ) {
                actions.push({
                    attacker:
                        player,

                    defender:
                        enemy,

                    instance:
                        playerInstance,

                    move:
                        playerMove
                });

            } else {
                var order =
                    GM.compareTurnOrder(
                        player,
                        playerMove,
                        enemy,
                        enemyMove
                    );


                if (
                    order <=
                    0
                ) {
                    actions.push({
                        attacker:
                            player,

                        defender:
                            enemy,

                        instance:
                            playerInstance,

                        move:
                            playerMove
                    });


                    actions.push({
                        attacker:
                            enemy,

                        defender:
                            player,

                        instance:
                            enemyInstance,

                        move:
                            enemyMove
                    });

                } else {
                    actions.push({
                        attacker:
                            enemy,

                        defender:
                            player,

                        instance:
                            enemyInstance,

                        move:
                            enemyMove
                    });


                    actions.push({
                        attacker:
                            player,

                        defender:
                            enemy,

                        instance:
                            playerInstance,

                        move:
                            playerMove
                    });
                }
            }


            BC.beginSequentialTurn(
                this,
                actions
            );
        };


    Scene_GranadaMonBattle.prototype.enemyFreeTurn =
        function() {

            if (
                this._gmSequentialTurn ||
                this._gmOutcomeState ||
                this._battleEnded
            ) {
                return;
            }


            var enemyInstance =
                this.enemyMove();


            if (
                !enemyInstance
            ) {
                BC.finishSequentialRound(
                    this
                );

                return;
            }


            var move =
                GM.getMove(
                    enemyInstance.id
                );


            if (
                !move
            ) {
                BC.finishSequentialRound(
                    this
                );

                return;
            }


            BC.beginSequentialTurn(
                this,
                [
                    {
                        attacker:
                            GM.Battle.enemy,

                        defender:
                            GM.Battle.playerPokemon,

                        instance:
                            enemyInstance,

                        move:
                            move
                    }
                ]
            );
        };


    // =========================================================
    // TARJETA DE RESULTADO
    // =========================================================

    BC.outcomeColor =
        function(kind) {

            switch (
                String(
                    kind ||
                    ''
                ).toUpperCase()
            ) {
                case 'WIN':
                    return '#71db9f';

                case 'CAPTURE':
                    return '#75d7ff';

                case 'LOSE':
                    return '#ef7777';

                case 'RUN':
                    return '#e7c96b';

                default:
                    return '#ffffff';
            }
        };


    BC.createOutcomeCard =
        function(scene) {

            if (
                !scene ||
                scene._gmOutcomeCard
            ) {
                return;
            }


            var holder =
                new Sprite();


            holder.visible =
                false;


            holder.alpha =
                0;


            holder.x =
                Graphics.boxWidth /
                2;


            holder.y =
                Graphics.boxHeight /
                2 -
                12;


            var shadow =
                new Sprite(
                    new Bitmap(
                        620,
                        300
                    )
                );


            shadow.anchor.x =
                0.5;


            shadow.anchor.y =
                0.5;


            BC.roundRect(
                shadow.bitmap,
                8,
                12,
                604,
                276,
                28,
                '#000000',
                0.34
            );


            holder.addChild(
                shadow
            );


            var card =
                new Sprite(
                    new Bitmap(
                        600,
                        280
                    )
                );


            card.anchor.x =
                0.5;


            card.anchor.y =
                0.5;


            holder.addChild(
                card
            );


            holder._gmCardSprite =
                card;


            scene._gmOutcomeCard =
                holder;


            scene.addChild(
                holder
            );
        };


    BC.drawOutcomeCard =
        function(
            scene,
            state
        ) {

            BC.createOutcomeCard(
                scene
            );


            var holder =
                scene._gmOutcomeCard;


            var b =
                holder._gmCardSprite.bitmap;


            var kind =
                String(
                    state.kind ||
                    ''
                ).toUpperCase();


            var accent =
                BC.outcomeColor(
                    kind
                );


            var title =
                '';


            var lines =
                [];


            if (
                kind ===
                'WIN'
            ) {
                title =
                    '¡VICTORIA!';


                lines.push(
                    (
                        state.enemyName ||
                        'El Pokémon rival'
                    ) +
                    ' ha sido derrotado.'
                );


                var exp =
                    state.expMessages ||
                    [];


                for (
                    var i = 0;
                    i < exp.length &&
                    i < 3;
                    i++
                ) {
                    lines.push(
                        exp[i]
                    );
                }


                lines.push(
                    'Pokédex: DERROTADO  ✓'
                );

            } else if (
                kind ===
                'CAPTURE'
            ) {
                title =
                    '¡CAPTURADO!';


                lines.push(
                    'Has capturado a ' +
                    (
                        state.enemyName ||
                        'Pokémon'
                    ) +
                    '.'
                );


                lines.push(
                    state.destination ===
                    'STORAGE'
                        ? 'Enviado al almacenamiento.'
                        : 'Se ha unido a tu equipo.'
                );


                if (
                    state.newDexEntry
                ) {
                    lines.push(
                        '¡Nueva entrada en la Pokédex!'
                    );
                }


                lines.push(
                    'Pokédex: CAPTURADO  ✓'
                );

            } else if (
                kind ===
                'LOSE'
            ) {
                title =
                    'DERROTA';


                lines.push(
                    'Tu equipo ha sido derrotado.'
                );


                lines.push(
                    'Tus Pokémon permanecen debilitados.'
                );


                lines.push(
                    'Deberás recuperarlos antes de volver a combatir.'
                );


                lines.push(
                    'Pokédex rival: VISTO  ✓'
                );

            } else if (
                kind ===
                'RUN'
            ) {
                title =
                    'HAS HUIDO';


                lines.push(
                    'Has escapado del combate.'
                );


                lines.push(
                    (
                        state.enemyName ||
                        'El Pokémon salvaje'
                    ) +
                    ' sigue en libertad.'
                );


                lines.push(
                    'No ha sido derrotado ni capturado.'
                );


                lines.push(
                    'Pokédex: VISTO  ✓'
                );
            }


            b.clear();


            BC.roundRect(
                b,
                2,
                2,
                596,
                276,
                26,
                '#142b2f',
                0.965,
                accent,
                4
            );


            BC.roundRect(
                b,
                16,
                16,
                568,
                58,
                19,
                '#0e2024',
                0.86,
                accent,
                2
            );


            b.fontSize =
                31;


            b.fontBold =
                true;


            b.textColor =
                '#ffffff';


            b.outlineColor =
                'rgba(0,0,0,0.62)';


            b.outlineWidth =
                4;


            b.drawText(
                title,
                24,
                22,
                552,
                43,
                'center'
            );


            b.fontBold =
                false;


            b.fontSize =
                19;


            b.outlineWidth =
                2;


            var y =
                90;


            for (
                var j = 0;
                j < lines.length &&
                j < 5;
                j++
            ) {
                b.textColor =
                    (
                        j ===
                        lines.length -
                        1
                    )
                        ? accent
                        : '#eef8f5';


                b.drawText(
                    lines[j],
                    30,
                    y,
                    540,
                    30,
                    'center'
                );


                y +=
                    34;
            }


            holder.visible =
                true;


            holder.alpha =
                0;


            holder.scale.x =
                0.74;


            holder.scale.y =
                0.74;


            holder.y =
                Graphics.boxHeight /
                2 +
                20;
        };


    BC.startOutcome =
        function(
            scene,
            kind,
            data
        ) {

            if (
                !scene ||
                scene._gmOutcomeState
            ) {
                return;
            }


            data =
                data ||
                {};


            var enemy =
                GM.Battle
                    ? GM.Battle.enemy
                    : null;


            scene._battleEnded =
                true;


            /*
             * IMPORTANTE:
             * Marcamos el evento del mapa como resuelto
             * ANTES de volver desde la escena de combate.
             *
             * Esto evita el bucle:
             * batalla -> mapa -> mismo evento -> batalla.
             */
            BC.resolveBattleEvent(
                BC.context
            );


            if (
                scene._commandWindow
            ) {
                scene._commandWindow.deactivate();
            }


            if (
                scene._moveWindow
            ) {
                scene._moveWindow.deactivate();

                scene._moveWindow.hide();
            }


            if (
                scene._gmBallWindow
            ) {
                scene._gmBallWindow.deactivate();

                scene._gmBallWindow.hide();
            }


            if (
                scene._gmBattlePartyWindow
            ) {
                scene._gmBattlePartyWindow.deactivate();

                scene._gmBattlePartyWindow.hide();
            }


            scene._gmOutcomeState = {
                kind:
                    String(
                        kind ||
                        ''
                    ).toUpperCase(),

                phase:
                    'WAIT_ANIMATION',

                frame:
                    0,

                enemyName:
                    enemy
                        ? enemy.name
                        : '',

                expMessages:
                    data.expMessages ||
                    [],

                destination:
                    data.destination ||
                    null,

                newDexEntry:
                    !!data.newDexEntry,

                skipFaint:
                    !!data.skipFaint,

                faintBase:
                    null,

                runBase:
                    null
            };
        };


    BC.isAnimationBusy =
        function(scene) {

            var animBusy =
                !!(
                    GM.BattleAnimations &&
                    GM.BattleAnimations.isBusy &&
                    GM.BattleAnimations.isBusy(
                        scene
                    )
                );


            var hpBusy =
                !!(
                    scene &&
                    scene._gmHpTweens &&
                    scene._gmHpTweens.length
                );


            return (
                animBusy ||
                hpBusy
            );
        };


    // =========================================================
    // AVISO DE DEBILITADO
    // =========================================================

    BC.showFaintBanner =
        function(
            scene,
            name
        ) {

            if (
                !scene
            ) {
                return;
            }


            if (
                scene._gmFaintBanner &&
                scene._gmFaintBanner.parent
            ) {
                scene._gmFaintBanner.parent.removeChild(
                    scene._gmFaintBanner
                );
            }


            var holder =
                new Sprite(
                    new Bitmap(
                        560,
                        78
                    )
                );


            holder.anchor.x =
                0.5;


            holder.anchor.y =
                0.5;


            holder.x =
                Graphics.boxWidth /
                2;


            holder.y =
                Math.floor(
                    Graphics.boxHeight *
                    0.25
                );


            holder.alpha =
                0;


            holder.scale.x =
                0.78;


            holder.scale.y =
                0.78;


            BC.roundRect(
                holder.bitmap,
                2,
                2,
                556,
                74,
                22,
                '#172a31',
                0.95,
                '#f3d86b',
                3
            );


            holder.bitmap.fontSize =
                24;


            holder.bitmap.fontBold =
                true;


            holder.bitmap.textColor =
                '#ffffff';


            holder.bitmap.outlineColor =
                'rgba(0,0,0,0.65)';


            holder.bitmap.outlineWidth =
                4;


            holder.bitmap.drawText(
                '¡' +
                String(
                    name ||
                    'POKÉMON'
                ).toUpperCase() +
                ' SE HA DEBILITADO!',
                16,
                11,
                528,
                48,
                'center'
            );


            holder._gmFrames =
                88;


            scene._gmFaintBanner =
                holder;


            scene.addChild(
                holder
            );
        };


    BC.updateFaintBanner =
        function(scene) {

            if (
                !scene ||
                !scene._gmFaintBanner
            ) {
                return;
            }


            var b =
                scene._gmFaintBanner;


            b._gmFrames--;


            b.alpha +=
                (
                    1 -
                    b.alpha
                ) *
                0.20;


            b.scale.x +=
                (
                    1 -
                    b.scale.x
                ) *
                0.18;


            b.scale.y +=
                (
                    1 -
                    b.scale.y
                ) *
                0.18;


            if (
                b._gmFrames <
                18
            ) {
                b.alpha =
                    Math.max(
                        0,
                        b.alpha -
                        0.065
                    );


                b.y -=
                    0.4;
            }


            if (
                b._gmFrames <=
                0
            ) {
                if (
                    b.parent
                ) {
                    b.parent.removeChild(
                        b
                    );
                }


                scene._gmFaintBanner =
                    null;
            }
        };


    BC.startFaintPhase =
        function(
            scene,
            state,
            sprite,
            name
        ) {

            state.phase =
                'FAINT';


            state.frame =
                0;


            state.faintSprite =
                sprite ||
                null;


            state.faintBase =
                sprite
                    ? {
                        x:
                            Number(
                                sprite.x ||
                                0
                            ),

                        y:
                            Number(
                                sprite.y ||
                                0
                            ),

                        sx:
                            Number(
                                sprite.scale.x ||
                                1
                            ),

                        sy:
                            Number(
                                sprite.scale.y ||
                                1
                            ),

                        alpha:
                            Number(
                                sprite.alpha ==
                                null
                                    ? 1
                                    : sprite.alpha
                            )
                      }
                    : null;


            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    '¡' +
                    (
                        name ||
                        'El Pokémon'
                    ) +
                    ' se ha debilitado!'
                );
            }


            BC.showFaintBanner(
                scene,
                name ||
                'Pokémon'
            );


            if (
                state.kind ===
                'WIN'
            ) {
                if (
                    SoundManager.playEnemyCollapse
                ) {
                    SoundManager.playEnemyCollapse();

                } else {
                    SoundManager.playBuzzer();
                }

            } else {
                if (
                    SoundManager.playActorCollapse
                ) {
                    SoundManager.playActorCollapse();

                } else {
                    SoundManager.playBuzzer();
                }
            }
        };


    BC.updateFaintPhase =
        function(
            scene,
            state
        ) {

            state.frame++;


            var s =
                state.faintSprite;


            var b =
                state.faintBase;


            if (
                s &&
                b
            ) {
                if (
                    state.frame <=
                    18
                ) {
                    s.x =
                        b.x +
                        Math.sin(
                            state.frame *
                            2.8
                        ) *
                        (
                            7 -
                            state.frame *
                            0.18
                        );


                    if (
                        s.setBlendColor
                    ) {
                        var a =
                            Math.floor(
                                80 +
                                Math.sin(
                                    state.frame *
                                    1.7
                                ) *
                                65
                            );


                        s.setBlendColor(
                            [
                                255,
                                255,
                                255,
                                Math.max(
                                    0,
                                    a
                                )
                            ]
                        );
                    }


                } else if (
                    state.frame <=
                    52
                ) {
                    var t =
                        BC.clamp(
                            (
                                state.frame -
                                18
                            ) /
                            34,
                            0,
                            1
                        );


                    s.x =
                        b.x;


                    s.y =
                        b.y +
                        30 *
                        t;


                    s.alpha =
                        b.alpha *
                        (
                            1 -
                            t
                        );


                    s.scale.x =
                        b.sx *
                        (
                            1 -
                            0.08 *
                            t
                        );


                    s.scale.y =
                        b.sy *
                        (
                            1 -
                            0.12 *
                            t
                        );


                    if (
                        s.setBlendColor
                    ) {
                        s.setBlendColor(
                            [
                                255,
                                255,
                                255,
                                Math.floor(
                                    (
                                        1 -
                                        t
                                    ) *
                                    135
                                )
                            ]
                        );
                    }
                }
            }


            if (
                state.frame >=
                58
            ) {
                if (
                    s
                ) {
                    s.alpha =
                        0;


                    s.visible =
                        false;


                    if (
                        s.setBlendColor
                    ) {
                        s.setBlendColor(
                            [
                                0,
                                0,
                                0,
                                0
                            ]
                        );
                    }
                }


                state.phase =
                    state.kind ===
                    'WIN'
                        ? 'EXP'
                        : 'CARD_DELAY';


                state.frame =
                    0;


                if (
                    state.kind ===
                    'WIN' &&
                    scene._logWindow
                ) {
                    scene._logWindow.setText(
                        state.expMessages &&
                        state.expMessages.length
                            ? state.expMessages.join(
                                '\n'
                              )
                            : '¡Has ganado el combate!'
                    );
                }
            }
        };


    BC.updateOutcome =
        function(scene) {

            var state =
                scene
                    ? scene._gmOutcomeState
                    : null;


            if (
                !state
            ) {
                return;
            }


            if (
                scene._commandWindow
            ) {
                scene._commandWindow.deactivate();
            }


            if (
                scene._moveWindow
            ) {
                scene._moveWindow.deactivate();
            }


            if (
                state.phase ===
                'WAIT_ANIMATION'
            ) {
                if (
                    BC.isAnimationBusy(
                        scene
                    )
                ) {
                    return;
                }


                state.frame++;


                if (
                    state.frame <
                    8
                ) {
                    return;
                }


                if (
                    state.kind ===
                    'WIN'
                ) {
                    BC.startFaintPhase(
                        scene,
                        state,
                        scene._enemyPokemonSprite,
                        state.enemyName
                    );


                    return;
                }


                if (
                    state.kind ===
                    'LOSE'
                ) {
                    if (
                        state.skipFaint
                    ) {
                        state.phase =
                            'CARD_DELAY';


                        state.frame =
                            0;


                        return;
                    }


                    var player =
                        GM.Battle
                            ? GM.Battle.playerPokemon
                            : null;


                    BC.startFaintPhase(
                        scene,
                        state,
                        scene._playerPokemonSprite,
                        player
                            ? player.name
                            : 'Tu Pokémon'
                    );


                    return;
                }


                if (
                    state.kind ===
                    'RUN'
                ) {
                    state.phase =
                        'RUN_ANIM';


                    state.frame =
                        0;


                    var rs =
                        scene._playerPokemonSprite;


                    state.runSprite =
                        rs ||
                        null;


                    state.runBase =
                        rs
                            ? {
                                x:
                                    Number(
                                        rs.x ||
                                        0
                                    ),

                                y:
                                    Number(
                                        rs.y ||
                                        0
                                    ),

                                alpha:
                                    Number(
                                        rs.alpha ==
                                        null
                                            ? 1
                                            : rs.alpha
                                    )
                              }
                            : null;


                    if (
                        scene._logWindow
                    ) {
                        scene._logWindow.setText(
                            '¡Has escapado!'
                        );
                    }


                    return;
                }


                if (
                    state.kind ===
                    'CAPTURE'
                ) {
                    state.phase =
                        'CARD_DELAY';


                    state.frame =
                        0;


                    return;
                }
            }


            if (
                state.phase ===
                'FAINT'
            ) {
                BC.updateFaintPhase(
                    scene,
                    state
                );


                return;
            }


            if (
                state.phase ===
                'EXP'
            ) {
                state.frame++;


                if (
                    state.frame >=
                    (
                        state.expMessages &&
                        state.expMessages.length
                            ? 86
                            : 48
                    )
                ) {
                    if (
                        scene._logWindow
                    ) {
                        scene._logWindow.setText(
                            '¡Has ganado el combate!'
                        );
                    }


                    state.phase =
                        'CARD_DELAY';


                    state.frame =
                        0;
                }


                return;
            }


            if (
                state.phase ===
                'RUN_ANIM'
            ) {
                state.frame++;


                var r =
                    state.runSprite;


                var rb =
                    state.runBase;


                if (
                    r &&
                    rb
                ) {
                    var rt =
                        BC.clamp(
                            state.frame /
                            32,
                            0,
                            1
                        );


                    r.x =
                        rb.x -
                        150 *
                        rt;


                    r.y =
                        rb.y +
                        12 *
                        Math.sin(
                            rt *
                            Math.PI
                        );


                    r.alpha =
                        rb.alpha *
                        (
                            1 -
                            rt
                        );
                }


                if (
                    state.frame >=
                    34
                ) {
                    if (
                        r
                    ) {
                        r.visible =
                            false;
                    }


                    state.phase =
                        'CARD_DELAY';


                    state.frame =
                        0;
                }


                return;
            }


            if (
                state.phase ===
                'CARD_DELAY'
            ) {
                state.frame++;


                if (
                    state.frame >=
                    22
                ) {
                    BC.drawOutcomeCard(
                        scene,
                        state
                    );


                    state.phase =
                        'CARD';


                    state.frame =
                        0;
                }


                return;
            }


            if (
                state.phase ===
                'CARD'
            ) {
                state.frame++;


                var card =
                    scene._gmOutcomeCard;


                if (
                    card
                ) {
                    card.alpha +=
                        (
                            1 -
                            card.alpha
                        ) *
                        0.18;


                    card.scale.x +=
                        (
                            1 -
                            card.scale.x
                        ) *
                        0.16;


                    card.scale.y +=
                        (
                            1 -
                            card.scale.y
                        ) *
                        0.16;


                    card.y +=
                        (
                            (
                                Graphics.boxHeight /
                                2 -
                                12
                            ) -
                            card.y
                        ) *
                        0.14;


                    if (
                        state.frame >
                        145
                    ) {
                        card.alpha =
                            Math.max(
                                0,
                                card.alpha -
                                0.045
                            );


                        card.y -=
                            0.35;
                    }
                }


                if (
                    state.frame >=
                    175
                ) {
                    scene._gmOutcomeState =
                        null;


                    SceneManager.pop();
                }
            }
        };


    // =========================================================
    // CAPTURA
    // =========================================================

    if (
        Scene_GranadaMonBattle.prototype
            .finishGMCaptureSuccess
    ) {
        var _BC_finishCaptureBase =
            Scene_GranadaMonBattle.prototype
                .finishGMCaptureSuccess;


        Scene_GranadaMonBattle.prototype
            .finishGMCaptureSuccess =
            function() {

                var enemy =
                    GM.Battle.enemy;


                var dexBefore =
                    enemy &&
                    GM.getDexEntry
                        ? GM.getDexEntry(
                            enemy.speciesId
                          )
                        : null;


                var wasCaught =
                    !!(
                        dexBefore &&
                        dexBefore.caught ===
                        true
                    );


                var result =
                    _BC_finishCaptureBase.call(
                        this
                    );


                this._gmCaptureFinishFrames =
                    0;


                if (
                    enemy &&
                    (
                        !BC.context ||
                        !BC.context.resolved
                    )
                ) {
                    if (
                        BC.context
                    ) {
                        BC.context.resolved =
                            true;


                        BC.context.outcome =
                            'CAPTURE';
                    }


                    BC.recordCapture(
                        enemy
                    );
                }


                BC.startOutcome(
                    this,
                    'CAPTURE',
                    {
                        destination:
                            BC._lastCaptureDestination,

                        newDexEntry:
                            !wasCaught
                    }
                );


                return result;
            };
    }


    // =========================================================
    // VICTORIA
    // =========================================================

    Scene_GranadaMonBattle.prototype.winBattle =
        function() {

            if (
                this._gmOutcomeState
            ) {
                return;
            }


            var enemy =
                GM.Battle.enemy;


            var expMessages =
                [];


            this._battleEnded =
                true;


            GM.Battle.result =
                'WIN';


            if (
                !BC.context ||
                !BC.context.resolved
            ) {
                if (
                    BC.context
                ) {
                    BC.context.resolved =
                        true;


                    BC.context.outcome =
                        'WIN';
                }


                BC.recordDefeat(
                    enemy
                );


                var participants =
                    BC.participants();


                for (
                    var i = 0;
                    i < participants.length;
                    i++
                ) {
                    participants[i].battleRecord =
                        participants[i].battleRecord ||
                        {};


                    participants[i].battleRecord.wins =
                        Number(
                            participants[i].battleRecord.wins ||
                            0
                        ) +
                        1;
                }


                expMessages =
                    BC.awardVictoryExp(
                        enemy
                    );
            }


            if (
                this._logWindow &&
                enemy
            ) {
                this._logWindow.setText(
                    enemy.name +
                    ' ha recibido el golpe final...'
                );
            }


            BC.startOutcome(
                this,
                'WIN',
                {
                    expMessages:
                        expMessages
                }
            );
        };


    // =========================================================
    // DERROTA
    // =========================================================

    Scene_GranadaMonBattle.prototype.loseBattle =
        function() {

            if (
                this._gmOutcomeState
            ) {
                return;
            }


            this._battleEnded =
                true;


            GM.Battle.result =
                'LOSE';


            if (
                !BC.context ||
                !BC.context.resolved
            ) {
                if (
                    BC.context
                ) {
                    BC.context.resolved =
                        true;


                    BC.context.outcome =
                        'LOSE';
                }


                BC.recordLoss(
                    GM.Battle.enemy
                );
            }


            if (
                this._logWindow
            ) {
                this._logWindow.setText(
                    'Tu último Pokémon no puede continuar...'
                );
            }


            var skipFaint =
                !!this._gmLossFaintAlreadyShown;


            this._gmLossFaintAlreadyShown =
                false;


            BC.startOutcome(
                this,
                'LOSE',
                {
                    skipFaint:
                        skipFaint
                }
            );
        };


    // =========================================================
    // HUIR
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandRun =
        function() {

            if (
                this._gmOutcomeState ||
                this._battleEnded
            ) {
                return;
            }


            var player =
                GM.Battle.playerPokemon;


            var enemy =
                GM.Battle.enemy;


            var chance =
                0.5;


            if (
                GM.effectiveSpeed(
                    player
                ) >
                GM.effectiveSpeed(
                    enemy
                )
            ) {
                chance =
                    0.85;
            }


            if (
                Math.random() <
                chance
            ) {
                GM.Battle.result =
                    'RUN';


                this._battleEnded =
                    true;


                if (
                    BC.context &&
                    !BC.context.resolved
                ) {
                    BC.context.resolved =
                        true;


                    BC.context.outcome =
                        'RUN';
                }


                BC.recordRun(
                    enemy
                );


                if (
                    this._logWindow
                ) {
                    this._logWindow.setText(
                        '¡Has encontrado una vía de escape!'
                    );
                }


                BC.startOutcome(
                    this,
                    'RUN',
                    {}
                );

            } else {
                if (
                    this._logWindow
                ) {
                    this._logWindow.setText(
                        '¡No has podido escapar!'
                    );
                }


                this.enemyFreeTurn();
            }
        };


    // =========================================================
    // UPDATE
    // =========================================================

    var _BC_sceneUpdate =
        Scene_GranadaMonBattle.prototype.update;


    Scene_GranadaMonBattle.prototype.update =
        function() {

            _BC_sceneUpdate.call(
                this
            );


            BC.updateSequentialTurn(
                this
            );


            BC.updatePlayerFaintTransition(
                this
            );


            BC.updateFaintBanner(
                this
            );


            BC.updateOutcome(
                this
            );
        };


    // =========================================================
    // TERMINATE / SAVE
    // =========================================================

    var _BC_terminate =
        Scene_GranadaMonBattle.prototype.terminate;


    Scene_GranadaMonBattle.prototype.terminate =
        function() {

            var party =
                GM.State &&
                GM.State.party
                    ? GM.State.party()
                    : [];


            for (
                var i = 0;
                i < party.length;
                i++
            ) {
                if (
                    !party[i]
                ) {
                    continue;
                }


                if (
                    party[i]._gmVisualHpOverride !=
                    null
                ) {
                    delete party[i]
                        ._gmVisualHpOverride;
                }


                if (
                    GM.resetBattleStages
                ) {
                    GM.resetBattleStages(
                        party[i]
                    );
                }


                GM.State.ensurePokemon(
                    party[i]
                );
            }


            if (
                GM.Battle &&
                GM.Battle.enemy &&
                GM.Battle.enemy._gmVisualHpOverride !=
                null
            ) {
                delete GM.Battle.enemy
                    ._gmVisualHpOverride;
            }


            BC.decorateDex();


            BC.context =
                null;


            return _BC_terminate.call(
                this
            );
        };


    if (
        DataManager &&
        DataManager.extractSaveContents
    ) {
        var _BC_extractSaveContents =
            DataManager.extractSaveContents;


        DataManager.extractSaveContents =
            function(contents) {

                _BC_extractSaveContents.call(
                    this,
                    contents
                );


                BC.ensureResolvedBattleRegistry();


                BC.ensureDexStatsTable();


                GM.State.normalizeAll();


                if (
                    GM.syncDex
                ) {
                    GM.syncDex();
                }
            };
    }


    // =========================================================
    // COMANDOS
    // =========================================================

    var _BC_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;


    Game_Interpreter.prototype.pluginCommand =
        function(
            command,
            args
        ) {

            var cmd =
                String(
                    command ||
                    ''
                ).toLowerCase();


            /*
             * ANTES de lanzar una batalla guardamos
             * qué evento del mapa la ha iniciado.
             */
            if (
                cmd ===
                    'granadamonbattle' ||

                cmd ===
                    'granadamonbattlegd'
            ) {

                var battleMapId =
                    $gameMap
                        ? Number(
                            $gameMap.mapId() ||
                            0
                          )
                        : 0;


                var battleEventId =
                    Number(
                        this._eventId ||
                        0
                    );


                /*
                 * Segunda barrera de seguridad:
                 * aunque el evento siga visible por cualquier
                 * motivo, no permitimos que vuelva a abrir
                 * un combate ya resuelto.
                 */
                if (
                    battleMapId &&
                    battleEventId &&

                    BC.isBattleEventResolved(
                        battleMapId,
                        battleEventId
                    )
                ) {
                    if (
                        $gameMessage
                    ) {
                        $gameMessage.add(
                            'Este encuentro ya ha terminado.'
                        );
                    }


                    return;
                }


                BC.pendingBattleEvent = {
                    mapId:
                        battleMapId,

                    eventId:
                        battleEventId
                };
            }


            /*
             * Dejamos que los plugins anteriores procesen
             * sus propios comandos.
             */
            _BC_pluginCommand.call(
                this,
                command,
                args
            );


            /*
             * COMBATE POR POKÉDEX GRANADA.
             */
            if (
                cmd ===
                'granadamonbattlegd'
            ) {

                var granadaDex =
                    Number(
                        args[0] ||
                        0
                    );


                var level =
                    Number(
                        args[1] ||
                        1
                    );


                var species =
                    GM.getSpeciesByGranadaDex
                        ? GM.getSpeciesByGranadaDex(
                            granadaDex
                          )
                        : null;


                if (
                    !species
                ) {
                    BC.pendingBattleEvent =
                        null;


                    if (
                        $gameMessage
                    ) {
                        $gameMessage.add(
                            'No existe el Pokémon Granada #' +
                            granadaDex +
                            '.'
                        );
                    }


                    return;
                }


                GM.Battle.startWildBattle(
                    species.nationalDex,
                    level
                );
            }


            /*
             * INFORMACIÓN DE BATALLA DE UNA ESPECIE.
             */
            if (
                cmd ===
                'granadamondexbattleinfo'
            ) {

                var gd =
                    Number(
                        args[0] ||
                        0
                    );


                var sp =
                    GM.getSpeciesByGranadaDex
                        ? GM.getSpeciesByGranadaDex(
                            gd
                          )
                        : null;


                if (
                    !sp
                ) {
                    if (
                        $gameMessage
                    ) {
                        $gameMessage.add(
                            'No existe el Pokémon Granada #' +
                            gd +
                            '.'
                        );
                    }


                    return;
                }


                var stats =
                    BC.getDexStats(
                        sp.nationalDex
                    );


                if (
                    $gameMessage
                ) {
                    $gameMessage.add(
                        sp.name +
                        ' · Pokédex Granada #' +
                        gd
                    );


                    $gameMessage.add(
                        'Enfrentamientos: ' +
                        Number(
                            stats.encounteredCount ||
                            0
                        )
                    );


                    $gameMessage.add(
                        'Derrotados: ' +
                        Number(
                            stats.defeatedCount ||
                            0
                        )
                    );


                    $gameMessage.add(
                        'Capturados: ' +
                        Number(
                            stats.capturedCount ||
                            0
                        )
                    );


                    $gameMessage.add(
                        'Último resultado: ' +
                        String(
                            stats.lastOutcome ||
                            'NINGUNO'
                        )
                    );
                }
            }
        };


    // =========================================================
    // INICIALIZACIÓN
    // =========================================================

    BC.ensureResolvedBattleRegistry();


    BC.ensureDexStatsTable();


    if (
        GM.State
    ) {
        GM.State.normalizeAll();
    }


    if (
        GM.syncDex
    ) {
        GM.syncDex();
    }


    console.log(
        'GranadaMon_BattleClassic v1.7 cargado correctamente.'
    );

})();