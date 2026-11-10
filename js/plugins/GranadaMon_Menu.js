/*:
 * @plugindesc v1.1 GranadaMon - Menú Pokémon para RPG Maker MV
 * @author OpenAI
 *
 * @param Total Pokedex
 * @type number
 * @min 1
 * @default 100
 *
 * @param Nombre Equipo
 * @type text
 * @default Pokémon
 *
 * @param Nombre Pokedex
 * @type text
 * @default Pokédex
 *
 * @param Nombre Mochila
 * @type text
 * @default Mochila
 *
 * @param Nombre Almacenamiento
 * @type text
 * @default Almacenamiento
 *
 * @help
 * GranadaMon_Menu.js
 * ------------------------------------------------------------
 * Añade al menú principal:
 * - Pokémon
 * - Pokédex
 * - Mochila
 * - Almacenamiento
 *
 * v1.1 añade la ficha individual del Pokémon al pulsar OK
 * sobre uno de los miembros del equipo.
 */

(function() {

    'use strict';

    var pluginName = 'GranadaMon_Menu';
    var parameters = PluginManager.parameters(pluginName);

    var TOTAL_POKEDEX = Number(parameters['Total Pokedex'] || 100);
    var NAME_PARTY = String(parameters['Nombre Equipo'] || 'Pokémon');
    var NAME_DEX = String(parameters['Nombre Pokedex'] || 'Pokédex');
    var NAME_BAG = String(parameters['Nombre Mochila'] || 'Mochila');
    var NAME_STORAGE = String(parameters['Nombre Almacenamiento'] || 'Almacenamiento');

    window.GranadaMon = window.GranadaMon || {};
    GranadaMon.Menu = GranadaMon.Menu || {};

    GranadaMon.Menu.version = '1.1';
    GranadaMon.Menu.totalPokedex = TOTAL_POKEDEX;
    GranadaMon.Menu.selectedPokemon = null;


    // =========================================================
    // DATOS
    // =========================================================

    var _Game_System_initialize = Game_System.prototype.initialize;

    Game_System.prototype.initialize = function() {

        _Game_System_initialize.call(this);

        this.initGranadaMonMenuData();

    };


    Game_System.prototype.initGranadaMonMenuData = function() {

        if (!this._granadaMonParty) {
            this._granadaMonParty = [];
        }

        if (!this._granadaMonStorage) {
            this._granadaMonStorage = [];
        }

        if (!this._granadaMonDex) {

            this._granadaMonDex = [];

            for (var i = 0; i < TOTAL_POKEDEX; i++) {

                this._granadaMonDex.push({

                    id: i + 1,

                    name: '',

                    seen: false,

                    caught: false

                });

            }

        }

    };


    GranadaMon.Menu.ensureData = function() {

        if (
            $gameSystem &&
            $gameSystem.initGranadaMonMenuData
        ) {

            $gameSystem.initGranadaMonMenuData();

        }

    };


    GranadaMon.Menu.pad3 = function(value) {

        var text =
            String(
                value == null
                    ? '?'
                    : value
            );

        while (text.length < 3) {

            text =
                '0' + text;

        }

        return text;

    };


    GranadaMon.Menu.prettyType = function(type) {

        var names = {

            ELECTRICO: 'ELÉCTRICO',

            PSIQUICO: 'PSÍQUICO',

            DRAGON: 'DRAGÓN'

        };


        return (
            names[type] ||
            type ||
            '—'
        );

    };


    GranadaMon.Menu.prettyStatus = function(status) {

        if (!status) {

            return 'Ninguno';

        }


        var names = {

            poison:
                'Envenenado',

            burn:
                'Quemado',

            paralysis:
                'Paralizado',

            sleep:
                'Dormido',

            freeze:
                'Congelado'

        };


        return (
            names[status] ||
            String(status)
        );

    };


    // =========================================================
    // MOCHILA
    // =========================================================

    var _Window_MenuCommand_makeCommandList =
        Window_MenuCommand.prototype.makeCommandList;


    Window_MenuCommand.prototype.makeCommandList = function() {

        _Window_MenuCommand_makeCommandList.call(this);


        for (
            var i = 0;
            i < this._list.length;
            i++
        ) {

            if (
                this._list[i].symbol ===
                'item'
            ) {

                this._list[i].name =
                    NAME_BAG;

            }

        }

    };


    // =========================================================
    // COMANDOS DEL MENÚ
    // =========================================================

    var _Window_MenuCommand_addOriginalCommands =
        Window_MenuCommand.prototype.addOriginalCommands;


    Window_MenuCommand.prototype.addOriginalCommands = function() {

        _Window_MenuCommand_addOriginalCommands.call(this);


        this.addCommand(
            NAME_PARTY,
            'granadaMonParty',
            true
        );


        this.addCommand(
            NAME_DEX,
            'granadaMonDex',
            true
        );


        this.addCommand(
            NAME_STORAGE,
            'granadaMonStorage',
            true
        );

    };


    var _Scene_Menu_createCommandWindow =
        Scene_Menu.prototype.createCommandWindow;


    Scene_Menu.prototype.createCommandWindow = function() {

        _Scene_Menu_createCommandWindow.call(this);


        this._commandWindow.setHandler(
            'granadaMonParty',
            this.commandGranadaMonParty.bind(this)
        );


        this._commandWindow.setHandler(
            'granadaMonDex',
            this.commandGranadaMonDex.bind(this)
        );


        this._commandWindow.setHandler(
            'granadaMonStorage',
            this.commandGranadaMonStorage.bind(this)
        );

    };


    Scene_Menu.prototype.commandGranadaMonParty = function() {

        SceneManager.push(
            Scene_GranadaMonParty
        );

    };


    Scene_Menu.prototype.commandGranadaMonDex = function() {

        SceneManager.push(
            Scene_GranadaMonDex
        );

    };


    Scene_Menu.prototype.commandGranadaMonStorage = function() {

        SceneManager.push(
            Scene_GranadaMonStorage
        );

    };


    // =========================================================
    // EQUIPO POKÉMON
    // =========================================================

    function Scene_GranadaMonParty() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_GranadaMonParty.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );


    Scene_GranadaMonParty.prototype.constructor =
        Scene_GranadaMonParty;


    Scene_GranadaMonParty.prototype.initialize = function() {

        Scene_MenuBase.prototype.initialize.call(this);

    };


    Scene_GranadaMonParty.prototype.create = function() {

        Scene_MenuBase.prototype.create.call(this);

        GranadaMon.Menu.ensureData();

        this.createTitleWindow();

        this.createPartyWindow();

    };


    Scene_GranadaMonParty.prototype.createTitleWindow = function() {

        this._titleWindow =
            new Window_GranadaMonTitle(
                NAME_PARTY
            );

        this.addWindow(
            this._titleWindow
        );

    };


    Scene_GranadaMonParty.prototype.createPartyWindow = function() {

        var y =
            this._titleWindow.height;


        this._partyWindow =
            new Window_GranadaMonParty(

                0,

                y,

                Graphics.boxWidth,

                Graphics.boxHeight - y

            );


        this._partyWindow.setHandler(

            'ok',

            this.onPartyOk.bind(this)

        );


        this._partyWindow.setHandler(

            'cancel',

            this.popScene.bind(this)

        );


        this.addWindow(
            this._partyWindow
        );


        this._partyWindow.activate();

        this._partyWindow.select(0);

    };


    // =========================================================
    // PULSAR SOBRE UN POKÉMON
    // =========================================================

    Scene_GranadaMonParty.prototype.onPartyOk = function() {

        var index =
            this._partyWindow.index();


        var party =
            $gameSystem._granadaMonParty ||
            [];


        var pokemon =
            party[index];


        if (!pokemon) {

            SoundManager.playBuzzer();

            this._partyWindow.activate();

            return;

        }


        GranadaMon.Menu.selectedPokemon =
            pokemon;


        SceneManager.push(
            Scene_GranadaMonSummary
        );

    };


    // =========================================================
    // VENTANA EQUIPO
    // =========================================================

    function Window_GranadaMonParty() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GranadaMonParty.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GranadaMonParty.prototype.constructor =
        Window_GranadaMonParty;


    Window_GranadaMonParty.prototype.initialize =
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


            this.refresh();

        };


    Window_GranadaMonParty.prototype.maxItems = function() {

        return 6;

    };


    Window_GranadaMonParty.prototype.itemHeight = function() {

        return 72;

    };


    Window_GranadaMonParty.prototype.drawItem = function(index) {

        var rect =
            this.itemRectForText(index);


        var party =
            $gameSystem._granadaMonParty ||
            [];


        var mon =
            party[index];


        this.changeTextColor(
            this.systemColor()
        );


        this.drawText(

            'Slot ' + (index + 1),

            rect.x,

            rect.y,

            90

        );


        this.resetTextColor();


        if (!mon) {

            this.changePaintOpacity(false);


            this.drawText(

                'Vacío',

                rect.x + 100,

                rect.y,

                rect.width - 100

            );


            this.changePaintOpacity(true);

            return;

        }


        var name =

            mon.nickname ||

            mon.name ||

            (
                'Pokémon #' +
                (
                    mon.speciesId ||
                    '?'
                )
            );


        var level =

            mon.level != null
                ? mon.level
                : '?';


        var hp =

            mon.hp != null
                ? mon.hp
                : '?';


        var maxHp =

            mon.maxHp != null
                ? mon.maxHp
                : '?';


        this.drawText(

            name,

            rect.x + 100,

            rect.y,

            260

        );


        this.drawText(

            'Nv. ' + level,

            rect.x + 370,

            rect.y,

            100

        );


        this.drawText(

            'PS ' +
            hp +
            '/' +
            maxHp,

            rect.x + 480,

            rect.y,

            180

        );

    };


    // =========================================================
    // FICHA INDIVIDUAL DEL POKÉMON
    // =========================================================

    function Scene_GranadaMonSummary() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_GranadaMonSummary.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );


    Scene_GranadaMonSummary.prototype.constructor =
        Scene_GranadaMonSummary;


    Scene_GranadaMonSummary.prototype.initialize = function() {

        Scene_MenuBase.prototype.initialize.call(this);

    };


    Scene_GranadaMonSummary.prototype.create = function() {

        Scene_MenuBase.prototype.create.call(this);

        this.createTitleWindow();

        this.createSummaryWindow();

    };


    Scene_GranadaMonSummary.prototype.createTitleWindow = function() {

        this._titleWindow =
            new Window_GranadaMonTitle(
                'Ficha Pokémon'
            );


        this.addWindow(
            this._titleWindow
        );

    };


    Scene_GranadaMonSummary.prototype.createSummaryWindow = function() {

        var y =
            this._titleWindow.height;


        this._summaryWindow =
            new Window_GranadaMonSummary(

                0,

                y,

                Graphics.boxWidth,

                Graphics.boxHeight - y

            );


        this._summaryWindow.setHandler(

            'cancel',

            this.popScene.bind(this)

        );


        this.addWindow(
            this._summaryWindow
        );


        this._summaryWindow.activate();

        this._summaryWindow.select(0);

    };


    // =========================================================
    // VENTANA FICHA
    // =========================================================

    function Window_GranadaMonSummary() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GranadaMonSummary.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GranadaMonSummary.prototype.constructor =
        Window_GranadaMonSummary;


    Window_GranadaMonSummary.prototype.initialize =
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


            this.refresh();

        };


    Window_GranadaMonSummary.prototype.maxItems = function() {

        return 1;

    };


    Window_GranadaMonSummary.prototype.drawItem = function() {

        // La ficha completa se dibuja
        // directamente en refresh.

    };


    Window_GranadaMonSummary.prototype.refresh = function() {

        this.contents.clear();


        var mon =
            GranadaMon.Menu.selectedPokemon;


        if (!mon) {

            this.drawText(

                'No hay ningún Pokémon seleccionado.',

                0,

                0,

                this.contentsWidth(),

                'center'

            );

            return;

        }


        // =====================================================
        // ESPECIE
        // =====================================================

        var species =
            null;


        if (
            GranadaMon.getSpecies &&
            mon.speciesId != null
        ) {

            species =
                GranadaMon.getSpecies(
                    mon.speciesId
                );

        }


        var name =

            mon.nickname ||

            mon.name ||

            (
                species
                    ? species.name
                    : 'Pokémon'
            );


        var nationalDex =

            mon.speciesId != null

                ? mon.speciesId

                : (
                    species
                        ? species.nationalDex
                        : '?'
                );


        var granadaDex =

            mon.granadaDex != null

                ? mon.granadaDex

                : (
                    species
                        ? species.granadaDex
                        : '?'
                );


        // =====================================================
        // TIPOS
        // =====================================================

        var types =

            mon.types ||

            (
                species
                    ? species.types
                    : []
            );


        var typeText =
            '—';


        if (
            types &&
            types.length > 0
        ) {

            var prettyTypes =
                [];


            for (
                var i = 0;
                i < types.length;
                i++
            ) {

                prettyTypes.push(

                    GranadaMon.Menu.prettyType(
                        types[i]
                    )

                );

            }


            typeText =
                prettyTypes.join(
                    ' / '
                );

        }


        // =====================================================
        // POSICIONES
        // =====================================================

        var line =
            this.lineHeight();


        var width =
            this.contentsWidth();


        var left =
            12;


        var right =
            Math.floor(
                width * 0.53
            );


        var leftWidth =
            right -
            left -
            16;


        var rightWidth =
            width -
            right -
            12;


        var y =
            0;


        // =====================================================
        // NOMBRE
        // =====================================================

        this.changeTextColor(
            this.systemColor()
        );


        this.drawText(

            name,

            left,

            y,

            width - 24,

            'center'

        );


        this.resetTextColor();


        y += line;


        // =====================================================
        // NIVEL Y TIPO
        // =====================================================

        this.drawText(

            'Nivel: ' +
            (
                mon.level != null
                    ? mon.level
                    : '?'
            ),

            left,

            y,

            leftWidth

        );


        this.drawText(

            'Tipo: ' +
            typeText,

            right,

            y,

            rightWidth

        );


        y += line;


        // =====================================================
        // POKÉDEX
        // =====================================================

        this.drawText(

            'Pokédex Granada: #' +
            GranadaMon.Menu.pad3(
                granadaDex
            ),

            left,

            y,

            leftWidth

        );


        this.drawText(

            'Pokédex Nacional: #' +
            GranadaMon.Menu.pad3(
                nationalDex
            ),

            right,

            y,

            rightWidth

        );


        y += line;


        // =====================================================
        // PS Y ESTADO
        // =====================================================

        this.drawText(

            'PS: ' +
            valueOrDash(mon.hp) +
            ' / ' +
            valueOrDash(mon.maxHp),

            left,

            y,

            leftWidth

        );


        this.drawText(

            'Estado: ' +
            GranadaMon.Menu.prettyStatus(
                mon.status
            ),

            right,

            y,

            rightWidth

        );


        y += line;


        // =====================================================
        // EXPERIENCIA Y OBJETO
        // =====================================================

        this.drawText(

            'EXP actual: ' +
            valueOrDash(
                mon.exp
            ),

            left,

            y,

            leftWidth

        );


        this.drawText(

            'Objeto: ' +
            heldItemName(
                mon.heldItem
            ),

            right,

            y,

            rightWidth

        );


        y += line + 4;


        // =====================================================
        // ESTADÍSTICAS
        // =====================================================

        this.changeTextColor(
            this.systemColor()
        );


        this.drawText(

            'ESTADÍSTICAS',

            left,

            y,

            width - 24

        );


        this.resetTextColor();


        y += line;


        this.drawText(

            'Ataque: ' +
            valueOrDash(
                mon.attack
            ),

            left,

            y,

            leftWidth

        );


        this.drawText(

            'Defensa: ' +
            valueOrDash(
                mon.defense
            ),

            right,

            y,

            rightWidth

        );


        y += line;


        this.drawText(

            'Ataque Esp.: ' +
            valueOrDash(
                mon.spAttack
            ),

            left,

            y,

            leftWidth

        );


        this.drawText(

            'Defensa Esp.: ' +
            valueOrDash(
                mon.spDefense
            ),

            right,

            y,

            rightWidth

        );


        y += line;


        this.drawText(

            'Velocidad: ' +
            valueOrDash(
                mon.speed
            ),

            left,

            y,

            leftWidth

        );


        y += line + 4;


        // =====================================================
        // MOVIMIENTOS
        // =====================================================

        this.changeTextColor(
            this.systemColor()
        );


        this.drawText(

            'MOVIMIENTOS',

            left,

            y,

            width - 24

        );


        this.resetTextColor();


        y += line;


        var moves =
            mon.moves ||
            [];


        for (
            var m = 0;
            m < 4;
            m++
        ) {

            var moveText =
                '—';


            if (
                moves[m] != null
            ) {

                moveText =
                    moveName(
                        moves[m]
                    );

            }


            this.drawText(

                (m + 1) +
                '. ' +
                moveText,

                left + 20,

                y,

                width - 64

            );


            y += line;

        }

    };


    // =========================================================
    // FUNCIONES AUXILIARES FICHA
    // =========================================================

    function valueOrDash(value) {

        return (
            value != null
                ? String(value)
                : '—'
        );

    }


    function heldItemName(item) {

        if (
            item == null ||
            item === ''
        ) {

            return 'Ninguno';

        }


        if (
            typeof item ===
                'string' ||
            typeof item ===
                'number'
        ) {

            return String(item);

        }


        return (
            item.name ||
            item.id ||
            'Objeto'
        );

    }


    function moveName(move) {

        if (
            typeof move ===
                'string' ||
            typeof move ===
                'number'
        ) {

            return String(move);

        }


        if (move.name) {

            return move.name;

        }


        if (move.move) {

            return String(
                move.move
            );

        }


        if (
            move.id != null
        ) {

            return (
                'Movimiento #' +
                move.id
            );

        }


        return 'Movimiento';

    }


    // =========================================================
    // POKÉDEX
    // =========================================================

    function Scene_GranadaMonDex() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_GranadaMonDex.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );


    Scene_GranadaMonDex.prototype.constructor =
        Scene_GranadaMonDex;


    Scene_GranadaMonDex.prototype.initialize = function() {

        Scene_MenuBase.prototype.initialize.call(this);

    };


    Scene_GranadaMonDex.prototype.create = function() {

        Scene_MenuBase.prototype.create.call(this);

        GranadaMon.Menu.ensureData();

        this.createTitleWindow();

        this.createSummaryWindow();

        this.createDexWindow();

    };


    Scene_GranadaMonDex.prototype.createTitleWindow = function() {

        this._titleWindow =
            new Window_GranadaMonTitle(
                NAME_DEX
            );


        this.addWindow(
            this._titleWindow
        );

    };


    Scene_GranadaMonDex.prototype.createSummaryWindow = function() {

        var y =
            this._titleWindow.height;


        this._summaryWindow =
            new Window_GranadaMonDexSummary(

                0,

                y,

                Graphics.boxWidth,

                72

            );


        this.addWindow(
            this._summaryWindow
        );

    };


    Scene_GranadaMonDex.prototype.createDexWindow = function() {

        var y =

            this._titleWindow.height +

            this._summaryWindow.height;


        this._dexWindow =
            new Window_GranadaMonDexList(

                0,

                y,

                Graphics.boxWidth,

                Graphics.boxHeight - y

            );


        this._dexWindow.setHandler(

            'cancel',

            this.popScene.bind(this)

        );


        this.addWindow(
            this._dexWindow
        );


        this._dexWindow.activate();

        this._dexWindow.select(0);

    };


    // =========================================================
    // CONTADOR POKÉDEX
    // =========================================================

    function Window_GranadaMonDexSummary() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GranadaMonDexSummary.prototype =
        Object.create(
            Window_Base.prototype
        );


    Window_GranadaMonDexSummary.prototype.constructor =
        Window_GranadaMonDexSummary;


    Window_GranadaMonDexSummary.prototype.initialize =
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


    Window_GranadaMonDexSummary.prototype.refresh = function() {

        this.contents.clear();


        var dex =
            $gameSystem._granadaMonDex ||
            [];


        var seen =
            0;


        var caught =
            0;


        for (
            var i = 0;
            i < dex.length;
            i++
        ) {

            if (
                dex[i].seen
            ) {

                seen++;

            }


            if (
                dex[i].caught
            ) {

                caught++;

            }

        }


        this.drawText(

            'Vistos: ' +
            seen +
            ' / ' +
            TOTAL_POKEDEX,

            0,

            0,

            this.contentsWidth() / 2,

            'center'

        );


        this.drawText(

            'Capturados: ' +
            caught +
            ' / ' +
            TOTAL_POKEDEX,

            this.contentsWidth() / 2,

            0,

            this.contentsWidth() / 2,

            'center'

        );

    };


    // =========================================================
    // LISTA POKÉDEX
    // =========================================================

    function Window_GranadaMonDexList() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GranadaMonDexList.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GranadaMonDexList.prototype.constructor =
        Window_GranadaMonDexList;


    Window_GranadaMonDexList.prototype.initialize =
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


            this.refresh();

        };


    Window_GranadaMonDexList.prototype.maxItems = function() {

        return TOTAL_POKEDEX;

    };


    Window_GranadaMonDexList.prototype.maxCols = function() {

        return 2;

    };


    Window_GranadaMonDexList.prototype.drawItem = function(index) {

        var rect =
            this.itemRectForText(index);


        var dex =
            $gameSystem._granadaMonDex ||
            [];


        var entry =
            dex[index];


        var number =
            GranadaMon.Menu.pad3(
                index + 1
            );


        var text =
            '#' +
            number +
            '   ';


        if (
            !entry ||
            !entry.seen
        ) {

            text +=
                '??????????';


            this.changePaintOpacity(false);


            this.drawText(

                text,

                rect.x,

                rect.y,

                rect.width

            );


            this.changePaintOpacity(true);

            return;

        }


        text +=

            entry.name ||

            (
                'Pokémon #' +
                (
                    index + 1
                )
            );


        this.drawText(

            text,

            rect.x,

            rect.y,

            rect.width - 40

        );


        if (
            entry.caught
        ) {

            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                '✓',

                rect.x +
                rect.width -
                36,

                rect.y,

                32,

                'center'

            );


            this.resetTextColor();

        }

    };


    // =========================================================
    // ALMACENAMIENTO
    // =========================================================

    function Scene_GranadaMonStorage() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_GranadaMonStorage.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );


    Scene_GranadaMonStorage.prototype.constructor =
        Scene_GranadaMonStorage;


    Scene_GranadaMonStorage.prototype.initialize = function() {

        Scene_MenuBase.prototype.initialize.call(this);

    };


    Scene_GranadaMonStorage.prototype.create = function() {

        Scene_MenuBase.prototype.create.call(this);

        GranadaMon.Menu.ensureData();

        this.createTitleWindow();

        this.createStorageWindow();

    };


    Scene_GranadaMonStorage.prototype.createTitleWindow = function() {

        this._titleWindow =
            new Window_GranadaMonTitle(
                NAME_STORAGE
            );


        this.addWindow(
            this._titleWindow
        );

    };


    Scene_GranadaMonStorage.prototype.createStorageWindow = function() {

        var y =
            this._titleWindow.height;


        this._storageWindow =
            new Window_GranadaMonStorage(

                0,

                y,

                Graphics.boxWidth,

                Graphics.boxHeight - y

            );


        this._storageWindow.setHandler(

            'cancel',

            this.popScene.bind(this)

        );


        this.addWindow(
            this._storageWindow
        );


        this._storageWindow.activate();

        this._storageWindow.select(0);

    };


    // =========================================================
    // VENTANA ALMACENAMIENTO
    // =========================================================

    function Window_GranadaMonStorage() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GranadaMonStorage.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GranadaMonStorage.prototype.constructor =
        Window_GranadaMonStorage;


    Window_GranadaMonStorage.prototype.initialize =
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


            this.refresh();

        };


    Window_GranadaMonStorage.prototype.maxItems = function() {

        var storage =
            $gameSystem._granadaMonStorage ||
            [];


        return Math.max(

            storage.length,

            1

        );

    };


    Window_GranadaMonStorage.prototype.drawItem = function(index) {

        var rect =
            this.itemRectForText(index);


        var storage =
            $gameSystem._granadaMonStorage ||
            [];


        var mon =
            storage[index];


        if (!mon) {

            if (
                index === 0 &&
                storage.length === 0
            ) {

                this.changePaintOpacity(false);


                this.drawText(

                    'No hay Pokémon almacenados.',

                    rect.x,

                    rect.y,

                    rect.width,

                    'center'

                );


                this.changePaintOpacity(true);

            }

            return;

        }


        var name =

            mon.nickname ||

            mon.name ||

            (
                'Pokémon #' +
                (
                    mon.speciesId ||
                    '?'
                )
            );


        var level =

            mon.level != null
                ? mon.level
                : '?';


        this.drawText(

            name,

            rect.x,

            rect.y,

            rect.width - 120

        );


        this.drawText(

            'Nv. ' + level,

            rect.x +
            rect.width -
            120,

            rect.y,

            120,

            'right'

        );

    };


    // =========================================================
    // TÍTULOS
    // =========================================================

    function Window_GranadaMonTitle() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GranadaMonTitle.prototype =
        Object.create(
            Window_Base.prototype
        );


    Window_GranadaMonTitle.prototype.constructor =
        Window_GranadaMonTitle;


    Window_GranadaMonTitle.prototype.initialize = function(title) {

        this._title =
            title ||
            '';


        Window_Base.prototype.initialize.call(

            this,

            0,

            0,

            Graphics.boxWidth,

            72

        );


        this.refresh();

    };


    Window_GranadaMonTitle.prototype.refresh = function() {

        this.contents.clear();


        this.changeTextColor(
            this.systemColor()
        );


        this.drawText(

            this._title,

            0,

            0,

            this.contentsWidth(),

            'center'

        );


        this.resetTextColor();

    };


    // =========================================================
    // ESCENAS PÚBLICAS
    // =========================================================

    window.Scene_GranadaMonParty =
        Scene_GranadaMonParty;


    window.Scene_GranadaMonSummary =
        Scene_GranadaMonSummary;


    window.Scene_GranadaMonDex =
        Scene_GranadaMonDex;


    window.Scene_GranadaMonStorage =
        Scene_GranadaMonStorage;


})();