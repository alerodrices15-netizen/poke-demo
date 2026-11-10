/*:
 * @plugindesc v1.0 GranadaMon - Reparación final del sistema de combate y gimnasios
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleRepair.js
 * ------------------------------------------------------------
 * COLOCAR AL FINAL DE TODOS LOS PLUGINS GRANADAMON,
 * incluso debajo de GranadaMon_Gyms y GranadaMon_AudioSafety.
 *
 * Objetivos:
 * - Fuerza siempre la interfaz visual moderna del combate.
 * - Usa GM_Battle_BG como fondo.
 * - Usa GMDEX para rival y GMBTL_Back para jugador.
 * - Conserva BattleClassic, BattlePremium, BattleParty,
 *   BattleAnimations y BattleEffects.
 * - Repara los comandos GranadaMonBattle / GranadaMonBattleGD.
 * - Repara los comandos de entrenador.
 * - Mantiene GranadaMonGym 1..8 funcionando mediante Gyms.
 *
 * Comandos:
 *   GranadaMonBattle NATIONALDEX NIVEL
 *   GranadaMonBattleGD GRANADADEX NIVEL
 *   GranadaMonTrainerBattle NOMBRE|NDEX:NIVEL,NDEX:NIVEL
 *   GranadaMonTrainerBattleGD NOMBRE|GD:NIVEL,GD:NIVEL
 *   GranadaMonGym 1
 *   ...
 *   GranadaMonGym 8
 *
 * @requiredAssets img/pictures/GM_Battle_BG
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    GM.BattleRepair = GM.BattleRepair || {};
    var R = GM.BattleRepair;

    R.VERSION = '1.0';
    R.BATTLE_BG_NAME = 'GM_Battle_BG';

    // =========================================================
    // COMPROBACIONES
    // =========================================================

    if (!GM.Battle || typeof Scene_GranadaMonBattle === 'undefined') {
        throw new Error(
            'GranadaMon_BattleRepair necesita GranadaMon_Battle.js.'
        );
    }

    if (!GM.BattlePremium) {
        throw new Error(
            'GranadaMon_BattleRepair necesita GranadaMon_BattlePremium.js.'
        );
    }

    // =========================================================
    // UTILIDADES
    // =========================================================

    R.message = function(text) {
        if ($gameMessage) {
            $gameMessage.add(String(text || ''));
        }
    };

    R.eventContext = function(interpreter) {
        return {
            mapId: $gameMap ? Number($gameMap.mapId() || 0) : 0,
            eventId: interpreter ? Number(interpreter._eventId || 0) : 0
        };
    };

    R.isResolvedWildEvent = function(context) {
        if (
            !context ||
            !context.mapId ||
            !context.eventId ||
            !GM.BattleClassic ||
            typeof GM.BattleClassic.isBattleEventResolved !== 'function'
        ) {
            return false;
        }

        return !!GM.BattleClassic.isBattleEventResolved(
            context.mapId,
            context.eventId
        );
    };

    // =========================================================
    // FONDO BONITO Y FIJO
    // =========================================================

    Scene_GranadaMonBattle.prototype.createBackground = function() {
        var scene = this;

        this._backgroundSprite = new Sprite(
            ImageManager.loadPicture(
                R.BATTLE_BG_NAME
            )
        );

        this.addChild(
            this._backgroundSprite
        );

        this._backgroundSprite.bitmap.addLoadListener(
            function() {
                if (
                    GM.BattleClassic &&
                    typeof GM.BattleClassic.fitBattleBackground === 'function'
                ) {
                    GM.BattleClassic.fitBattleBackground(
                        scene._backgroundSprite
                    );
                    return;
                }

                var sprite = scene._backgroundSprite;

                if (
                    !sprite ||
                    !sprite.bitmap ||
                    !sprite.bitmap.width ||
                    !sprite.bitmap.height
                ) {
                    return;
                }

                var sx = Graphics.boxWidth / sprite.bitmap.width;
                var sy = Graphics.boxHeight / sprite.bitmap.height;
                var scale = Math.max(sx, sy);

                sprite.scale.x = scale;
                sprite.scale.y = scale;

                sprite.x = Math.round(
                    (Graphics.boxWidth - sprite.bitmap.width * scale) / 2
                );

                sprite.y = Math.round(
                    (Graphics.boxHeight - sprite.bitmap.height * scale) / 2
                );
            }
        );

        var shadeBitmap = new Bitmap(
            Graphics.boxWidth,
            Graphics.boxHeight
        );

        shadeBitmap.gradientFillRect(
            0,
            0,
            Graphics.boxWidth,
            Graphics.boxHeight,
            'rgba(4,12,18,0.04)',
            'rgba(4,12,18,0.22)',
            true
        );

        this._gmRepairBackgroundShade = new Sprite(
            shadeBitmap
        );

        this.addChild(
            this._gmRepairBackgroundShade
        );
    };

    // =========================================================
    // CREAR LA INTERFAZ MODERNA DE FORMA EXPLÍCITA
    // =========================================================
    //
    // No encadenamos el create antiguo porque, si cualquiera de
    // las capas previas ha dejado la escena apuntando al create
    // provisional de Battle.js, reaparecen [SPRITE RIVAL] y
    // [TU POKÉMON]. Aquí construimos directamente la UI buena.
    //
    // =========================================================

    R.createModernScene = function(scene) {
        var requiredMethods = [
            'createPokemonSprites',
            'createEnemyStatusWindow',
            'createPlayerStatusWindow',
            'createLogWindow',
            'createCommandWindow',
            'createMoveWindow',
            'createCompatibilityFieldBridge'
        ];

        var i;

        for (i = 0; i < requiredMethods.length; i++) {
            if (typeof scene[requiredMethods[i]] !== 'function') {
                throw new Error(
                    'GranadaMon_BattleRepair: falta ' +
                    requiredMethods[i] +
                    '. Revisa GranadaMon_BattleUI.js.'
                );
            }
        }

        Scene_MenuBase.prototype.create.call(
            scene
        );

        scene.createPokemonSprites();
        scene.createEnemyStatusWindow();
        scene.createPlayerStatusWindow();
        scene.createLogWindow();
        scene.createCommandWindow();
        scene.createMoveWindow();
        scene.createCompatibilityFieldBridge();

        // Ventana de equipo de BattleParty.
        if (
            typeof scene.createGMBattlePartyWindow === 'function'
        ) {
            scene.createGMBattlePartyWindow();
            scene._gmSwitchingPokemon = false;
        }

        // Sprites reales: GMDEX / GMBTL_Back.
        if (
            GM.BattleSprites &&
            typeof GM.BattleSprites.refreshAll === 'function'
        ) {
            GM.BattleSprites.refreshAll(
                scene
            );
        }

        // Estado que BattleAnimations normalmente crea en su wrapper.
        scene._gmAnimationQueue = [];
        scene._gmAnimationsLocked = false;
        scene._gmHpTweens = [];

        if (
            GM.BattleAnimations &&
            typeof GM.BattleAnimations.layer === 'function'
        ) {
            GM.BattleAnimations.layer(
                scene
            );
        }

        // Layout premium/clásico.
        if (
            GM.BattleClassic &&
            typeof GM.BattleClassic.applyLayout === 'function'
        ) {
            GM.BattleClassic.applyLayout(
                scene
            );
        }

        // Mochila Premium.
        if (
            GM.BattlePremium &&
            typeof GM.BattlePremium.createBagWindows === 'function'
        ) {
            GM.BattlePremium.createBagWindows(
                scene
            );
        }

        // FX Premium.
        if (
            GM.BattlePremium &&
            typeof GM.BattlePremium.createFx === 'function'
        ) {
            GM.BattlePremium.createFx(
                scene
            );
        }

        // El intro premium activa el menú cuando termina.
        if (scene._commandWindow) {
            scene._commandWindow.deactivate();
        }

        if (scene._logWindow) {
            if (
                GM.BattlePremium &&
                GM.BattlePremium.trainer
            ) {
                scene._logWindow.setText(
                    GM.BattlePremium.trainer.name +
                    ' quiere combatir.'
                );
            } else if (GM.Battle.enemy) {
                scene._logWindow.setText(
                    '¡Ha aparecido un ' +
                    GM.Battle.enemy.name +
                    ' salvaje!'
                );
            }
        }
    };

    Scene_GranadaMonBattle.prototype.create = function() {
        R.createModernScene(
            this
        );
    };

    // =========================================================
    // INICIAR COMBATE SALVAJE DE FORMA ROBUSTA
    // =========================================================

    R.startWildNational = function(
        nationalDex,
        level,
        interpreter
    ) {
        nationalDex = Number(
            nationalDex || 0
        );

        level = Math.max(
            1,
            Math.floor(
                Number(level || 1)
            )
        );

        if (!nationalDex) {
            R.message(
                'Pokémon no válido.'
            );
            return false;
        }

        var context = R.eventContext(
            interpreter
        );

        if (
            R.isResolvedWildEvent(
                context
            )
        ) {
            R.message(
                'Este encuentro ya ha terminado.'
            );
            return false;
        }

        if (
            GM.BattleClassic
        ) {
            GM.BattleClassic.pendingBattleEvent =
                context;
        }

        return !!GM.Battle.startWildBattle(
            nationalDex,
            level
        );
    };

    R.startWildGranada = function(
        granadaDex,
        level,
        interpreter
    ) {
        granadaDex = Number(
            granadaDex || 0
        );

        var species =
            GM.getSpeciesByGranadaDex
                ? GM.getSpeciesByGranadaDex(
                    granadaDex
                  )
                : null;

        if (!species) {
            R.message(
                'No existe el Pokémon Granada #' +
                granadaDex +
                '.'
            );
            return false;
        }

        return R.startWildNational(
            species.nationalDex,
            level,
            interpreter
        );
    };

    // =========================================================
    // ENTRENADORES
    // =========================================================

    R.startTrainer = function(
        command,
        args,
        interpreter
    ) {
        if (
            !GM.BattlePremium ||
            typeof GM.BattlePremium.startTrainerBattle !== 'function'
        ) {
            R.message(
                'El sistema de combate de entrenadores no está disponible.'
            );
            return false;
        }

        var raw = (
            args || []
        ).join(' ');

        var parts = raw.split('|');

        var name = String(
            parts[0] || 'Entrenador'
        ).trim();

        var teamRaw = String(
            parts[1] || ''
        ).trim();

        var useGranadaDex =
            String(command || '').toLowerCase() ===
            'granadamontrainerbattlegd';

        var team =
            GM.BattlePremium.parseTrainerTeam
                ? GM.BattlePremium.parseTrainerTeam(
                    teamRaw,
                    useGranadaDex
                  )
                : [];

        if (!team.length) {
            R.message(
                'El entrenador no tiene ningún Pokémon válido.'
            );
            return false;
        }

        var context = R.eventContext(
            interpreter
        );

        if (
            context.mapId &&
            context.eventId &&
            $gameSelfSwitches &&
            $gameSelfSwitches.value(
                [
                    context.mapId,
                    context.eventId,
                    'A'
                ]
            )
        ) {
            R.message(
                name +
                ' ya ha sido derrotado.'
            );
            return false;
        }

        return !!GM.BattlePremium.startTrainerBattle(
            name,
            team,
            context
        );
    };

    // =========================================================
    // COMANDOS - INTERCEPTAR ANTES DE LA CADENA ANTIGUA
    // =========================================================

    var _R_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(
        command,
        args
    ) {
        var cmd = String(
            command || ''
        ).toLowerCase();

        if (
            cmd === 'granadamonbattle'
        ) {
            R.startWildNational(
                args && args.length ? args[0] : 0,
                args && args.length > 1 ? args[1] : 1,
                this
            );
            return;
        }

        if (
            cmd === 'granadamonbattlegd'
        ) {
            R.startWildGranada(
                args && args.length ? args[0] : 0,
                args && args.length > 1 ? args[1] : 1,
                this
            );
            return;
        }

        if (
            cmd === 'granadamontrainerbattle' ||
            cmd === 'granadamontrainerbattlegd'
        ) {
            R.startTrainer(
                command,
                args,
                this
            );
            return;
        }

        // Los gimnasios siguen usando GranadaMon_Gyms.js,
        // pero los llamamos directamente para evitar que una
        // cadena antigua de pluginCommand interfiera.
        if (
            cmd === 'granadamongym' &&
            GM.Gyms &&
            typeof GM.Gyms.startBattle === 'function'
        ) {
            GM.Gyms.startBattle(
                Number(
                    args && args.length
                        ? args[0]
                        : 0
                ),
                this
            );
            return;
        }

        if (
            cmd === 'granadamongyminfo' &&
            GM.Gyms &&
            typeof GM.Gyms.showInfo === 'function'
        ) {
            GM.Gyms.showInfo(
                Number(
                    args && args.length
                        ? args[0]
                        : 0
                )
            );
            return;
        }

        if (
            cmd === 'granadamongymreset' &&
            GM.Gyms &&
            typeof GM.Gyms.resetGym === 'function'
        ) {
            GM.Gyms.resetGym(
                Number(
                    args && args.length
                        ? args[0]
                        : 0
                ),
                this
            );
            return;
        }

        _R_pluginCommand.call(
            this,
            command,
            args
        );
    };

    // =========================================================
    // REFUERZO DE SPRITES AL CAMBIAR RIVAL/JUGADOR
    // =========================================================

    R.refreshSprites = function(scene) {
        if (
            GM.BattleSprites &&
            typeof GM.BattleSprites.refreshAll === 'function'
        ) {
            GM.BattleSprites.refreshAll(
                scene
            );
        }
    };

    if (
        Scene_GranadaMonBattle.prototype.refreshBattleUI
    ) {
        var _R_refreshBattleUI =
            Scene_GranadaMonBattle.prototype.refreshBattleUI;

        Scene_GranadaMonBattle.prototype.refreshBattleUI = function() {
            var result = _R_refreshBattleUI.call(
                this
            );

            R.refreshSprites(
                this
            );

            return result;
        };
    }

    // =========================================================
    // LOG
    // =========================================================

    console.log(
        'GranadaMon BattleRepair v1.0 cargado: UI y comandos reparados.'
    );

})();