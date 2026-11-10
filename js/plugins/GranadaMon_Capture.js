/*:
 * @plugindesc v1.4 GranadaMon - Captura Pokemon + Poké Balls PNG
 * @author OpenAI
 *
 * @help
 * GranadaMon_Capture.js
 * ------------------------------------------------------------
 *
 * REQUIERE:
 * GranadaMon_Bag
 * GranadaMon_Battle
 * GranadaMon_BattleUI
 *
 * Utiliza los mismos PNG que la Mochila:
 *
 * GM_Ball_Poke.png
 * GM_Ball_Super.png
 * GM_Ball_Ultra.png
 * GM_Ball_Master.png
 *
 * La misma imagen se utiliza:
 *
 * - Mochila general
 * - Mochila durante combate
 * - Lanzamiento
 * - Caída
 * - Sacudidas
 */

(function() {

    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;


    // =========================================================
    // COMPROBACIÓN
    // =========================================================

    if (

        !GM.Battle ||
        !GM.Bag ||
        !GM.BallVisuals ||
        !GM.itemsInCategory ||
        !GM.getItemQuantity ||
        !GM.loseItem

    ) {

        throw new Error(
            'GranadaMon_Capture necesita GranadaMon_Bag y GranadaMon_Battle.'
        );

    }


    if (
        typeof Scene_GranadaMonBattle ===
        'undefined'
    ) {

        throw new Error(
            'GranadaMon_Capture necesita GranadaMon_Battle.js.'
        );

    }


    GM.Capture =
        GM.Capture || {};


    GM.Capture.version =
        '1.4';


    // =========================================================
    // MULTIPLICADOR BALL
    // =========================================================

    GM.Capture.ballMultiplier =
        function(ballKey) {

            ballKey =
                String(
                    ballKey || ''
                ).toUpperCase();


            if (
                ballKey ===
                'SUPER_BALL'
            ) {

                return 1.5;

            }


            if (
                ballKey ===
                'ULTRA_BALL'
            ) {

                return 2.0;

            }


            if (
                ballKey ===
                'MASTER_BALL'
            ) {

                return Infinity;

            }


            return 1.0;

        };


    // =========================================================
    // CATCH RATE
    // =========================================================

    GM.Capture.catchRates = {

        25: 190,
        172: 190,
        26: 75,

        4: 45,
        5: 45,
        6: 45,

        7: 45,
        8: 45,
        9: 45,

        129: 255,
        130: 45,

        133: 45,

        147: 45,
        148: 45,
        149: 45,

        246: 45,
        247: 45,
        248: 45

    };


    GM.Capture.getCatchRate =
        function(pokemon) {

            if (!pokemon) {

                return 120;

            }


            var species =
                GM.getSpecies
                    ? GM.getSpecies(
                        pokemon.speciesId
                    )
                    : null;


            if (
                species &&
                species.catchRate != null
            ) {

                return Number(
                    species.catchRate
                );

            }


            var national =
                Number(
                    pokemon.speciesId || 0
                );


            if (
                GM.Capture.catchRates[
                    national
                ] != null
            ) {

                return Number(
                    GM.Capture.catchRates[
                        national
                    ]
                );

            }


            return 120;

        };


    // =========================================================
    // ESTADO
    // =========================================================

    GM.Capture.statusMultiplier =
        function(pokemon) {

            if (
                !pokemon ||
                !pokemon.status
            ) {

                return 1;

            }


            var status =
                String(
                    pokemon.status
                ).toLowerCase();


            if (
                status === 'sleep' ||
                status === 'freeze'
            ) {

                return 2.5;

            }


            if (

                status === 'paralysis' ||
                status === 'poison' ||
                status === 'burn'

            ) {

                return 1.5;

            }


            return 1;

        };


    // =========================================================
    // CÁLCULO DE CAPTURA
    // =========================================================

    GM.Capture.calculate =
        function(
            pokemon,
            ballKey
        ) {

            var result = {

                captured:
                    false,

                shakes:
                    0

            };


            if (!pokemon) {

                return result;

            }


            ballKey =
                String(
                    ballKey || ''
                ).toUpperCase();


            // MASTER BALL

            if (
                ballKey ===
                'MASTER_BALL'
            ) {

                result.captured =
                    true;

                result.shakes =
                    3;

                return result;

            }


            var maxHp =
                Math.max(
                    1,
                    Number(
                        pokemon.maxHp || 1
                    )
                );


            var hp =
                Math.max(
                    1,
                    Number(
                        pokemon.hp || 1
                    )
                );


            var catchRate =
                GM.Capture.getCatchRate(
                    pokemon
                );


            var ballBonus =
                GM.Capture.ballMultiplier(
                    ballKey
                );


            var statusBonus =
                GM.Capture.statusMultiplier(
                    pokemon
                );


            var a =

                (
                    (
                        3 * maxHp -
                        2 * hp
                    ) *

                    catchRate *

                    ballBonus

                ) /

                (
                    3 * maxHp
                );


            a *=
                statusBonus;


            a =
                Math.floor(
                    a
                );


            a =
                Math.max(
                    1,
                    Math.min(
                        255,
                        a
                    )
                );


            if (
                a >= 255
            ) {

                result.captured =
                    true;

                result.shakes =
                    3;

                return result;

            }


            var b =
                Math.floor(

                    1048560 /

                    Math.sqrt(

                        Math.sqrt(

                            16711680 /
                            a

                        )

                    )

                );


            b =
                Math.max(
                    0,
                    Math.min(
                        65535,
                        b
                    )
                );


            var successes =
                0;


            for (
                var i = 0;
                i < 4;
                i++
            ) {

                var roll =
                    Math.floor(
                        Math.random() *
                        65536
                    );


                if (
                    roll < b
                ) {

                    successes++;

                }

                else {

                    break;

                }

            }


            if (
                successes >= 4
            ) {

                result.captured =
                    true;

                result.shakes =
                    3;

            }

            else {

                result.shakes =
                    Math.min(
                        successes,
                        3
                    );

            }


            return result;

        };


    // =========================================================
    // GUARDAR CAPTURADO
    // =========================================================

    GM.Capture.storeCapturedPokemon =
        function(pokemon) {

            if (!pokemon) {

                return null;

            }


            if (
                GM.resetBattleStages
            ) {

                GM.resetBattleStages(
                    pokemon
                );

            }


            if (
                !$gameSystem._granadaMonParty
            ) {

                $gameSystem._granadaMonParty =
                    [];

            }


            if (
                !$gameSystem._granadaMonStorage
            ) {

                $gameSystem._granadaMonStorage =
                    [];

            }


            var destination =

                $gameSystem
                    ._granadaMonParty
                    .length < 6

                    ? 'PARTY'

                    : 'STORAGE';


            if (
                GM.addPokemon
            ) {

                GM.addPokemon(
                    pokemon
                );

            }

            else {

                if (
                    destination ===
                    'PARTY'
                ) {

                    $gameSystem
                        ._granadaMonParty
                        .push(
                            pokemon
                        );

                }

                else {

                    $gameSystem
                        ._granadaMonStorage
                        .push(
                            pokemon
                        );

                }


                if (
                    GM.markCaught
                ) {

                    GM.markCaught(
                        pokemon.speciesId
                    );

                }

            }


            return destination;

        };


    // =========================================================
    // BALLS DE LA MOCHILA
    // =========================================================

    GM.Capture.getBagBalls =
        function() {

            var balls =
                GM.itemsInCategory(
                    GM.BagCategory.BALL
                ) || [];


            var result =
                [];


            for (
                var i = 0;
                i < balls.length;
                i++
            ) {

                var item =
                    balls[i];


                if (
                    item &&
                    GM.getItemQuantity(
                        item.key
                    ) > 0
                ) {

                    result.push(
                        item
                    );

                }

            }


            return result;

        };


    // =========================================================
    // VENTANA BALLS
    // =========================================================

    function Window_GMBattleBallList() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleBallList.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GMBattleBallList.prototype.constructor =
        Window_GMBattleBallList;


    Window_GMBattleBallList.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._data =
                [];


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


    Window_GMBattleBallList.prototype.makeItemList =
        function() {

            this._data =
                GM.Capture.getBagBalls();

        };


    Window_GMBattleBallList.prototype.maxItems =
        function() {

            return Math.max(
                (this._data || []).length,
                1
            );

        };


    Window_GMBattleBallList.prototype.item =
        function() {

            var data =
                this._data || [];


            if (
                data.length === 0
            ) {

                return null;

            }


            return (
                data[
                    this.index()
                ] ||
                null
            );

        };


    Window_GMBattleBallList.prototype.isCurrentItemEnabled =
        function() {

            return !!this.item();

        };


    Window_GMBattleBallList.prototype.itemHeight =
        function() {

            return 72;

        };


    Window_GMBattleBallList.prototype.drawItem =
        function(index) {

            var rect =
                this.itemRectForText(
                    index
                );


            var item =
                (this._data || [])[index];


            if (!item) {

                if (
                    index === 0
                ) {

                    this.changePaintOpacity(
                        false
                    );


                    this.drawText(

                        'No tienes Poké Balls.',

                        rect.x,
                        rect.y,

                        rect.width,

                        'center'

                    );


                    this.changePaintOpacity(
                        true
                    );

                }


                return;

            }


            var self =
                this;


            // PNG REAL

            GM.BallVisuals.draw(

                this.contents,

                rect.x + 38,

                rect.y + 35,

                62,

                item.key,

                function() {

                    self.refresh();

                }

            );


            this.drawText(

                item.name,

                rect.x + 82,
                rect.y,

                rect.width - 230

            );


            this.drawText(

                '× ' +
                GM.getItemQuantity(
                    item.key
                ),

                rect.x,
                rect.y,

                rect.width - 15,

                'right'

            );

        };


    Window_GMBattleBallList.prototype.refresh =
        function() {

            this.makeItemList();

            this.createContents();

            this.drawAllItems();

        };


    // =========================================================
    // SPRITE REAL DE BALL
    // =========================================================

    GM.Capture.createBallSprite =
        function(ballKey) {

            var filename =
                GM.BallVisuals.filename(
                    ballKey
                );


            if (!filename) {

                filename =
                    GM.BallVisuals.filename(
                        'POKE_BALL'
                    );

            }


            var bitmap =
                ImageManager.loadPicture(
                    filename
                );


            var sprite =
                new Sprite(
                    bitmap
                );


            sprite.anchor.x =
                0.5;


            sprite.anchor.y =
                0.5;


            // Con PNG 256x256 esto da una Ball
            // de unos 75 px durante la captura.

            sprite.scale.x =
                0.30;


            sprite.scale.y =
                0.30;


            return sprite;

        };


    // =========================================================
    // CREAR VENTANA EN BATALLA
    // =========================================================

    var _GMCapture_create =
        Scene_GranadaMonBattle
            .prototype
            .create;


    Scene_GranadaMonBattle.prototype.create =
        function() {

            _GMCapture_create.call(
                this
            );


            this.createGMBallWindow();


            this._gmCaptureAnimation =
                null;


            this._gmCaptureFinishFrames =
                0;

        };


    Scene_GranadaMonBattle.prototype.createGMBallWindow =
        function() {

            var bottomHeight =
                205;


            var x =
                Math.floor(
                    Graphics.boxWidth *
                    0.52
                );


            var width =
                Graphics.boxWidth -
                x;


            this._gmBallWindow =
                new Window_GMBattleBallList(

                    x,

                    Graphics.boxHeight -
                    bottomHeight,

                    width,

                    bottomHeight

                );


            this._gmBallWindow.setHandler(

                'ok',

                this.onGMBallOk.bind(
                    this
                )

            );


            this._gmBallWindow.setHandler(

                'cancel',

                this.onGMBallCancel.bind(
                    this
                )

            );


            this.addWindow(
                this._gmBallWindow
            );

        };


    // =========================================================
    // MOCHILA
    // =========================================================

    Scene_GranadaMonBattle.prototype.commandBag =
        function() {

            this._commandWindow.deactivate();


            this._gmBallWindow.refresh();


            var balls =
                GM.Capture.getBagBalls();


            if (
                balls.length === 0
            ) {

                SoundManager.playBuzzer();


                this._logWindow.setText(
                    'No tienes ninguna Poké Ball.'
                );


                this._commandWindow.activate();

                return;

            }


            this._logWindow.setText(
                '¿Qué Poké Ball quieres usar?'
            );


            this._gmBallWindow.show();

            this._gmBallWindow.activate();

            this._gmBallWindow.select(0);

        };


    Scene_GranadaMonBattle.prototype.onGMBallCancel =
        function() {

            this._gmBallWindow.hide();

            this._gmBallWindow.deactivate();

            this._gmBallWindow.deselect();


            this._logWindow.setText(

                '¿Qué hará ' +
                GM.Battle.playerPokemon.name +
                '?'

            );


            this._commandWindow.activate();

        };


    // =========================================================
    // USAR BALL
    // =========================================================

    Scene_GranadaMonBattle.prototype.onGMBallOk =
        function() {

            var item =
                this._gmBallWindow.item();


            if (!item) {

                SoundManager.playBuzzer();

                this._gmBallWindow.activate();

                return;

            }


            if (
                GM.getItemQuantity(
                    item.key
                ) <= 0
            ) {

                SoundManager.playBuzzer();

                this._gmBallWindow.refresh();

                this._gmBallWindow.activate();

                return;

            }


            // Consumir la Ball REAL

            GM.loseItem(
                item.key,
                1
            );


            this._gmBallWindow.hide();

            this._gmBallWindow.deactivate();

            this._gmBallWindow.deselect();


            this._commandWindow.deactivate();


            var result =
                GM.Capture.calculate(

                    GM.Battle.enemy,

                    item.key

                );


            this.startGMCaptureAnimation(
                item,
                result
            );

        };


    // =========================================================
    // COMIENZO DE ANIMACIÓN
    // =========================================================

    Scene_GranadaMonBattle.prototype.startGMCaptureAnimation =
        function(
            item,
            result
        ) {

            var sprite =
                GM.Capture.createBallSprite(
                    item.key
                );


            sprite.x =
                Math.floor(
                    Graphics.boxWidth *
                    0.25
                );


            sprite.y =
                Math.floor(
                    Graphics.boxHeight *
                    0.62
                );


            this.addChild(
                sprite
            );


            this._logWindow.setText(

                '¡Has lanzado una ' +
                item.name +
                '!'

            );


            this._gmCaptureAnimation = {

                item:
                    item,

                result:
                    result,

                sprite:
                    sprite,

                phase:
                    'throw',

                frame:
                    0,

                shakeIndex:
                    0,

                startX:
                    sprite.x,

                startY:
                    sprite.y,

                targetX:
                    Math.floor(
                        Graphics.boxWidth *
                        0.73
                    ),

                targetY:
                    Math.floor(
                        Graphics.boxHeight *
                        0.29
                    ),

                groundY:
                    Math.floor(
                        Graphics.boxHeight *
                        0.455
                    )

            };

        };


    // =========================================================
    // UPDATE
    // =========================================================

    var _GMCapture_update =
        Scene_GranadaMonBattle
            .prototype
            .update;


    Scene_GranadaMonBattle.prototype.update =
        function() {

            _GMCapture_update.call(
                this
            );


            if (
                this._gmCaptureAnimation
            ) {

                this.updateGMCaptureAnimation();

            }


            if (
                this._gmCaptureFinishFrames >
                0
            ) {

                this._gmCaptureFinishFrames--;


                if (
                    this._gmCaptureFinishFrames ===
                    0
                ) {

                    SceneManager.pop();

                }

            }

        };


    // =========================================================
    // ANIMACIÓN COMPLETA
    // =========================================================

    Scene_GranadaMonBattle.prototype.updateGMCaptureAnimation =
        function() {

            var anim =
                this._gmCaptureAnimation;


            if (!anim) {

                return;

            }


            var ball =
                anim.sprite;


            anim.frame++;


            // =================================================
            // LANZAMIENTO
            // =========================================================

            if (
                anim.phase ===
                'throw'
            ) {

                var t =
                    Math.min(
                        1,
                        anim.frame /
                        32
                    );


                ball.x =

                    anim.startX +

                    (
                        anim.targetX -
                        anim.startX
                    ) *

                    t;


                ball.y =

                    anim.startY +

                    (
                        anim.targetY -
                        anim.startY
                    ) *

                    t -

                    Math.sin(
                        t *
                        Math.PI
                    ) *

                    170;


                ball.rotation +=
                    0.32;


                if (
                    anim.frame >=
                    32
                ) {

                    anim.phase =
                        'absorb';


                    anim.frame =
                        0;

                }


                return;

            }


            // =========================================================
            // ABSORCIÓN
            // =========================================================

            if (
                anim.phase ===
                'absorb'
            ) {

                var absorbT =
                    Math.min(
                        1,
                        anim.frame /
                        20
                    );


                if (
                    this._enemyPokemonSprite
                ) {

                    this._enemyPokemonSprite.alpha =
                        1 -
                        absorbT;


                    this._enemyPokemonSprite.scale.x =

                        0.92 *

                        (
                            1 -
                            absorbT *
                            0.80
                        );


                    this._enemyPokemonSprite.scale.y =

                        0.92 *

                        (
                            1 -
                            absorbT *
                            0.80
                        );

                }


                // Ball hace un pequeño destello de tamaño

                var pulse =
                    1 +
                    Math.sin(
                        absorbT *
                        Math.PI
                    ) *
                    0.25;


                ball.scale.x =
                    0.30 *
                    pulse;


                ball.scale.y =
                    0.30 *
                    pulse;


                if (
                    anim.frame >=
                    20
                ) {

                    if (
                        this._enemyPokemonSprite
                    ) {

                        this._enemyPokemonSprite.visible =
                            false;

                    }


                    ball.scale.x =
                        0.30;

                    ball.scale.y =
                        0.30;


                    anim.phase =
                        'drop';


                    anim.frame =
                        0;

                }


                return;

            }


            // =========================================================
            // CAÍDA
            // =========================================================

            if (
                anim.phase ===
                'drop'
            ) {

                var dropT =
                    Math.min(
                        1,
                        anim.frame /
                        22
                    );


                ball.y =

                    anim.targetY +

                    (
                        anim.groundY -
                        anim.targetY
                    ) *

                    dropT *
                    dropT;


                ball.rotation *=
                    0.90;


                if (
                    anim.frame >=
                    22
                ) {

                    ball.y =
                        anim.groundY;


                    ball.rotation =
                        0;


                    anim.phase =
                        'wait';


                    anim.frame =
                        0;

                }


                return;

            }


            // =========================================================
            // ESPERA
            // =========================================================

            if (
                anim.phase ===
                'wait'
            ) {

                if (
                    anim.frame >=
                    22
                ) {

                    anim.frame =
                        0;


                    if (
                        anim.result.shakes >
                        0
                    ) {

                        anim.phase =
                            'shake';

                    }

                    else {

                        anim.phase =
                            'break';

                    }

                }


                return;

            }


            // =========================================================
            // SACUDIDA
            // =========================================================

            if (
                anim.phase ===
                'shake'
            ) {

                var shakeProgress =
                    anim.frame /
                    26;


                ball.rotation =

                    Math.sin(

                        shakeProgress *
                        Math.PI *
                        2

                    ) *

                    0.25;


                ball.x =

                    anim.targetX +

                    Math.sin(

                        shakeProgress *
                        Math.PI *
                        2

                    ) *

                    8;


                if (
                    anim.frame >=
                    26
                ) {

                    ball.rotation =
                        0;


                    ball.x =
                        anim.targetX;


                    anim.shakeIndex++;


                    anim.frame =
                        0;


                    if (
                        anim.shakeIndex <
                        anim.result.shakes
                    ) {

                        anim.phase =
                            'shakePause';

                    }

                    else {

                        anim.phase =

                            anim.result.captured

                                ? 'capturePause'

                                : 'breakPause';

                    }

                }


                return;

            }


            // =========================================================
            // PAUSA ENTRE SACUDIDAS
            // =========================================================

            if (
                anim.phase ===
                'shakePause'
            ) {

                if (
                    anim.frame >=
                    18
                ) {

                    anim.frame =
                        0;


                    anim.phase =
                        'shake';

                }


                return;

            }


            // =========================================================
            // CAPTURA FINAL
            // =========================================================

            if (
                anim.phase ===
                'capturePause'
            ) {

                if (
                    anim.frame >=
                    28
                ) {

                    this.finishGMCaptureSuccess();

                }


                return;

            }


            // =========================================================
            // ESCAPE
            // =========================================================

            if (
                anim.phase ===
                'breakPause'
            ) {

                if (
                    anim.frame >=
                    20
                ) {

                    anim.phase =
                        'break';


                    anim.frame =
                        0;

                }


                return;

            }


            if (
                anim.phase ===
                'break'
            ) {

                this.finishGMCaptureFailure();

            }

        };


    // =========================================================
    // CAPTURA CORRECTA
    // =========================================================

    Scene_GranadaMonBattle.prototype.finishGMCaptureSuccess =
        function() {

            var anim =
                this._gmCaptureAnimation;


            if (!anim) {

                return;

            }


            var enemy =
                GM.Battle.enemy;


            var destination =
                GM.Capture.storeCapturedPokemon(
                    enemy
                );


            GM.Battle.result =
                'CAPTURE';


            this._battleEnded =
                true;


            if (
                destination ===
                'STORAGE'
            ) {

                this._logWindow.setText(

                    '¡Ya está! ¡' +
                    enemy.name +
                    ' ha sido capturado!\n' +
                    enemy.name +
                    ' fue enviado al Almacenamiento.'

                );

            }

            else {

                this._logWindow.setText(

                    '¡Ya está! ¡' +
                    enemy.name +
                    ' ha sido capturado!'

                );

            }


            SoundManager.playOk();


            anim.sprite.scale.x =
                0.34;


            anim.sprite.scale.y =
                0.34;


            this._gmCaptureAnimation =
                null;


            this._gmCaptureFinishFrames =
                110;

        };


    // =========================================================
    // CAPTURA FALLIDA
    // =========================================================

    Scene_GranadaMonBattle.prototype.finishGMCaptureFailure =
        function() {

            var anim =
                this._gmCaptureAnimation;


            if (!anim) {

                return;

            }


            if (
                anim.sprite &&
                anim.sprite.parent
            ) {

                anim.sprite.parent.removeChild(
                    anim.sprite
                );

            }


            if (
                this._enemyPokemonSprite
            ) {

                this._enemyPokemonSprite.visible =
                    true;


                this._enemyPokemonSprite.alpha =
                    1;


                this._enemyPokemonSprite.scale.x =
                    0.92;


                this._enemyPokemonSprite.scale.y =
                    0.92;

            }


            var shakes =
                Number(
                    anim.result.shakes || 0
                );


            var message;


            if (
                shakes === 0
            ) {

                message =
                    '¡Oh, no! ¡El Pokémon se ha escapado!';

            }

            else if (
                shakes === 1
            ) {

                message =
                    '¡Vaya! ¡Parecía que lo habías atrapado!';

            }

            else if (
                shakes === 2
            ) {

                message =
                    '¡Casi lo consigues!';

            }

            else {

                message =
                    '¡Qué pena! ¡Estaba a punto de ser capturado!';

            }


            this._logWindow.setText(
                message
            );


            this._gmCaptureAnimation =
                null;


            var scene =
                this;


            setTimeout(

                function() {

                    if (
                        SceneManager._scene ===
                        scene
                    ) {

                        scene.enemyFreeTurn();

                    }

                },

                650

            );

        };


    // =========================================================
    // COMPATIBILIDAD GranadaMonGiveBall
    // =========================================================

    var _GMCapture_pluginCommand =
        Game_Interpreter
            .prototype
            .pluginCommand;


    Game_Interpreter.prototype.pluginCommand =
        function(
            command,
            args
        ) {

            _GMCapture_pluginCommand.call(
                this,
                command,
                args
            );


            if (
                command ===
                'GranadaMonGiveBall'
            ) {

                var key =
                    String(
                        args[0] || ''
                    ).toUpperCase();


                var amount =
                    Number(
                        args[1] || 1
                    );


                var item =
                    GM.getItem(
                        key
                    );


                if (
                    !item ||
                    item.category !==
                    GM.BagCategory.BALL
                ) {

                    $gameMessage.add(
                        'Esa Poké Ball no existe.'
                    );

                    return;

                }


                GM.gainItem(
                    key,
                    amount
                );


                $gameMessage.add(

                    'Has recibido ' +
                    item.name +
                    ' ×' +
                    amount +
                    '.'

                );

            }

        };


    console.log(
        'GranadaMon Capture v1.4 cargado correctamente.'
    );

})();