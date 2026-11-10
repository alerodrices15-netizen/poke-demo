/*:
 * @plugindesc v1.0 GranadaMon - Estado persistente real de cada Pokémon
 * @author OpenAI
 *
 * @help
 * GranadaMon_State.js
 * ------------------------------------------------------------
 * Este plugin es la base del sistema de combate persistente.
 *
 * GUARDA DE FORMA INDIVIDUAL:
 * - PS actuales y máximos
 * - debilitado / disponible
 * - estado alterado
 * - PP actuales y máximos de cada movimiento
 * - estadísticas básicas persistentes
 * - datos de historial de combate
 *
 * IMPORTANTE:
 * Colocar DESPUÉS de GranadaMon_Moves
 * y ANTES de GranadaMon_Experience.
 *
 * No sustituye ningún plugin.
 * Es un plugin NUEVO.
 *
 * ------------------------------------------------------------
 * COMANDOS DE PRUEBA
 * ------------------------------------------------------------
 * SLOT = posición del Pokémon en el equipo, empezando en 1.
 *
 * GranadaMonStateInfo 1
 * GranadaMonStateDamage 1 20
 * GranadaMonStateHeal 1 10
 * GranadaMonStateRevive 1
 * GranadaMonStateFullRestore 1
 * GranadaMonStateSetStatus 1 PARALISIS
 * GranadaMonStateClearStatus 1
 *
 * Estos comandos son principalmente para comprobar que el estado
 * persiste correctamente antes de conectar los combates.
 */

