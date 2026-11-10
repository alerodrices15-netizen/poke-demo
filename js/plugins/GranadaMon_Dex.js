/*:
 * @plugindesc v1.4 GranadaMon - Pokédex consultable + Singulares + Pokémon de Eclosión
 * @author OpenAI
 *
 * @param Mostrar Imagenes
 * @type boolean
 * @on Sí
 * @off No
 * @default false
 *
 * @help
 * GranadaMon_Dex.js
 * ------------------------------------------------------------
 * REQUIERE ESTE ORDEN:
 * GranadaMon_Menu.js
 * GranadaMon_Core.js
 * GranadaMon_Data.js
 * GranadaMon_Dex.js
 *
 * IMÁGENES:
 * img/pictures/GMDEX_###_Nombre.png
 *
 * CLASIFICACIONES ESPECIALES:
 *
 * SINGULARES:
 * 022 Mew
 * 023 Victini
 * 024 Hoopa
 * 028 Celebi
 * 029 Zeraora
 * 030 Volcanion
 *
 * POKÉMON DE ECLOSIÓN:
 * Huevo Verde:   001 Pidgey, 013 Oddish, 016 Bellsprout
 * Huevo Naranja: 037 Zubat, 040 Gastly, 097 Scyther
 * Huevo Morado:  084 Dratini, 087 Ralts, 091 Larvitar
 *
 * Este juego NO utiliza evolución.
 */

