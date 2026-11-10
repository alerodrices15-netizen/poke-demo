/*:
 * @plugindesc v1.2 GranadaMon - Interfaz de combate Pokémon a pantalla completa
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleUI.js
 * ------------------------------------------------------------
 * REQUIERE:
 * GranadaMon_Battle.js
 *
 * v1.2
 * - Pantalla de combate independiente del mapa.
 * - Fondo propio de batalla.
 * - Rival arriba/derecha.
 * - Pokémon jugador abajo/izquierda.
 * - HUD rival arriba/izquierda.
 * - HUD jugador derecha.
 * - Menú LUCHAR / MOCHILA / POKÉMON / HUIR.
 * - Movimientos 2x2 con tipo y PP.
 * - Texto inferior con salto de línea automático.
 * - Compatibilidad con las funciones internas de Battle.js.
 *
 * Los sprites actuales son placeholders temporales.
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
        typeof Scene_GranadaMonBattle ===
        'undefined'
    ) {

        throw new Error(
            'GranadaMon_BattleUI necesita GranadaMon_Battle.js encima.'
        );

    }


    GM.BattleUI =
        GM.BattleUI || {};

    GM.BattleUI.version =
        '1.2';


    // =========================================================
    // COLORES DE LOS TIPOS
    // =========================================================

    GM.BattleUI.typeColor =
        function(type) {

            var colors = {

                NORMAL:
                    '#A8A878',

                FUEGO:
                    '#F08030',

                AGUA:
                    '#6890F0',

                ELECTRICO:
                    '#E5BC24',

                PLANTA:
                    '#78C850',

                HIELO:
                    '#78C8C8',

                LUCHA:
                    '#C03028',

                VENENO:
                    '#A040A0',

                TIERRA:
                    '#D8B85B',

                VOLADOR:
                    '#9078D8',

                PSIQUICO:
                    '#F85888',

                BICHO:
                    '#A8B820',

                ROCA:
                    '#B8A038',

                FANTASMA:
                    '#705898',

                DRAGON:
                    '#7038F8',

                SINIESTRO:
                    '#705848',

                ACERO:
                    '#A0A0B8',

                HADA:
                    '#EE99AC'

            };


            return (

                colors[
                    String(
                        type || ''
                    ).toUpperCase()
                ] ||

                '#888888'

            );

        };


    // =========================================================
    // FONDO DE BATALLA
    // =========================================================
    //
    // Sustituye completamente la captura del mapa que normalmente
    // utiliza Scene_MenuBase.
    //
    // =========================================================

    Scene_GranadaMonBattle.prototype.createBackground =
        function() {

            var width =
                Graphics.boxWidth;

            var height =
                Graphics.boxHeight;


            var bitmap =
                new Bitmap(
                    width,
                    height
                );


            // =================================================
            // CIELO
            // =================================================

            bitmap.gradientFillRect(

                0,
                0,

                width,

                Math.floor(
                    height * 0.43
                ),

                '#60CFF3',

                '#C5F2F5',

                true

            );


            // =================================================
            // COLINAS
            // =================================================

            var horizon =
                Math.floor(
                    height * 0.35
                );


            bitmap.drawCircle(

                width * 0.10,
                horizon + 80,
                150,

                '#75B95F'

            );


            bitmap.drawCircle(

                width * 0.27,
                horizon + 75,
                180,

                '#68AF54'

            );


            bitmap.drawCircle(

                width * 0.48,
                horizon + 90,
                190,

                '#79BD60'

            );


            bitmap.drawCircle(

                width * 0.70,
                horizon + 80,
                170,

                '#64AA50'

            );


            bitmap.drawCircle(

                width * 0.90,
                horizon + 85,
                190,

                '#70B658'

            );


            // =================================================
            // CAMPO
            // =================================================

            bitmap.gradientFillRect(

                0,

                Math.floor(
                    height * 0.42
                ),

                width,

                Math.ceil(
                    height * 0.58
                ),

                '#69C447',

                '#3A923F',

                true

            );


            // =================================================
            // FRANJAS
            // =================================================

            bitmap.fillRect(

                0,

                Math.floor(
                    height * 0.49
                ),

                width,

                14,

                '#79D45B'

            );


            bitmap.fillRect(

                0,

                Math.floor(
                    height * 0.58
                ),

                width,

                10,

                '#5CAF43'

            );


            bitmap.fillRect(

                0,

                Math.floor(
                    height * 0.68
                ),

                width,

                12,

                '#4F9F3E'

            );


            // =================================================
            // PLATAFORMA RIVAL
            // =================================================

            var enemyX =
                Math.floor(
                    width * 0.73
                );

            var enemyY =
                Math.floor(
                    height * 0.40
                );


            for (
                var i = 0;
                i < 15;
                i++
            ) {

                bitmap.drawCircle(

                    enemyX -
                    150 +
                    i * 22,

                    enemyY +
                    Math.sin(i) * 12,

                    32,

                    '#367D32'

                );

            }


            bitmap.gradientFillRect(

                enemyX - 180,

                enemyY,

                360,

                55,

                '#58B547',

                '#3C8436',

                true

            );


            // =================================================
            // PLATAFORMA JUGADOR
            // =================================================

            var playerX =
                Math.floor(
                    width * 0.27
                );

            var playerY =
                Math.floor(
                    height * 0.66
                );


            for (
                var j = 0;
                j < 18;
                j++
            ) {

                bitmap.drawCircle(

                    playerX -
                    210 +
                    j * 25,

                    playerY +
                    Math.sin(
                        j * 1.2
                    ) * 12,

                    37,

                    '#347C32'

                );

            }


            bitmap.gradientFillRect(

                playerX - 230,

                playerY,

                460,

                65,

                '#58B649',

                '#3B8436',

                true

            );


            // =================================================
            // SPRITE DEL FONDO
            // =================================================

            this._backgroundSprite =
                new Sprite(
                    bitmap
                );


            this.addChild(
                this._backgroundSprite
            );

        };


    // =========================================================
    // SPRITE TEMPORAL
    // =========================================================
    //
    // Más adelante aquí cargaremos los sprites reales frontal
    // y trasero de cada Pokémon.
    //
    // =========================================================

    function Sprite_GMTempPokemon() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Sprite_GMTempPokemon.prototype =
        Object.create(
            Sprite.prototype
        );


    Sprite_GMTempPokemon.prototype.constructor =
        Sprite_GMTempPokemon;


    Sprite_GMTempPokemon.prototype.initialize =
        function(
            pokemon,
            back
        ) {

            Sprite.prototype.initialize.call(
                this
            );


            this._pokemon =
                pokemon;


            this._back =
                !!back;


            this.bitmap =
                new Bitmap(
                    300,
                    300
                );


            this.anchor.x =
                0.5;

            this.anchor.y =
                1;


            this.refresh();

        };


    Sprite_GMTempPokemon.prototype.refresh =
        function() {

            var bitmap =
                this.bitmap;


            bitmap.clear();


            var mon =
                this._pokemon;


            if (!mon) {

                return;

            }


            // =================================================
            // SOMBRA
            // =================================================

            bitmap.drawCircle(

                150,
                245,
                70,

                'rgba(0,0,0,0.22)'

            );


            // =================================================
            // CUERPO PLACEHOLDER
            // =================================================

            var bodyColor =
                this._back
                    ? '#475A66'
                    : '#586D78';


            bitmap.drawCircle(

                150,
                150,
                82,

                bodyColor

            );


            bitmap.drawCircle(

                105,
                86,
                30,

                bodyColor

            );


            bitmap.drawCircle(

                195,
                86,
                30,

                bodyColor

            );


            // =================================================
            // NOMBRE TEMPORAL
            // =================================================

            bitmap.fontSize =
                25;


            bitmap.textColor =
                '#FFFFFF';


            bitmap.outlineColor =
                '#222222';


            bitmap.outlineWidth =
                5;


            bitmap.drawText(

                mon.name ||
                'Pokémon',

                15,
                125,
                270,
                60,

                'center'

            );

        };


    // =========================================================
    // HUD DE ESTADO
    // =========================================================

    function Window_GMBattleStatus() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleStatus.prototype =
        Object.create(
            Window_Base.prototype
        );


    Window_GMBattleStatus.prototype.constructor =
        Window_GMBattleStatus;


    Window_GMBattleStatus.prototype.initialize =
        function(
            x,
            y,
            width,
            height,
            enemy
        ) {

            this._enemy =
                !!enemy;


            Window_Base.prototype.initialize.call(

                this,

                x,
                y,
                width,
                height

            );


            this.opacity =
                0;


            this.refresh();

        };


    Window_GMBattleStatus.prototype.pokemon =
        function() {

            return this._enemy

                ? GM.Battle.enemy

                : GM.Battle.playerPokemon;

        };


    Window_GMBattleStatus.prototype.hpColor =
        function(rate) {

            if (
                rate <=
                0.20
            ) {

                return '#E53935';

            }


            if (
                rate <=
                0.50
            ) {

                return '#F5C542';

            }


            return '#45A54A';

        };


    Window_GMBattleStatus.prototype.refresh =
        function() {

            this.contents.clear();


            var mon =
                this.pokemon();


            if (!mon) {

                return;

            }


            var w =
                this.contentsWidth();


            var h =
                this.contentsHeight();


            // =================================================
            // FONDO
            // =================================================

            this.contents.fillRect(

                6,
                6,

                w - 12,
                h - 12,

                'rgba(248,248,239,0.96)'

            );


            // Borde lateral

            this.contents.fillRect(

                6,
                6,

                14,
                h - 12,

                '#3C494D'

            );


            // =================================================
            // NOMBRE
            // =================================================

            this.contents.textColor =
                '#222222';


            this.contents.fontSize =
                30;


            this.drawText(

                mon.name ||
                'Pokémon',

                35,
                8,

                w - 190

            );


            // =================================================
            // NIVEL
            // =================================================

            this.contents.fontSize =
                23;


            this.drawText(

                'Nv.' +
                Number(
                    mon.level || 1
                ),

                w - 150,
                13,

                115,

                'right'

            );


            // =================================================
            // PS
            // =================================================

            var rate =

                Number(
                    mon.hp || 0
                ) /

                Math.max(

                    1,

                    Number(
                        mon.maxHp || 1
                    )

                );


            rate =
                Math.max(

                    0,

                    Math.min(
                        1,
                        rate
                    )

                );


            this.contents.fontSize =
                20;


            this.drawText(

                'PS',

                36,
                55,

                60

            );


            var gaugeX =
                105;


            var gaugeY =
                66;


            var gaugeWidth =
                w - 145;


            this.contents.fillRect(

                gaugeX,
                gaugeY,

                gaugeWidth,
                24,

                '#313536'

            );


            this.contents.fillRect(

                gaugeX + 4,
                gaugeY + 4,

                Math.floor(

                    (
                        gaugeWidth -
                        8
                    ) *

                    rate

                ),

                16,

                this.hpColor(
                    rate
                )

            );


            // =================================================
            // PS NUMÉRICOS DEL JUGADOR
            // =================================================

            if (
                !this._enemy
            ) {

                this.contents.fontSize =
                    22;


                this.drawText(

                    Number(
                        mon.hp || 0
                    ) +

                    ' / ' +

                    Number(
                        mon.maxHp || 0
                    ),

                    0,
                    92,

                    w - 35,

                    'right'

                );


                // =============================================
                // EXP
                // =============================================

                this.contents.fontSize =
                    15;


                this.drawText(

                    'EXP',

                    35,
                    128,

                    50

                );


                this.contents.fillRect(

                    90,
                    143,

                    w - 125,
                    10,

                    '#313536'

                );


                var expRate =
                    this.expRate(
                        mon
                    );


                this.contents.fillRect(

                    92,
                    145,

                    Math.floor(

                        (
                            w -
                            129
                        ) *

                        expRate

                    ),

                    6,

                    '#4AA9DD'

                );

            }


            this.resetTextColor();


            this.contents.fontSize =
                this.standardFontSize();

        };


    // =========================================================
    // EXP
    // =========================================================

    Window_GMBattleStatus.prototype.expRate =
        function(mon) {

            if (

                !GM.expForLevel ||

                !mon ||

                Number(
                    mon.level || 1
                ) >= 100

            ) {

                return 0;

            }


            var currentMin =
                GM.expForLevel(

                    mon.level,

                    mon.growthRate

                );


            var nextMin =
                GM.expForLevel(

                    mon.level + 1,

                    mon.growthRate

                );


            var currentExp =
                Number(

                    mon.exp ||
                    currentMin

                );


            var range =
                Math.max(

                    1,

                    nextMin -
                    currentMin

                );


            return Math.max(

                0,

                Math.min(

                    1,

                    (
                        currentExp -
                        currentMin
                    ) /
                    range

                )

            );

        };


    // =========================================================
    // CAJA DE MENSAJES
    // =========================================================

    function Window_GMBattleMessage() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleMessage.prototype =
        Object.create(
            Window_Base.prototype
        );


    Window_GMBattleMessage.prototype.constructor =
        Window_GMBattleMessage;


    Window_GMBattleMessage.prototype.initialize =
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


    Window_GMBattleMessage.prototype.setText =
        function(text) {

            this._text =
                String(
                    text || ''
                );


            this.refresh();

        };


    // =========================================================
    // TEXTO CON SALTO AUTOMÁTICO
    // =========================================================

    Window_GMBattleMessage.prototype.refresh =
        function() {

            this.contents.clear();


            this.contents.fontSize =
                25;


            var text =
                String(
                    this._text || ''
                );


            var maxWidth =
                this.contentsWidth() -
                24;


            var x =
                12;


            var y =
                15;


            var lineHeight =
                38;


            // Respeta también los saltos \n enviados por Battle.js

            var paragraphs =
                text.split('\n');


            for (
                var p = 0;
                p < paragraphs.length;
                p++
            ) {

                var paragraph =
                    paragraphs[p];


                // Línea vacía

                if (
                    paragraph.length ===
                    0
                ) {

                    y +=
                        lineHeight;

                    continue;

                }


                var words =
                    paragraph.split(
                        /\s+/
                    );


                var line =
                    '';


                for (
                    var i = 0;
                    i < words.length;
                    i++
                ) {

                    var word =
                        words[i];


                    var testLine =

                        line.length > 0

                            ? line +
                              ' ' +
                              word

                            : word;


                    if (

                        line.length > 0 &&

                        this.textWidth(
                            testLine
                        ) >
                        maxWidth

                    ) {

                        this.drawText(

                            line,

                            x,
                            y,

                            maxWidth,

                            'left'

                        );


                        y +=
                            lineHeight;


                        line =
                            word;

                    }

                    else {

                        line =
                            testLine;

                    }

                }


                // Última línea

                if (
                    line.length >
                    0
                ) {

                    this.drawText(

                        line,

                        x,
                        y,

                        maxWidth,

                        'left'

                    );


                    y +=
                        lineHeight;

                }

            }


            this.contents.fontSize =
                this.standardFontSize();

        };


    // =========================================================
    // MENÚ PRINCIPAL 2x2
    // =========================================================

    function Window_GMBattleCommandUI() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleCommandUI.prototype =
        Object.create(
            Window_Command.prototype
        );


    Window_GMBattleCommandUI.prototype.constructor =
        Window_GMBattleCommandUI;


    Window_GMBattleCommandUI.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._gmWidth =
                width;


            this._gmHeight =
                height;


            Window_Command.prototype.initialize.call(

                this,

                x,
                y

            );

        };


    Window_GMBattleCommandUI.prototype.windowWidth =
        function() {

            return (
                this._gmWidth ||
                600
            );

        };


    Window_GMBattleCommandUI.prototype.windowHeight =
        function() {

            return (
                this._gmHeight ||
                200
            );

        };


    Window_GMBattleCommandUI.prototype.maxCols =
        function() {

            return 2;

        };


    Window_GMBattleCommandUI.prototype.numVisibleRows =
        function() {

            return 2;

        };


    Window_GMBattleCommandUI.prototype.itemHeight =
        function() {

            return 72;

        };


    Window_GMBattleCommandUI.prototype.makeCommandList =
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


    Window_GMBattleCommandUI.prototype.drawItem =
        function(index) {

            var rect =
                this.itemRectForText(
                    index
                );


            var colors = [

                '#D85A5A',

                '#DCAA43',

                '#5BA75A',

                '#4D91BF'

            ];


            this.contents.fillRect(

                rect.x + 6,
                rect.y + 6,

                rect.width - 12,
                rect.height - 12,

                colors[index]

            );


            this.contents.fontSize =
                24;


            this.drawText(

                this.commandName(
                    index
                ),

                rect.x,

                rect.y + 10,

                rect.width,

                'center'

            );


            this.contents.fontSize =
                this.standardFontSize();

        };


    // =========================================================
    // MENÚ DE MOVIMIENTOS
    // =========================================================

    function Window_GMBattleMovesUI() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMBattleMovesUI.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GMBattleMovesUI.prototype.constructor =
        Window_GMBattleMovesUI;


    Window_GMBattleMovesUI.prototype.initialize =
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


    Window_GMBattleMovesUI.prototype.maxCols =
        function() {

            return 2;

        };


    Window_GMBattleMovesUI.prototype.maxItems =
        function() {

            var mon =
                GM.Battle.playerPokemon;


            if (
                !mon ||
                !mon.moves
            ) {

                return 0;

            }


            return mon.moves.length;

        };


    Window_GMBattleMovesUI.prototype.itemHeight =
        function() {

            return 72;

        };


    Window_GMBattleMovesUI.prototype.moveInstance =
        function() {

            var mon =
                GM.Battle.playerPokemon;


            if (
                !mon ||
                !mon.moves
            ) {

                return null;

            }


            return (

                mon.moves[
                    this.index()
                ] ||

                null

            );

        };


    Window_GMBattleMovesUI.prototype.isCurrentItemEnabled =
        function() {

            var instance =
                this.moveInstance();


            return (

                instance &&

                Number(
                    instance.currentPP || 0
                ) > 0

            );

        };


    Window_GMBattleMovesUI.prototype.drawItem =
        function(index) {

            var mon =
                GM.Battle.playerPokemon;


            if (
                !mon ||
                !mon.moves
            ) {

                return;

            }


            var instance =
                mon.moves[index];


            if (!instance) {

                return;

            }


            var move =
                GM.getMove(
                    instance.id
                );


            if (!move) {

                return;

            }


            var rect =
                this.itemRectForText(
                    index
                );


            this.changePaintOpacity(

                Number(
                    instance.currentPP || 0
                ) > 0

            );


            this.contents.fillRect(

                rect.x + 5,
                rect.y + 5,

                rect.width - 10,
                rect.height - 10,

                GM.BattleUI.typeColor(
                    move.type
                )

            );


            // Nombre

            this.contents.fontSize =
                21;


            this.drawText(

                move.name,

                rect.x + 14,
                rect.y + 5,

                rect.width - 28

            );


            // Tipo

            this.contents.fontSize =
                15;


            this.drawText(

                String(
                    move.type || ''
                ),

                rect.x + 14,
                rect.y + 34,

                rect.width / 2

            );


            // PP

            this.drawText(

                'PP ' +

                Number(
                    instance.currentPP || 0
                ) +

                '/' +

                Number(

                    instance.maxPP != null

                        ? instance.maxPP

                        : move.pp || 0

                ),

                rect.x,
                rect.y + 34,

                rect.width - 14,

                'right'

            );


            this.changePaintOpacity(
                true
            );


            this.contents.fontSize =
                this.standardFontSize();

        };


    Window_GMBattleMovesUI.prototype.refresh =
        function() {

            this.createContents();

            this.drawAllItems();

        };


    // =========================================================
    // CREAR ESCENA DE BATALLA
    // =========================================================

    Scene_GranadaMonBattle.prototype.create =
        function() {

            Scene_MenuBase.prototype.create.call(
                this
            );


            this.createPokemonSprites();

            this.createEnemyStatusWindow();

            this.createPlayerStatusWindow();

            this.createLogWindow();

            this.createCommandWindow();

            this.createMoveWindow();


            // Compatibilidad con GranadaMon_Battle.js

            this.createCompatibilityFieldBridge();


            this._logWindow.setText(

                '¡Ha aparecido un ' +
                GM.Battle.enemy.name +
                ' salvaje!'

            );

        };


    // =========================================================
    // SPRITES POKÉMON
    // =========================================================

    Scene_GranadaMonBattle.prototype.createPokemonSprites =
        function() {

            // =================================================
            // RIVAL
            // =================================================

            this._enemyPokemonSprite =
                new Sprite_GMTempPokemon(

                    GM.Battle.enemy,

                    false

                );


            this._enemyPokemonSprite.x =
                Math.floor(

                    Graphics.boxWidth *
                    0.73

                );


            this._enemyPokemonSprite.y =
                Math.floor(

                    Graphics.boxHeight *
                    0.47

                );


            this._enemyPokemonSprite.scale.x =
                0.92;


            this._enemyPokemonSprite.scale.y =
                0.92;


            // Debajo de las ventanas

            this.addChildAt(

                this._enemyPokemonSprite,

                1

            );


            // =================================================
            // JUGADOR
            // =================================================

            this._playerPokemonSprite =
                new Sprite_GMTempPokemon(

                    GM.Battle.playerPokemon,

                    true

                );


            this._playerPokemonSprite.x =
                Math.floor(

                    Graphics.boxWidth *
                    0.28

                );


            this._playerPokemonSprite.y =
                Math.floor(

                    Graphics.boxHeight *
                    0.70

                );


            this._playerPokemonSprite.scale.x =
                1.12;


            this._playerPokemonSprite.scale.y =
                1.12;


            this.addChildAt(

                this._playerPokemonSprite,

                1

            );

        };


    // =========================================================
    // HUD RIVAL
    // =========================================================

    Scene_GranadaMonBattle.prototype.createEnemyStatusWindow =
        function() {

            this._enemyStatusWindow =
                new Window_GMBattleStatus(

                    45,

                    42,

                    Math.floor(
                        Graphics.boxWidth *
                        0.39
                    ),

                    135,

                    true

                );


            this.addWindow(
                this._enemyStatusWindow
            );

        };


    // =========================================================
    // HUD JUGADOR
    // =========================================================

    Scene_GranadaMonBattle.prototype.createPlayerStatusWindow =
        function() {

            var width =
                Math.floor(

                    Graphics.boxWidth *
                    0.40

                );


            var x =

                Graphics.boxWidth -

                width -

                50;


            var y =
                Math.floor(

                    Graphics.boxHeight *
                    0.48

                );


            this._playerStatusWindow =
                new Window_GMBattleStatus(

                    x,

                    y,

                    width,

                    185,

                    false

                );


            this.addWindow(
                this._playerStatusWindow
            );

        };


    // =========================================================
    // MENSAJES
    // =========================================================

    Scene_GranadaMonBattle.prototype.createLogWindow =
        function() {

            var bottomHeight =
                205;


            var width =
                Math.floor(

                    Graphics.boxWidth *
                    0.52

                );


            this._logWindow =
                new Window_GMBattleMessage(

                    0,

                    Graphics.boxHeight -
                    bottomHeight,

                    width,

                    bottomHeight

                );


            this.addWindow(
                this._logWindow
            );

        };


    // =========================================================
    // COMANDOS
    // =========================================================

    Scene_GranadaMonBattle.prototype.createCommandWindow =
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


            this._commandWindow =
                new Window_GMBattleCommandUI(

                    x,

                    Graphics.boxHeight -
                    bottomHeight,

                    width,

                    bottomHeight

                );


            this._commandWindow.setHandler(

                'fight',

                this.commandFight.bind(
                    this
                )

            );


            this._commandWindow.setHandler(

                'bag',

                this.commandBag.bind(
                    this
                )

            );


            this._commandWindow.setHandler(

                'pokemon',

                this.commandPokemon.bind(
                    this
                )

            );


            this._commandWindow.setHandler(

                'run',

                this.commandRun.bind(
                    this
                )

            );


            this.addWindow(
                this._commandWindow
            );


            this._commandWindow.activate();

            this._commandWindow.select(
                0
            );

        };


    // =========================================================
    // MOVIMIENTOS
    // =========================================================

    Scene_GranadaMonBattle.prototype.createMoveWindow =
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


            this._moveWindow =
                new Window_GMBattleMovesUI(

                    x,

                    Graphics.boxHeight -
                    bottomHeight,

                    width,

                    bottomHeight

                );


            this._moveWindow.setHandler(

                'ok',

                this.onMoveOk.bind(
                    this
                )

            );


            this._moveWindow.setHandler(

                'cancel',

                this.onMoveCancel.bind(
                    this
                )

            );


            this.addWindow(
                this._moveWindow
            );

        };


    // =========================================================
    // COMPATIBILIDAD CON BATTLE.JS
    // =========================================================
    //
    // Battle.js todavía llama a:
    //
    // this._fieldWindow.refresh()
    //
    // Como en esta interfaz ya no tenemos la antigua ventana
    // de campo, creamos un puente invisible.
    //
    // =========================================================

    Scene_GranadaMonBattle.prototype.createCompatibilityFieldBridge =
        function() {

            var scene =
                this;


            this._fieldWindow = {

                refresh:
                    function() {

                        scene.refreshBattleUI();

                    }

            };

        };


    // =========================================================
    // REFRESCAR HUD
    // =========================================================

    Scene_GranadaMonBattle.prototype.refreshBattleUI =
        function() {

            if (
                this._enemyStatusWindow
            ) {

                this._enemyStatusWindow.refresh();

            }


            if (
                this._playerStatusWindow
            ) {

                this._playerStatusWindow.refresh();

            }

        };


    // =========================================================
    // DESPUÉS DE UN TURNO
    // =========================================================

    var _GMUI_executeTurn =
        Scene_GranadaMonBattle
            .prototype
            .executeTurn;


    Scene_GranadaMonBattle.prototype.executeTurn =
        function(
            playerInstance,
            playerMove
        ) {

            _GMUI_executeTurn.call(

                this,

                playerInstance,

                playerMove

            );


            this.refreshBattleUI();

        };


    // =========================================================
    // ATAQUE DEL RIVAL TRAS HUIDA FALLIDA
    // =========================================================

    var _GMUI_enemyFreeTurn =
        Scene_GranadaMonBattle
            .prototype
            .enemyFreeTurn;


    Scene_GranadaMonBattle.prototype.enemyFreeTurn =
        function() {

            _GMUI_enemyFreeTurn.call(
                this
            );


            this.refreshBattleUI();

        };


    // =========================================================
    // CAMBIO AUTOMÁTICO AL DEBILITARSE
    // =========================================================

    var _GMUI_loseCurrentPokemon =
        Scene_GranadaMonBattle
            .prototype
            .loseCurrentPokemon;


    Scene_GranadaMonBattle.prototype.loseCurrentPokemon =
        function() {

            var oldPokemon =
                GM.Battle.playerPokemon;


            _GMUI_loseCurrentPokemon.call(
                this
            );


            if (

                oldPokemon !==
                    GM.Battle.playerPokemon &&

                GM.Battle.playerPokemon

            ) {

                if (
                    this._playerPokemonSprite
                ) {

                    this.removeChild(
                        this._playerPokemonSprite
                    );

                }


                this._playerPokemonSprite =
                    new Sprite_GMTempPokemon(

                        GM.Battle.playerPokemon,

                        true

                    );


                this._playerPokemonSprite.x =
                    Math.floor(

                        Graphics.boxWidth *
                        0.28

                    );


                this._playerPokemonSprite.y =
                    Math.floor(

                        Graphics.boxHeight *
                        0.70

                    );


                this._playerPokemonSprite.scale.x =
                    1.12;


                this._playerPokemonSprite.scale.y =
                    1.12;


                this.addChildAt(

                    this._playerPokemonSprite,

                    1

                );


                this.refreshBattleUI();

            }

        };


    // =========================================================
    // CARGADO
    // =========================================================

    console.log(
        'GranadaMon BattleUI v1.2 cargado correctamente.'
    );


})();