(function() {

    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (!GM.getSpecies || !GM.createPokemon) {
        throw new Error(
            'GranadaMon_State necesita GranadaMon_Core.js.'
        );
    }

    GM.State = GM.State || {};
    GM.State.VERSION = 1;

    // =========================================================
    // UTILIDADES
    // =========================================================

    GM.State.clamp = function(value, min, max) {
        value = Number(value || 0);
        return Math.max(min, Math.min(max, value));
    };

    GM.State.toInt = function(value, fallback) {
        var n = Number(value);

        if (!isFinite(n)) {
            return Number(fallback || 0);
        }

        return Math.floor(n);
    };

    // =========================================================
    // RECONSTRUIR PS MÁXIMOS SI FALTAN
    // =========================================================

    GM.State.calculateMaxHp = function(pokemon) {

        if (!pokemon) {
            return 1;
        }

        var current = Number(pokemon.maxHp);

        if (
            isFinite(current) &&
            current > 0
        ) {
            return Math.floor(current);
        }

        var species =
            GM.getSpecies(
                Number(pokemon.speciesId || 0)
            );

        if (
            species &&
            GM.calculateStats
        ) {

            var stats =
                GM.calculateStats(
                    species,
                    Number(pokemon.level || 1)
                );

            if (
                stats &&
                Number(stats.hp) > 0
            ) {
                return Math.floor(stats.hp);
            }
        }

        return 1;
    };

    // =========================================================
    // NORMALIZAR MOVIMIENTO
    // =========================================================

    GM.State.ensureMove = function(move) {

        if (move == null) {
            return null;
        }

        // Compatibilidad con Pokémon antiguos
        // que puedan guardar solo el ID del movimiento.

        if (
            typeof move === 'number' ||
            typeof move === 'string'
        ) {

            var moveId =
                Number(move);

            if (
                GM.createMoveInstance &&
                isFinite(moveId)
            ) {
                return GM.createMoveInstance(
                    moveId
                );
            }

            return {
                id: moveId,
                name: 'Movimiento',
                currentPP: 1,
                maxPP: 1
            };
        }

        var data = null;

        if (
            GM.getMove &&
            move.id != null
        ) {
            data =
                GM.getMove(
                    Number(move.id)
                );
        }

        if (
            !move.name &&
            data
        ) {
            move.name = data.name;
        }

        var defaultMax = 1;

        if (
            data &&
            Number(data.pp) > 0
        ) {
            defaultMax =
                Number(data.pp);
        }

        if (
            !isFinite(Number(move.maxPP)) ||
            Number(move.maxPP) <= 0
        ) {
            move.maxPP =
                defaultMax;
        }

        move.maxPP =
            Math.max(
                1,
                Math.floor(
                    Number(move.maxPP)
                )
            );

        if (
            !isFinite(
                Number(move.currentPP)
            )
        ) {
            move.currentPP =
                move.maxPP;
        }

        move.currentPP =
            GM.State.clamp(
                Math.floor(
                    Number(move.currentPP)
                ),
                0,
                move.maxPP
            );

        return move;
    };

    // =========================================================
    // NORMALIZAR UN POKÉMON
    // =========================================================

    GM.State.ensurePokemon = function(pokemon) {

        if (!pokemon) {
            return null;
        }

        // UID único para distinguir dos ejemplares
        // de la misma especie.

        if (
            !pokemon.uid &&
            GM.makeUid
        ) {
            pokemon.uid =
                GM.makeUid();
        }

        pokemon.level =
            GM.State.clamp(
                GM.State.toInt(
                    pokemon.level,
                    1
                ),
                1,
                100
            );

        pokemon.maxHp =
            GM.State.calculateMaxHp(
                pokemon
            );

        if (
            !isFinite(
                Number(pokemon.hp)
            )
        ) {
            pokemon.hp =
                pokemon.maxHp;
        }

        pokemon.hp =
            GM.State.clamp(
                Math.floor(
                    Number(pokemon.hp)
                ),
                0,
                pokemon.maxHp
            );

        // Debilitado depende de PS = 0.

        pokemon.fainted =
            pokemon.hp <= 0;

        if (
            pokemon.status == null ||
            pokemon.status === ''
        ) {
            pokemon.status = null;
        } else {
            pokemon.status =
                String(
                    pokemon.status
                ).toUpperCase();
        }

        pokemon.moves =
            pokemon.moves || [];

        var cleanMoves = [];

        for (
            var i = 0;
            i < pokemon.moves.length;
            i++
        ) {

            var move =
                GM.State.ensureMove(
                    pokemon.moves[i]
                );

            if (move) {
                cleanMoves.push(
                    move
                );
            }
        }

        pokemon.moves =
            cleanMoves.slice(
                0,
                4
            );

        // =====================================================
        // HISTORIAL INDIVIDUAL
        // =====================================================

        pokemon.battleRecord =
            pokemon.battleRecord || {};

        if (
            !isFinite(
                Number(
                    pokemon.battleRecord.battles
                )
            )
        ) {
            pokemon.battleRecord.battles = 0;
        }

        if (
            !isFinite(
                Number(
                    pokemon.battleRecord.wins
                )
            )
        ) {
            pokemon.battleRecord.wins = 0;
        }

        if (
            !isFinite(
                Number(
                    pokemon.battleRecord.faints
                )
            )
        ) {
            pokemon.battleRecord.faints = 0;
        }

        if (
            !isFinite(
                Number(
                    pokemon.battleRecord.damageDealt
                )
            )
        ) {
            pokemon.battleRecord.damageDealt = 0;
        }

        if (
            !isFinite(
                Number(
                    pokemon.battleRecord.damageTaken
                )
            )
        ) {
            pokemon.battleRecord.damageTaken = 0;
        }

        pokemon._granadaStateVersion =
            GM.State.VERSION;

        return pokemon;
    };

    // =========================================================
    // EQUIPO Y ALMACENAMIENTO
    // =========================================================

    GM.State.party = function() {

        if (!$gameSystem) {
            return [];
        }

        $gameSystem._granadaMonParty =
            $gameSystem._granadaMonParty || [];

        return $gameSystem._granadaMonParty;
    };

    GM.State.storage = function() {

        if (!$gameSystem) {
            return [];
        }

        $gameSystem._granadaMonStorage =
            $gameSystem._granadaMonStorage || [];

        return $gameSystem._granadaMonStorage;
    };

    GM.State.getAllOwnedPokemon = function() {

        var result = [];

        var party =
            GM.State.party();

        var storage =
            GM.State.storage();

        var i;

        for (
            i = 0;
            i < party.length;
            i++
        ) {

            if (party[i]) {
                result.push(
                    GM.State.ensurePokemon(
                        party[i]
                    )
                );
            }
        }

        for (
            i = 0;
            i < storage.length;
            i++
        ) {

            if (storage[i]) {
                result.push(
                    GM.State.ensurePokemon(
                        storage[i]
                    )
                );
            }
        }

        return result;
    };

    GM.State.normalizeAll = function() {
        GM.State.getAllOwnedPokemon();
    };

    // =========================================================
    // BUSCAR EJEMPLAR POR UID
    // =========================================================

    GM.State.findByUid = function(uid) {

        uid =
            String(
                uid || ''
            );

        if (!uid) {
            return null;
        }

        var all =
            GM.State.getAllOwnedPokemon();

        for (
            var i = 0;
            i < all.length;
            i++
        ) {

            if (
                all[i] &&
                String(all[i].uid) === uid
            ) {
                return all[i];
            }
        }

        return null;
    };

    // =========================================================
    // SABER SI ESTÁ EN EQUIPO O ALMACENAMIENTO
    // =========================================================

    GM.State.locationOf = function(pokemon) {

        if (!pokemon) {
            return null;
        }

        var uid =
            String(
                pokemon.uid || ''
            );

        var party =
            GM.State.party();

        var storage =
            GM.State.storage();

        var i;

        for (
            i = 0;
            i < party.length;
            i++
        ) {

            if (
                party[i] === pokemon ||
                (
                    uid &&
                    party[i] &&
                    String(
                        party[i].uid
                    ) === uid
                )
            ) {
                return {
                    type: 'PARTY',
                    index: i
                };
            }
        }

        for (
            i = 0;
            i < storage.length;
            i++
        ) {

            if (
                storage[i] === pokemon ||
                (
                    uid &&
                    storage[i] &&
                    String(
                        storage[i].uid
                    ) === uid
                )
            ) {
                return {
                    type: 'STORAGE',
                    index: i
                };
            }
        }

        return null;
    };

    // =========================================================
    // ESTADO DE COMBATE
    // =========================================================

    GM.State.isFainted = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        return (
            !pokemon ||
            pokemon.hp <= 0
        );
    };

    GM.State.canBattle = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        return (
            !!pokemon &&
            pokemon.hp > 0
        );
    };

    GM.State.getHpPercent = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (
            !pokemon ||
            pokemon.maxHp <= 0
        ) {
            return 0;
        }

        return (
            pokemon.hp /
            pokemon.maxHp
        );
    };

    // =========================================================
    // CAMBIAR PS
    // =========================================================

    GM.State.setHp = function(pokemon, value) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return 0;
        }

        var wasFainted =
            pokemon.fainted;

        pokemon.hp =
            GM.State.clamp(
                Math.floor(
                    Number(value || 0)
                ),
                0,
                pokemon.maxHp
            );

        pokemon.fainted =
            pokemon.hp <= 0;

        // Solo cuenta cuando pasa de vivo -> debilitado.

        if (
            !wasFainted &&
            pokemon.fainted
        ) {
            pokemon.battleRecord.faints =
                Number(
                    pokemon.battleRecord.faints || 0
                ) + 1;
        }

        return pokemon.hp;
    };

    // =========================================================
    // RECIBIR DAÑO
    // =========================================================

    GM.State.damage = function(pokemon, amount) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return 0;
        }

        amount =
            Math.max(
                0,
                Math.floor(
                    Number(amount || 0)
                )
            );

        var before =
            pokemon.hp;

        GM.State.setHp(
            pokemon,
            pokemon.hp - amount
        );

        var realDamage =
            before -
            pokemon.hp;

        pokemon.battleRecord.damageTaken =
            Number(
                pokemon.battleRecord.damageTaken || 0
            ) +
            realDamage;

        return realDamage;
    };

    // =========================================================
    // CURAR
    // =========================================================

    GM.State.heal = function(pokemon, amount) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return 0;
        }

        // Curar NO revive.

        if (
            pokemon.hp <= 0
        ) {
            return 0;
        }

        amount =
            Math.max(
                0,
                Math.floor(
                    Number(amount || 0)
                )
            );

        var before =
            pokemon.hp;

        GM.State.setHp(
            pokemon,
            pokemon.hp + amount
        );

        return (
            pokemon.hp -
            before
        );
    };

    // =========================================================
    // REVIVIR
    // =========================================================

    GM.State.revive = function(pokemon, percent) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return false;
        }

        if (
            pokemon.hp > 0
        ) {
            return false;
        }

        if (
            percent == null
        ) {
            percent = 0.50;
        }

        percent =
            GM.State.clamp(
                Number(percent),
                0.01,
                1
            );

        pokemon.hp =
            Math.max(
                1,
                Math.floor(
                    pokemon.maxHp *
                    percent
                )
            );

        pokemon.fainted = false;

        return true;
    };

    // =========================================================
    // CURAR PS AL MÁXIMO
    // =========================================================

    GM.State.fullHealHp = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return false;
        }

        // Un debilitado necesita revive.

        if (
            pokemon.hp <= 0
        ) {
            return false;
        }

        pokemon.hp =
            pokemon.maxHp;

        pokemon.fainted = false;

        return true;
    };

    // =========================================================
    // ESTADOS ALTERADOS
    // =========================================================

    GM.State.setStatus = function(pokemon, status) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return false;
        }

        if (
            status == null ||
            status === ''
        ) {
            pokemon.status = null;
        } else {
            pokemon.status =
                String(
                    status
                ).toUpperCase();
        }

        return true;
    };

    GM.State.clearStatus = function(pokemon) {
        return GM.State.setStatus(
            pokemon,
            null
        );
    };

    // =========================================================
    // PP
    // =========================================================

    GM.State.getMove = function(
        pokemon,
        moveIndex
    ) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return null;
        }

        moveIndex =
            Math.floor(
                Number(moveIndex || 0)
            );

        if (
            moveIndex < 0 ||
            moveIndex >= pokemon.moves.length
        ) {
            return null;
        }

        return pokemon.moves[
            moveIndex
        ];
    };

    GM.State.consumePP = function(
        pokemon,
        moveIndex,
        amount
    ) {

        var move =
            GM.State.getMove(
                pokemon,
                moveIndex
            );

        if (!move) {
            return false;
        }

        amount =
            Math.max(
                1,
                Math.floor(
                    Number(amount || 1)
                )
            );

        if (
            move.currentPP <= 0
        ) {
            return false;
        }

        move.currentPP =
            Math.max(
                0,
                move.currentPP - amount
            );

        return true;
    };

    GM.State.restorePP = function(
        pokemon,
        moveIndex,
        amount
    ) {

        var move =
            GM.State.getMove(
                pokemon,
                moveIndex
            );

        if (!move) {
            return 0;
        }

        if (
            amount == null
        ) {
            amount =
                move.maxPP;
        }

        amount =
            Math.max(
                0,
                Math.floor(
                    Number(amount || 0)
                )
            );

        var before =
            move.currentPP;

        move.currentPP =
            Math.min(
                move.maxPP,
                move.currentPP + amount
            );

        return (
            move.currentPP -
            before
        );
    };

    GM.State.restoreAllPP = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return false;
        }

        for (
            var i = 0;
            i < pokemon.moves.length;
            i++
        ) {

            if (pokemon.moves[i]) {
                pokemon.moves[i].currentPP =
                    pokemon.moves[i].maxPP;
            }
        }

        return true;
    };

    // =========================================================
    // RESTAURACIÓN TOTAL
    // =========================================================

    GM.State.fullRestore = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (!pokemon) {
            return false;
        }

        pokemon.hp =
            pokemon.maxHp;

        pokemon.fainted =
            false;

        pokemon.status =
            null;

        GM.State.restoreAllPP(
            pokemon
        );

        return true;
    };

    // =========================================================
    // POKÉMON DEL EQUIPO POR POSICIÓN
    // =========================================================

    GM.State.getPartyPokemon = function(slot) {

        slot =
            Math.floor(
                Number(slot || 1)
            ) - 1;

        var party =
            GM.State.party();

        if (
            slot < 0 ||
            slot >= party.length
        ) {
            return null;
        }

        return GM.State.ensurePokemon(
            party[slot]
        );
    };

    // =========================================================
    // PARCHEAR CREACIÓN DE POKÉMON
    // =========================================================
    // Este plugin va después de Moves.
    // Por tanto recibe al Pokémon ya con sus movimientos.
    // =========================================================

    var _GM_State_createPokemon =
        GM.createPokemon;

    GM.createPokemon = function(
        nationalDex,
        level
    ) {

        var pokemon =
            _GM_State_createPokemon.call(
                GM,
                nationalDex,
                level
            );

        return GM.State.ensurePokemon(
            pokemon
        );
    };

    // =========================================================
    // NORMALIZAR PARTIDAS GUARDADAS ANTIGUAS
    // =========================================================

    if (
        window.DataManager &&
        DataManager.extractSaveContents
    ) {

        var _GM_State_extractSaveContents =
            DataManager.extractSaveContents;

        DataManager.extractSaveContents =
            function(contents) {

                _GM_State_extractSaveContents.call(
                    this,
                    contents
                );

                if (
                    window.$gameSystem &&
                    GM.State
                ) {
                    GM.State.normalizeAll();
                }
            };
    }

    // =========================================================
    // ATAJOS PARA LOS SIGUIENTES PLUGINS
    // =========================================================

    GM.isPokemonFainted = function(pokemon) {
        return GM.State.isFainted(
            pokemon
        );
    };

    GM.canPokemonBattle = function(pokemon) {
        return GM.State.canBattle(
            pokemon
        );
    };

    GM.damagePokemon = function(
        pokemon,
        amount
    ) {
        return GM.State.damage(
            pokemon,
            amount
        );
    };

    GM.healPokemon = function(
        pokemon,
        amount
    ) {
        return GM.State.heal(
            pokemon,
            amount
        );
    };

    GM.revivePokemon = function(
        pokemon,
        percent
    ) {
        return GM.State.revive(
            pokemon,
            percent
        );
    };

    // =========================================================
    // MOSTRAR INFORMACIÓN PARA PRUEBAS
    // =========================================================

    GM.State.showInfo = function(pokemon) {

        pokemon =
            GM.State.ensurePokemon(
                pokemon
            );

        if (
            !pokemon ||
            !$gameMessage
        ) {
            return;
        }

        var location =
            GM.State.locationOf(
                pokemon
            );

        var locationText =
            'DESCONOCIDO';

        if (location) {

            locationText =
                location.type === 'PARTY'
                    ? 'EQUIPO'
                    : 'ALMACENAMIENTO';
        }

        var stateText =
            pokemon.fainted
                ? 'DEBILITADO'
                : (
                    pokemon.status ||
                    'NORMAL'
                );

        $gameMessage.add(
            pokemon.name +
            ' · Nv. ' +
            pokemon.level
        );

        $gameMessage.add(
            'PS: ' +
            pokemon.hp +
            ' / ' +
            pokemon.maxHp
        );

        $gameMessage.add(
            'Estado: ' +
            stateText
        );

        $gameMessage.add(
            'Ubicación: ' +
            locationText
        );

        if (
            pokemon.moves &&
            pokemon.moves.length
        ) {

            var ppText = [];

            for (
                var i = 0;
                i < pokemon.moves.length;
                i++
            ) {

                var move =
                    pokemon.moves[i];

                if (move) {

                    ppText.push(
                        move.name +
                        ' ' +
                        move.currentPP +
                        '/' +
                        move.maxPP
                    );
                }
            }

            if (
                ppText.length
            ) {
                $gameMessage.add(
                    'PP: ' +
                    ppText.join(' · ')
                );
            }
        }
    };

    // =========================================================
    // PLUGIN COMMANDS PARA PROBARLO
    // =========================================================

    var _GM_State_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand =
        function(command, args) {

            _GM_State_pluginCommand.call(
                this,
                command,
                args
            );

            var cmd =
                String(
                    command || ''
                ).toLowerCase();

            // =================================================
            // INFORMACIÓN
            // =================================================

            if (
                cmd ===
                'granadamonstateinfo'
            ) {

                var infoPokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                if (infoPokemon) {

                    GM.State.showInfo(
                        infoPokemon
                    );

                } else if ($gameMessage) {

                    $gameMessage.add(
                        'No hay Pokémon en ese hueco del equipo.'
                    );
                }
            }

            // =================================================
            // DAÑO
            // =================================================

            if (
                cmd ===
                'granadamonstatedamage'
            ) {

                var damagePokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                var damageAmount =
                    Number(
                        args[1] || 0
                    );

                if (damagePokemon) {

                    GM.State.damage(
                        damagePokemon,
                        damageAmount
                    );

                    GM.State.showInfo(
                        damagePokemon
                    );
                }
            }

            // =================================================
            // CURAR
            // =================================================

            if (
                cmd ===
                'granadamonstateheal'
            ) {

                var healPokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                var healAmount =
                    Number(
                        args[1] || 0
                    );

                if (healPokemon) {

                    if (
                        healPokemon.hp <= 0
                    ) {

                        if ($gameMessage) {

                            $gameMessage.add(
                                healPokemon.name +
                                ' está debilitado. Necesita ser recuperado primero.'
                            );
                        }

                    } else {

                        GM.State.heal(
                            healPokemon,
                            healAmount
                        );

                        GM.State.showInfo(
                            healPokemon
                        );
                    }
                }
            }

            // =================================================
            // REVIVIR AL 50 %
            // =================================================

            if (
                cmd ===
                'granadamonstaterevive'
            ) {

                var revivePokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                if (revivePokemon) {

                    var revived =
                        GM.State.revive(
                            revivePokemon,
                            0.50
                        );

                    if (
                        !revived &&
                        $gameMessage
                    ) {

                        $gameMessage.add(
                            revivePokemon.name +
                            ' no está debilitado.'
                        );
                    }

                    GM.State.showInfo(
                        revivePokemon
                    );
                }
            }

            // =================================================
            // RESTAURACIÓN COMPLETA
            // =================================================

            if (
                cmd ===
                'granadamonstatefullrestore'
            ) {

                var restorePokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                if (restorePokemon) {

                    GM.State.fullRestore(
                        restorePokemon
                    );

                    GM.State.showInfo(
                        restorePokemon
                    );
                }
            }

            // =================================================
            // PONER ESTADO
            // =================================================

            if (
                cmd ===
                'granadamonstatesetstatus'
            ) {

                var statusPokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                var status =
                    args.slice(1).join('_');

                if (statusPokemon) {

                    GM.State.setStatus(
                        statusPokemon,
                        status
                    );

                    GM.State.showInfo(
                        statusPokemon
                    );
                }
            }

            // =================================================
            // QUITAR ESTADO
            // =================================================

            if (
                cmd ===
                'granadamonstateclearstatus'
            ) {

                var clearPokemon =
                    GM.State.getPartyPokemon(
                        Number(
                            args[0] || 1
                        )
                    );

                if (clearPokemon) {

                    GM.State.clearStatus(
                        clearPokemon
                    );

                    GM.State.showInfo(
                        clearPokemon
                    );
                }
            }
        };

    // =========================================================
    // NORMALIZAR EQUIPO ACTUAL
    // =========================================================

    if (
        window.$gameSystem
    ) {
        GM.State.normalizeAll();
    }

    console.log(
        'GranadaMon_State v1.0 cargado correctamente.'
    );

})();