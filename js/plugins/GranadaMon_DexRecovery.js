/*:
 * @plugindesc v4.0 GranadaMon - Pokédex original + fichas restauradas + recuperación
 * @author OpenAI
 *
 * @help
 * GranadaMon_DexRecovery.js
 * ------------------------------------------------------------
 * REQUIERE:
 * - GranadaMon_State
 * - GranadaMon_Dex
 *
 * OBJETIVO:
 * - Restaurar completamente la apertura de las fichas Pokédex.
 * - NO modificar visualmente la ficha original.
 * - Mantener imagen, tipo, estadísticas, evolución y descripción.
 * - Añadir acceso a TUS POKÉMON.
 * - Añadir recuperación mediante código.
 *
 * COLOCAR DESPUÉS DE:
 * GranadaMon_Dex
 * GranadaMon_BattleClassic
 */

(function() {

    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;


    // =========================================================
    // DEPENDENCIAS
    // =========================================================

    if (!GM.State) {

        throw new Error(
            'GranadaMon_DexRecovery necesita GranadaMon_State.js'
        );

    }


    if (
        !GM.Dex ||
        typeof Scene_GranadaDexEntry ===
        'undefined'
    ) {

        throw new Error(
            'GranadaMon_DexRecovery necesita GranadaMon_Dex.js'
        );

    }


    GM.DexRecovery =
        GM.DexRecovery || {};


    var DR =
        GM.DexRecovery;


    DR.VERSION =
        '4.0';


    // =========================================================
    // CÓDIGOS DE RECUPERACIÓN
    // =========================================================

    DR.codes = {

         1:'5426',
         2:'2370',
         3:'9407',
         4:'6154',
         5:'8798',
         6:'2725',
         7:'4736',
         8:'1672',
         9:'5884',
        10:'4392',

        11:'3080',
        12:'1933',
        13:'4678',
        14:'1636',
        15:'1096',
        16:'4572',
        17:'3698',
        18:'4468',
        19:'6427',
        20:'1699',

        21:'2595',
        22:'7485',
        23:'1796',
        24:'5784',
        25:'3023',
        26:'7916',
        27:'1505',
        28:'1617',
        29:'1788',
        30:'9680',

        31:'7372',
        32:'2715',
        33:'1875',
        34:'3975',
        35:'9401',
        36:'4309',
        37:'2532',
        38:'5433',
        39:'7973',
        40:'4335',

        41:'9414',
        42:'2077',
        43:'1641',
        44:'4764',
        45:'7651',
        46:'6180',
        47:'6282',
        48:'9386',
        49:'7504',
        50:'1596',

        51:'3855',
        52:'2551',
        53:'5255',
        54:'9540',
        55:'4355',
        56:'9614',
        57:'9221',
        58:'5593',
        59:'9133',
        60:'3633',

        61:'8850',
        62:'8170',
        63:'8990',
        64:'7474',
        65:'7252',
        66:'1444',
        67:'2308',
        68:'1339',
        69:'7288',
        70:'7233',

        71:'2500',
        72:'7502',
        73:'8615',
        74:'5756',
        75:'7657',
        76:'4089',
        77:'6100',
        78:'7907',
        79:'1757',
        80:'9920',

        81:'3321',
        82:'4749',
        83:'4361',
        84:'2817',
        85:'1852',
        86:'1848',
        87:'2521',
        88:'1269',
        89:'5624',
        90:'3002',

        91:'2877',
        92:'9941',
        93:'5887',
        94:'6145',
        95:'9500',
        96:'2765',
        97:'5155',
        98:'9594',
        99:'2505',
       100:'5649'

    };


    // =========================================================
    // CÓDIGO
    // =========================================================

    DR.codeFor =
        function(granadaDex) {

            return String(

                DR.codes[
                    Number(
                        granadaDex ||
                        0
                    )
                ] ||

                ''

            );

        };


    DR.verifyCode =
        function(
            granadaDex,
            code
        ) {

            return (

                DR.codeFor(
                    granadaDex
                ) ===

                String(
                    code ||
                    ''
                )

            );

        };


    // =========================================================
    // UTILIDADES
    // =========================================================

    DR.pad3 =
        function(value) {

            var text =
                String(
                    value ||
                    0
                );


            while (
                text.length <
                3
            ) {

                text =
                    '0' +
                    text;

            }


            return text;

        };


    // =========================================================
    // ESTADO
    // =========================================================

    DR.statusText =
        function(pokemon) {

            if (!pokemon) {

                return '—';

            }


            pokemon =
                GM.State
                    .ensurePokemon(
                        pokemon
                    );


            if (
                pokemon.hp <=
                    0 ||
                pokemon.fainted
            ) {

                return 'DEBILITADO';

            }


            var s =
                String(
                    pokemon.status ||
                    ''
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
                    'NORMAL'
                )

            );

        };


    // =========================================================
    // UBICACIÓN
    // =========================================================

    DR.locationText =
        function(pokemon) {

            var loc =
                GM.State
                    .locationOf(
                        pokemon
                    );


            if (!loc) {

                return 'DESCONOCIDA';

            }


            if (
                loc.type ===
                'PARTY'
            ) {

                return (

                    'EQUIPO · Hueco ' +

                    String(
                        loc.index +
                        1
                    )

                );

            }


            return 'ALMACENAMIENTO';

        };


    // =========================================================
    // TUS EJEMPLARES
    // =========================================================

    DR.ownedBySpecies =
        function(speciesId) {

            var all =
                GM.State
                    .getAllOwnedPokemon();


            var result =
                [];


            for (
                var i = 0;
                i < all.length;
                i++
            ) {

                if (

                    all[i] &&

                    Number(
                        all[i].speciesId
                    ) ===

                    Number(
                        speciesId
                    )

                ) {

                    result.push(

                        GM.State
                            .ensurePokemon(
                                all[i]
                            )

                    );

                }

            }


            return result;

        };


    // =========================================================
    // ESTADÍSTICAS DE BATALLA
    // =========================================================

    DR.battleStats =
        function(speciesId) {

            if (
                GM.BattleClassic &&
                GM.BattleClassic
                    .getDexStats
            ) {

                return GM
                    .BattleClassic
                    .getDexStats(
                        speciesId
                    );

            }


            if (
                GM.BattlePersistence &&
                GM.BattlePersistence
                    .getDexStats
            ) {

                return GM
                    .BattlePersistence
                    .getDexStats(
                        speciesId
                    );

            }


            return {

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

        };


    // =========================================================
    // REPARAR POKÉDEX DESDE LOS POKÉMON QUE YA POSEES
    // =========================================================

    DR.repairDexFromOwned =
        function() {

            if (!$gameSystem) {

                return;

            }


            if (GM.syncDex) {

                GM.syncDex();

            }


            var owned =

                GM.State
                    .getAllOwnedPokemon

                    ? GM.State
                        .getAllOwnedPokemon()

                    : [];


            for (
                var i = 0;
                i < owned.length;
                i++
            ) {

                var pokemon =
                    owned[i];


                if (
                    !pokemon ||
                    pokemon.speciesId ==
                    null
                ) {

                    continue;

                }


                if (GM.markCaught) {

                    GM.markCaught(
                        pokemon.speciesId
                    );

                }

            }


            // caught siempre implica seen

            var dex =

                $gameSystem
                    ._granadaMonDex ||

                [];


            for (
                var j = 0;
                j < dex.length;
                j++
            ) {

                if (
                    dex[j] &&
                    dex[j].caught
                ) {

                    dex[j].seen =
                        true;

                }

            }

        };


    // =========================================================
    // FORZAR APERTURA DE FICHAS DESDE LA LISTA
    // =========================================================

    var _DR_createDexWindow =

        Scene_GranadaMonDex
            .prototype
            .createDexWindow;


    Scene_GranadaMonDex
        .prototype
        .createDexWindow =
        function() {

            DR.repairDexFromOwned();


            _DR_createDexWindow
                .call(
                    this
                );


            if (!this._dexWindow) {

                return;

            }


            this._dexWindow
                .setHandler(

                    'ok',

                    this
                        .onDRDexOk
                        .bind(
                            this
                        )

                );


            this._dexWindow
                .refresh();


            if (
                this._summaryWindow &&
                this._summaryWindow.refresh
            ) {

                this._summaryWindow
                    .refresh();

            }

        };


    Scene_GranadaMonDex
        .prototype
        .onDRDexOk =
        function() {

            var index =

                this._dexWindow

                    ? this._dexWindow
                        .index()

                    : -1;


            if (
                index <
                0
            ) {

                SoundManager.playBuzzer();


                if (this._dexWindow) {

                    this._dexWindow
                        .activate();

                }


                return;

            }


            DR.repairDexFromOwned();


            var dex =

                $gameSystem
                    ._granadaMonDex ||

                [];


            var entry =

                dex[index] ||

                null;


            // No visto = no ficha

            if (

                !entry ||

                (
                    entry.seen !==
                        true &&

                    entry.caught !==
                        true
                )

            ) {

                SoundManager.playBuzzer();


                if (this._dexWindow) {

                    this._dexWindow
                        .activate();

                }


                return;

            }


            if (
                entry.caught
            ) {

                entry.seen =
                    true;

            }


            GM.Dex.selectedIndex =
                index;


            SceneManager.push(
                Scene_GranadaDexEntry
            );

        };


    // =========================================================
    // FICHA ORIGINAL: NO TOCAR REFRESH
    // =========================================================
    //
    // Aquí está la diferencia importante con v2/v3:
    //
    // NO sustituimos win.refresh.
    //
    // GranadaMon_Dex.js sigue dibujando por sí mismo:
    // - IMAGEN
    // - TIPO
    // - REGISTRO
    // - ESTADÍSTICAS BASE
    // - EVOLUCIÓN
    // - DESCRIPCIÓN
    //
    // =========================================================

    var _DR_originalCreateEntryWindow =

        Scene_GranadaDexEntry
            .prototype
            .createEntryWindow;


    Scene_GranadaDexEntry
        .prototype
        .createEntryWindow =
        function() {

            _DR_originalCreateEntryWindow
                .call(
                    this
                );


            var win =
                this._entryWindow;


            if (!win) {

                return;

            }


            // Solo añadimos OK.
            // No redibujamos absolutamente nada.

            win.setHandler(

                'ok',

                this
                    .onDROpenOwned
                    .bind(
                        this
                    )

            );


            win.activate();

            win.select(0);

        };


    // =========================================================
    // ABRIR TUS POKÉMON
    // =========================================================

    Scene_GranadaDexEntry
        .prototype
        .onDROpenOwned =
        function() {

            var species =

                GM.getSpeciesByGranadaDex(

                    GM.Dex.selectedIndex +
                    1

                );


            if (!species) {

                SoundManager.playBuzzer();


                if (this._entryWindow) {

                    this._entryWindow
                        .activate();

                }


                return;

            }


            var owned =

                DR.ownedBySpecies(
                    species.nationalDex
                );


            if (
                !owned.length
            ) {

                SoundManager.playBuzzer();


                if (this._entryWindow) {

                    this._entryWindow
                        .activate();

                }


                return;

            }


            SceneManager.push(
                Scene_GranadaDexOwnedV4
            );

        };


    // =========================================================
    // ESCENA TUS POKÉMON
    // =========================================================

    function Scene_GranadaDexOwnedV4() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Scene_GranadaDexOwnedV4.prototype =

        Object.create(
            Scene_MenuBase.prototype
        );


    Scene_GranadaDexOwnedV4.prototype.constructor =

        Scene_GranadaDexOwnedV4;


    Scene_GranadaDexOwnedV4.prototype.initialize =
        function() {

            Scene_MenuBase
                .prototype
                .initialize
                .call(
                    this
                );


            this._species =
                null;


            this._owned =
                [];


            this._recoveryWindow =
                null;

        };


    Scene_GranadaDexOwnedV4.prototype.create =
        function() {

            Scene_MenuBase
                .prototype
                .create
                .call(
                    this
                );


            this._species =

                GM.getSpeciesByGranadaDex(

                    GM.Dex.selectedIndex +
                    1

                );


            this._owned =

                this._species

                    ? DR.ownedBySpecies(

                        this._species
                            .nationalDex

                    )

                    : [];


            this.createTitleWindow();

            this.createListWindow();

            this.createDetailWindow();


            this._listWindow
                .select(
                    0
                );


            this._listWindow
                .activate();


            this.refreshDetail();

        };


    // =========================================================
    // TÍTULO
    // =========================================================

    Scene_GranadaDexOwnedV4
        .prototype
        .createTitleWindow =
        function() {

            this._titleWindow =

                new Window_DROwnedTitleV4(
                    this._species
                );


            this.addWindow(
                this._titleWindow
            );

        };


    // =========================================================
    // LISTA
    // =========================================================

    Scene_GranadaDexOwnedV4
        .prototype
        .createListWindow =
        function() {

            var y =
                this._titleWindow
                    .height;


            var width =
                290;


            this._listWindow =

                new Window_DROwnedListV4(

                    0,

                    y,

                    width,

                    Graphics.boxHeight -
                    y,

                    this._owned

                );


            this._listWindow
                .setHandler(

                    'ok',

                    this
                        .onPokemonOk
                        .bind(
                            this
                        )

                );


            this._listWindow
                .setHandler(

                    'cancel',

                    this
                        .popScene
                        .bind(
                            this
                        )

                );


            this._listWindow
                .setChangeHandler(

                    this
                        .refreshDetail
                        .bind(
                            this
                        )

                );


            this.addWindow(
                this._listWindow
            );

        };


    // =========================================================
    // DETALLE
    // =========================================================

    Scene_GranadaDexOwnedV4
        .prototype
        .createDetailWindow =
        function() {

            var x =
                this._listWindow
                    .width;


            var y =
                this._titleWindow
                    .height;


            this._detailWindow =

                new Window_DROwnedDetailV4(

                    x,

                    y,

                    Graphics.boxWidth -
                    x,

                    Graphics.boxHeight -
                    y

                );


            this.addWindow(
                this._detailWindow
            );

        };


    Scene_GranadaDexOwnedV4
        .prototype
        .currentPokemon =
        function() {

            return this._listWindow

                ? this._listWindow
                    .item()

                : null;

        };


    Scene_GranadaDexOwnedV4
        .prototype
        .refreshDetail =
        function() {

            if (
                !this._detailWindow ||
                !this._listWindow
            ) {

                return;

            }


            this._detailWindow
                .setPokemon(

                    this.currentPokemon(),

                    this._species

                );

        };


    // =========================================================
    // OK
    // =========================================================

    Scene_GranadaDexOwnedV4
        .prototype
        .onPokemonOk =
        function() {

            var pokemon =
                this.currentPokemon();


            if (!pokemon) {

                SoundManager.playBuzzer();

                this._listWindow
                    .activate();

                return;

            }


            pokemon =
                GM.State
                    .ensurePokemon(
                        pokemon
                    );


            if (
                pokemon.hp >
                    0 &&
                !pokemon.fainted
            ) {

                SoundManager.playBuzzer();


                this._detailWindow
                    .setNotice(
                        'Este Pokémon no está debilitado.'
                    );


                this._listWindow
                    .activate();


                return;

            }


            this.openRecoveryInput(
                pokemon
            );

        };


    // =========================================================
    // RECUPERACIÓN
    // =========================================================

    Scene_GranadaDexOwnedV4
        .prototype
        .openRecoveryInput =
        function(pokemon) {

            this._listWindow
                .deactivate();


            var width =
                470;


            var height =
                300;


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


            this._recoveryWindow =

                new Window_DRRecoveryCodeV4(

                    x,

                    y,

                    width,

                    height,

                    pokemon,

                    this._species

                );


            this._recoveryWindow
                .setHandler(

                    'ok',

                    this
                        .onRecoveryConfirm
                        .bind(
                            this
                        )

                );


            this._recoveryWindow
                .setHandler(

                    'cancel',

                    this
                        .onRecoveryCancel
                        .bind(
                            this
                        )

                );


            this.addWindow(
                this._recoveryWindow
            );


            this._recoveryWindow
                .select(
                    0
                );


            this._recoveryWindow
                .activate();

        };


    Scene_GranadaDexOwnedV4
        .prototype
        .onRecoveryConfirm =
        function() {

            var win =
                this._recoveryWindow;


            if (!win) {

                return;

            }


            var pokemon =
                win.pokemon();


            var code =
                win.code();


            var granadaDex =

                this._species

                    ? this._species
                        .granadaDex

                    : 0;


            if (
                !DR.verifyCode(
                    granadaDex,
                    code
                )
            ) {

                SoundManager.playBuzzer();


                win.setError(
                    'Código incorrecto'
                );


                win.activate();


                return;

            }


            var revived =

                GM.State.revive(

                    pokemon,

                    0.50

                );


            if (!revived) {

                SoundManager.playBuzzer();


                win.setError(
                    'Este Pokémon ya puede combatir'
                );


                win.activate();


                return;

            }


            if (
                GM.State.clearStatus
            ) {

                GM.State.clearStatus(
                    pokemon
                );

            }


            if (
                SoundManager.playRecovery
            ) {

                SoundManager.playRecovery();

            }

            else {

                SoundManager.playOk();

            }


            this.removeRecoveryWindow();


            this._listWindow
                .refresh();


            this.refreshDetail();


            this._detailWindow
                .setNotice(

                    '✓ ' +
                    pokemon.name +
                    ' se ha recuperado al 50% de PS.'

                );


            this._listWindow
                .activate();

        };


    Scene_GranadaDexOwnedV4
        .prototype
        .onRecoveryCancel =
        function() {

            SoundManager.playCancel();


            this.removeRecoveryWindow();


            this._listWindow
                .activate();

        };


    Scene_GranadaDexOwnedV4
        .prototype
        .removeRecoveryWindow =
        function() {

            if (
                !this._recoveryWindow
            ) {

                return;

            }


            this._recoveryWindow
                .deactivate();


            this._recoveryWindow
                .hide();


            if (
                this._recoveryWindow
                    .parent
            ) {

                this._recoveryWindow
                    .parent
                    .removeChild(
                        this._recoveryWindow
                    );

            }


            this._recoveryWindow =
                null;

        };


    // =========================================================
    // TÍTULO
    // =========================================================

    function Window_DROwnedTitleV4() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_DROwnedTitleV4.prototype =

        Object.create(
            Window_Base.prototype
        );


    Window_DROwnedTitleV4.prototype.constructor =

        Window_DROwnedTitleV4;


    Window_DROwnedTitleV4.prototype.initialize =
        function(species) {

            this._species =
                species;


            Window_Base
                .prototype
                .initialize
                .call(

                    this,

                    0,

                    0,

                    Graphics.boxWidth,

                    72

                );


            this.refresh();

        };


    Window_DROwnedTitleV4.prototype.refresh =
        function() {

            this.contents.clear();


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                this._species

                    ? '#' +

                      DR.pad3(
                          this._species
                              .granadaDex
                      ) +

                      ' ' +

                      this._species
                          .name +

                      ' · TUS POKÉMON'

                    : 'TUS POKÉMON',

                0,

                0,

                this.contentsWidth(),

                'center'

            );


            this.resetTextColor();

        };


    // =========================================================
    // LISTA
    // =========================================================

    function Window_DROwnedListV4() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_DROwnedListV4.prototype =

        Object.create(
            Window_Selectable.prototype
        );


    Window_DROwnedListV4.prototype.constructor =

        Window_DROwnedListV4;


    Window_DROwnedListV4.prototype.initialize =
        function(
            x,
            y,
            width,
            height,
            data
        ) {

            this._data =
                data ||
                [];


            this._changeHandler =
                null;


            Window_Selectable
                .prototype
                .initialize
                .call(

                    this,

                    x,

                    y,

                    width,

                    height

                );


            this.refresh();

        };


    Window_DROwnedListV4.prototype.maxItems =
        function() {

            return this._data
                .length;

        };


    Window_DROwnedListV4.prototype.itemHeight =
        function() {

            return 88;

        };


    Window_DROwnedListV4.prototype.item =
        function() {

            return this.index() >=
                0

                    ? this._data[
                        this.index()
                      ]

                    : null;

        };


    Window_DROwnedListV4.prototype.setChangeHandler =
        function(handler) {

            this._changeHandler =
                handler;

        };


    Window_DROwnedListV4.prototype.select =
        function(index) {

            var old =
                this.index();


            Window_Selectable
                .prototype
                .select
                .call(
                    this,
                    index
                );


            if (
                old !==
                    index &&
                this._changeHandler
            ) {

                this._changeHandler();

            }

        };


    Window_DROwnedListV4.prototype.drawItem =
        function(index) {

            var pokemon =
                this._data[
                    index
                ];


            if (!pokemon) {

                return;

            }


            pokemon =
                GM.State
                    .ensurePokemon(
                        pokemon
                    );


            var rect =
                this.itemRect(
                    index
                );


            var x =
                rect.x +
                6;


            var y =
                rect.y +
                2;


            var width =
                rect.width -
                12;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                pokemon.nickname ||
                pokemon.name,

                x,

                y,

                width -
                72

            );


            this.resetTextColor();


            this.drawText(

                'Nv. ' +
                pokemon.level,

                x +
                width -
                72,

                y,

                72,

                'right'

            );


            y +=
                this.lineHeight();


            this.drawText(

                'PS ' +
                pokemon.hp +
                ' / ' +
                pokemon.maxHp,

                x,

                y,

                width

            );


            y +=
                this.lineHeight();


            if (
                pokemon.hp <=
                    0 ||
                pokemon.fainted
            ) {

                this.changeTextColor(
                    this.textColor(
                        18
                    )
                );

            }


            this.drawText(

                DR.statusText(
                    pokemon
                ),

                x,

                y,

                width

            );


            this.resetTextColor();

        };


    Window_DROwnedListV4.prototype.refresh =
        function() {

            this.createContents();

            this.drawAllItems();

        };


    // =========================================================
    // DETALLE
    // =========================================================

    function Window_DROwnedDetailV4() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_DROwnedDetailV4.prototype =

        Object.create(
            Window_Base.prototype
        );


    Window_DROwnedDetailV4.prototype.constructor =

        Window_DROwnedDetailV4;


    Window_DROwnedDetailV4.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._pokemon =
                null;


            this._species =
                null;


            this._notice =
                '';


            this._noticeFrames =
                0;


            Window_Base
                .prototype
                .initialize
                .call(

                    this,

                    x,

                    y,

                    width,

                    height

                );

        };


    Window_DROwnedDetailV4.prototype.setPokemon =
        function(
            pokemon,
            species
        ) {

            this._pokemon =

                pokemon

                    ? GM.State
                        .ensurePokemon(
                            pokemon
                        )

                    : null;


            this._species =
                species ||
                null;


            this.refresh();

        };


    Window_DROwnedDetailV4.prototype.setNotice =
        function(text) {

            this._notice =
                String(
                    text ||
                    ''
                );


            this._noticeFrames =
                240;


            this.refresh();

        };


    Window_DROwnedDetailV4.prototype.update =
        function() {

            Window_Base
                .prototype
                .update
                .call(
                    this
                );


            if (
                this._noticeFrames >
                0
            ) {

                this._noticeFrames--;


                if (
                    this._noticeFrames ===
                    0
                ) {

                    this._notice =
                        '';


                    this.refresh();

                }

            }

        };


    Window_DROwnedDetailV4.prototype.refresh =
        function() {

            this.contents.clear();


            var pokemon =
                this._pokemon;


            if (!pokemon) {

                this.drawText(

                    'No hay ningún ejemplar seleccionado.',

                    0,

                    0,

                    this.contentsWidth(),

                    'center'

                );


                return;

            }


            pokemon =
                GM.State
                    .ensurePokemon(
                        pokemon
                    );


            var W =
                this.contentsWidth();


            var line =
                this.lineHeight();


            var y =
                0;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                pokemon.nickname ||
                pokemon.name,

                0,

                y,

                W -
                100

            );


            this.resetTextColor();


            this.drawText(

                'Nv. ' +
                pokemon.level,

                W -
                100,

                y,

                100,

                'right'

            );


            y +=
                line +
                5;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(
                'PS',
                0,
                y,
                95
            );


            this.resetTextColor();


            this.drawText(

                pokemon.hp +
                ' / ' +
                pokemon.maxHp,

                105,

                y,

                W -
                105

            );


            y +=
                line;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(
                'Estado',
                0,
                y,
                95
            );


            this.resetTextColor();


            if (
                pokemon.hp <=
                    0 ||
                pokemon.fainted
            ) {

                this.changeTextColor(
                    this.textColor(
                        18
                    )
                );

            }


            this.drawText(

                DR.statusText(
                    pokemon
                ),

                105,

                y,

                W -
                105

            );


            this.resetTextColor();


            y +=
                line;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(
                'Ubicación',
                0,
                y,
                95
            );


            this.resetTextColor();


            this.drawText(

                DR.locationText(
                    pokemon
                ),

                105,

                y,

                W -
                105

            );


            y +=
                line *
                1.5;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                'MOVIMIENTOS / PP',

                0,

                y,

                W

            );


            this.resetTextColor();


            y +=
                line;


            var moves =
                pokemon.moves ||
                [];


            for (
                var i = 0;
                i <
                    moves.length &&
                i <
                    4;
                i++
            ) {

                var move =
                    moves[i];


                if (!move) {

                    continue;

                }


                var moveData =

                    GM.getMove

                        ? GM.getMove(
                            move.id
                        )

                        : null;


                var moveName =

                    move.name ||

                    (
                        moveData

                            ? moveData.name

                            : 'Movimiento ' +
                              String(
                                  i +
                                  1
                              )
                    );


                var maxPP =

                    move.maxPP !=
                    null

                        ? move.maxPP

                        : (
                            moveData

                                ? moveData.pp

                                : 0
                        );


                this.drawText(

                    moveName,

                    8,

                    y,

                    W -
                    150

                );


                this.drawText(

                    Number(
                        move.currentPP ||
                        0
                    ) +

                    ' / ' +

                    Number(
                        maxPP ||
                        0
                    ) +

                    ' PP',

                    W -
                    145,

                    y,

                    140,

                    'right'

                );


                y +=
                    line;

            }


            y +=
                5;


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                'HISTORIAL',

                0,

                y,

                W

            );


            this.resetTextColor();


            y +=
                line;


            var record =
                pokemon.battleRecord ||
                {};


            this.drawText(

                'Combates: ' +
                Number(
                    record.battles ||
                    0
                ),

                8,

                y,

                Math.floor(
                    W /
                    2
                )

            );


            this.drawText(

                'Victorias: ' +
                Number(
                    record.wins ||
                    0
                ),

                Math.floor(
                    W /
                    2
                ),

                y,

                Math.floor(
                    W /
                    2
                ) -
                8,

                'right'

            );


            y +=
                line;


            this.drawText(

                'Veces debilitado: ' +
                Number(
                    record.faints ||
                    0
                ),

                8,

                y,

                W

            );


            var footerY =

                this.contentsHeight() -

                line *
                2;


            this.contents.clearRect(

                0,

                footerY -
                2,

                W,

                line *
                2 +
                4

            );


            if (
                this._notice
            ) {

                this.changeTextColor(
                    this.systemColor()
                );


                this.drawText(

                    this._notice,

                    0,

                    footerY,

                    W,

                    'center'

                );


                this.resetTextColor();

            }

            else if (
                pokemon.hp <=
                    0 ||
                pokemon.fainted
            ) {

                this.changeTextColor(
                    this.textColor(
                        18
                    )
                );


                this.drawText(

                    'DEBILITADO',

                    0,

                    footerY,

                    W,

                    'center'

                );


                this.resetTextColor();


                this.changeTextColor(
                    this.systemColor()
                );


                this.drawText(

                    'OK: introducir código de recuperación',

                    0,

                    footerY +
                    line,

                    W,

                    'center'

                );


                this.resetTextColor();

            }

            else {

                this.changeTextColor(
                    this.systemColor()
                );


                this.drawText(

                    'Este Pokémon puede combatir.',

                    0,

                    footerY +
                    line,

                    W,

                    'center'

                );


                this.resetTextColor();

            }

        };


    // =========================================================
    // INPUT DE CÓDIGO
    // =========================================================

    function Window_DRRecoveryCodeV4() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_DRRecoveryCodeV4.prototype =

        Object.create(
            Window_Selectable.prototype
        );


    Window_DRRecoveryCodeV4.prototype.constructor =

        Window_DRRecoveryCodeV4;


    Window_DRRecoveryCodeV4.prototype.initialize =
        function(
            x,
            y,
            width,
            height,
            pokemon,
            species
        ) {

            this._pokemon =
                pokemon;


            this._species =
                species;


            this._digits =
                [
                    0,
                    0,
                    0,
                    0
                ];


            this._error =
                '';


            Window_Selectable
                .prototype
                .initialize
                .call(

                    this,

                    x,

                    y,

                    width,

                    height

                );


            this.refresh();

        };


    Window_DRRecoveryCodeV4.prototype.pokemon =
        function() {

            return this._pokemon;

        };


    Window_DRRecoveryCodeV4.prototype.maxItems =
        function() {

            return 4;

        };


    Window_DRRecoveryCodeV4.prototype.maxCols =
        function() {

            return 4;

        };


    Window_DRRecoveryCodeV4.prototype.itemWidth =
        function() {

            return 78;

        };


    Window_DRRecoveryCodeV4.prototype.spacing =
        function() {

            return 12;

        };


    Window_DRRecoveryCodeV4.prototype.itemRect =
        function(index) {

            var rect =
                new Rectangle();


            var total =

                this.maxCols() *
                this.itemWidth() +

                (
                    this.maxCols() -
                    1
                ) *

                this.spacing();


            var start =
                Math.floor(

                    (
                        this.contentsWidth() -
                        total
                    ) /

                    2

                );


            rect.width =
                this.itemWidth();


            rect.height =
                70;


            rect.x =

                start +

                index *

                (
                    this.itemWidth() +
                    this.spacing()
                );


            rect.y =
                88;


            return rect;

        };


    Window_DRRecoveryCodeV4.prototype.drawItem =
        function(index) {

            var rect =
                this.itemRect(
                    index
                );


            this.contents.fontSize =
                38;


            this.drawText(

                String(
                    this._digits[
                        index
                    ]
                ),

                rect.x,

                rect.y +
                8,

                rect.width,

                50,

                'center'

            );


            this.contents.fontSize =
                this.standardFontSize();

        };


    Window_DRRecoveryCodeV4.prototype.code =
        function() {

            return this._digits.join(
                ''
            );

        };


    Window_DRRecoveryCodeV4.prototype.setError =
        function(text) {

            this._error =
                String(
                    text ||
                    ''
                );


            this.refresh();

        };


    Window_DRRecoveryCodeV4.prototype.cursorUp =
        function() {

            var index =
                Math.max(
                    0,
                    this.index()
                );


            this._digits[
                index
            ] =

                (
                    this._digits[
                        index
                    ] +
                    1
                ) %

                10;


            this._error =
                '';


            SoundManager.playCursor();


            this.refresh();


            this.select(
                index
            );

        };


    Window_DRRecoveryCodeV4.prototype.cursorDown =
        function() {

            var index =
                Math.max(
                    0,
                    this.index()
                );


            this._digits[
                index
            ] =

                (
                    this._digits[
                        index
                    ] +
                    9
                ) %

                10;


            this._error =
                '';


            SoundManager.playCursor();


            this.refresh();


            this.select(
                index
            );

        };


    Window_DRRecoveryCodeV4.prototype.refresh =
        function() {

            this.contents.clear();


            var W =
                this.contentsWidth();


            var name =

                this._pokemon

                    ? (
                        this._pokemon
                            .nickname ||

                        this._pokemon
                            .name
                    )

                    : 'Pokémon';


            this.changeTextColor(
                this.systemColor()
            );


            this.contents.fontSize =
                24;


            this.drawText(

                'CÓDIGO DE RECUPERACIÓN',

                0,

                0,

                W,

                'center'

            );


            this.contents.fontSize =
                this.standardFontSize();


            this.resetTextColor();


            this.drawText(

                name +
                ' está debilitado',

                0,

                38,

                W,

                'center'

            );


            this.drawAllItems();


            this.changeTextColor(
                this.systemColor()
            );


            this.drawText(

                '← → elegir cifra   ·   ↑ ↓ cambiar número',

                0,

                170,

                W,

                'center'

            );


            this.drawText(

                'OK confirmar   ·   Esc cancelar',

                0,

                200,

                W,

                'center'

            );


            this.resetTextColor();


            if (
                this._error
            ) {

                this.changeTextColor(
                    this.textColor(
                        18
                    )
                );


                this.drawText(

                    '✕ ' +
                    this._error,

                    0,

                    228,

                    W,

                    'center'

                );


                this.resetTextColor();

            }

        };


    // =========================================================
    // PÚBLICO
    // =========================================================

    window.Scene_GranadaDexOwnedV4 =
        Scene_GranadaDexOwnedV4;


    console.log(
        'GranadaMon_DexRecovery v4.0 cargado correctamente. Fichas restauradas.'
    );

})();