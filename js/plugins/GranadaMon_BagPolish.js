/*:
 * @plugindesc v1.0 GranadaMon - Pulido visual de Mochila, vitrina de medallas y Caramelo
 * @author OpenAI
 *
 * @help
 * GranadaMon_BagPolish.js
 * ------------------------------------------------------------
 * AÑADIR, NO SUSTITUIR.
 *
 * Colócalo DEBAJO de:
 * - GranadaMon_Bag.js
 * - GranadaMon_UIEffects.js
 *
 * Usa estas imágenes ya acordadas en img/pictures/:
 * GM_Ball_Poke.png
 * GM_Ball_Super.png
 * GM_Ball_Ultra.png
 * GM_Item_Potion.png
 * GM_Item_Revive.png
 * GM_Item_GymBadge.png
 * GM_Item_Candy.png
 *
 * Añade:
 * - Vista grande del objeto seleccionado.
 * - Vitrina visual de 8 medallas.
 * - Aviso Nv. X -> Nv. Y al usar Caramelo.
 * - Fondo específico de Mochila.
 * - Aviso especial al conseguir una medalla.
 */

(function() {
    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;

    if (
        !GM.UIX ||
        typeof Scene_GranadaMonBag ===
            'undefined'
    ) {

        console.warn(
            'GranadaMon_BagPolish: faltan Bag o UIEffects.'
        );

        return;
    }

    var UIX =
        GM.UIX;

    function Window_GMBagPreview() {

        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GMBagPreview.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GMBagPreview.prototype.constructor =
        Window_GMBagPreview;

    Window_GMBagPreview.prototype.initialize =
        function(
            x,
            y,
            width,
            height,
            scene
        ) {

            this._scene =
                scene;

            this._lastKey =
                '';

            Window_Base.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            this.opacity =
                0;

            this.backOpacity =
                0;

            this.refresh();
        };

    Window_GMBagPreview.prototype.standardPadding =
        function() {

            return 12;
        };

    Window_GMBagPreview.prototype._category =
        function() {

            var w =
                this._scene &&
                this._scene._categoryWindow;

            return (
                w &&
                w.currentSymbol
            )
                ? w.currentSymbol()
                : '';
        };

    Window_GMBagPreview.prototype._item =
        function() {

            var w =
                this._scene &&
                this._scene._itemWindow;

            return (
                w &&
                w.item
            )
                ? w.item()
                : null;
        };

    Window_GMBagPreview.prototype._filename =
        function(item) {

            if (!item) {
                return null;
            }

            var map = {
                POKE_BALL:
                    'GM_Ball_Poke',

                SUPER_BALL:
                    'GM_Ball_Super',

                ULTRA_BALL:
                    'GM_Ball_Ultra',

                POTION:
                    'GM_Item_Potion',

                REVIVE:
                    'GM_Item_Revive',

                GYM_BADGE:
                    'GM_Item_GymBadge',

                CANDY:
                    'GM_Item_Candy'
            };

            return (
                map[
                    String(
                        item.key ||
                        ''
                    ).toUpperCase()
                ] ||
                null
            );
        };

    Window_GMBagPreview.prototype._panel =
        function(
            x,
            y,
            w,
            h,
            accent
        ) {

            this.contents.gradientFillRect(
                x,
                y,
                w,
                h,
                '#222a38',
                '#0d1219',
                false
            );

            this.contents.fillRect(
                x,
                y,
                w,
                2,
                accent ||
                '#596279'
            );

            this.contents.fillRect(
                x,
                y +
                h -
                2,
                w,
                2,
                '#596279'
            );

            this.contents.fillRect(
                x,
                y,
                2,
                h,
                '#596279'
            );

            this.contents.fillRect(
                x +
                w -
                2,
                y,
                2,
                h,
                '#596279'
            );
        };

    Window_GMBagPreview.prototype._drawMedalCase =
        function() {

            var qty =
                GM.getItemQuantity
                    ? GM.getItemQuantity(
                        'GYM_BADGE'
                    )
                    : 0;

            var max =
                8;

            var w =
                this.contentsWidth();

            this.changeTextColor(
                '#f5d76e'
            );

            this.contents.fontSize =
                18;

            this.contents.fontBold =
                true;

            this.contents.drawText(
                'VITRINA DE MEDALLAS',
                0,
                6,
                w,
                28,
                'center'
            );

            this.resetTextColor();

            this.contents.fontSize =
                14;

            this.contents.fontBold =
                false;

            this.changeTextColor(
                '#aeb5c5'
            );

            this.contents.drawText(
                Math.min(
                    qty,
                    max
                ) +
                ' / ' +
                max +
                ' conseguidas',

                0,
                34,
                w,
                22,
                'center'
            );

            this.resetTextColor();

            var cols =
                4;

            var gap =
                10;

            var cellW =
                Math.floor(
                    (
                        w -
                        gap *
                        3
                    ) /
                    4
                );

            var cellH =
                82;

            var startY =
                70;

            var bmp =
                ImageManager.loadPicture(
                    'GM_Item_GymBadge'
                );

            var self =
                this;

            if (
                !bmp.isReady()
            ) {

                bmp.addLoadListener(
                    function() {

                        self.refresh();
                    }
                );
            }

            for (
                var i = 0;
                i < max;
                i++
            ) {

                var col =
                    i %
                    cols;

                var row =
                    Math.floor(
                        i /
                        cols
                    );

                var x =
                    col *
                    (
                        cellW +
                        gap
                    );

                var y =
                    startY +
                    row *
                    (
                        cellH +
                        gap
                    );

                var owned =
                    i <
                    qty;

                this._panel(
                    x,
                    y,
                    cellW,
                    cellH,

                    owned
                        ? '#f5d76e'
                        : '#4c5363'
                );

                if (
                    owned &&
                    bmp.isReady() &&
                    bmp.width >
                    0
                ) {

                    var size =
                        Math.min(
                            58,
                            cellW -
                            12,
                            cellH -
                            14
                        );

                    this.contents.blt(
                        bmp,
                        0,
                        0,
                        bmp.width,
                        bmp.height,

                        x +
                        Math.floor(
                            (
                                cellW -
                                size
                            ) /
                            2
                        ),

                        y +
                        Math.floor(
                            (
                                cellH -
                                size
                            ) /
                            2
                        ),

                        size,
                        size
                    );

                } else {

                    this.contents.fontSize =
                        26;

                    this.changeTextColor(
                        '#596172'
                    );

                    this.contents.drawText(
                        '◇',
                        x,
                        y +
                        20,
                        cellW,
                        32,
                        'center'
                    );

                    this.resetTextColor();
                }
            }

            this.contents.fontSize =
                13;

            this.changeTextColor(
                '#929aac'
            );

            this.contents.drawText(
                'Cada hueco representa una Medalla de Gimnasio.',
                4,

                startY +
                2 *
                (
                    cellH +
                    gap
                ) +
                4,

                w -
                8,

                22,

                'center'
            );

            this.resetTextColor();
        };

    Window_GMBagPreview.prototype.refresh =
        function() {

            this.contents.clear();

            var item =
                this._item();

            var category =
                this._category();

            var w =
                this.contentsWidth();

            var h =
                this.contentsHeight();

            this._panel(
                0,
                0,
                w,
                h,
                '#8ebcff'
            );

            if (
                category ===
                    'MEDAL' ||
                category ===
                    'MEDALLAS' ||
                (
                    GM.BagCategory &&
                    category ===
                        GM.BagCategory.MEDAL
                )
            ) {

                this._drawMedalCase();

                return;
            }

            if (!item) {

                this.changeTextColor(
                    '#969db0'
                );

                this.contents.fontSize =
                    18;

                this.contents.drawText(
                    'SIN OBJETO SELECCIONADO',
                    0,
                    Math.floor(
                        h /
                        2
                    ) -
                    18,
                    w,
                    30,
                    'center'
                );

                this.contents.fontSize =
                    13;

                this.contents.drawText(
                    'Elige un objeto para ver sus detalles.',
                    0,
                    Math.floor(
                        h /
                        2
                    ) +
                    14,
                    w,
                    24,
                    'center'
                );

                this.resetTextColor();

                return;
            }

            var filename =
                this._filename(
                    item
                );

            var bmp =
                filename
                    ? ImageManager.loadPicture(
                        filename
                    )
                    : null;

            var self =
                this;

            if (
                bmp &&
                !bmp.isReady()
            ) {

                bmp.addLoadListener(
                    function() {

                        self.refresh();
                    }
                );
            }

            var imageBox =
                Math.min(
                    150,
                    w -
                    60
                );

            var imageX =
                Math.floor(
                    (
                        w -
                        imageBox
                    ) /
                    2
                );

            var imageY =
                22;

            this._panel(
                imageX,
                imageY,
                imageBox,
                imageBox,
                '#f5d76e'
            );

            if (
                bmp &&
                bmp.isReady() &&
                bmp.width >
                0
            ) {

                var size =
                    imageBox -
                    18;

                this.contents.blt(
                    bmp,
                    0,
                    0,
                    bmp.width,
                    bmp.height,
                    imageX +
                    9,
                    imageY +
                    9,
                    size,
                    size
                );
            }

            this.contents.fontBold =
                true;

            this.contents.fontSize =
                23;

            this.changeTextColor(
                '#ffffff'
            );

            this.contents.drawText(
                item.name ||
                'Objeto',
                8,
                imageY +
                imageBox +
                14,
                w -
                16,
                32,
                'center'
            );

            this.resetTextColor();

            var qty =
                GM.getItemQuantity
                    ? GM.getItemQuantity(
                        item.key
                    )
                    : 0;

            this.contents.fontSize =
                16;

            this.changeTextColor(
                '#f5d76e'
            );

            this.contents.drawText(
                'x ' +
                qty,
                8,
                imageY +
                imageBox +
                48,
                w -
                16,
                24,
                'center'
            );

            this.resetTextColor();

            if (
                String(
                    item.key
                ).toUpperCase() ===
                    'CANDY'
            ) {

                this.contents.fontSize =
                    15;

                this.changeTextColor(
                    '#79dfca'
                );

                this.contents.drawText(
                    'SUBE 1 NIVEL',
                    8,
                    imageY +
                    imageBox +
                    78,
                    w -
                    16,
                    24,
                    'center'
                );

                this.resetTextColor();
            }

            this.contents.fontBold =
                false;

            this.contents.fontSize =
                13;

            this.changeTextColor(
                '#b7becd'
            );

            var desc =
                String(
                    item.description ||
                    ''
                );

            var words =
                desc.split(
                    /\s+/
                );

            var line =
                '';

            var lines =
                [];

            for (
                var i = 0;
                i < words.length;
                i++
            ) {

                var test =
                    line
                        ? line +
                          ' ' +
                          words[i]
                        : words[i];

                if (
                    this.textWidth(
                        test
                    ) <=
                    w -
                    28
                ) {

                    line =
                        test;

                } else {

                    if (line) {
                        lines.push(
                            line
                        );
                    }

                    line =
                        words[i];
                }
            }

            if (line) {
                lines.push(
                    line
                );
            }

            for (
                var j = 0;
                j <
                    Math.min(
                        lines.length,
                        4
                    );
                j++
            ) {

                this.contents.drawText(
                    lines[j],
                    14,

                    imageY +
                    imageBox +
                    110 +
                    j *
                    20,

                    w -
                    28,

                    20,

                    'center'
                );
            }

            this.resetTextColor();
        };

    Window_GMBagPreview.prototype.update =
        function() {

            Window_Base.prototype.update.call(
                this
            );

            var item =
                this._item();

            var cat =
                this._category();

            var key =
                cat +
                '|' +
                (
                    item
                        ? item.key
                        : ''
                ) +
                '|' +
                (
                    item &&
                    GM.getItemQuantity
                        ? GM.getItemQuantity(
                            item.key
                        )
                        : 0
                ) +
                '|B' +
                (
                    GM.getItemQuantity
                        ? GM.getItemQuantity(
                            'GYM_BADGE'
                        )
                        : 0
                );

            if (
                key !==
                this._lastKey
            ) {

                this._lastKey =
                    key;

                this.refresh();
            }
        };

    var _Scene_Bag_create =
        Scene_GranadaMonBag.prototype.create;

    Scene_GranadaMonBag.prototype.create =
        function() {

            _Scene_Bag_create.call(
                this
            );

            UIX.addPattern(
                this,
                'bag'
            );

            if (
                this._itemWindow &&
                !this._gmBagPreviewWindow
            ) {

                var fullRight =
                    Graphics.boxWidth -
                    16;

                var previewW =
                    Math.min(
                        300,
                        Math.floor(
                            Graphics.boxWidth *
                            0.34
                        )
                    );

                var gap =
                    10;

                var itemX =
                    this._itemWindow.x;

                var itemY =
                    this._itemWindow.y;

                var itemH =
                    this._itemWindow.height;

                var itemW =
                    fullRight -
                    itemX -
                    previewW -
                    gap;

                if (
                    itemW >=
                    360
                ) {

                    this._itemWindow.move(
                        itemX,
                        itemY,
                        itemW,
                        itemH
                    );

                    this._itemWindow.createContents();

                    if (
                        this._itemWindow.refresh
                    ) {
                        this._itemWindow.refresh();
                    }

                    this._gmBagPreviewWindow =
                        new Window_GMBagPreview(
                            itemX +
                            itemW +
                            gap,
                            itemY,
                            previewW,
                            itemH,
                            this
                        );

                    this.addWindow(
                        this._gmBagPreviewWindow
                    );
                }
            }
        };

    // =========================================================
    // CARAMELO
    // =========================================================

    var _Scene_Bag_onPokemonOk =
        Scene_GranadaMonBag.prototype.onPokemonOk;

    Scene_GranadaMonBag.prototype.onPokemonOk =
        function() {

            var item =
                this._selectedBagItem;

            var mon =
                this._pokemonWindow &&
                this._pokemonWindow.pokemon
                    ? this._pokemonWindow.pokemon()
                    : null;

            var before =
                mon
                    ? Number(
                        mon.level ||
                        1
                    )
                    : null;

            var isCandy =
                !!(
                    item &&
                    String(
                        item.key
                    ).toUpperCase() ===
                        'CANDY'
                );

            _Scene_Bag_onPokemonOk.call(
                this
            );

            if (
                isCandy &&
                mon &&
                before != null &&
                Number(
                    mon.level ||
                    before
                ) >
                    before
            ) {

                var after =
                    Number(
                        mon.level ||
                        before +
                        1
                    );

                if (
                    SoundManager &&
                    SoundManager.playRecovery
                ) {
                    SoundManager.playRecovery();
                }

                if (
                    $gameScreen &&
                    $gameScreen.startFlash
                ) {

                    $gameScreen.startFlash(
                        [
                            255,
                            230,
                            130,
                            120
                        ],
                        24
                    );
                }

                UIX.queueToast(
                    'CARAMELO UTILIZADO',

                    (
                        mon.name ||
                        'Pokémon'
                    ) +
                    '  ·  Nv. ' +
                    before +
                    ' → Nv. ' +
                    after,

                    'El Pokémon ha subido exactamente 1 nivel.',

                    '#f5d76e'
                );
            }
        };

    // =========================================================
    // MEDALLA CONSEGUIDA
    // =========================================================

    if (
        GM.gainItem &&
        !GM._gmBagPolishGainWrapped
    ) {

        GM._gmBagPolishGainWrapped =
            true;

        var _GM_gainItem =
            GM.gainItem;

        GM.gainItem =
            function(
                key,
                amount
            ) {

                var upper =
                    String(
                        key ||
                        ''
                    ).toUpperCase();

                var before =
                    GM.getItemQuantity
                        ? GM.getItemQuantity(
                            upper
                        )
                        : 0;

                var result =
                    _GM_gainItem.call(
                        GM,
                        key,
                        amount
                    );

                var after =
                    GM.getItemQuantity
                        ? GM.getItemQuantity(
                            upper
                        )
                        : before;

                if (
                    result &&
                    upper ===
                        'GYM_BADGE' &&
                    after >
                        before
                ) {

                    UIX.queueToast(
                        'MEDALLA CONSEGUIDA',

                        'Medalla de Gimnasio  ·  ' +
                        after +
                        ' / 8',

                        'La nueva medalla se ha añadido a tu vitrina.',

                        '#f5d76e'
                    );
                }

                return result;
            };
    }

    console.log(
        'GranadaMon_BagPolish v1.0 cargado.'
    );

})();