/*:
 * @plugindesc v1.0 GranadaMon - Cambio de Pokemon durante el combate
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleParty.js
 * ------------------------------------------------------------
 * REQUIERE:
 * GranadaMon_Battle.js
 * GranadaMon_BattleUI.js
 *
 * FUNCIONES:
 * - Conecta el botón POKÉMON durante el combate.
 * - Muestra los Pokémon del equipo.
 * - No permite elegir al Pokémon que ya está combatiendo.
 * - No permite elegir Pokémon debilitados.
 * - Cambiar de Pokémon consume el turno.
 * - El rival ataca después del cambio.
 * - Actualiza HUD, sprite provisional y movimientos.
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
        !GM.Battle ||
        typeof Scene_GranadaMonBattle ===
        'undefined'
    ) {

        throw new Error(
            'GranadaMon_BattleParty necesita GranadaMon_Battle.js.'
        );

    }


    GM.BattleParty =
        GM.BattleParty || {};


    GM.BattleParty.version =
        '1.0';


    // =========================================================
    // EQUIPO
    // =========================================================

    GM.BattleParty.party =
        function() {

            if (!$gameSystem) {

                return [];

            }


            if (
                !$gameSystem
                    ._granadaMonParty
            ) {

                $gameSystem
                    ._granadaMonParty =
                    [];

            }


            return $gameSystem
                ._granadaMonParty;

        };


    // =========================================================
    // ¿SE PUEDE SACAR ESTE POKÉMON?
    // =========================================================

    GM.BattleParty.isUsableSwitch =
        function(pokemon) {

            if (!pokemon) {

                return false;

            }


            // Ya está combatiendo

            if (
                pokemon ===
                GM.Battle.playerPokemon
            ) {

                return false;

            }


            // Debilitado

            if (
                Number(
                    pokemon.hp || 0
                ) <= 0
            ) {

                return false;

            }


            return true;

        };


    // =========================================================
    // ¿HAY ALGÚN OTRO POKÉMON?
    // =========================================================

    GM.BattleParty.hasAlternative =
        function() {

            var party =
                GM.BattleParty.party();


            for (
                var i = 0;
                i < party.length;
                i++
            ) {

                if (
                    GM.BattleParty
                        .isUsableSwitch(
                            party[i]
                        )
                ) {

                    return true;

                }

            }


            return false;

        };


    // =========================================================
    // TEXTO DE ESTADO
    // =========================================================

    GM.BattleParty.statusText =
        function(pokemon) {

            if (
                !pokemon ||
                !pokemon.status
            ) {

                return '';

            }


            var status =
                String(
                    pokemon.status
                ).toLowerCase();


            var names = {

                poison:
                    'ENV',

                paralysis:
                    'PAR',

                sleep:
                    'DOR',

                freeze:
                    'CON',

                burn:
                    'QUE'

            };


            return (
                names[
                    status
                ] ||
                String(
                    pokemon.status
                ).toUpperCase()
            );

        };


    // =========================================================
    // VENTANA DEL EQUIPO DURANTE EL COMBATE
    // =========================================================

    function Window_GMBattlePartyList() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattlePartyList.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GMBattlePartyList.prototype.constructor =
        Window_GMBattlePartyList;


    Window_GMBattlePartyList.prototype.initialize =
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


    Window_GMBattlePartyList.prototype.maxItems =
        function() {

            return GM.BattleParty
                .party()
                .length;

        };


    Window_GMBattlePartyList.prototype.itemHeight =
        function() {

            return 66;

        };


    Window_GMBattlePartyList.prototype.pokemon =
        function() {

            var party =
                GM.BattleParty.party();


            return (
                party[
                    this.index()
                ] ||
                null
            );

        };


    Window_GMBattlePartyList.prototype.isCurrentItemEnabled =
        function() {

            return GM.BattleParty
                .isUsableSwitch(
                    this.pokemon()
                );

        };


    // =========================================================
    // DIBUJAR POKÉMON
    // =========================================================

    Window_GMBattlePartyList.prototype.drawItem =
        function(index) {

            var party =
                GM.BattleParty.party();


            var mon =
                party[index];


            if (!mon) {

                return;

            }


            var rect =
                this.itemRectForText(
                    index
                );


            var enabled =
                GM.BattleParty
                    .isUsableSwitch(
                        mon
                    );


            var current =
                mon ===
                GM.Battle.playerPokemon;


            var fainted =
                Number(
                    mon.hp || 0
                ) <= 0;


            this.changePaintOpacity(
                enabled
            );


            var slotWidth =
                54;


            var nameX =
                rect.x +
                slotWidth;


            var nameWidth =
                Math.floor(
                    rect.width *
                    0.34
                );


            var levelWidth =
                100;


            var hpWidth =
                Math.floor(
                    rect.width *
                    0.25
                );


            var statusWidth =

                rect.width -

                slotWidth -

                nameWidth -

                levelWidth -

                hpWidth -

                12;


            // =================================================
            // NÚMERO
            // =========================================================

            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                String(
                    index + 1
                ),

                rect.x,
                rect.y,

                slotWidth - 8,

                'center'

            );


            this.resetTextColor();


            // =================================================
            // NOMBRE
            // =========================================================

            this.drawText(

                mon.name ||
                'Pokémon',

                nameX,
                rect.y,

                nameWidth

            );


            // =================================================
            // NIVEL
            // =========================================================

            this.drawText(

                'Nv. ' +
                Number(
                    mon.level || 1
                ),

                nameX +
                nameWidth,

                rect.y,

                levelWidth

            );


            // =================================================
            // PS
            // =========================================================

            this.drawText(

                'PS ' +
                Number(
                    mon.hp || 0
                ) +
                '/' +
                Number(
                    mon.maxHp || 0
                ),

                nameX +
                nameWidth +
                levelWidth,

                rect.y,

                hpWidth

            );


            // =================================================
            // ESTADO
            // =========================================================

            var state =
                '';


            if (
                current
            ) {

                state =
                    'EN COMBATE';

            }

            else if (
                fainted
            ) {

                state =
                    'DEBILITADO';

            }

            else {

                state =
                    GM.BattleParty
                        .statusText(
                            mon
                        );

            }


            this.drawText(

                state,

                rect.x +
                rect.width -
                statusWidth,

                rect.y,

                statusWidth,

                'right'

            );


            this.changePaintOpacity(
                true
            );

        };


    Window_GMBattlePartyList.prototype.refresh =
        function() {

            this.createContents();

            this.drawAllItems();

        };


    // =========================================================
    // CREAR LA VENTANA EN LA BATALLA
    // =========================================================

    var _GMBattleParty_create =
        Scene_GranadaMonBattle
            .prototype
            .create;


    Scene_GranadaMonBattle.prototype.create =
        function() {

            _GMBattleParty_create.call(
                this
            );


            this.createGMBattlePartyWindow();


            this._gmSwitchingPokemon =
                false;

        };


    Scene_GranadaMonBattle.prototype.createGMBattlePartyWindow =
        function() {

            var width =
                Math.floor(
                    Graphics.boxWidth *
                    0.84
                );


            var height =
                Math.min(

                    Graphics.boxHeight -
                    120,

                    6 *
                    66 +
                    72

                );


            var x =
                Math.floor(

                    (
                        Graphics.boxWidth -
                        width
                    ) /
                    2

                );


            var y =
                Math.floor(

                    (
                        Graphics.boxHeight -
                        height
                    ) /
                    2

                );


            this._gmBattlePartyWindow =
                new Window_GMBattlePartyList(

                    x,
                    y,
                    width,
                    height

                );


            this._gmBattlePartyWindow.setHandler(

                'ok',

                this.onGMBattlePartyOk.bind(
                    this
                )

            );


            this._gmBattlePartyWindow.setHandler(

                'cancel',

                this.onGMBattlePartyCancel.bind(
                    this
                )

            );


            this.addWindow(
                this._gmBattlePartyWindow
            );

        };


    // =========================================================
    // BOTÓN POKÉMON
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandPokemon =
        function() {

            // =================================================
            // NO HAY OTRO DISPONIBLE
            // =========================================================

            if (
                !GM.BattleParty
                    .hasAlternative()
            ) {

                SoundManager.playBuzzer();


                this._logWindow.setText(
                    'No tienes otro Pokémon disponible para combatir.'
                );


                this._commandWindow.activate();


                return;

            }


            // =================================================
            // ABRIR EQUIPO
            // =========================================================

            this._commandWindow.deactivate();


            if (
                this._moveWindow
            ) {

                this._moveWindow.hide();

                this._moveWindow.deactivate();

            }


            if (
                this._gmBallWindow
            ) {

                this._gmBallWindow.hide();

                this._gmBallWindow.deactivate();

            }


            this._logWindow.setText(
                'Elige el Pokémon que quieres sacar.'
            );


            this._gmBattlePartyWindow.refresh();

            this._gmBattlePartyWindow.show();

            this._gmBattlePartyWindow.activate();


            // =================================================
            // SELECCIONAR AUTOMÁTICAMENTE EL PRIMERO DISPONIBLE
            // =========================================================

            var party =
                GM.BattleParty.party();


            var firstUsable =
                0;


            for (
                var i = 0;
                i < party.length;
                i++
            ) {

                if (
                    GM.BattleParty
                        .isUsableSwitch(
                            party[i]
                        )
                ) {

                    firstUsable =
                        i;

                    break;

                }

            }


            this._gmBattlePartyWindow.select(
                firstUsable
            );

        };


    // =========================================================
    // CANCELAR
    // =========================================================

    Scene_GranadaMonBattle.prototype.onGMBattlePartyCancel =
        function() {

            this._gmBattlePartyWindow.hide();

            this._gmBattlePartyWindow.deactivate();

            this._gmBattlePartyWindow.deselect();


            this._logWindow.setText(

                '¿Qué hará ' +
                GM.Battle.playerPokemon.name +
                '?'

            );


            this._commandWindow.activate();

        };


    // =========================================================
    // CONFIRMAR CAMBIO
    // =========================================================

    Scene_GranadaMonBattle.prototype.onGMBattlePartyOk =
        function() {

            if (
                this._gmSwitchingPokemon
            ) {

                return;

            }


            var pokemon =
                this._gmBattlePartyWindow
                    .pokemon();


            if (
                !GM.BattleParty
                    .isUsableSwitch(
                        pokemon
                    )
            ) {

                SoundManager.playBuzzer();


                this._gmBattlePartyWindow.activate();


                return;

            }


            this._gmSwitchingPokemon =
                true;


            this._gmBattlePartyWindow.hide();

            this._gmBattlePartyWindow.deactivate();

            this._gmBattlePartyWindow.deselect();


            this.executeGMPokemonSwitch(
                pokemon
            );

        };


    // =========================================================
    // REALIZAR CAMBIO
    // =========================================================

    Scene_GranadaMonBattle.prototype.executeGMPokemonSwitch =
        function(
            nextPokemon
        ) {

            var oldPokemon =
                GM.Battle.playerPokemon;


            if (
                !nextPokemon ||
                nextPokemon === oldPokemon
            ) {

                this._gmSwitchingPokemon =
                    false;


                this._commandWindow.activate();


                return;

            }


            // =================================================
            // REINICIAR MODIFICADORES DEL POKÉMON QUE SALE
            // =========================================================

            if (
                GM.resetBattleStages &&
                oldPokemon
            ) {

                GM.resetBattleStages(
                    oldPokemon
                );

            }


            // =================================================
            // REINICIAR MODIFICADORES DEL QUE ENTRA
            // =========================================================

            if (
                GM.resetBattleStages
            ) {

                GM.resetBattleStages(
                    nextPokemon
                );

            }


            // =================================================
            // ASEGURAR MOVIMIENTOS
            // =========================================================

            if (
                GM.Battle.ensureUsableMove
            ) {

                GM.Battle.ensureUsableMove(
                    nextPokemon
                );

            }


            // =================================================
            // CAMBIAR POKÉMON ACTIVO
            // =========================================================

            GM.Battle.playerPokemon =
                nextPokemon;


            // =================================================
            // ACTUALIZAR PANTALLA
            // =========================================================

            this.refreshGMSwitchedPokemonVisual();


            this._logWindow.setText(

                '¡Adelante, ' +
                nextPokemon.name +
                '!'

            );


            // =================================================
            // CAMBIAR CONSUME EL TURNO
            // =========================================================
            //
            // El Pokémon salvaje ataca después.
            //
            // =========================================================

            var scene =
                this;


            setTimeout(

                function() {

                    if (
                        SceneManager._scene !==
                        scene
                    ) {

                        return;

                    }


                    scene._gmSwitchingPokemon =
                        false;


                    scene.enemyFreeTurn();

                },

                550

            );

        };


    // =========================================================
    // ACTUALIZAR HUD / SPRITE / MOVIMIENTOS
    // =========================================================

    Scene_GranadaMonBattle.prototype.refreshGMSwitchedPokemonVisual =
        function() {

            var pokemon =
                GM.Battle.playerPokemon;


            // =================================================
            // SPRITE PROVISIONAL
            // =========================================================
            //
            // Más adelante esto actualizará el sprite real
            // trasero del Pokémon.
            //
            // =========================================================

            if (
                this._playerPokemonSprite
            ) {

                this._playerPokemonSprite._pokemon =
                    pokemon;


                this._playerPokemonSprite.visible =
                    true;


                this._playerPokemonSprite.alpha =
                    1;


                if (
                    this._playerPokemonSprite.refresh
                ) {

                    this._playerPokemonSprite.refresh();

                }

            }


            // =================================================
            // HUD
            // =========================================================

            if (
                this._playerStatusWindow
            ) {

                this._playerStatusWindow.refresh();

            }


            if (
                this._enemyStatusWindow
            ) {

                this._enemyStatusWindow.refresh();

            }


            // =================================================
            // MOVIMIENTOS
            // =========================================================

            if (
                this._moveWindow
            ) {

                this._moveWindow.refresh();

            }


            // =================================================
            // REFRESCO GENERAL
            // =========================================================

            if (
                this.refreshBattleUI
            ) {

                this.refreshBattleUI();

            }

        };


    // =========================================================
    // CARGADO
    // =========================================================

    console.log(
        'GranadaMon BattleParty v1.0 cargado correctamente.'
    );

})();