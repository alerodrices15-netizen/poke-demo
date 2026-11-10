/*:
 * @plugindesc v1.1 GranadaMon - Balance de EXP, progresión y ficha clara
 * @author OpenAI
 *
 * @help
 * GranadaMon_ExperienceBalance.js
 * ------------------------------------------------------------
 * NO sustituye GranadaMon_Experience.js: lo amplía.
 *
 * COLOCAR DESPUÉS DE:
 * - GranadaMon_Experience
 * - GranadaMon_Evolution
 * - GranadaMon_BattleClassic
 * - GranadaMon_BattlePremium (si lo usas)
 *
 * PROGRESIÓN OBJETIVO, rival de nivel parecido:
 * Nv. 1-10  -> 3-4 combates por nivel
 * Nv. 11-20 -> 4-5
 * Nv. 21-30 -> 5-6
 * Nv. 31-40 -> 6-7
 * Nv. 41-50 -> 7-8
 * Nv. 51-60 -> 8-9
 * Nv. 61+   -> 9-10
 *
 * MODIFICADORES:
 * - Rival muy inferior: mucha menos EXP.
 * - Rival superior: más EXP.
 * - Especies fuertes: algo más de EXP.
 * - Entrenadores: +25% EXP.
 * - Varios participantes: se reparte.
 * - Máximo: 2 niveles ganados en una sola victoria.
 *
 * COMANDOS DE PRUEBA:
 * GranadaMonExpInfo SLOT
 * GranadaMonExpPreviewGD SLOT GD NIVEL WILD|TRAINER PARTICIPANTES
 * GranadaMonExpPreview SLOT NDEX NIVEL WILD|TRAINER PARTICIPANTES
 *
 * Ejemplos:
 * GranadaMonExpInfo 1
 * GranadaMonExpPreviewGD 1 63 20 WILD 1
 * GranadaMonExpPreviewGD 1 63 20 TRAINER 1
 */
