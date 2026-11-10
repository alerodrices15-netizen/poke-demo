/*:
 * @plugindesc v1.1 GranadaMon - Gestión de equipo y almacenamiento
 * @author OpenAI
 *
 * @help
 * GranadaMon_Storage.js
 * ------------------------------------------------------------
 * REQUIERE:
 * GranadaMon_Menu.js
 * GranadaMon_Core.js
 *
 * FUNCIONES:
 * - Ver Pokémon almacenados.
 * - Ver ficha desde almacenamiento.
 * - Mover Pokémon al equipo.
 * - Si el equipo está lleno, intercambiar con uno de los 6.
 * - Ver ficha desde el equipo.
 * - Cambiar el orden de los Pokémon del equipo.
 *
 * Esta versión NO modifica las ventanas privadas del plugin Menu.
 * Crea sus propias ventanas para evitar incompatibilidades.
 */

(function() {

    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (
        typeof Scene_GranadaMonStorage === 'undefined' ||
        typeof Scene_GranadaMonParty === 'undefined' ||
        typeof Scene_GranadaMonSummary === 'undefined'
    ) {
        throw new Error(
            'GranadaMon_Storage necesita GranadaMon_Menu.js encima.'
        );
    }

    GM.Storage = GM.Storage || {};
    GM.Storage.version = '1.1';


    // =========================================================
    // DATOS
    // =========================================================

    GM.Storage.ensureData = function() {

        if (!$gameSystem) return;

        if (!$gameSystem._granadaMonParty) {
            $gameSystem._granadaMonParty = [];
        }

        if (!$gameSystem._granadaMonStorage) {
            $gameSystem._granadaMonStorage = [];
        }

    };


    GM.Storage.withdraw = function(storageIndex) {

        GM.Storage.ensureData();

        var party = $gameSystem._granadaMonParty;
        var storage = $gameSystem._granadaMonStorage;

        if (party.length >= 6) return false;
        if (storageIndex < 0 || storageIndex >= storage.length) return false;

        var pokemon = storage.splice(storageIndex, 1)[0];

        if (!pokemon) return false;

        party.push(pokemon);

        return true;

    };


    GM.Storage.swap = function(storageIndex, partyIndex) {

        GM.Storage.ensureData();

        var party = $gameSystem._granadaMonParty;
        var storage = $gameSystem._granadaMonStorage;

        if (storageIndex < 0 || storageIndex >= storage.length) return false;
        if (partyIndex < 0 || partyIndex >= party.length) return false;

        var storedPokemon = storage[storageIndex];
        var partyPokemon = party[partyIndex];

        if (!storedPokemon || !partyPokemon) return false;

        storage[storageIndex] = partyPokemon;
        party[partyIndex] = storedPokemon;

        return true;

    };


    GM.Storage.swapPartyPositions = function(indexA, indexB) {

        GM.Storage.ensureData();

        var party = $gameSystem._granadaMonParty;

        if (indexA < 0 || indexB < 0) return false;
        if (indexA >= party.length || indexB >= party.length) return false;

        if (indexA === indexB) return true;

        var temp = party[indexA];

        party[indexA] = party[indexB];
        party[indexB] = temp;

        return true;

    };


    // =========================================================
    // VENTANA EQUIPO
    // =========================================================

    function Window_GMPartyManage() {
        this.initialize.apply(this, arguments);
    }

    Window_GMPartyManage.prototype =
        Object.create(Window_Selectable.prototype);

    Window_GMPartyManage.prototype.constructor =
        Window_GMPartyManage;


    Window_GMPartyManage.prototype.initialize =
        function(x, y, width, height) {

            Window_Selectable.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            this.refresh();

        };


    Window_GMPartyManage.prototype.maxItems = function() {
        return 6;
    };


    Window_GMPartyManage.prototype.itemHeight = function() {
        return 72;
    };


    Window_GMPartyManage.prototype.pokemon = function() {

        GM.Storage.ensureData();

        return (
            $gameSystem._granadaMonParty[this.index()] ||
            null
        );

    };


    Window_GMPartyManage.prototype.isCurrentItemEnabled =
        function() {

            return !!this.pokemon();

        };


    Window_GMPartyManage.prototype.drawItem =
        function(index) {

            GM.Storage.ensureData();

            var rect =
                this.itemRectForText(index);

            var mon =
                $gameSystem._granadaMonParty[index];


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
                ('Pokémon #' + (mon.speciesId || '?'));

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
                'PS ' + hp + '/' + maxHp,
                rect.x + 480,
                rect.y,
                180
            );

        };


    // =========================================================
    // MENÚ EQUIPO
    // =========================================================

    function Window_GMPartyCommand() {
        this.initialize.apply(this, arguments);
    }

    Window_GMPartyCommand.prototype =
        Object.create(Window_Command.prototype);

    Window_GMPartyCommand.prototype.constructor =
        Window_GMPartyCommand;


    Window_GMPartyCommand.prototype.initialize =
        function(x, y) {

            Window_Command.prototype.initialize.call(
                this,
                x,
                y
            );

            this.hide();
            this.deactivate();

        };


    Window_GMPartyCommand.prototype.windowWidth =
        function() {

            return 360;

        };


    Window_GMPartyCommand.prototype.makeCommandList =
        function() {

            this.addCommand(
                'Ver ficha',
                'summary'
            );

            this.addCommand(
                'Cambiar posición',
                'move'
            );

            this.addCommand(
                'Cancelar',
                'cancel'
            );

        };


    // =========================================================
    // REEMPLAZAR PANTALLA EQUIPO
    // =========================================================

    Scene_GranadaMonParty.prototype.createPartyWindow =
        function() {

            GM.Storage.ensureData();

            var y =
                this._titleWindow.height;


            this._partyWindow =
                new Window_GMPartyManage(
                    0,
                    y,
                    Graphics.boxWidth,
                    Graphics.boxHeight - y
                );


            this._partyWindow.setHandler(
                'ok',
                this.onGMPartyOk.bind(this)
            );

            this._partyWindow.setHandler(
                'cancel',
                this.onGMPartyCancel.bind(this)
            );


            this.addWindow(
                this._partyWindow
            );


            this.createGMPartyCommandWindow();


            this._selectedPartyIndex =
                null;

            this._movingPartyIndex =
                null;


            this._partyWindow.activate();

            this._partyWindow.select(0);

        };


    Scene_GranadaMonParty.prototype.createGMPartyCommandWindow =
        function() {

            var width =
                360;

            var x =
                Math.floor(
                    (Graphics.boxWidth - width) / 2
                );

            var y =
                Math.floor(
                    (Graphics.boxHeight - 220) / 2
                );


            this._gmPartyCommandWindow =
                new Window_GMPartyCommand(
                    x,
                    y
                );


            this._gmPartyCommandWindow.setHandler(
                'summary',
                this.commandGMPartySummary.bind(this)
            );

            this._gmPartyCommandWindow.setHandler(
                'move',
                this.commandGMPartyMove.bind(this)
            );

            this._gmPartyCommandWindow.setHandler(
                'cancel',
                this.cancelGMPartyCommand.bind(this)
            );


            this.addWindow(
                this._gmPartyCommandWindow
            );

        };


    Scene_GranadaMonParty.prototype.onGMPartyOk =
        function() {

            var index =
                this._partyWindow.index();

            var pokemon =
                this._partyWindow.pokemon();


            if (!pokemon) {

                SoundManager.playBuzzer();

                this._partyWindow.activate();

                return;

            }


            // Si estamos cambiando posiciones

            if (
                this._movingPartyIndex != null
            ) {

                GM.Storage.swapPartyPositions(
                    this._movingPartyIndex,
                    index
                );


                SoundManager.playOk();


                this._movingPartyIndex =
                    null;


                this._partyWindow.refresh();

                this._partyWindow.activate();

                this._partyWindow.select(
                    index
                );


                return;

            }


            this._selectedPartyIndex =
                index;


            this._gmPartyCommandWindow.show();

            this._gmPartyCommandWindow.activate();

            this._gmPartyCommandWindow.select(0);

            this._partyWindow.deactivate();

        };


    Scene_GranadaMonParty.prototype.onGMPartyCancel =
        function() {

            if (
                this._movingPartyIndex != null
            ) {

                SoundManager.playCancel();

                this._movingPartyIndex =
                    null;

                this._partyWindow.activate();

                return;

            }


            this.popScene();

        };


    Scene_GranadaMonParty.prototype.commandGMPartySummary =
        function() {

            GM.Storage.ensureData();


            var pokemon =
                $gameSystem
                    ._granadaMonParty[
                        this._selectedPartyIndex
                    ];


            if (!pokemon) {

                SoundManager.playBuzzer();

                this.cancelGMPartyCommand();

                return;

            }


            GranadaMon.Menu.selectedPokemon =
                pokemon;


            SceneManager.push(
                Scene_GranadaMonSummary
            );

        };


    Scene_GranadaMonParty.prototype.commandGMPartyMove =
        function() {

            this._movingPartyIndex =
                this._selectedPartyIndex;


            this._gmPartyCommandWindow.hide();

            this._gmPartyCommandWindow.deactivate();

            this._gmPartyCommandWindow.deselect();


            this._partyWindow.activate();

            this._partyWindow.select(
                this._movingPartyIndex
            );

        };


    Scene_GranadaMonParty.prototype.cancelGMPartyCommand =
        function() {

            this._gmPartyCommandWindow.hide();

            this._gmPartyCommandWindow.deactivate();

            this._gmPartyCommandWindow.deselect();


            this._partyWindow.activate();

        };


    // =========================================================
    // LISTA ALMACENAMIENTO
    // =========================================================

    function Window_GMStorageList() {
        this.initialize.apply(this, arguments);
    }

    Window_GMStorageList.prototype =
        Object.create(Window_Selectable.prototype);

    Window_GMStorageList.prototype.constructor =
        Window_GMStorageList;


    Window_GMStorageList.prototype.initialize =
        function(x, y, width, height) {

            Window_Selectable.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            this.refresh();

        };


    Window_GMStorageList.prototype.maxItems =
        function() {

            GM.Storage.ensureData();


            var storage =
                $gameSystem
                    ._granadaMonStorage;


            return Math.max(
                storage.length,
                1
            );

        };


    Window_GMStorageList.prototype.pokemon =
        function() {

            GM.Storage.ensureData();


            return (
                $gameSystem
                    ._granadaMonStorage[
                        this.index()
                    ] ||
                null
            );

        };


    Window_GMStorageList.prototype.isCurrentItemEnabled =
        function() {

            return !!this.pokemon();

        };


    Window_GMStorageList.prototype.itemHeight =
        function() {

            return 64;

        };


    Window_GMStorageList.prototype.drawItem =
        function(index) {

            GM.Storage.ensureData();


            var rect =
                this.itemRectForText(index);


            var storage =
                $gameSystem
                    ._granadaMonStorage;


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
                ('Pokémon #' + (mon.speciesId || '?'));


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
                rect.x,
                rect.y,
                300
            );


            this.drawText(
                'Nv. ' + level,
                rect.x + 310,
                rect.y,
                120
            );


            this.drawText(
                'PS ' + hp + '/' + maxHp,
                rect.x + 440,
                rect.y,
                rect.width - 450,
                'right'
            );

        };


    // =========================================================
    // MENÚ ALMACENAMIENTO
    // =========================================================

    function Window_GMStorageCommand() {
        this.initialize.apply(this, arguments);
    }

    Window_GMStorageCommand.prototype =
        Object.create(Window_Command.prototype);

    Window_GMStorageCommand.prototype.constructor =
        Window_GMStorageCommand;


    Window_GMStorageCommand.prototype.initialize =
        function(x, y) {

            Window_Command.prototype.initialize.call(
                this,
                x,
                y
            );

            this.hide();

            this.deactivate();

        };


    Window_GMStorageCommand.prototype.windowWidth =
        function() {

            return 360;

        };


    Window_GMStorageCommand.prototype.makeCommandList =
        function() {

            this.addCommand(
                'Ver ficha',
                'summary'
            );

            this.addCommand(
                'Mover al equipo',
                'withdraw'
            );

            this.addCommand(
                'Cancelar',
                'cancel'
            );

        };


    // =========================================================
    // SELECTOR EQUIPO PARA INTERCAMBIO
    // =========================================================

    function Window_GMStoragePartyPicker() {
        this.initialize.apply(this, arguments);
    }

    Window_GMStoragePartyPicker.prototype =
        Object.create(Window_Selectable.prototype);

    Window_GMStoragePartyPicker.prototype.constructor =
        Window_GMStoragePartyPicker;


    Window_GMStoragePartyPicker.prototype.initialize =
        function(x, y, width, height) {

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


    Window_GMStoragePartyPicker.prototype.maxItems =
        function() {

            GM.Storage.ensureData();


            return Math.max(
                $gameSystem
                    ._granadaMonParty
                    .length,
                1
            );

        };


    Window_GMStoragePartyPicker.prototype.pokemon =
        function() {

            GM.Storage.ensureData();


            return (
                $gameSystem
                    ._granadaMonParty[
                        this.index()
                    ] ||
                null
            );

        };


    Window_GMStoragePartyPicker.prototype.isCurrentItemEnabled =
        function() {

            return !!this.pokemon();

        };


    Window_GMStoragePartyPicker.prototype.itemHeight =
        function() {

            return 64;

        };


    Window_GMStoragePartyPicker.prototype.drawItem =
        function(index) {

            GM.Storage.ensureData();


            var rect =
                this.itemRectForText(index);


            var mon =
                $gameSystem
                    ._granadaMonParty[
                        index
                    ];


            if (!mon) return;


            var name =
                mon.nickname ||
                mon.name ||
                ('Pokémon #' + (mon.speciesId || '?'));


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
                rect.x,
                rect.y,
                280
            );


            this.drawText(
                'Nv. ' + level,
                rect.x + 290,
                rect.y,
                120
            );


            this.drawText(
                'PS ' + hp + '/' + maxHp,
                rect.x + 420,
                rect.y,
                rect.width - 430,
                'right'
            );

        };


    Window_GMStoragePartyPicker.prototype.refresh =
        function() {

            this.createContents();

            this.drawAllItems();

        };


    // =========================================================
    // REEMPLAZAR ALMACENAMIENTO
    // =========================================================

    Scene_GranadaMonStorage.prototype.createStorageWindow =
        function() {

            GM.Storage.ensureData();


            var y =
                this._titleWindow.height;


            this._storageWindow =
                new Window_GMStorageList(
                    0,
                    y,
                    Graphics.boxWidth,
                    Graphics.boxHeight - y
                );


            this._storageWindow.setHandler(
                'ok',
                this.onGMStorageOk.bind(this)
            );


            this._storageWindow.setHandler(
                'cancel',
                this.popScene.bind(this)
            );


            this.addWindow(
                this._storageWindow
            );


            this.createGMStorageCommandWindow();

            this.createGMStoragePartyPicker();


            this._selectedStorageIndex =
                null;


            this._storageWindow.activate();

            this._storageWindow.select(0);

        };


    Scene_GranadaMonStorage.prototype.createGMStorageCommandWindow =
        function() {

            var width =
                360;


            var x =
                Math.floor(
                    (Graphics.boxWidth - width) / 2
                );


            var y =
                Math.floor(
                    (Graphics.boxHeight - 220) / 2
                );


            this._gmStorageCommandWindow =
                new Window_GMStorageCommand(
                    x,
                    y
                );


            this._gmStorageCommandWindow.setHandler(
                'summary',
                this.commandGMStorageSummary.bind(this)
            );


            this._gmStorageCommandWindow.setHandler(
                'withdraw',
                this.commandGMStorageWithdraw.bind(this)
            );


            this._gmStorageCommandWindow.setHandler(
                'cancel',
                this.cancelGMStorageCommand.bind(this)
            );


            this.addWindow(
                this._gmStorageCommandWindow
            );

        };


    Scene_GranadaMonStorage.prototype.createGMStoragePartyPicker =
        function() {

            var width =
                Math.floor(
                    Graphics.boxWidth * 0.78
                );


            var height =
                Math.min(
                    6 * 64 + 36,
                    Graphics.boxHeight - 120
                );


            var x =
                Math.floor(
                    (Graphics.boxWidth - width) / 2
                );


            var y =
                Math.floor(
                    (Graphics.boxHeight - height) / 2
                );


            this._gmStoragePartyPicker =
                new Window_GMStoragePartyPicker(
                    x,
                    y,
                    width,
                    height
                );


            this._gmStoragePartyPicker.setHandler(
                'ok',
                this.onGMStoragePartyOk.bind(this)
            );


            this._gmStoragePartyPicker.setHandler(
                'cancel',
                this.onGMStoragePartyCancel.bind(this)
            );


            this.addWindow(
                this._gmStoragePartyPicker
            );

        };


    // =========================================================
    // PULSAR POKÉMON ALMACENADO
    // =========================================================

    Scene_GranadaMonStorage.prototype.onGMStorageOk =
        function() {

            var pokemon =
                this._storageWindow.pokemon();


            if (!pokemon) {

                SoundManager.playBuzzer();

                this._storageWindow.activate();

                return;

            }


            this._selectedStorageIndex =
                this._storageWindow.index();


            this._gmStorageCommandWindow.show();

            this._gmStorageCommandWindow.activate();

            this._gmStorageCommandWindow.select(0);


            this._storageWindow.deactivate();

        };


    // =========================================================
    // VER FICHA
    // =========================================================

    Scene_GranadaMonStorage.prototype.commandGMStorageSummary =
        function() {

            GM.Storage.ensureData();


            var pokemon =
                $gameSystem
                    ._granadaMonStorage[
                        this._selectedStorageIndex
                    ];


            if (!pokemon) {

                SoundManager.playBuzzer();

                this.cancelGMStorageCommand();

                return;

            }


            GranadaMon.Menu.selectedPokemon =
                pokemon;


            SceneManager.push(
                Scene_GranadaMonSummary
            );

        };


    // =========================================================
    // MOVER AL EQUIPO
    // =========================================================

    Scene_GranadaMonStorage.prototype.commandGMStorageWithdraw =
        function() {

            GM.Storage.ensureData();


            var party =
                $gameSystem
                    ._granadaMonParty;


            // HAY HUECO

            if (
                party.length < 6
            ) {

                var success =
                    GM.Storage.withdraw(
                        this._selectedStorageIndex
                    );


                if (success) {

                    SoundManager.playOk();

                }

                else {

                    SoundManager.playBuzzer();

                }


                this._gmStorageCommandWindow.hide();

                this._gmStorageCommandWindow.deactivate();

                this._gmStorageCommandWindow.deselect();


                this.refreshGMStorageList();

                return;

            }


            // EQUIPO LLENO

            this._gmStorageCommandWindow.hide();

            this._gmStorageCommandWindow.deactivate();

            this._gmStorageCommandWindow.deselect();


            this._gmStoragePartyPicker.refresh();

            this._gmStoragePartyPicker.show();

            this._gmStoragePartyPicker.activate();

            this._gmStoragePartyPicker.select(0);

        };


    // =========================================================
    // INTERCAMBIAR
    // =========================================================

    Scene_GranadaMonStorage.prototype.onGMStoragePartyOk =
        function() {

            var partyIndex =
                this._gmStoragePartyPicker.index();


            var success =
                GM.Storage.swap(
                    this._selectedStorageIndex,
                    partyIndex
                );


            if (success) {

                SoundManager.playOk();

            }

            else {

                SoundManager.playBuzzer();

            }


            this._gmStoragePartyPicker.hide();

            this._gmStoragePartyPicker.deactivate();

            this._gmStoragePartyPicker.deselect();


            this.refreshGMStorageList();

        };


    Scene_GranadaMonStorage.prototype.onGMStoragePartyCancel =
        function() {

            this._gmStoragePartyPicker.hide();

            this._gmStoragePartyPicker.deactivate();

            this._gmStoragePartyPicker.deselect();


            this._gmStorageCommandWindow.show();

            this._gmStorageCommandWindow.activate();

            this._gmStorageCommandWindow.select(1);

        };


    // =========================================================
    // CANCELAR MENÚ
    // =========================================================

    Scene_GranadaMonStorage.prototype.cancelGMStorageCommand =
        function() {

            this._gmStorageCommandWindow.hide();

            this._gmStorageCommandWindow.deactivate();

            this._gmStorageCommandWindow.deselect();


            this._storageWindow.activate();

        };


    // =========================================================
    // REFRESCAR
    // =========================================================

    Scene_GranadaMonStorage.prototype.refreshGMStorageList =
        function() {

            GM.Storage.ensureData();


            this._storageWindow.refresh();

            this._storageWindow.activate();


            var storageLength =
                $gameSystem
                    ._granadaMonStorage
                    .length;


            if (
                storageLength <= 0
            ) {

                this._storageWindow.select(0);

            }

            else {

                this._storageWindow.select(

                    Math.min(
                        this._selectedStorageIndex,
                        storageLength - 1
                    )

                );

            }

        };


    // =========================================================
    // PARTIDAS GUARDADAS
    // =========================================================

    var _DataManager_extractSaveContents =
        DataManager.extractSaveContents;


    DataManager.extractSaveContents =
        function(contents) {

            _DataManager_extractSaveContents.call(
                this,
                contents
            );


            GM.Storage.ensureData();

        };


    if (
        window.$gameSystem
    ) {

        GM.Storage.ensureData();

    }


    console.log(
        'GranadaMon Storage v1.1 cargado correctamente.'
    );


})();