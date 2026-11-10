/*:
 * @plugindesc v1.0 GranadaMon - Batallas Pokémon salvajes
 * @author OpenAI
 *
 * @help
 * GranadaMon_Battle.js
 * ------------------------------------------------------------
 * REQUIERE:
 * GranadaMon_Core
 * GranadaMon_Data
 * GranadaMon_Moves
 * GranadaMon_BattleCore
 *
 * COMANDO FINAL DE EVENTO:
 *
 * GranadaMonBattle NATIONALDEX NIVEL
 *
 * Ejemplo:
 *
 * GranadaMonBattle 25 8
 *
 * Inicia una batalla contra Pikachu nivel 8.
 */

(function() {

    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;

    if (
        !GM.createPokemon ||
        !GM.calculateDamage ||
        !GM.compareTurnOrder
    ) {

        throw new Error(
            'GranadaMon_Battle necesita Core, Moves y BattleCore.'
        );

    }


    // =========================================================
    // BATTLE
    // =========================================================

    GM.Battle =
        GM.Battle || {};

    GM.Battle.version =
        '1.0';

    GM.Battle.enemy =
        null;

    GM.Battle.playerPokemon =
        null;

    GM.Battle.result =
        null;


    // =========================================================
    // PRIMER POKÉMON DISPONIBLE
    // =========================================================

    GM.Battle.firstUsablePokemon =
        function() {

            var party =
                $gameSystem._granadaMonParty || [];


            for (
                var i = 0;
                i < party.length;
                i++
            ) {

                if (
                    party[i] &&
                    Number(
                        party[i].hp || 0
                    ) > 0
                ) {

                    return party[i];

                }

            }


            return null;

        };


    // =========================================================
    // MOVIMIENTO DE EMERGENCIA
    // =========================================================

    GM.Battle.ensureUsableMove =
        function(pokemon) {

            if (!pokemon) {

                return;

            }


            pokemon.moves =
                pokemon.moves || [];


            if (
                pokemon.moves.length === 0
            ) {

                var tackle =
                    GM.createMoveInstance
                        ? GM.createMoveInstance(1)
                        : null;


                if (tackle) {

                    pokemon.moves.push(
                        tackle
                    );

                }

            }

        };


    // =========================================================
    // INICIAR BATALLA
    // =========================================================

    GM.Battle.startWildBattle =
        function(
            nationalDex,
            level
        ) {

            var player =
                GM.Battle.firstUsablePokemon();


            if (!player) {

                $gameMessage.add(
                    'No tienes ningún Pokémon disponible para combatir.'
                );

                return false;

            }


            var enemy =
                GM.createPokemon(
                    nationalDex,
                    level
                );


            if (!enemy) {

                $gameMessage.add(
                    'No se ha podido crear el Pokémon salvaje.'
                );

                return false;

            }


            GM.Battle.ensureUsableMove(
                player
            );

            GM.Battle.ensureUsableMove(
                enemy
            );


            GM.resetBattleStages(
                player
            );

            GM.resetBattleStages(
                enemy
            );


            GM.Battle.playerPokemon =
                player;

            GM.Battle.enemy =
                enemy;

            GM.Battle.result =
                null;


            if (
                GM.markSeen
            ) {

                GM.markSeen(
                    nationalDex
                );

            }


            SceneManager.push(
                Scene_GranadaMonBattle
            );


            return true;

        };


    // =========================================================
    // TÍTULO
    // =========================================================

    function Window_GMBattleTitle() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleTitle.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GMBattleTitle.prototype.constructor =
        Window_GMBattleTitle;


    Window_GMBattleTitle.prototype.initialize =
        function() {

            Window_Base.prototype.initialize.call(
                this,
                0,
                0,
                Graphics.boxWidth,
                72
            );

            this.refresh();

        };


    Window_GMBattleTitle.prototype.refresh =
        function() {

            this.contents.clear();

            this.changeTextColor(
                this.systemColor()
            );

            this.drawText(
                'Combate Pokémon',
                0,
                0,
                this.contentsWidth(),
                'center'
            );

            this.resetTextColor();

        };


    // =========================================================
    // CAMPO DE BATALLA
    // =========================================================

    function Window_GMBattleField() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleField.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GMBattleField.prototype.constructor =
        Window_GMBattleField;


    Window_GMBattleField.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            Window_Base.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            this.refresh();

        };


    Window_GMBattleField.prototype.refresh =
        function() {

            this.contents.clear();


            var player =
                GM.Battle.playerPokemon;

            var enemy =
                GM.Battle.enemy;


            if (
                !player ||
                !enemy
            ) {

                return;

            }


            var width =
                this.contentsWidth();

            var line =
                this.lineHeight();


            // =================================================
            // RIVAL
            // =================================================

            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(
                enemy.name,
                width / 2,
                10,
                width / 2 - 20
            );


            this.resetTextColor();


            this.drawText(
                'Nv. ' + enemy.level,
                width / 2,
                10 + line,
                160
            );


            this.drawText(
                'PS ' +
                enemy.hp +
                '/' +
                enemy.maxHp,
                width / 2,
                10 + line * 2,
                width / 2 - 20
            );


            this.drawGauge(
                width / 2,
                10 + line * 3,
                width / 2 - 40,
                enemy.hp /
                Math.max(
                    1,
                    enemy.maxHp
                ),
                this.hpGaugeColor1(),
                this.hpGaugeColor2()
            );


            // =================================================
            // PLACEHOLDER RIVAL
            // =================================================

            this.changePaintOpacity(false);


            this.drawText(
                '[SPRITE RIVAL]',
                width / 2,
                10 + line * 5,
                width / 2 - 20,
                'center'
            );


            this.changePaintOpacity(true);


            // =================================================
            // JUGADOR
            // =================================================

            var py =
                this.contentsHeight() -
                line * 6;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(
                player.name,
                20,
                py,
                width / 2 - 40
            );


            this.resetTextColor();


            this.drawText(
                'Nv. ' + player.level,
                20,
                py + line,
                160
            );


            this.drawText(
                'PS ' +
                player.hp +
                '/' +
                player.maxHp,
                20,
                py + line * 2,
                width / 2 - 40
            );


            this.drawGauge(
                20,
                py + line * 3,
                width / 2 - 60,
                player.hp /
                Math.max(
                    1,
                    player.maxHp
                ),
                this.hpGaugeColor1(),
                this.hpGaugeColor2()
            );


            this.changePaintOpacity(false);


            this.drawText(
                '[TU POKÉMON]',
                20,
                py - line * 2,
                width / 2 - 60,
                'center'
            );


            this.changePaintOpacity(true);

        };


    // =========================================================
    // MENSAJES
    // =========================================================

    function Window_GMBattleLog() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleLog.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GMBattleLog.prototype.constructor =
        Window_GMBattleLog;


    Window_GMBattleLog.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._text =
                '';

            Window_Base.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

        };


    Window_GMBattleLog.prototype.setText =
        function(text) {

            this._text =
                String(
                    text || ''
                );

            this.refresh();

        };


    Window_GMBattleLog.prototype.refresh =
        function() {

            this.contents.clear();

            this.drawTextEx(
                this._text,
                4,
                0
            );

        };


    // =========================================================
    // COMANDOS PRINCIPALES
    // =========================================================

    function Window_GMBattleCommand() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleCommand.prototype =
        Object.create(
            Window_HorzCommand.prototype
        );

    Window_GMBattleCommand.prototype.constructor =
        Window_GMBattleCommand;


    Window_GMBattleCommand.prototype.initialize =
        function(
            x,
            y
        ) {

            Window_HorzCommand.prototype.initialize.call(
                this,
                x,
                y
            );

        };


    Window_GMBattleCommand.prototype.windowWidth =
        function() {

            return Graphics.boxWidth;

        };


    Window_GMBattleCommand.prototype.maxCols =
        function() {

            return 4;

        };


    Window_GMBattleCommand.prototype.makeCommandList =
        function() {

            this.addCommand(
                'LUCHAR',
                'fight',
                true
            );

            this.addCommand(
                'MOCHILA',
                'bag',
                true
            );

            this.addCommand(
                'POKÉMON',
                'pokemon',
                true
            );

            this.addCommand(
                'HUIR',
                'run',
                true
            );

        };


    // =========================================================
    // MOVIMIENTOS
    // =========================================================

    function Window_GMBattleMoves() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleMoves.prototype =
        Object.create(
            Window_Selectable.prototype
        );

    Window_GMBattleMoves.prototype.constructor =
        Window_GMBattleMoves;


    Window_GMBattleMoves.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            Window_Selectable.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            this.hide();

            this.deactivate();

            this.refresh();

        };


    Window_GMBattleMoves.prototype.maxItems =
        function() {

            var pokemon =
                GM.Battle.playerPokemon;


            if (
                !pokemon ||
                !pokemon.moves
            ) {

                return 0;

            }


            return pokemon.moves.length;

        };


    Window_GMBattleMoves.prototype.moveInstance =
        function() {

            var pokemon =
                GM.Battle.playerPokemon;


            if (
                !pokemon ||
                !pokemon.moves
            ) {

                return null;

            }


            return (
                pokemon.moves[
                    this.index()
                ] ||
                null
            );

        };


    Window_GMBattleMoves.prototype.isCurrentItemEnabled =
        function() {

            var move =
                this.moveInstance();


            return (
                move &&
                move.currentPP > 0
            );

        };


    Window_GMBattleMoves.prototype.drawItem =
        function(index) {

            var pokemon =
                GM.Battle.playerPokemon;


            if (
                !pokemon ||
                !pokemon.moves
            ) {

                return;

            }


            var instance =
                pokemon.moves[index];


            if (!instance) {

                return;

            }


            var data =
                GM.getMove(
                    instance.id
                );


            if (!data) {

                return;

            }


            var rect =
                this.itemRectForText(
                    index
                );


            this.changePaintOpacity(
                instance.currentPP > 0
            );


            this.drawText(
                data.name,
                rect.x,
                rect.y,
                rect.width - 170
            );


            this.drawText(
                'PP ' +
                instance.currentPP +
                '/' +
                instance.maxPP,
                rect.x,
                rect.y,
                rect.width - 10,
                'right'
            );


            this.changePaintOpacity(true);

        };


    // =========================================================
    // ESCENA
    // =========================================================

    function Scene_GranadaMonBattle() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_GranadaMonBattle.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );

    Scene_GranadaMonBattle.prototype.constructor =
        Scene_GranadaMonBattle;


    Scene_GranadaMonBattle.prototype.initialize =
        function() {

            Scene_MenuBase.prototype.initialize.call(
                this
            );

            this._battleEnded =
                false;

        };


    Scene_GranadaMonBattle.prototype.create =
        function() {

            Scene_MenuBase.prototype.create.call(
                this
            );


            this.createTitleWindow();

            this.createFieldWindow();

            this.createLogWindow();

            this.createCommandWindow();

            this.createMoveWindow();


            this._logWindow.setText(
                '¡Ha aparecido un ' +
                GM.Battle.enemy.name +
                ' salvaje!'
            );

        };


    // =========================================================
    // CREAR VENTANAS
    // =========================================================

    Scene_GranadaMonBattle.prototype.createTitleWindow =
        function() {

            this._titleWindow =
                new Window_GMBattleTitle();

            this.addWindow(
                this._titleWindow
            );

        };


    Scene_GranadaMonBattle.prototype.createFieldWindow =
        function() {

            var y =
                this._titleWindow.height;


            var commandHeight =
                72;


            var logHeight =
                108;


            var height =
                Graphics.boxHeight -
                y -
                commandHeight -
                logHeight;


            this._fieldWindow =
                new Window_GMBattleField(
                    0,
                    y,
                    Graphics.boxWidth,
                    height
                );


            this.addWindow(
                this._fieldWindow
            );

        };


    Scene_GranadaMonBattle.prototype.createLogWindow =
        function() {

            var y =
                this._titleWindow.height +
                this._fieldWindow.height;


            this._logWindow =
                new Window_GMBattleLog(
                    0,
                    y,
                    Graphics.boxWidth,
                    108
                );


            this.addWindow(
                this._logWindow
            );

        };


    Scene_GranadaMonBattle.prototype.createCommandWindow =
        function() {

            var y =
                Graphics.boxHeight -
                72;


            this._commandWindow =
                new Window_GMBattleCommand(
                    0,
                    y
                );


            this._commandWindow.setHandler(
                'fight',
                this.commandFight.bind(this)
            );


            this._commandWindow.setHandler(
                'bag',
                this.commandBag.bind(this)
            );


            this._commandWindow.setHandler(
                'pokemon',
                this.commandPokemon.bind(this)
            );


            this._commandWindow.setHandler(
                'run',
                this.commandRun.bind(this)
            );


            this.addWindow(
                this._commandWindow
            );


            this._commandWindow.activate();

            this._commandWindow.select(0);

        };


    Scene_GranadaMonBattle.prototype.createMoveWindow =
        function() {

            var width =
                Graphics.boxWidth;


            var height =
                Math.min(
                    4 * 48 + 36,
                    Graphics.boxHeight / 2
                );


            var y =
                Graphics.boxHeight -
                height;


            this._moveWindow =
                new Window_GMBattleMoves(
                    0,
                    y,
                    width,
                    height
                );


            this._moveWindow.setHandler(
                'ok',
                this.onMoveOk.bind(this)
            );


            this._moveWindow.setHandler(
                'cancel',
                this.onMoveCancel.bind(this)
            );


            this.addWindow(
                this._moveWindow
            );

        };


    // =========================================================
    // LUCHAR
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandFight =
        function() {

            this._commandWindow.deactivate();

            this._moveWindow.refresh();

            this._moveWindow.show();

            this._moveWindow.activate();

            this._moveWindow.select(0);

        };


    Scene_GranadaMonBattle.prototype.onMoveCancel =
        function() {

            this._moveWindow.hide();

            this._moveWindow.deactivate();

            this._moveWindow.deselect();

            this._commandWindow.activate();

        };


    // =========================================================
    // MOVIMIENTO ELEGIDO
    // =========================================================

    Scene_GranadaMonBattle.prototype.onMoveOk =
        function() {

            var instance =
                this._moveWindow
                    .moveInstance();


            if (
                !instance ||
                instance.currentPP <= 0
            ) {

                SoundManager.playBuzzer();

                this._moveWindow.activate();

                return;

            }


            var move =
                GM.getMove(
                    instance.id
                );


            if (!move) {

                SoundManager.playBuzzer();

                this._moveWindow.activate();

                return;

            }


            this._moveWindow.hide();

            this._moveWindow.deactivate();


            this.executeTurn(
                instance,
                move
            );

        };


    // =========================================================
    // MOVIMIENTO RIVAL
    // =========================================================

    Scene_GranadaMonBattle.prototype.enemyMove =
        function() {

            var enemy =
                GM.Battle.enemy;


            if (
                !enemy ||
                !enemy.moves
            ) {

                return null;

            }


            var usable =
                [];


            for (
                var i = 0;
                i < enemy.moves.length;
                i++
            ) {

                if (
                    enemy.moves[i] &&
                    enemy.moves[i].currentPP > 0
                ) {

                    usable.push(
                        enemy.moves[i]
                    );

                }

            }


            if (
                usable.length === 0
            ) {

                return null;

            }


            return usable[
                Math.floor(
                    Math.random() *
                    usable.length
                )
            ];

        };


    // =========================================================
    // TURNO COMPLETO
    // =========================================================

    Scene_GranadaMonBattle.prototype.executeTurn =
        function(
            playerInstance,
            playerMove
        ) {

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


            var order;


            if (!enemyMove) {

                order =
                    -1;

            }

            else {

                order =
                    GM.compareTurnOrder(
                        player,
                        playerMove,
                        enemy,
                        enemyMove
                    );

            }


            var messages =
                [];


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
                    enemy.hp > 0 &&
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
                    player.hp > 0
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


            this._fieldWindow.refresh();


            this._logWindow.setText(
                messages.join('\n')
            );


            if (
                enemy.hp <= 0
            ) {

                this.winBattle();

                return;

            }


            if (
                player.hp <= 0
            ) {

                this.loseCurrentPokemon();

                return;

            }


            this._commandWindow.activate();

            this._commandWindow.select(0);

        };


    // =========================================================
    // EJECUTAR MOVIMIENTO
    // =========================================================

    Scene_GranadaMonBattle.prototype.performMove =
        function(
            attacker,
            defender,
            instance,
            move,
            messages
        ) {

            if (
                !instance ||
                !move
            ) {

                return;

            }


            GM.useMovePP(
                instance
            );


            messages.push(
                attacker.name +
                ' usa ' +
                move.name +
                '.'
            );


            var result =
                GM.calculateDamage(
                    attacker,
                    defender,
                    move
                );


            if (
                !result.hit
            ) {

                messages.push(
                    '¡El ataque ha fallado!'
                );

                return;

            }


            if (
                result.damage > 0
            ) {

                GM.applyDamage(
                    defender,
                    result.damage
                );

            }


            if (
                result.critical
            ) {

                messages.push(
                    '¡Golpe crítico!'
                );

            }


            if (
                result.message
            ) {

                messages.push(
                    result.message
                );

            }


            if (
                defender.hp <= 0
            ) {

                messages.push(
                    defender.name +
                    ' se ha debilitado.'
                );

            }

        };


    // =========================================================
    // GANAR
    // =========================================================

    Scene_GranadaMonBattle.prototype.winBattle =
        function() {

            this._battleEnded =
                true;


            GM.Battle.result =
                'WIN';


            this._logWindow.setText(
                GM.Battle.enemy.name +
                ' se ha debilitado.\n¡Has ganado el combate!'
            );


            this._commandWindow.deactivate();


            setTimeout(
                function() {

                    SceneManager.pop();

                },
                1000
            );

        };


    // =========================================================
    // POKÉMON DEL JUGADOR DEBILITADO
    // =========================================================

    Scene_GranadaMonBattle.prototype.loseCurrentPokemon =
        function() {

            var next =
                GM.Battle.firstUsablePokemon();


            if (
                next &&
                next !==
                GM.Battle.playerPokemon
            ) {

                GM.Battle.playerPokemon =
                    next;


                GM.resetBattleStages(
                    next
                );


                GM.Battle.ensureUsableMove(
                    next
                );


                this._fieldWindow.refresh();


                this._logWindow.setText(
                    '¡Adelante, ' +
                    next.name +
                    '!'
                );


                this._commandWindow.activate();

                return;

            }


            this.loseBattle();

        };


    // =========================================================
    // DERROTA
    // =========================================================

    Scene_GranadaMonBattle.prototype.loseBattle =
        function() {

            this._battleEnded =
                true;


            GM.Battle.result =
                'LOSE';


            this._logWindow.setText(
                'Todos tus Pokémon se han debilitado.'
            );


            this._commandWindow.deactivate();


            setTimeout(
                function() {

                    SceneManager.pop();

                },
                1000
            );

        };


    // =========================================================
    // MOCHILA
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandBag =
        function() {

            SoundManager.playBuzzer();


            this._logWindow.setText(
                'La Mochila durante combate se conectará en el siguiente paso.'
            );


            this._commandWindow.activate();

        };


    // =========================================================
    // CAMBIO DE POKÉMON
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandPokemon =
        function() {

            SoundManager.playBuzzer();


            this._logWindow.setText(
                'El cambio de Pokémon durante combate se conectará en el siguiente paso.'
            );


            this._commandWindow.activate();

        };


    // =========================================================
    // HUIR
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandRun =
        function() {

            var player =
                GM.Battle.playerPokemon;

            var enemy =
                GM.Battle.enemy;


            var chance =
                0.5;


            if (
                GM.effectiveSpeed(player) >
                GM.effectiveSpeed(enemy)
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


                this._logWindow.setText(
                    '¡Has escapado!'
                );


                this._commandWindow.deactivate();


                setTimeout(
                    function() {

                        SceneManager.pop();

                    },
                    700
                );

            }

            else {

                this._logWindow.setText(
                    '¡No has podido escapar!'
                );


                this.enemyFreeTurn();

            }

        };


    // =========================================================
    // ATAQUE RIVAL TRAS FALLAR HUIDA
    // =========================================================

    Scene_GranadaMonBattle.prototype.enemyFreeTurn =
        function() {

            var enemyInstance =
                this.enemyMove();


            if (!enemyInstance) {

                this._commandWindow.activate();

                return;

            }


            var move =
                GM.getMove(
                    enemyInstance.id
                );


            var messages =
                [];


            this.performMove(
                GM.Battle.enemy,
                GM.Battle.playerPokemon,
                enemyInstance,
                move,
                messages
            );


            this._fieldWindow.refresh();


            this._logWindow.setText(
                messages.join('\n')
            );


            if (
                GM.Battle.playerPokemon.hp <=
                0
            ) {

                this.loseCurrentPokemon();

                return;

            }


            this._commandWindow.activate();

        };


    // =========================================================
    // EVENTO
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
                command ===
                'GranadaMonBattle'
            ) {

                var nationalDex =
                    Number(
                        args[0] || 0
                    );


                var level =
                    Number(
                        args[1] || 5
                    );


                GM.Battle.startWildBattle(
                    nationalDex,
                    level
                );

            }

        };


    // =========================================================
    // PÚBLICO
    // =========================================================

    window.Scene_GranadaMonBattle =
        Scene_GranadaMonBattle;


    console.log(
        'GranadaMon Battle v1.0 cargado.'
    );

})();