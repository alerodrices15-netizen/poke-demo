/*:
 * @plugindesc v1.2 GranadaMon - Interfaz visual para Equipo Pokémon y Almacenamiento
 * @author OpenAI
 *
 * @help
 * GranadaMon_StorageVisual.js
 * ------------------------------------------------------------
 * Colócalo DEBAJO de:
 * - GranadaMon_Menu.js
 * - GranadaMon_Core.js
 * - GranadaMon_Storage.js
 * - GranadaMon_Dex.js (opcional pero recomendado)
 *
 * Mejora visualmente:
 * - Pantalla Pokémon -> EQUIPO POKÉMON.
 * - Pantalla de almacenamiento -> ALMACENAMIENTO.
 * - Sustituye "Slot" por "Posición".
 * - Muestra miniatura del Pokémon usando GMDEX_###_Nombre.png.
 * - Tarjetas grandes tipo Pokédex.
 * - Muestra nivel, PS, tipos y etiqueta especial si procede.
 *
 * v1.2:
 * - "Cajas Pokémon" pasa a llamarse "Almacenamiento".
 * - Corregido también el texto de la pantalla vacía.
 */

(function() {

    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;


    if (
        typeof Scene_GranadaMonParty === 'undefined' ||
        typeof Scene_GranadaMonStorage === 'undefined'
    ) {

        throw new Error(
            'GranadaMon_StorageVisual necesita GranadaMon_Menu.js y GranadaMon_Storage.js encima.'
        );

    }


    GM.StorageVisual =
        GM.StorageVisual || {};

    GM.StorageVisual.version =
        '1.2';


    GM.StorageVisual.c = {

        bg1:
            '#1b2230',

        bg2:
            '#0b1017',

        panel1:
            '#232a39',

        panel2:
            '#111720',

        border:
            '#d9d5e3',

        softBorder:
            '#676b82',

        teal:
            '#79dfca',

        blue:
            '#8ebcff',

        gold:
            '#f5d76e',

        white:
            '#f7f7fa',

        soft:
            '#d9dce7',

        muted:
            '#969db0'

    };


    // =========================================================
    // OCULTAR MARCOS MV
    // =========================================================

    GM.StorageVisual.clearChrome =
        function(win) {

            if (!win) {
                return;
            }

            win.opacity =
                0;

            win.backOpacity =
                0;

        };


    // =========================================================
    // PANEL
    // =========================================================

    GM.StorageVisual.frame =
        function(
            win,
            x,
            y,
            width,
            height,
            options
        ) {

            if (
                !win ||
                !win.contents
            ) {

                return;

            }


            options =
                options || {};


            var c =
                GM.StorageVisual.c;


            var top =
                options.top ||
                c.panel1;


            var bottom =
                options.bottom ||
                c.panel2;


            var border =
                options.border ||
                c.softBorder;


            win.contents.gradientFillRect(

                x,
                y,

                width,
                height,

                top,
                bottom,

                false

            );


            win.contents.fillRect(
                x,
                y,
                width,
                2,
                border
            );


            win.contents.fillRect(
                x,
                y + height - 2,
                width,
                2,
                border
            );


            win.contents.fillRect(
                x,
                y,
                2,
                height,
                border
            );


            win.contents.fillRect(
                x + width - 2,
                y,
                2,
                height,
                border
            );


            if (
                width > 12 &&
                height > 12
            ) {

                win.contents.fillRect(
                    x + 5,
                    y + 5,
                    width - 10,
                    1,
                    '#34394b'
                );


                win.contents.fillRect(
                    x + 5,
                    y + height - 6,
                    width - 10,
                    1,
                    '#252a39'
                );

            }


            if (
                options.accent
            ) {

                win.contents.fillRect(

                    x + 2,
                    y + 2,

                    width - 4,
                    3,

                    options.accent

                );

            }

        };


    // =========================================================
    // TEXTO
    // =========================================================

    GM.StorageVisual.text =
        function(
            win,
            text,
            x,
            y,
            width,
            height,
            align,
            color,
            size,
            bold
        ) {

            if (
                !win ||
                !win.contents
            ) {

                return;

            }


            var oldSize =
                win.contents.fontSize;


            var oldBold =
                win.contents.fontBold;


            win.contents.fontSize =
                size ||
                oldSize;


            win.contents.fontBold =
                !!bold;


            if (
                color
            ) {

                win.changeTextColor(
                    color
                );

            }


            win.contents.drawText(

                String(
                    text || ''
                ),

                x,
                y,

                width,
                height,

                align ||
                'left'

            );


            win.resetTextColor();


            win.contents.fontSize =
                oldSize;


            win.contents.fontBold =
                oldBold;

        };


    // =========================================================
    // ESPECIE
    // =========================================================

    GM.StorageVisual.speciesOf =
        function(mon) {

            if (
                !mon ||
                !GM.getSpecies
            ) {

                return null;

            }


            return (
                GM.getSpecies(
                    mon.speciesId
                ) ||
                null
            );

        };


    GM.StorageVisual.pad3 =
        function(value) {

            var text =
                String(
                    value == null
                        ? '?'
                        : value
                );


            while (
                text.length < 3
            ) {

                text =
                    '0' +
                    text;

            }


            return text;

        };


    GM.StorageVisual.prettyType =
        function(type) {

            var names = {

                ELECTRICO:
                    'ELÉCTRICO',

                PSIQUICO:
                    'PSÍQUICO',

                DRAGON:
                    'DRAGÓN'

            };


            return (
                names[type] ||
                type ||
                '—'
            );

        };


    // =========================================================
    // IMÁGENES
    // =========================================================

    GM.StorageVisual.imageNameForSpecies =
        function(species) {

            if (
                !species
            ) {

                return '';

            }


            var number =
                GM.StorageVisual.pad3(
                    species.granadaDex
                );


            var safeName =
                String(
                    species.name || ''
                ).replace(
                    /[^A-Za-z0-9]/g,
                    ''
                );


            return (
                'GMDEX_' +
                number +
                '_' +
                safeName
            );

        };


    // =========================================================
    // ETIQUETAS ESPECIALES
    // =========================================================

    GM.StorageVisual.specialInfo =
        function(species) {

            if (
                !species ||
                !GM.Dex
            ) {

                return null;

            }


            if (
                GM.Dex.isSingular &&
                GM.Dex.isSingular(
                    species
                )
            ) {

                return {

                    text:
                        'SINGULAR',

                    color:
                        '#f4d56a'

                };

            }


            if (
                GM.Dex.isHatch &&
                GM.Dex.isHatch(
                    species
                ) &&
                GM.Dex.hatchStyle
            ) {

                var style =
                    GM.Dex.hatchStyle(
                        species
                    );


                if (
                    style
                ) {

                    return {

                        text:
                            style.label ||
                            'ECLOSIÓN',

                        color:
                            style.accent2 ||
                            style.accent ||
                            '#ffffff'

                    };

                }

            }


            return null;

        };


    // =========================================================
    // CARGA IMÁGENES
    // =========================================================

    GM.StorageVisual.requestImageRefresh =
        function(
            win,
            bitmap,
            key
        ) {

            if (
                !win ||
                !bitmap ||
                !key
            ) {

                return;

            }


            win._gmLoadingCallbacks =
                win._gmLoadingCallbacks ||
                {};


            if (
                win._gmLoadingCallbacks[
                    key
                ]
            ) {

                return;

            }


            win._gmLoadingCallbacks[
                key
            ] =
                true;


            bitmap.addLoadListener(

                function() {

                    win._gmLoadingCallbacks[
                        key
                    ] =
                        false;


                    if (
                        win &&
                        win.refresh
                    ) {

                        win.refresh();

                    }

                }

            );

        };


    GM.StorageVisual.drawThumb =
        function(
            win,
            mon,
            x,
            y,
            width,
            height
        ) {

            var species =
                GM.StorageVisual.speciesOf(
                    mon
                );


            var filename =
                GM.StorageVisual.imageNameForSpecies(
                    species
                );


            if (
                !filename
            ) {

                return;

            }


            var bitmap =
                ImageManager.loadPicture(
                    filename
                );


            if (
                !bitmap.isReady()
            ) {

                GM.StorageVisual.requestImageRefresh(

                    win,
                    bitmap,
                    filename

                );

                return;

            }


            var scale =
                Math.min(

                    width /
                    bitmap.width,

                    height /
                    bitmap.height

                );


            var drawWidth =
                Math.max(

                    1,

                    Math.floor(

                        bitmap.width *
                        scale

                    )

                );


            var drawHeight =
                Math.max(

                    1,

                    Math.floor(

                        bitmap.height *
                        scale

                    )

                );


            var drawX =

                x +

                Math.floor(

                    (
                        width -
                        drawWidth
                    ) /
                    2

                );


            var drawY =

                y +

                Math.floor(

                    (
                        height -
                        drawHeight
                    ) /
                    2

                );


            win.contents.blt(

                bitmap,

                0,
                0,

                bitmap.width,
                bitmap.height,

                drawX,
                drawY,

                drawWidth,
                drawHeight

            );

        };


    // =========================================================
    // TARJETA POKÉMON
    // =========================================================

    GM.StorageVisual.drawPokemonCard =
        function(
            win,
            rect,
            mon,
            index,
            options
        ) {

            options =
                options || {};


            var c =
                GM.StorageVisual.c;


            var focused =
                !!options.focused;


            var showPosition =
                options.showPosition !== false;


            var emptyText =
                options.emptyText ||
                'Hueco libre';


            var positionLabel =
                options.positionLabel ||
                (
                    'POS. ' +
                    (
                        index +
                        1
                    )
                );


            var x =
                rect.x +
                4;


            var y =
                rect.y +
                4;


            var width =
                rect.width -
                8;


            var height =
                rect.height -
                8;


            // =================================================
            // FONDO
            // =========================================================

            GM.StorageVisual.frame(

                win,

                x,
                y,

                width,
                height,

                {
                    top:

                        focused

                            ? '#302a3d'

                            : mon

                                ? '#202632'

                                : '#181d25',

                    bottom:

                        focused

                            ? '#17141f'

                            : mon

                                ? '#10151c'

                                : '#0d1219',

                    border:

                        focused

                            ? c.gold

                            : mon

                                ? c.softBorder

                                : '#4d5565',

                    accent:

                        focused

                            ? c.gold

                            : mon

                                ? c.blue

                                : null
                }

            );


            // =================================================
            // CURSOR
            // =========================================================

            if (
                focused
            ) {

                GM.StorageVisual.text(

                    win,

                    '>',

                    x + 8,
                    y,

                    20,
                    height,

                    'center',

                    c.gold,

                    22,

                    true

                );

            }


            // =================================================
            // IMAGEN
            // =========================================================

            var imageSize =
                Math.min(

                    64,

                    Math.max(
                        56,
                        height - 18
                    )

                );


            var imageX =
                x +
                32;


            var imageY =

                y +

                Math.floor(

                    (
                        height -
                        imageSize
                    ) /
                    2

                );


            GM.StorageVisual.frame(

                win,

                imageX - 4,
                imageY - 4,

                imageSize + 8,
                imageSize + 8,

                {
                    top:
                        '#222938',

                    bottom:
                        '#0e131b',

                    border:

                        focused

                            ? c.gold

                            : c.softBorder
                }

            );


            if (
                mon
            ) {

                GM.StorageVisual.drawThumb(

                    win,
                    mon,

                    imageX,
                    imageY,

                    imageSize,
                    imageSize

                );

            }

            else {

                GM.StorageVisual.text(

                    win,

                    '—',

                    imageX,
                    imageY,

                    imageSize,
                    imageSize,

                    'center',

                    c.muted,

                    24,

                    true

                );

            }


            // =================================================
            // TEXTO
            // =========================================================

            var mainX =

                imageX +
                imageSize +
                20;


            var mainWidth =

                width -
                (
                    mainX -
                    x
                ) -
                16;


            if (
                showPosition
            ) {

                GM.StorageVisual.text(

                    win,

                    positionLabel,

                    mainX,
                    y + 5,

                    110,
                    18,

                    'left',

                    c.blue,

                    13,

                    true

                );

            }


            // =================================================
            // VACÍO
            // =========================================================

            if (
                !mon
            ) {

                GM.StorageVisual.text(

                    win,

                    emptyText,

                    mainX,

                    y +
                    Math.floor(
                        height /
                        2
                    ) -
                    17,

                    mainWidth,
                    26,

                    'left',

                    c.soft,

                    24,

                    true

                );


                GM.StorageVisual.text(

                    win,

                    'Todavía no hay ningún Pokémon en esta posición.',

                    mainX,

                    y +
                    Math.floor(
                        height /
                        2
                    ) +
                    9,

                    mainWidth,
                    18,

                    'left',

                    c.muted,

                    13,

                    false

                );


                return;

            }


            // =================================================
            // DATOS POKÉMON
            // =========================================================

            var species =
                GM.StorageVisual.speciesOf(
                    mon
                );


            var name =

                mon.nickname ||

                mon.name ||

                (
                    species

                        ? species.name

                        : (
                            'Pokémon #' +
                            (
                                mon.speciesId ||
                                '?'
                            )
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


            var types =

                species &&
                species.types

                    ? species.types
                        .map(
                            GM.StorageVisual.prettyType
                        )
                        .join(
                            ' / '
                        )

                    : '—';


            var special =
                GM.StorageVisual.specialInfo(
                    species
                );


            GM.StorageVisual.text(

                win,

                name,

                mainX,

                y +
                Math.floor(
                    height /
                    2
                ) -
                20,

                Math.max(
                    140,
                    mainWidth - 240
                ),

                24,

                'left',

                c.white,

                23,

                true

            );


            GM.StorageVisual.text(

                win,

                'Nv. ' +
                level,

                x +
                width -
                160,

                y +
                Math.floor(
                    height /
                    2
                ) -
                19,

                70,
                22,

                'left',

                focused
                    ? c.gold
                    : c.soft,

                16,

                true

            );


            GM.StorageVisual.text(

                win,

                'PS ' +
                hp +
                ' / ' +
                maxHp,

                x +
                width -
                180,

                y +
                Math.floor(
                    height /
                    2
                ) +
                5,

                150,
                18,

                'right',

                c.teal,

                15,

                false

            );


            GM.StorageVisual.text(

                win,

                types,

                mainX,

                y +
                Math.floor(
                    height /
                    2
                ) +
                6,

                Math.max(
                    180,
                    mainWidth - 190
                ),

                18,

                'left',

                focused
                    ? c.gold
                    : c.muted,

                13,

                false

            );


            if (
                special
            ) {

                GM.StorageVisual.text(

                    win,

                    special.text,

                    x +
                    width -
                    270,

                    y + 5,

                    240,
                    18,

                    'right',

                    special.color,

                    13,

                    true

                );

            }

        };


    // =========================================================
    // TÍTULO
    // =========================================================

    function Window_GMPrettyTitle() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMPrettyTitle.prototype =
        Object.create(
            Window_Base.prototype
        );


    Window_GMPrettyTitle.prototype.constructor =
        Window_GMPrettyTitle;


    Window_GMPrettyTitle.prototype.standardPadding =
        function() {

            return 8;

        };


    Window_GMPrettyTitle.prototype.initialize =
        function(title) {

            this._title =
                title ||
                '';


            Window_Base.prototype.initialize.call(

                this,

                0,
                0,

                Graphics.boxWidth,
                78

            );


            GM.StorageVisual.clearChrome(
                this
            );


            this.refresh();

        };


    Window_GMPrettyTitle.prototype.refresh =
        function() {

            this.contents.clear();


            var c =
                GM.StorageVisual.c;


            var width =
                Math.min(

                    520,

                    this.contentsWidth() -
                    80

                );


            var x =
                Math.floor(

                    (
                        this.contentsWidth() -
                        width
                    ) /
                    2

                );


            var boxY =
                6;


            var boxHeight =
                48;


            GM.StorageVisual.frame(

                this,

                x,
                boxY,

                width,
                boxHeight,

                {
                    top:
                        '#242b3d',

                    bottom:
                        '#101621',

                    border:
                        c.border,

                    accent:
                        c.blue
                }

            );


            GM.StorageVisual.text(

                this,

                this._title,

                x,

                boxY +
                4,

                width,
                28,

                'center',

                c.blue,

                23,

                true

            );

        };


    // =========================================================
    // EQUIPO
    // =========================================================

    function Window_GMPartyVisual() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMPartyVisual.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GMPartyVisual.prototype.constructor =
        Window_GMPartyVisual;


    Window_GMPartyVisual.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._gmVisualIndex =
                -999;


            this._gmVisualActive =
                null;


            Window_Selectable.prototype.initialize.call(

                this,

                x,
                y,

                width,
                height

            );


            GM.StorageVisual.clearChrome(
                this
            );


            this.refresh();

        };


    Window_GMPartyVisual.prototype.standardPadding =
        function() {

            return 12;

        };


    Window_GMPartyVisual.prototype.maxItems =
        function() {

            return 6;

        };


    Window_GMPartyVisual.prototype.itemHeight =
        function() {

            return Math.floor(

                this.contentsHeight() /
                this.maxItems()

            );

        };


    Window_GMPartyVisual.prototype.itemRect =
        function(index) {

            var rect =
                new Rectangle();


            var total =
                this.maxItems();


            var top =
                Math.floor(

                    this.contentsHeight() *
                    index /
                    total

                );


            var bottom =
                Math.floor(

                    this.contentsHeight() *
                    (
                        index +
                        1
                    ) /
                    total

                );


            rect.x =
                0;


            rect.y =
                top;


            rect.width =
                this.contentsWidth();


            rect.height =
                bottom -
                top;


            return rect;

        };


    Window_GMPartyVisual.prototype.pokemon =
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


    Window_GMPartyVisual.prototype.isCurrentItemEnabled =
        function() {

            return true;

        };


    Window_GMPartyVisual.prototype.drawBackgroundPanel =
        function() {

            GM.StorageVisual.frame(

                this,

                0,
                0,

                this.contentsWidth(),
                this.contentsHeight(),

                {
                    top:
                        GM.StorageVisual.c.bg1,

                    bottom:
                        GM.StorageVisual.c.bg2,

                    border:
                        GM.StorageVisual.c.softBorder
                }

            );

        };


    Window_GMPartyVisual.prototype.drawItem =
        function(index) {

            GM.Storage.ensureData();


            var rect =
                this.itemRect(
                    index
                );


            var mon =

                $gameSystem
                    ._granadaMonParty[
                        index
                    ] ||

                null;


            GM.StorageVisual.drawPokemonCard(

                this,

                rect,

                mon,

                index,

                {
                    focused:

                        this.active &&
                        this.index() ===
                            index,

                    showPosition:
                        true,

                    positionLabel:

                        'POS. ' +
                        (
                            index +
                            1
                        ),

                    emptyText:
                        'Hueco libre'
                }

            );

        };


    Window_GMPartyVisual.prototype.refresh =
        function() {

            this.createContents();

            this.contents.clear();

            this.drawBackgroundPanel();

            this.drawAllItems();

        };


    Window_GMPartyVisual.prototype.update =
        function() {

            Window_Selectable.prototype.update.call(
                this
            );


            if (
                this._gmVisualIndex !==
                    this.index() ||
                this._gmVisualActive !==
                    this.active
            ) {

                this._gmVisualIndex =
                    this.index();


                this._gmVisualActive =
                    this.active;


                this.refresh();

            }

        };


    // =========================================================
    // ALMACENAMIENTO
    // =========================================================

    function Window_GMStorageVisualList() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMStorageVisualList.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GMStorageVisualList.prototype.constructor =
        Window_GMStorageVisualList;


    Window_GMStorageVisualList.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._gmVisualIndex =
                -999;


            this._gmVisualActive =
                null;


            Window_Selectable.prototype.initialize.call(

                this,

                x,
                y,

                width,
                height

            );


            GM.StorageVisual.clearChrome(
                this
            );


            this.refresh();

        };


    Window_GMStorageVisualList.prototype.standardPadding =
        function() {

            return 12;

        };


    Window_GMStorageVisualList.prototype.maxItems =
        function() {

            GM.Storage.ensureData();


            return Math.max(

                $gameSystem
                    ._granadaMonStorage
                    .length,

                1

            );

        };


    Window_GMStorageVisualList.prototype.itemHeight =
        function() {

            return 88;

        };


    Window_GMStorageVisualList.prototype.pokemon =
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


    Window_GMStorageVisualList.prototype.isCurrentItemEnabled =
        function() {

            return !!this.pokemon();

        };


    Window_GMStorageVisualList.prototype.drawBackgroundPanel =
        function() {

            GM.StorageVisual.frame(

                this,

                0,
                0,

                this.contentsWidth(),
                this.contentsHeight(),

                {
                    top:
                        GM.StorageVisual.c.bg1,

                    bottom:
                        GM.StorageVisual.c.bg2,

                    border:
                        GM.StorageVisual.c.softBorder
                }

            );

        };


    // =========================================================
    // VACÍO
    // =========================================================

    Window_GMStorageVisualList.prototype.drawEmpty =
        function() {

            var c =
                GM.StorageVisual.c;


            GM.StorageVisual.text(

                this,

                'ALMACENAMIENTO',

                0,

                Math.floor(
                    this.contentsHeight() /
                    2
                ) -
                26,

                this.contentsWidth(),

                26,

                'center',

                c.muted,

                18,

                true

            );


            GM.StorageVisual.text(

                this,

                'No hay Pokémon almacenados.',

                0,

                Math.floor(
                    this.contentsHeight() /
                    2
                ) +
                2,

                this.contentsWidth(),

                24,

                'center',

                c.muted,

                17,

                false

            );

        };


    Window_GMStorageVisualList.prototype.drawItem =
        function(index) {

            GM.Storage.ensureData();


            var storage =
                $gameSystem
                    ._granadaMonStorage;


            var mon =

                storage[
                    index
                ] ||

                null;


            if (
                !mon &&
                storage.length === 0
            ) {

                return;

            }


            GM.StorageVisual.drawPokemonCard(

                this,

                this.itemRect(
                    index
                ),

                mon,

                index,

                {
                    focused:

                        this.active &&
                        this.index() ===
                            index,

                    showPosition:
                        false,

                    emptyText:
                        'Sin Pokémon'
                }

            );

        };


    Window_GMStorageVisualList.prototype.refresh =
        function() {

            this.createContents();

            this.contents.clear();

            this.drawBackgroundPanel();


            GM.Storage.ensureData();


            if (
                $gameSystem
                    ._granadaMonStorage
                    .length <= 0
            ) {

                this.drawEmpty();

            }

            else {

                this.drawAllItems();

            }

        };


    Window_GMStorageVisualList.prototype.update =
        function() {

            Window_Selectable.prototype.update.call(
                this
            );


            if (
                this._gmVisualIndex !==
                    this.index() ||
                this._gmVisualActive !==
                    this.active
            ) {

                this._gmVisualIndex =
                    this.index();


                this._gmVisualActive =
                    this.active;


                this.refresh();

            }

        };


    // =========================================================
    // SELECTOR DE EQUIPO DESDE ALMACENAMIENTO
    // =========================================================

    function Window_GMStorageVisualPicker() {

        this.initialize.apply(
            this,
            arguments
        );

    }


    Window_GMStorageVisualPicker.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GMStorageVisualPicker.prototype.constructor =
        Window_GMStorageVisualPicker;


    Window_GMStorageVisualPicker.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._gmVisualIndex =
                -999;


            this._gmVisualActive =
                null;


            Window_Selectable.prototype.initialize.call(

                this,

                x,
                y,

                width,
                height

            );


            GM.StorageVisual.clearChrome(
                this
            );


            this.hide();

            this.deactivate();

            this.refresh();

        };


    Window_GMStorageVisualPicker.prototype.standardPadding =
        function() {

            return 14;

        };


    Window_GMStorageVisualPicker.prototype.maxItems =
        function() {

            GM.Storage.ensureData();


            return Math.max(

                $gameSystem
                    ._granadaMonParty
                    .length,

                1

            );

        };


    Window_GMStorageVisualPicker.prototype.pokemon =
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


    Window_GMStorageVisualPicker.prototype.isCurrentItemEnabled =
        function() {

            return !!this.pokemon();

        };


    Window_GMStorageVisualPicker.prototype.itemHeight =
        function() {

            return 72;

        };


    Window_GMStorageVisualPicker.prototype.itemRect =
        function(index) {

            var rect =
                Window_Selectable.prototype.itemRect.call(

                    this,
                    index

                );


            rect.y +=
                34;


            return rect;

        };


    Window_GMStorageVisualPicker.prototype.drawItem =
        function(index) {

            var mon =

                $gameSystem
                    ._granadaMonParty[
                        index
                    ] ||

                null;


            GM.StorageVisual.drawPokemonCard(

                this,

                this.itemRect(
                    index
                ),

                mon,

                index,

                {
                    focused:

                        this.active &&
                        this.index() ===
                            index,

                    showPosition:
                        true,

                    positionLabel:

                        'POS. ' +
                        (
                            index +
                            1
                        ),

                    emptyText:
                        'Hueco libre'
                }

            );

        };


    Window_GMStorageVisualPicker.prototype.refresh =
        function() {

            this.createContents();

            this.contents.clear();


            GM.StorageVisual.frame(

                this,

                0,
                0,

                this.contentsWidth(),
                this.contentsHeight(),

                {
                    top:
                        GM.StorageVisual.c.bg1,

                    bottom:
                        GM.StorageVisual.c.bg2,

                    border:
                        GM.StorageVisual.c.border,

                    accent:
                        GM.StorageVisual.c.gold
                }

            );


            GM.StorageVisual.text(

                this,

                'ELIGE UN POKÉMON DEL EQUIPO',

                0,
                5,

                this.contentsWidth(),

                22,

                'center',

                GM.StorageVisual.c.gold,

                17,

                true

            );


            this.drawAllItems();

        };


    Window_GMStorageVisualPicker.prototype.update =
        function() {

            Window_Selectable.prototype.update.call(
                this
            );


            if (
                this._gmVisualIndex !==
                    this.index() ||
                this._gmVisualActive !==
                    this.active
            ) {

                this._gmVisualIndex =
                    this.index();


                this._gmVisualActive =
                    this.active;


                this.refresh();

            }

        };


    // =========================================================
    // EQUIPO POKÉMON
    // =========================================================

    Scene_GranadaMonParty.prototype.createTitleWindow =
        function() {

            this._titleWindow =
                new Window_GMPrettyTitle(
                    'Equipo Pokémon'
                );


            this.addWindow(
                this._titleWindow
            );

        };


    Scene_GranadaMonParty.prototype.createPartyWindow =
        function() {

            GM.Storage.ensureData();


            var y =
                this._titleWindow.height -
                2;


            this._partyWindow =
                new Window_GMPartyVisual(

                    16,

                    y,

                    Graphics.boxWidth -
                    32,

                    Graphics.boxHeight -
                    y -
                    8

                );


            this._partyWindow.setHandler(

                'ok',

                this.onGMPartyOk.bind(
                    this
                )

            );


            this._partyWindow.setHandler(

                'cancel',

                this.onGMPartyCancel.bind(
                    this
                )

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


    // =========================================================
    // ALMACENAMIENTO
    // =========================================================

    Scene_GranadaMonStorage.prototype.createTitleWindow =
        function() {

            this._titleWindow =
                new Window_GMPrettyTitle(
                    'Almacenamiento'
                );


            this.addWindow(
                this._titleWindow
            );

        };


    Scene_GranadaMonStorage.prototype.createStorageWindow =
        function() {

            GM.Storage.ensureData();


            var y =
                this._titleWindow.height -
                2;


            this._storageWindow =
                new Window_GMStorageVisualList(

                    16,

                    y,

                    Graphics.boxWidth -
                    32,

                    Graphics.boxHeight -
                    y -
                    8

                );


            this._storageWindow.setHandler(

                'ok',

                this.onGMStorageOk.bind(
                    this
                )

            );


            this._storageWindow.setHandler(

                'cancel',

                this.popScene.bind(
                    this
                )

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


    Scene_GranadaMonStorage.prototype.createGMStoragePartyPicker =
        function() {

            var width =
                Math.floor(
                    Graphics.boxWidth *
                    0.80
                );


            var height =
                Math.min(

                    6 *
                    72 +
                    74,

                    Graphics.boxHeight -
                    90

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


            this._gmStoragePartyPicker =
                new Window_GMStorageVisualPicker(

                    x,
                    y,

                    width,
                    height

                );


            this._gmStoragePartyPicker.setHandler(

                'ok',

                this.onGMStoragePartyOk.bind(
                    this
                )

            );


            this._gmStoragePartyPicker.setHandler(

                'cancel',

                this.onGMStoragePartyCancel.bind(
                    this
                )

            );


            this.addWindow(
                this._gmStoragePartyPicker
            );

        };


    // =========================================================
    // LOG
    // =========================================================

    console.log(
        'GranadaMon StorageVisual v1.2 cargado correctamente.'
    );

})();