(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (!GM.gainExp || !GM.expForSpeciesLevel || !GM.nextLevelExp ||
        !GM.minimumExpForPokemon || !GM.getSpecies) {
        throw new Error('GranadaMon_ExperienceBalance necesita GranadaMon_Experience.js.');
    }

    GM.ExperienceBalance = GM.ExperienceBalance || {};
    var EB = GM.ExperienceBalance;

    EB.VERSION = '1.1';
    EB.TRAINER_BONUS = 1.25;
    EB.MAX_LEVELS_PER_BATTLE = 2;

    EB.clamp = function(value, min, max) {
        return Math.max(min, Math.min(max, Number(value || 0)));
    };

    // =========================================================
    // COMBATES NECESARIOS PARA SUBIR APROX. UN NIVEL
    // =========================================================

    EB.targetBattlesForLevel = function(level) {
        level = Math.max(1, Math.floor(Number(level || 1)));

        if (level <= 10) return 3.5;
        if (level <= 20) return 4.5;
        if (level <= 30) return 5.5;
        if (level <= 40) return 6.5;
        if (level <= 50) return 7.5;
        if (level <= 60) return 8.5;

        return 9.5;
    };

    // =========================================================
    // DIFERENCIA DE NIVEL
    // =========================================================

    EB.levelDifferenceMultiplier = function(enemyLevel, playerLevel) {

        var diff =
            Math.max(1, Number(enemyLevel || 1)) -
            Math.max(1, Number(playerLevel || 1));

        if (diff <= -15) return 0.10;
        if (diff <= -10) return 0.18;
        if (diff <= -6) return 0.35;
        if (diff <= -3) return 0.60;

        if (diff <= 2) return 1.00;

        if (diff <= 5) return 1.20;
        if (diff <= 10) return 1.45;

        return 1.65;
    };

    // =========================================================
    // FUERZA DE LA ESPECIE RIVAL
    // =========================================================

    EB.baseStatTotal = function(species) {

        if (!species || !species.baseStats) {
            return 320;
        }

        var s = species.baseStats;

        return (
            Number(s.hp || 0) +
            Number(s.attack || 0) +
            Number(s.defense || 0) +
            Number(s.spAttack || 0) +
            Number(s.spDefense || 0) +
            Number(s.speed || 0)
        );
    };

    EB.speciesStrengthMultiplier = function(enemy) {

        if (!enemy) {
            return 1;
        }

        var species =
            GM.getSpecies(
                enemy.speciesId
            );

        var bst =
            EB.baseStatTotal(
                species
            );

        /*
         * Especies débiles:
         * aproximadamente ×0.82
         *
         * Especies medias:
         * aproximadamente ×0.88 - ×1.00
         *
         * Especies muy fuertes:
         * aproximadamente ×1.15 - ×1.18
         */

        return EB.clamp(
            0.88 +
            (
                bst - 320
            ) /
            900,
            0.82,
            1.18
        );
    };

    // =========================================================
    // PROGRESO DE EXP DEL NIVEL ACTUAL
    // =========================================================

    EB.progress = function(pokemon) {

        if (!pokemon) {
            return null;
        }

        if (GM.ensurePokemonExperience) {
            GM.ensurePokemonExperience(
                pokemon
            );
        }

        var level =
            Math.max(
                1,
                Number(
                    pokemon.level || 1
                )
            );

        var maxLevel =
            GM.Experience &&
            GM.Experience.MAX_LEVEL
                ? GM.Experience.MAX_LEVEL
                : 100;

        var species =
            GM.getSpecies(
                pokemon.speciesId
            );

        if (!species) {
            return null;
        }

        var minimum =
            GM.expForSpeciesLevel(
                species,
                level
            );

        if (level >= maxLevel) {

            return {
                level: level,
                nextLevel: level,
                current: 0,
                required: 0,
                remaining: 0,
                rate: 1,
                minimum: minimum,
                next: minimum,
                maxLevel: true
            };
        }

        var next =
            GM.expForSpeciesLevel(
                species,
                level + 1
            );

        var current =
            Math.max(
                0,
                Number(
                    pokemon.exp || 0
                ) -
                minimum
            );

        var required =
            Math.max(
                1,
                next -
                minimum
            );

        var remaining =
            Math.max(
                0,
                next -
                Number(
                    pokemon.exp || 0
                )
            );

        return {
            level: level,
            nextLevel: level + 1,
            current: current,
            required: required,
            remaining: remaining,
            rate:
                EB.clamp(
                    current /
                    required,
                    0,
                    1
                ),
            minimum: minimum,
            next: next,
            maxLevel: false
        };
    };

    // =========================================================
    // EVITAR SUBIDAS ABSURDAS DE MUCHOS NIVELES
    // =========================================================

    EB.maximumRewardForPokemon = function(pokemon) {

        if (!pokemon) {
            return 0;
        }

        var maxLevel =
            GM.Experience &&
            GM.Experience.MAX_LEVEL
                ? GM.Experience.MAX_LEVEL
                : 100;

        var level =
            Math.max(
                1,
                Number(
                    pokemon.level || 1
                )
            );

        if (level >= maxLevel) {
            return 0;
        }

        var species =
            GM.getSpecies(
                pokemon.speciesId
            );

        if (!species) {
            return 0;
        }

        var targetLevel =
            Math.min(
                maxLevel,
                level +
                EB.MAX_LEVELS_PER_BATTLE +
                1
            );

        var threshold =
            GM.expForSpeciesLevel(
                species,
                targetLevel
            );

        /*
         * Un combate puede hacer ganar,
         * como máximo, dos niveles.
         */

        return Math.max(
            0,
            threshold -
            Number(
                pokemon.exp || 0
            ) -
            1
        );
    };

    // =========================================================
    // CALCULAR RECOMPENSA
    // =========================================================

    EB.calculateReward = function(enemy, pokemon, options) {

        options =
            options ||
            {};

        if (!enemy || !pokemon) {
            return 0;
        }

        if (GM.ensurePokemonExperience) {
            GM.ensurePokemonExperience(
                pokemon
            );
        }

        var level =
            Math.max(
                1,
                Number(
                    pokemon.level || 1
                )
            );

        var maxLevel =
            GM.Experience &&
            GM.Experience.MAX_LEVEL
                ? GM.Experience.MAX_LEVEL
                : 100;

        if (level >= maxLevel) {
            return 0;
        }

        var species =
            GM.getSpecies(
                pokemon.speciesId
            );

        if (!species) {
            return 0;
        }

        /*
         * Calculamos cuánta EXP ocupa
         * TODO el nivel actual.
         */

        var levelStart =
            GM.expForSpeciesLevel(
                species,
                level
            );

        var nextStart =
            GM.expForSpeciesLevel(
                species,
                level + 1
            );

        var levelCost =
            Math.max(
                1,
                nextStart -
                levelStart
            );

        /*
         * Lo dividimos entre el número
         * de combates que queremos que
         * aproximadamente necesite.
         */

        var base =
            levelCost /
            EB.targetBattlesForLevel(
                level
            );

        var levelMult =
            EB.levelDifferenceMultiplier(
                enemy.level,
                level
            );

        var strengthMult =
            EB.speciesStrengthMultiplier(
                enemy
            );

        var trainerMult =
            options.trainer
                ? EB.TRAINER_BONUS
                : 1;

        var participants =
            Math.max(
                1,
                Math.floor(
                    Number(
                        options.participants ||
                        1
                    )
                )
            );

        var amount =
            Math.floor(
                base *
                levelMult *
                strengthMult *
                trainerMult /
                participants
            );

        amount =
            Math.max(
                1,
                amount
            );

        var maximum =
            EB.maximumRewardForPokemon(
                pokemon
            );

        if (maximum > 0) {

            amount =
                Math.min(
                    amount,
                    maximum
                );
        }

        return Math.max(
            0,
            amount
        );
    };

    // =========================================================
    // MENSAJES DE NIVEL, MOVIMIENTOS Y EVOLUCIÓN
    // =========================================================

    EB.appendLevelRewards = function(
        messages,
        pokemon,
        result
    ) {

        if (
            !messages ||
            !pokemon ||
            !result
        ) {
            return;
        }

        if (
            result.levelsGained >
            0
        ) {

            messages.push(
                '¡' +
                pokemon.name +
                ' sube al Nv. ' +
                pokemon.level +
                '!'
            );
        }

        /*
         * Movimiento aprendido directamente
         */

        if (
            result.learnedMoves &&
            result.learnedMoves.length &&
            GM.getMove
        ) {

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

                    messages.push(
                        '¡' +
                        pokemon.name +
                        ' aprende ' +
                        learned.name +
                        '!'
                    );
                }
            }
        }

        /*
         * Quiere aprender uno,
         * pero ya tiene cuatro.
         */

        if (
            result.pendingMoves &&
            result.pendingMoves.length &&
            GM.getMove
        ) {

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

                    messages.push(
                        pokemon.name +
                        ' quiere aprender ' +
                        pending.name +
                        '.'
                    );
                }
            }
        }

        /*
         * Evolución disponible.
         */

        if (
            result.pendingEvolution &&
            result.pendingEvolution.target
        ) {

            var target =
                GM.getSpecies(
                    result.pendingEvolution.target
                );

            messages.push(
                '¡' +
                pokemon.name +
                ' puede evolucionar' +
                (
                    target
                        ? ' a ' +
                          target.name
                        : ''
                ) +
                '!'
            );
        }
    };

    // =========================================================
    // REPARTIR EXP ENTRE PARTICIPANTES
    // =========================================================

    EB.award = function(enemy, participants, options) {

        options =
            options ||
            {};

        participants =
            participants ||
            [];

        var messages =
            [];

        if (
            !enemy ||
            !participants.length
        ) {
            return messages;
        }

        var valid =
            [];

        for (
            var i = 0;
            i < participants.length;
            i++
        ) {

            if (participants[i]) {

                valid.push(
                    participants[i]
                );
            }
        }

        if (!valid.length) {
            return messages;
        }

        for (
            var p = 0;
            p < valid.length;
            p++
        ) {

            var pokemon =
                valid[p];

            var amount =
                EB.calculateReward(
                    enemy,
                    pokemon,
                    {
                        trainer:
                            !!options.trainer,

                        participants:
                            valid.length
                    }
                );

            if (amount <= 0) {
                continue;
            }

            var result =
                GM.gainExp(
                    pokemon,
                    amount
                );

            if (
                !result ||
                !result.success
            ) {
                continue;
            }

            var progress =
                EB.progress(
                    pokemon
                );

            var text =
                pokemon.name +
                ' gana ' +
                result.amount +
                ' EXP.';

            /*
             * Si no ha subido,
             * mostramos cuánto le queda.
             */

            if (
                progress &&
                !progress.maxLevel &&
                result.levelsGained <=
                0
            ) {

                text +=
                    ' Faltan ' +
                    progress.remaining +
                    '.';
            }

            messages.push(
                text
            );

            EB.appendLevelRewards(
                messages,
                pokemon,
                result
            );

            if (
                GM.State &&
                GM.State.ensurePokemon
            ) {

                GM.State.ensurePokemon(
                    pokemon
                );
            }
        }

        return messages;
    };

    // =========================================================
    // BATTLE CLASSIC - SALVAJES
    // =========================================================

    EB.patchBattleClassic = function() {

        if (
            !GM.BattleClassic ||
            !GM.BattleClassic.participants
        ) {
            return false;
        }

        var BC =
            GM.BattleClassic;

        BC.awardVictoryExp =
            function(enemy) {

                return EB.award(
                    enemy,
                    BC.participants(),
                    {
                        trainer: false
                    }
                );
            };

        return true;
    };

    // =========================================================
    // BATTLE PREMIUM - ENTRENADORES
    // =========================================================

    EB.patchBattlePremium = function() {

        if (!GM.BattlePremium) {
            return false;
        }

        var BP =
            GM.BattlePremium;

        BP.awardTrainerExp =
            function(enemy) {

                if (
                    !BP.trainer ||
                    !enemy
                ) {
                    return [];
                }

                var participants =
                    [];

                var map =
                    BP.trainer.participants ||
                    {};

                for (
                    var key in map
                ) {

                    if (
                        map.hasOwnProperty(
                            key
                        ) &&
                        map[key]
                    ) {

                        participants.push(
                            map[key]
                        );
                    }
                }

                if (
                    !participants.length &&
                    GM.Battle &&
                    GM.Battle.playerPokemon
                ) {

                    participants.push(
                        GM.Battle.playerPokemon
                    );
                }

                return EB.award(
                    enemy,
                    participants,
                    {
                        trainer: true
                    }
                );
            };

        return true;
    };

    EB.patchBattleClassic();
    EB.patchBattlePremium();

    // =========================================================
    // FICHA POKÉMON
    // =========================================================
    //
    // Sustituye visualmente:
    //
    // EXP: 3529 / 4096
    //
    // por algo mucho más entendible:
    //
    // EXP Nv.15 → 16
    // 154 / 721
    // Faltan 567 EXP
    //
    // + barra de progreso.
    // =========================================================

    EB.drawSummaryProgress = function(win) {

        if (
            !win ||
            !win.contents
        ) {
            return;
        }

        var pokemon =
            GM.Menu &&
            GM.Menu.selectedPokemon
                ? GM.Menu.selectedPokemon
                : null;

        if (!pokemon) {
            return;
        }

        var progress =
            EB.progress(
                pokemon
            );

        if (!progress) {
            return;
        }

        var width =
            win.contentsWidth();

        var line =
            win.lineHeight();

        var y =
            win.contentsHeight() -
            line -
            8;

        /*
         * Borramos la antigua línea de
         * EXP acumulada del plugin original.
         */

        win.contents.clearRect(
            0,
            Math.max(
                0,
                y - 2
            ),
            width,
            line + 12
        );

        var oldSize =
            win.contents.fontSize;

        win.contents.fontSize =
            15;

        win.changeTextColor(
            win.systemColor()
        );

        if (
            progress.maxLevel
        ) {

            win.drawText(
                'EXP · NIVEL MÁXIMO',
                20,
                y,
                width - 40,
                'center'
            );

            win.resetTextColor();

            win.contents.fontSize =
                oldSize;

            return;
        }

        /*
         * Izquierda
         */

        win.drawText(
            'EXP Nv.' +
            progress.level +
            ' → ' +
            progress.nextLevel,
            20,
            y - 4,
            180,
            'left'
        );

        win.resetTextColor();

        /*
         * Centro
         */

        win.drawText(
            progress.current +
            ' / ' +
            progress.required,
            Math.floor(
                width /
                2
            ) -
            90,
            y - 4,
            180,
            'center'
        );

        /*
         * Derecha
         */

        win.drawText(
            'Faltan ' +
            progress.remaining +
            ' EXP',
            width - 220,
            y - 4,
            200,
            'right'
        );

        /*
         * Barra.
         */

        var gx =
            20;

        var gy =
            y +
            25;

        var gw =
            width -
            40;

        var gh =
            6;

        win.contents.fillRect(
            gx,
            gy,
            gw,
            gh,
            win.gaugeBackColor()
        );

        var fillWidth =
            Math.floor(
                gw *
                progress.rate
            );

        if (
            fillWidth >
            0
        ) {

            win.contents.gradientFillRect(
                gx,
                gy,
                fillWidth,
                gh,
                win.textColor(3),
                win.textColor(11)
            );
        }

        win.contents.fontSize =
            oldSize;
    };

    if (
        typeof Scene_GranadaMonSummary !==
        'undefined'
    ) {

        var _EB_createSummaryWindow =
            Scene_GranadaMonSummary
                .prototype
                .createSummaryWindow;

        Scene_GranadaMonSummary
            .prototype
            .createSummaryWindow =
            function() {

                _EB_createSummaryWindow.call(
                    this
                );

                EB.drawSummaryProgress(
                    this._summaryWindow
                );
            };
    }

    // =========================================================
    // UTILIDADES DE DISEÑO
    // =========================================================

    EB.partyPokemon = function(slot) {

        slot =
            Math.max(
                0,
                Number(
                    slot || 1
                ) -
                1
            );

        var party =
            $gameSystem &&
            $gameSystem._granadaMonParty
                ? $gameSystem._granadaMonParty
                : [];

        return party[slot] ||
            null;
    };

    EB.preview = function(
        pokemon,
        species,
        enemyLevel,
        trainer,
        participants
    ) {

        if (
            !pokemon ||
            !species
        ) {
            return 0;
        }

        return EB.calculateReward(
            {
                speciesId:
                    species.nationalDex,

                level:
                    Math.max(
                        1,
                        Number(
                            enemyLevel ||
                            1
                        )
                    )
            },

            pokemon,

            {
                trainer:
                    !!trainer,

                participants:
                    Math.max(
                        1,
                        Number(
                            participants ||
                            1
                        )
                    )
            }
        );
    };

    // =========================================================
    // PLUGIN COMMANDS
    // =========================================================

    var _EB_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand =
        function(command, args) {

            _EB_pluginCommand.call(
                this,
                command,
                args
            );

            var cmd =
                String(
                    command ||
                    ''
                ).toLowerCase();

            // =================================================
            // INFO DEL POKÉMON
            // =================================================

            if (
                cmd ===
                'granadamonexpinfo'
            ) {

                var pokemon =
                    EB.partyPokemon(
                        args[0]
                    );

                if (!pokemon) {

                    $gameMessage.add(
                        'No hay Pokémon en ese slot.'
                    );

                    return;
                }

                var progress =
                    EB.progress(
                        pokemon
                    );

                if (!progress) {
                    return;
                }

                if (
                    progress.maxLevel
                ) {

                    $gameMessage.add(
                        pokemon.name +
                        ' está en el nivel máximo.'
                    );

                    return;
                }

                $gameMessage.add(
                    pokemon.name +
                    ' · Nv.' +
                    progress.level
                );

                $gameMessage.add(
                    'EXP del nivel: ' +
                    progress.current +
                    ' / ' +
                    progress.required +
                    '.'
                );

                $gameMessage.add(
                    'Faltan ' +
                    progress.remaining +
                    ' EXP para Nv.' +
                    progress.nextLevel +
                    '.'
                );

                return;
            }

            // =================================================
            // PREVISIÓN DE EXP
            // =================================================

            if (
                cmd ===
                'granadamonexppreview' ||
                cmd ===
                'granadamonexppreviewgd'
            ) {

                var recipient =
                    EB.partyPokemon(
                        args[0]
                    );

                if (!recipient) {

                    $gameMessage.add(
                        'No hay Pokémon en ese slot.'
                    );

                    return;
                }

                var dex =
                    Number(
                        args[1] ||
                        0
                    );

                var enemySpecies;

                if (
                    cmd ===
                    'granadamonexppreviewgd'
                ) {

                    enemySpecies =
                        GM.getSpeciesByGranadaDex
                            ? GM.getSpeciesByGranadaDex(
                                dex
                              )
                            : null;

                } else {

                    enemySpecies =
                        GM.getSpecies(
                            dex
                        );
                }

                if (!enemySpecies) {

                    $gameMessage.add(
                        'No existe esa especie.'
                    );

                    return;
                }

                var enemyLevel =
                    Math.max(
                        1,
                        Number(
                            args[2] ||
                            1
                        )
                    );

                var trainer =
                    String(
                        args[3] ||
                        'WILD'
                    ).toUpperCase() ===
                    'TRAINER';

                var participantCount =
                    Math.max(
                        1,
                        Number(
                            args[4] ||
                            1
                        )
                    );

                var reward =
                    EB.preview(
                        recipient,
                        enemySpecies,
                        enemyLevel,
                        trainer,
                        participantCount
                    );

                $gameMessage.add(
                    'Previsión EXP · ' +
                    recipient.name +
                    ' Nv.' +
                    recipient.level
                );

                $gameMessage.add(
                    enemySpecies.name +
                    ' Nv.' +
                    enemyLevel +
                    ' · ' +
                    (
                        trainer
                            ? 'Entrenador'
                            : 'Salvaje'
                    )
                );

                $gameMessage.add(
                    'Ganaría aprox. ' +
                    reward +
                    ' EXP' +
                    (
                        participantCount >
                        1
                            ? ' (' +
                              participantCount +
                              ' participantes).'
                            : '.'
                    )
                );
            }
        };

    console.log(
        'GranadaMon ExperienceBalance v1.1 cargado.'
    );

})();