(function() {

    'use strict';

    var pluginName = 'GranadaMon_Dex';
    var parameters = PluginManager.parameters(pluginName);
    var SHOW_IMAGES = String(parameters['Mostrar Imagenes'] || 'false') === 'true';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    GM.Dex = GM.Dex || {};
    GM.Dex.version = '1.4';
    GM.Dex.selectedIndex = 0;

    if (typeof Scene_GranadaMonDex === 'undefined') {
        throw new Error('GranadaMon_Dex necesita GranadaMon_Menu.js.');
    }

    if (!GM.getSpecies || !GM.getSpeciesByGranadaDex) {
        throw new Error('GranadaMon_Dex necesita GranadaMon_Core.js y GranadaMon_Data.js.');
    }

    // =========================================================
    // SINGULARES
    // =========================================================

    GM.Dex.SINGULAR_DEX = {
        22: true,
        23: true,
        24: true,
        28: true,
        29: true,
        30: true
    };

    GM.Dex.SINGULAR_STYLES = {
        22: { accent: '#ff7bc8', accentSoft: '#6b2854' },
        23: { accent: '#ff9f43', accentSoft: '#6c3821' },
        24: { accent: '#b878ff', accentSoft: '#432663' },
        28: { accent: '#78e6a6', accentSoft: '#245f43' },
        29: { accent: '#ffe066', accentSoft: '#68581e' },
        30: { accent: '#68cfff', accentSoft: '#28536d' }
    };

    GM.Dex.isSingular = function(species) {
        if (!species) return false;

        return !!GM.Dex.SINGULAR_DEX[
            Number(species.granadaDex || 0)
        ];
    };

    GM.Dex.singularStyle = function(species) {

        if (!species) {

            return {
                accent: '#d9b84f',
                accentSoft: '#5a4520'
            };

        }

        return (
            GM.Dex.SINGULAR_STYLES[
                Number(species.granadaDex || 0)
            ] ||
            {
                accent: '#d9b84f',
                accentSoft: '#5a4520'
            }
        );

    };

    // =========================================================
    // POKÉMON DE ECLOSIÓN
    // =========================================================

    GM.Dex.HATCH_DEX = {

        // HUEVO VERDE
        1: 'GREEN',
        13: 'GREEN',
        16: 'GREEN',

        // HUEVO NARANJA
        37: 'ORANGE',
        40: 'ORANGE',
        97: 'ORANGE',

        // HUEVO MORADO
        84: 'PURPLE',
        87: 'PURPLE',
        91: 'PURPLE'

    };

    GM.Dex.HATCH_STYLES = {

        GREEN: {

            label:
                'HUEVO VERDE',

            accent:
                '#73e39a',

            accent2:
                '#d8ff7a',

            accentSoft:
                '#2e6845',

            panelTop:
                '#173829',

            panelBottom:
                '#101a16'

        },

        ORANGE: {

            label:
                'HUEVO NARANJA',

            accent:
                '#ff9848',

            accent2:
                '#ffd269',

            accentSoft:
                '#784224',

            panelTop:
                '#432718',

            panelBottom:
                '#1b1511'

        },

        PURPLE: {

            label:
                'HUEVO MORADO',

            accent:
                '#b87cff',

            accent2:
                '#e4b5ff',

            accentSoft:
                '#563276',

            panelTop:
                '#311b43',

            panelBottom:
                '#17111f'

        }

    };

    GM.Dex.isHatch = function(species) {

        if (!species) {
            return false;
        }

        return !!GM.Dex.HATCH_DEX[
            Number(species.granadaDex || 0)
        ];

    };

    GM.Dex.hatchGroup = function(species) {

        if (!species) {
            return null;
        }

        return (
            GM.Dex.HATCH_DEX[
                Number(species.granadaDex || 0)
            ] ||
            null
        );

    };

    GM.Dex.hatchStyle = function(species) {

        var group =
            GM.Dex.hatchGroup(
                species
            );

        return (
            GM.Dex.HATCH_STYLES[
                group
            ] ||
            null
        );

    };

    // =========================================================
    // UTILIDADES
    // =========================================================

    GM.Dex.pad3 = function(value) {

        var text =
            String(value);

        while (
            text.length < 3
        ) {

            text =
                '0' + text;

        }

        return text;

    };

    GM.Dex.prettyType = function(type) {

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

    GM.Dex.imageName = function(species) {

        if (!species) {
            return '';
        }

        var number =
            GM.Dex.pad3(
                species.granadaDex
            );

        var safeName =
            String(
                species.name
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
    // ENTRAR EN UNA FICHA
    // =========================================================

    var _Scene_GranadaMonDex_createDexWindow =
        Scene_GranadaMonDex
            .prototype
            .createDexWindow;

    Scene_GranadaMonDex
        .prototype
        .createDexWindow =
        function() {

            _Scene_GranadaMonDex_createDexWindow
                .call(this);

            this._dexWindow.setHandler(

                'ok',

                this.onGranadaDexOk.bind(
                    this
                )

            );

        };

    Scene_GranadaMonDex
        .prototype
        .onGranadaDexOk =
        function() {

            var index =
                this._dexWindow.index();

            var dex =
                $gameSystem
                    ._granadaMonDex ||
                [];

            var entry =
                dex[index];

            if (
                !entry ||
                !entry.seen
            ) {

                SoundManager.playBuzzer();

                this._dexWindow.activate();

                return;

            }

            GM.Dex.selectedIndex =
                index;

            SceneManager.push(
                Scene_GranadaDexEntry
            );

        };

    // =========================================================
    // ESCENA
    // =========================================================

    function Scene_GranadaDexEntry() {

        this.initialize.apply(
            this,
            arguments
        );

    }

    Scene_GranadaDexEntry.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );

    Scene_GranadaDexEntry.prototype.constructor =
        Scene_GranadaDexEntry;

    Scene_GranadaDexEntry.prototype.initialize =
        function() {

            Scene_MenuBase
                .prototype
                .initialize
                .call(this);

        };

    Scene_GranadaDexEntry.prototype.create =
        function() {

            Scene_MenuBase
                .prototype
                .create
                .call(this);

            this.createTitleWindow();

            this.createEntryWindow();

        };

    Scene_GranadaDexEntry.prototype.createTitleWindow =
        function() {

            this._titleWindow =
                new Window_GranadaDexTitle();

            this.addWindow(
                this._titleWindow
            );

        };

    Scene_GranadaDexEntry.prototype.createEntryWindow =
        function() {

            var y =
                this._titleWindow.height;

            this._entryWindow =
                new Window_GranadaDexEntry(

                    0,

                    y,

                    Graphics.boxWidth,

                    Graphics.boxHeight - y

                );

            this._entryWindow.setHandler(

                'cancel',

                this.popScene.bind(
                    this
                )

            );

            this.addWindow(
                this._entryWindow
            );

            this._entryWindow.activate();

            this._entryWindow.select(0);

        };

    // =========================================================
    // CABECERA SUPERIOR
    // =========================================================

    function Window_GranadaDexTitle() {

        this.initialize.apply(
            this,
            arguments
        );

    }

    Window_GranadaDexTitle.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GranadaDexTitle.prototype.constructor =
        Window_GranadaDexTitle;

    Window_GranadaDexTitle.prototype.initialize =
        function() {

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

    Window_GranadaDexTitle.prototype.currentSpecies =
        function() {

            return (
                GM.getSpeciesByGranadaDex(
                    GM.Dex.selectedIndex + 1
                )
            );

        };

    Window_GranadaDexTitle.prototype.refresh =
        function() {

            this.contents.clear();

            var species =
                this.currentSpecies();

            var singular =
                GM.Dex.isSingular(
                    species
                );

            var hatch =
                GM.Dex.isHatch(
                    species
                );

            var width =
                this.contentsWidth();

            var height =
                this.contentsHeight();

            // =================================================
            // SINGULAR
            // =================================================

            if (singular) {

                var singularStyle =
                    GM.Dex.singularStyle(
                        species
                    );

                this.contents.gradientFillRect(

                    0,
                    0,

                    width,
                    height,

                    '#24132f',
                    '#11151f',

                    false

                );

                this.contents.fillRect(

                    0,
                    0,

                    width,
                    3,

                    '#f4d56a'

                );

                this.contents.fillRect(

                    0,
                    height - 3,

                    width,
                    3,

                    singularStyle.accent

                );

                this.contents.fontBold =
                    true;

                this.contents.fontSize =
                    24;

                this.changeTextColor(
                    '#f4d56a'
                );

                this.drawText(

                    '✦ POKÉDEX · REGISTRO SINGULAR ✦',

                    0,
                    0,

                    width,

                    'center'

                );

                this.contents.fontBold =
                    false;

                this.contents.fontSize =
                    this.standardFontSize();

                this.resetTextColor();

                return;

            }

            // =================================================
            // ECLOSIÓN
            // =================================================

            if (hatch) {

                var hatchStyle =
                    GM.Dex.hatchStyle(
                        species
                    );

                this.contents.gradientFillRect(

                    0,
                    0,

                    width,
                    height,

                    hatchStyle.panelTop,
                    hatchStyle.panelBottom,

                    false

                );

                this.contents.fillRect(

                    0,
                    0,

                    width,
                    3,

                    hatchStyle.accent2

                );

                this.contents.fillRect(

                    0,
                    height - 3,

                    width,
                    3,

                    hatchStyle.accent

                );

                this.contents.fontBold =
                    true;

                this.contents.fontSize =
                    23;

                this.changeTextColor(
                    hatchStyle.accent2
                );

                this.drawText(

                    '◇ POKÉDEX · REGISTRO DE ECLOSIÓN ◇',

                    0,
                    0,

                    width,

                    'center'

                );

                this.contents.fontBold =
                    false;

                this.contents.fontSize =
                    this.standardFontSize();

                this.resetTextColor();

                return;

            }

            // =================================================
            // NORMAL
            // =================================================

            this.changeTextColor(
                this.systemColor()
            );

            this.drawText(

                'Pokédex',

                0,
                0,

                width,

                'center'

            );

            this.resetTextColor();

        };

    // =========================================================
    // VENTANA PRINCIPAL
    // =========================================================

    function Window_GranadaDexEntry() {

        this.initialize.apply(
            this,
            arguments
        );

    }

    Window_GranadaDexEntry.prototype =
        Object.create(
            Window_Selectable.prototype
        );

    Window_GranadaDexEntry.prototype.constructor =
        Window_GranadaDexEntry;

    Window_GranadaDexEntry.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._dexImage =
                null;

            this._dexImageName =
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

            this.prepareImage();

            this.refresh();

        };

    Window_GranadaDexEntry.prototype.maxItems =
        function() {

            return 1;

        };

    Window_GranadaDexEntry.prototype.drawItem =
        function() {

        };

    Window_GranadaDexEntry.prototype.getEntry =
        function() {

            var dex =
                $gameSystem
                    ._granadaMonDex ||
                [];

            return (

                dex[
                    GM.Dex.selectedIndex
                ] ||

                null

            );

        };

    Window_GranadaDexEntry.prototype.getSpecies =
        function() {

            return (
                GM.getSpeciesByGranadaDex(
                    GM.Dex.selectedIndex + 1
                )
            );

        };

    Window_GranadaDexEntry.prototype.prepareImage =
        function() {

            if (!SHOW_IMAGES) {
                return;
            }

            var species =
                this.getSpecies();

            if (!species) {
                return;
            }

            this._dexImageName =
                GM.Dex.imageName(
                    species
                );

            this._dexImage =
                ImageManager.loadPicture(
                    this._dexImageName
                );

            this._dexImage.addLoadListener(

                function() {

                    this.refresh();

                }.bind(this)

            );

        };

    // =========================================================
    // TÍTULO DE SECCIÓN
    // =========================================================

    Window_GranadaDexEntry.prototype.drawSectionTitle =
        function(
            text,
            x,
            y,
            width,
            special,
            accent,
            titleColor
        ) {

            if (special) {

                this.contents.fillRect(

                    x,

                    y +
                    this.lineHeight() -
                    4,

                    Math.min(
                        width,
                        170
                    ),

                    2,

                    accent

                );

                this.contents.fontBold =
                    true;

                this.changeTextColor(
                    titleColor ||
                    accent
                );

                this.drawText(

                    text,

                    x,
                    y,
                    width

                );

                this.contents.fontBold =
                    false;

                this.resetTextColor();

                return;

            }

            this.changeTextColor(
                this.systemColor()
            );

            this.drawText(

                text,

                x,
                y,
                width

            );

            this.resetTextColor();

        };

    // =========================================================
    // BADGE SINGULAR
    // =========================================================

    Window_GranadaDexEntry.prototype.drawSingularBadge =
        function(
            x,
            y,
            width,
            accent
        ) {

            var badgeW =
                Math.min(
                    width,
                    260
                );

            var badgeH =
                34;

            this.contents.gradientFillRect(

                x,
                y,

                badgeW,
                badgeH,

                '#321842',
                '#18111f',

                false

            );

            this.contents.fillRect(
                x,
                y,
                badgeW,
                2,
                '#f4d56a'
            );

            this.contents.fillRect(
                x,
                y + badgeH - 2,
                badgeW,
                2,
                accent
            );

            this.contents.fillRect(
                x,
                y,
                2,
                badgeH,
                '#f4d56a'
            );

            this.contents.fillRect(
                x + badgeW - 2,
                y,
                2,
                badgeH,
                accent
            );

            this.contents.fontBold =
                true;

            this.contents.fontSize =
                19;

            this.changeTextColor(
                '#f4d56a'
            );

            this.drawText(

                '✦ POKÉMON SINGULAR ✦',

                x,
                y - 1,

                badgeW,

                'center'

            );

            this.contents.fontBold =
                false;

            this.contents.fontSize =
                this.standardFontSize();

            this.resetTextColor();

        };

    // =========================================================
    // BADGE ECLOSIÓN
    // =========================================================

    Window_GranadaDexEntry.prototype.drawHatchBadge =
        function(
            x,
            y,
            width,
            style
        ) {

            var badgeW =
                Math.min(
                    width,
                    310
                );

            var badgeH =
                58;

            this.contents.gradientFillRect(

                x,
                y,

                badgeW,
                badgeH,

                style.panelTop,
                style.panelBottom,

                false

            );

            this.contents.fillRect(
                x,
                y,
                badgeW,
                2,
                style.accent2
            );

            this.contents.fillRect(
                x,
                y + badgeH - 2,
                badgeW,
                2,
                style.accent
            );

            this.contents.fillRect(
                x,
                y,
                2,
                badgeH,
                style.accent2
            );

            this.contents.fillRect(
                x + badgeW - 2,
                y,
                2,
                badgeH,
                style.accent
            );

            this.contents.fontBold =
                true;

            this.contents.fontSize =
                17;

            this.changeTextColor(
                '#f5f0df'
            );

            this.drawText(

                'POKÉMON DE ECLOSIÓN',

                x,
                y + 1,

                badgeW,

                'center'

            );

            this.contents.fontSize =
                18;

            this.changeTextColor(
                style.accent2
            );

            this.drawText(

                style.label,

                x,
                y + 27,

                badgeW,

                'center'

            );

            this.contents.fontBold =
                false;

            this.contents.fontSize =
                this.standardFontSize();

            this.resetTextColor();

        };

    // =========================================================
    // FONDO SINGULAR
    // =========================================================

    Window_GranadaDexEntry.prototype.drawSingularBackdrop =
        function(
            width,
            height,
            style
        ) {

            this.contents.gradientFillRect(

                0,
                0,

                width,

                Math.min(
                    height,
                    118
                ),

                '#21112c',
                '#11141c',

                false

            );

            this.contents.fillRect(
                0,
                0,
                width,
                3,
                '#f4d56a'
            );

            this.contents.fillRect(
                0,
                3,
                width,
                2,
                style.accent
            );

            this.contents.fillRect(

                0,

                Math.min(
                    height,
                    116
                ),

                width,
                2,

                style.accentSoft

            );

        };

    // =========================================================
    // FONDO ECLOSIÓN
    // =========================================================

    Window_GranadaDexEntry.prototype.drawHatchBackdrop =
        function(
            width,
            height,
            style
        ) {

            this.contents.gradientFillRect(

                0,
                0,

                width,

                Math.min(
                    height,
                    118
                ),

                style.panelTop,
                style.panelBottom,

                false

            );

            this.contents.fillRect(
                0,
                0,
                width,
                3,
                style.accent2
            );

            this.contents.fillRect(
                0,
                3,
                width,
                2,
                style.accent
            );

            this.contents.fillRect(

                0,

                Math.min(
                    height,
                    116
                ),

                width,
                2,

                style.accentSoft

            );

        };

    // =========================================================
    // ESTADÍSTICAS COMPACTAS
    // =========================================================

    Window_GranadaDexEntry.prototype.drawCompactStats =
        function(
            species,
            x,
            y,
            width
        ) {

            var b =
                species.baseStats;

            var colW =
                Math.floor(
                    width / 3
                );

            var rowH =
                28;

            this.contents.fontSize =
                16;

            this.contents.fontBold =
                false;

            this.changeTextColor(
                '#eeeeee'
            );

            this.drawText(
                'PS: ' + b.hp,
                x,
                y,
                colW
            );

            this.drawText(
                'Ataque: ' + b.attack,
                x + colW,
                y,
                colW
            );

            this.drawText(
                'Defensa: ' + b.defense,
                x + colW * 2,
                y,
                colW
            );

            this.drawText(
                'Atq. Esp.: ' + b.spAttack,
                x,
                y + rowH,
                colW
            );

            this.drawText(
                'Def. Esp.: ' + b.spDefense,
                x + colW,
                y + rowH,
                colW
            );

            this.drawText(
                'Velocidad: ' + b.speed,
                x + colW * 2,
                y + rowH,
                colW
            );

            this.contents.fontSize =
                this.standardFontSize();

            this.resetTextColor();

        };

    // =========================================================
    // REFRESH
    // =========================================================

    Window_GranadaDexEntry.prototype.refresh =
        function() {

            this.contents.clear();

            var entry =
                this.getEntry();

            var species =
                this.getSpecies();

            if (
                !entry ||
                !species
            ) {

                this.drawText(

                    'No se ha podido cargar esta entrada.',

                    0,
                    0,

                    this.contentsWidth(),

                    'center'

                );

                return;

            }

            var width =
                this.contentsWidth();

            var height =
                this.contentsHeight();

            var line =
                this.lineHeight();

            var singular =
                GM.Dex.isSingular(
                    species
                );

            var hatch =
                GM.Dex.isHatch(
                    species
                );

            var singularStyle =
                GM.Dex.singularStyle(
                    species
                );

            var hatchStyle =
                GM.Dex.hatchStyle(
                    species
                );

            var special =
                singular ||
                hatch;

            var accent =

                singular

                    ? singularStyle.accent

                    : hatch

                        ? hatchStyle.accent

                        : this.systemColor();

            var titleAccent =

                singular

                    ? '#f4d56a'

                    : hatch

                        ? hatchStyle.accent2

                        : this.systemColor();

            // =================================================
            // FONDO
            // =========================================================

            if (
                singular
            ) {

                this.drawSingularBackdrop(

                    width,
                    height,
                    singularStyle

                );

            }

            else if (
                hatch
            ) {

                this.drawHatchBackdrop(

                    width,
                    height,
                    hatchStyle

                );

            }

            // =================================================
            // CABECERA ESPECIAL
            // =========================================================

            if (
                special
            ) {

                var headerOffsetY =
                    7;

                this.contents.fontBold =
                    true;

                this.contents.fontSize =
                    28;

                this.changeTextColor(
                    titleAccent
                );

                this.drawText(

                    '#' +
                    GM.Dex.pad3(
                        species.granadaDex
                    ),

                    24,

                    headerOffsetY,

                    120,

                    'left'

                );

                this.drawText(

                    (
                        singular
                            ? '✦ '
                            : '◇ '
                    ) +

                    String(
                        species.name
                    ).toUpperCase() +

                    (
                        singular
                            ? ' ✦'
                            : ' ◇'
                    ),

                    0,

                    headerOffsetY,

                    width,

                    'center'

                );

                this.contents.fontBold =
                    false;

                this.contents.fontSize =
                    19;

                this.changeTextColor(
                    accent
                );

                this.drawText(

                    singular
                        ? 'POKÉMON SINGULAR'
                        : 'POKÉMON DE ECLOSIÓN',

                    0,

                    line +
                    headerOffsetY,

                    width,

                    'center'

                );

                this.contents.fontSize =
                    18;

                this.changeTextColor(
                    '#e6e6ea'
                );

                var thirdLine =

                    singular

                        ? (
                            'Pokédex Nacional #' +
                            GM.Dex.pad3(
                                species.nationalDex
                            )
                        )

                        : (
                            hatchStyle.label +
                            '  ·  Pokédex Nacional #' +
                            GM.Dex.pad3(
                                species.nationalDex
                            )
                        );

                this.drawText(

                    thirdLine,

                    0,

                    line * 2 +
                    headerOffsetY -
                    2,

                    width,

                    'center'

                );

                this.contents.fontSize =
                    this.standardFontSize();

                this.resetTextColor();

            }

            // =================================================
            // CABECERA NORMAL
            // =========================================================

            else {

                this.changeTextColor(
                    this.systemColor()
                );

                this.drawText(

                    '#' +
                    GM.Dex.pad3(
                        species.granadaDex
                    ) +
                    '   ' +
                    species.name,

                    0,
                    0,

                    width,

                    'center'

                );

                this.resetTextColor();

                this.drawText(

                    'Pokédex Nacional #' +
                    GM.Dex.pad3(
                        species.nationalDex
                    ),

                    0,
                    line,

                    width,

                    'center'

                );

            }

            // =================================================
            // IMAGEN
            // =========================================================

            var imageX =
                20;

            var imageY =
                special
                    ? line * 3 + 14
                    : line * 2 + 15;

            var imageW =
                300;

            var imageH =
                special
                    ? 250
                    : 300;

            this.drawImageArea(

                species,

                imageX,
                imageY,

                imageW,
                imageH,

                singular,
                hatch,

                singularStyle,
                hatchStyle

            );

            // =================================================
            // INFORMACIÓN DERECHA
            // =========================================================

            var infoX =
                350;

            var infoY =
                imageY;

            var infoW =
                width -
                infoX -
                20;

            var types =
                [];

            for (
                var i = 0;
                i < species.types.length;
                i++
            ) {

                types.push(

                    GM.Dex.prettyType(
                        species.types[i]
                    )

                );

            }

            // =================================================
            // BADGE
            // =========================================================

            if (
                singular
            ) {

                this.drawSingularBadge(

                    infoX,
                    infoY,
                    infoW,
                    accent

                );

                infoY +=
                    42;

            }

            else if (
                hatch
            ) {

                this.drawHatchBadge(

                    infoX,
                    infoY,
                    infoW,
                    hatchStyle

                );

                infoY +=
                    66;

            }

            // =================================================
            // TIPO
            // =========================================================

            this.drawSectionTitle(

                'TIPO',

                infoX,
                infoY,
                infoW,

                special,
                accent,
                titleAccent

            );

            infoY +=
                special
                    ? 30
                    : line;

            if (
                special
            ) {

                this.contents.fontBold =
                    true;

                this.changeTextColor(
                    accent
                );

            }

            this.drawText(

                types.join(
                    ' / '
                ),

                infoX,
                infoY,
                infoW

            );

            this.contents.fontBold =
                false;

            this.resetTextColor();

            infoY +=
                special
                    ? 68
                    : line * 2;

            // =================================================
            // REGISTRO
            // =========================================================

            this.drawSectionTitle(

                'REGISTRO',

                infoX,
                infoY,
                infoW,

                special,
                accent,
                titleAccent

            );

            infoY +=
                special
                    ? 30
                    : line;

            // =================================================
            // CAPTURADO
            // =========================================================

            if (
                entry.caught
            ) {

                if (
                    special
                ) {

                    this.contents.fontBold =
                        true;

                    this.changeTextColor(
                        titleAccent
                    );

                }

                var caughtText =

                    singular

                        ? '★ CAPTURADO · REGISTRO SINGULAR ★'

                        : hatch

                            ? (
                                '◆ REGISTRADO · ' +
                                hatchStyle.label +
                                ' ◆'
                            )

                            : 'CAPTURADO';

                this.drawText(

                    caughtText,

                    infoX,
                    infoY,
                    infoW

                );

                this.contents.fontBold =
                    false;

                this.resetTextColor();

            }

            // =================================================
            // VISTO
            // =========================================================

            else {

                if (
                    special
                ) {

                    this.contents.fontBold =
                        true;

                    this.changeTextColor(
                        accent
                    );

                }

                var seenText =

                    singular

                        ? '★ AVISTADO · POKÉMON SINGULAR ★'

                        : hatch

                            ? '◆ AVISTADO · POKÉMON DE ECLOSIÓN ◆'

                            : 'VISTO';

                this.drawText(

                    seenText,

                    infoX,
                    infoY,
                    infoW

                );

                this.contents.fontBold =
                    false;

                this.resetTextColor();

            }

            infoY +=
                special
                    ? 68
                    : line * 2;

            // =================================================
            // NO CAPTURADO
            // =========================================================

            if (
                !entry.caught
            ) {

                this.drawSectionTitle(

                    'INFORMACIÓN',

                    infoX,
                    infoY,
                    infoW,

                    special,
                    accent,
                    titleAccent

                );

                infoY +=
                    special
                        ? 30
                        : line;

                this.drawText(

                    'Registra este Pokémon para',

                    infoX,
                    infoY,
                    infoW

                );

                this.drawText(

                    'desbloquear su ficha completa.',

                    infoX,
                    infoY + 28,
                    infoW

                );

                return;

            }

            // =================================================
            // ESTADÍSTICAS
            // =========================================================

            this.drawSectionTitle(

                'ESTADÍSTICAS BASE',

                infoX,
                infoY,
                infoW,

                special,
                accent,
                titleAccent

            );

            infoY +=
                special
                    ? 32
                    : line;

            if (
                special
            ) {

                this.drawCompactStats(

                    species,

                    infoX,
                    infoY,
                    infoW

                );

                infoY +=
                    62;

            }

            else {

                var b =
                    species.baseStats;

                this.drawText(

                    'PS: ' +
                    b.hp,

                    infoX,
                    infoY,
                    180

                );

                this.drawText(

                    'Ataque: ' +
                    b.attack,

                    infoX + 190,
                    infoY,
                    200

                );

                infoY +=
                    line;

                this.drawText(

                    'Defensa: ' +
                    b.defense,

                    infoX,
                    infoY,
                    180

                );

                this.drawText(

                    'Atq. Esp.: ' +
                    b.spAttack,

                    infoX + 190,
                    infoY,
                    220

                );

                infoY +=
                    line;

                this.drawText(

                    'Def. Esp.: ' +
                    b.spDefense,

                    infoX,
                    infoY,
                    200

                );

                this.drawText(

                    'Velocidad: ' +
                    b.speed,

                    infoX + 190,
                    infoY,
                    220

                );

                infoY +=
                    line;

            }

            // =================================================
            // DESCRIPCIÓN
            // =========================================================

            var descriptionY =
                Math.max(

                    imageY +
                    imageH +
                    12,

                    infoY +
                    8

                );

            // =================================================
            // PANEL SINGULAR
            // =========================================================

            if (
                singular
            ) {

                this.contents.gradientFillRect(

                    20,

                    descriptionY - 5,

                    width - 40,

                    line * 2 + 15,

                    '#25142f',
                    '#15131d',

                    false

                );

                this.contents.fillRect(

                    20,

                    descriptionY - 5,

                    width - 40,

                    2,

                    '#f4d56a'

                );

                this.contents.fillRect(

                    20,

                    descriptionY +
                    line * 2 +
                    8,

                    width - 40,

                    2,

                    accent

                );

            }

            // =================================================
            // PANEL ECLOSIÓN
            // =========================================================

            else if (
                hatch
            ) {

                this.contents.gradientFillRect(

                    20,

                    descriptionY - 5,

                    width - 40,

                    line * 2 + 15,

                    hatchStyle.panelTop,
                    hatchStyle.panelBottom,

                    false

                );

                this.contents.fillRect(

                    20,

                    descriptionY - 5,

                    width - 40,

                    2,

                    hatchStyle.accent2

                );

                this.contents.fillRect(

                    20,

                    descriptionY +
                    line * 2 +
                    8,

                    width - 40,

                    2,

                    hatchStyle.accent

                );

            }

            // =================================================
            // TÍTULO ARCHIVO
            // =========================================================

            var archiveTitle =

                singular

                    ? '✦ ARCHIVO SINGULAR'

                    : hatch

                        ? (
                            '◇ ARCHIVO DE ECLOSIÓN · ' +
                            hatchStyle.label
                        )

                        : 'DESCRIPCIÓN';

            this.drawSectionTitle(

                archiveTitle,

                20,
                descriptionY,

                width - 40,

                special,
                accent,
                titleAccent

            );

            descriptionY +=
                line;

            // =================================================
            // TEXTO
            // =========================================================

            if (
                species.description
            ) {

                if (
                    special
                ) {

                    this.changeTextColor(
                        '#f1edf5'
                    );

                }

                this.drawText(

                    species.description,

                    20,
                    descriptionY,

                    width - 40

                );

                this.resetTextColor();

            }

            else {

                this.changePaintOpacity(
                    false
                );

                this.drawText(

                    'Descripción todavía no añadida.',

                    20,
                    descriptionY,

                    width - 40

                );

                this.changePaintOpacity(
                    true
                );

            }

        };

    // =========================================================
    // ÁREA DE IMAGEN
    // =========================================================

    Window_GranadaDexEntry.prototype.drawImageArea =
        function(
            species,
            x,
            y,
            width,
            height,
            singular,
            hatch,
            singularStyle,
            hatchStyle
        ) {

            var special =
                singular ||
                hatch;

            var outer =

                singular

                    ? '#f4d56a'

                    : hatch

                        ? hatchStyle.accent2

                        : this.normalColor();

            var inner =

                singular

                    ? singularStyle.accent

                    : hatch

                        ? hatchStyle.accent

                        : this.normalColor();

            var panelTop =

                singular

                    ? '#201329'

                    : hatch

                        ? hatchStyle.panelTop

                        : null;

            var panelBottom =

                singular

                    ? '#0f141b'

                    : hatch

                        ? hatchStyle.panelBottom

                        : null;

            // =================================================
            // MARCO ESPECIAL
            // =========================================================

            if (
                special
            ) {

                this.contents.gradientFillRect(

                    x,
                    y,

                    width,
                    height,

                    panelTop,
                    panelBottom,

                    false

                );

                // Exterior

                this.contents.fillRect(
                    x,
                    y,
                    width,
                    3,
                    outer
                );

                this.contents.fillRect(
                    x,
                    y + height - 3,
                    width,
                    3,
                    outer
                );

                this.contents.fillRect(
                    x,
                    y,
                    3,
                    height,
                    outer
                );

                this.contents.fillRect(
                    x + width - 3,
                    y,
                    3,
                    height,
                    outer
                );

                // Interior

                this.contents.fillRect(
                    x + 6,
                    y + 6,
                    width - 12,
                    2,
                    inner
                );

                this.contents.fillRect(
                    x + 6,
                    y + height - 8,
                    width - 12,
                    2,
                    inner
                );

                this.contents.fillRect(
                    x + 6,
                    y + 6,
                    2,
                    height - 12,
                    inner
                );

                this.contents.fillRect(
                    x + width - 8,
                    y + 6,
                    2,
                    height - 12,
                    inner
                );

                // Esquinas

                var corner =
                    18;

                this.contents.fillRect(
                    x + 10,
                    y + 10,
                    corner,
                    3,
                    outer
                );

                this.contents.fillRect(
                    x + 10,
                    y + 10,
                    3,
                    corner,
                    outer
                );

                this.contents.fillRect(
                    x + width - 10 - corner,
                    y + 10,
                    corner,
                    3,
                    outer
                );

                this.contents.fillRect(
                    x + width - 13,
                    y + 10,
                    3,
                    corner,
                    outer
                );

                this.contents.fillRect(
                    x + 10,
                    y + height - 13,
                    corner,
                    3,
                    inner
                );

                this.contents.fillRect(
                    x + 10,
                    y + height - 10 - corner,
                    3,
                    corner,
                    inner
                );

                this.contents.fillRect(
                    x + width - 10 - corner,
                    y + height - 13,
                    corner,
                    3,
                    inner
                );

                this.contents.fillRect(
                    x + width - 13,
                    y + height - 10 - corner,
                    3,
                    corner,
                    inner
                );

            }

            // =================================================
            // MARCO NORMAL
            // =========================================================

            else {

                this.contents.fillRect(
                    x,
                    y,
                    width,
                    2,
                    this.normalColor()
                );

                this.contents.fillRect(
                    x,
                    y + height - 2,
                    width,
                    2,
                    this.normalColor()
                );

                this.contents.fillRect(
                    x,
                    y,
                    2,
                    height,
                    this.normalColor()
                );

                this.contents.fillRect(
                    x + width - 2,
                    y,
                    2,
                    height,
                    this.normalColor()
                );

            }

            // =================================================
            // IMAGEN REAL
            // =========================================================

            if (
                SHOW_IMAGES &&
                this._dexImage &&
                this._dexImage.isReady()
            ) {

                var bitmap =
                    this._dexImage;

                var sw =
                    bitmap.width;

                var sh =
                    bitmap.height;

                var innerPad =
                    special
                        ? 28
                        : 20;

                var scale =
                    Math.min(

                        (
                            width -
                            innerPad
                        ) /
                        sw,

                        (
                            height -
                            innerPad
                        ) /
                        sh

                    );

                var dw =
                    Math.floor(
                        sw *
                        scale
                    );

                var dh =
                    Math.floor(
                        sh *
                        scale
                    );

                var dx =
                    x +
                    Math.floor(

                        (
                            width -
                            dw
                        ) /
                        2

                    );

                var dy =
                    y +
                    Math.floor(

                        (
                            height -
                            dh
                        ) /
                        2

                    );

                this.contents.blt(

                    bitmap,

                    0,
                    0,

                    sw,
                    sh,

                    dx,
                    dy,

                    dw,
                    dh

                );

                return;

            }

            // =================================================
            // PLACEHOLDER
            // =========================================================

            var filename =
                GM.Dex.imageName(
                    species
                ) +
                '.png';

            this.changePaintOpacity(
                false
            );

            if (
                special
            ) {

                this.contents.fontBold =
                    true;

                this.changeTextColor(
                    outer
                );

            }

            var placeholder =

                singular

                    ? 'POKÉMON SINGULAR'

                    : hatch

                        ? hatchStyle.label

                        : 'IMAGEN';

            this.drawText(

                placeholder,

                x + 10,

                y + 80,

                width - 20,

                'center'

            );

            this.contents.fontBold =
                false;

            this.resetTextColor();

            this.drawText(

                filename,

                x + 10,

                y + 125,

                width - 20,

                'center'

            );

            this.changePaintOpacity(
                true
            );

        };

    // =========================================================
    // PÚBLICO
    // =========================================================

    window.Scene_GranadaDexEntry =
        Scene_GranadaDexEntry;

    console.log(
        'GranadaMon Dex v1.4 cargado correctamente.'
    );

})();