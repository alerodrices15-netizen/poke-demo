/*:
 * @plugindesc v1.1 GranadaMon - Lista visual de Pokédex + estado ROBADO Team Rocket
 * @author OpenAI
 *
 * @help
 * GranadaMon_DexListVisual.js
 *
 * COLOCAR DESPUÉS DE:
 * - GranadaMon_Menu.js
 * - GranadaMon_Core.js
 * - GranadaMon_Data.js
 * - GranadaMon_Dex.js
 * - GranadaMon_DexRecovery.js
 *
 * Y ANTES DE:
 * - GranadaMon_Telemetry.js
 * - GranadaMon_TeamRocket.js
 *
 * FUNCIONES:
 * - Lista principal de Pokédex en una columna.
 * - Imagen del Pokémon.
 * - Silueta si no ha sido visto.
 * - Nombre oculto si no ha sido visto.
 * - CAPTURADO si está capturado.
 * - ROBADO si Team Rocket lo ha robado.
 * - Mantiene etiquetas de huevos y singulares.
 */

(function() {

    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (typeof Scene_GranadaMonDex === 'undefined') {
        throw new Error(
            'GranadaMon_DexListVisual necesita GranadaMon_Menu.js.'
        );
    }

    if (!GM.getSpeciesByGranadaDex) {
        throw new Error(
            'GranadaMon_DexListVisual necesita GranadaMon_Core.js y GranadaMon_Data.js.'
        );
    }

    GM.DexListVisual = GM.DexListVisual || {};
    GM.DexListVisual.version = '1.1';


    // =========================================================
    // UTILIDADES
    // =========================================================

    GM.DexListVisual.pad3 = function(value) {

        var text = String(
            value == null ? '?' : value
        );

        while (text.length < 3) {
            text = '0' + text;
        }

        return text;
    };


    GM.DexListVisual.imageName = function(species) {

        if (!species) {
            return '';
        }

        var number =
            GM.DexListVisual.pad3(
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
    // VENTANA
    // =========================================================

    function Window_GranadaMonDexVisualList() {

        this.initialize.apply(
            this,
            arguments
        );
    }


    Window_GranadaMonDexVisualList.prototype =
        Object.create(
            Window_Selectable.prototype
        );


    Window_GranadaMonDexVisualList.prototype.constructor =
        Window_GranadaMonDexVisualList;


    Window_GranadaMonDexVisualList.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._silhouetteCache = {};
            this._loadingCallbacks = {};

            Window_Selectable.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            this.refresh();
        };


    // =========================================================
    // DIMENSIONES
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.maxItems =
        function() {

            if (
                GM.Menu &&
                GM.Menu.totalPokedex
            ) {
                return Number(
                    GM.Menu.totalPokedex
                );
            }

            return 100;
        };


    Window_GranadaMonDexVisualList.prototype.maxCols =
        function() {

            return 1;
        };


    Window_GranadaMonDexVisualList.prototype.itemHeight =
        function() {

            return 108;
        };


    // =========================================================
    // DATOS
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.entryAt =
        function(index) {

            var dex =
                $gameSystem._granadaMonDex ||
                [];

            return dex[index] || null;
        };


    Window_GranadaMonDexVisualList.prototype.speciesAt =
        function(index) {

            return GM.getSpeciesByGranadaDex(
                index + 1
            );
        };


    Window_GranadaMonDexVisualList.prototype.isSeen =
        function(entry) {

            return !!(
                entry &&
                (
                    entry.seen === true ||
                    entry.caught === true
                )
            );
        };


    Window_GranadaMonDexVisualList.prototype.isCaught =
        function(entry) {

            return !!(
                entry &&
                entry.caught === true
            );
        };


    Window_GranadaMonDexVisualList.prototype.isStolen =
        function(entry) {

            return !!(
                entry &&
                entry.teamRocketStolen === true
            );
        };


    // =========================================================
    // CARGA DE IMÁGENES
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.requestImageRefresh =
        function(
            bitmap,
            key
        ) {

            if (
                !bitmap ||
                !key ||
                this._loadingCallbacks[key]
            ) {
                return;
            }

            this._loadingCallbacks[key] =
                true;

            bitmap.addLoadListener(
                function() {

                    this._loadingCallbacks[key] =
                        false;

                    if (this.contents) {
                        this.refresh();
                    }

                }.bind(this)
            );
        };


    // =========================================================
    // SILUETA
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.silhouetteFor =
        function(
            source,
            key
        ) {

            if (
                !source ||
                !source.isReady() ||
                source.width <= 0 ||
                source.height <= 0
            ) {
                return null;
            }

            if (
                this._silhouetteCache[key]
            ) {
                return this._silhouetteCache[
                    key
                ];
            }

            var result =
                new Bitmap(
                    source.width,
                    source.height
                );

            result.blt(
                source,
                0,
                0,
                source.width,
                source.height,
                0,
                0
            );

            var context =
                result._context;

            if (context) {

                context.save();

                context.globalCompositeOperation =
                    'source-in';

                context.fillStyle =
                    '#535966';

                context.fillRect(
                    0,
                    0,
                    result.width,
                    result.height
                );

                context.restore();

                if (
                    result._setDirty
                ) {
                    result._setDirty();
                }
            }

            this._silhouetteCache[key] =
                result;

            return result;
        };


    // =========================================================
    // IMAGEN DEL POKÉMON
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.drawPokemonImage =
        function(
            species,
            seen,
            x,
            y,
            width,
            height
        ) {

            if (!species) {
                return;
            }

            var filename =
                GM.DexListVisual.imageName(
                    species
                );

            if (!filename) {
                return;
            }

            var source =
                ImageManager.loadPicture(
                    filename
                );

            if (!source.isReady()) {

                this.requestImageRefresh(
                    source,
                    filename
                );

                return;
            }

            var bitmap =
                seen
                    ? source
                    : this.silhouetteFor(
                        source,
                        filename
                    );

            if (
                !bitmap ||
                bitmap.width <= 0 ||
                bitmap.height <= 0
            ) {
                return;
            }

            var scale =
                Math.min(
                    width / bitmap.width,
                    height / bitmap.height
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
                    ) / 2
                );

            var drawY =
                y +
                Math.floor(
                    (
                        height -
                        drawHeight
                    ) / 2
                );

            this.contents.blt(
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
    // ETIQUETAS ESPECIALES
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.specialInfo =
        function(species) {

            if (
                !species ||
                !GM.Dex
            ) {
                return null;
            }


            // SINGULAR
            if (
                GM.Dex.isSingular &&
                GM.Dex.isSingular(
                    species
                )
            ) {

                return {
                    text: 'SINGULAR',
                    color: '#f4d56a'
                };
            }


            // HUEVO
            if (
                GM.Dex.isHatch &&
                GM.Dex.isHatch(
                    species
                ) &&
                GM.Dex.hatchStyle
            ) {

                var hatchStyle =
                    GM.Dex.hatchStyle(
                        species
                    );

                if (hatchStyle) {

                    return {

                        text:
                            hatchStyle.label ||
                            'ECLOSIÓN',

                        color:
                            hatchStyle.accent2 ||
                            hatchStyle.accent ||
                            '#ffffff'
                    };
                }
            }

            return null;
        };


    // =========================================================
    // TARJETA
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.drawCard =
        function(
            rect,
            seen,
            caught,
            stolen
        ) {

            var x =
                rect.x + 4;

            var y =
                rect.y + 5;

            var width =
                rect.width - 8;

            var height =
                rect.height - 10;


            var topColor;

            var bottomColor;

            var borderColor;


            if (stolen) {

                topColor =
                    '#35242a';

                bottomColor =
                    '#170f13';

                borderColor =
                    '#d95b66';

            }

            else if (caught) {

                topColor =
                    '#272d39';

                bottomColor =
                    '#111821';

                borderColor =
                    '#d9c76f';

            }

            else if (seen) {

                topColor =
                    '#202734';

                bottomColor =
                    '#10161e';

                borderColor =
                    '#7188a8';

            }

            else {

                topColor =
                    '#181d25';

                bottomColor =
                    '#0c1016';

                borderColor =
                    '#454b58';
            }


            // FONDO
            this.contents.gradientFillRect(
                x,
                y,
                width,
                height,
                topColor,
                bottomColor,
                false
            );


            // BORDE SUPERIOR
            this.contents.fillRect(
                x,
                y,
                width,
                2,
                borderColor
            );


            // BORDE INFERIOR
            this.contents.fillRect(
                x,
                y + height - 2,
                width,
                2,
                borderColor
            );


            // BORDE IZQUIERDO
            this.contents.fillRect(
                x,
                y,
                2,
                height,
                borderColor
            );


            // BORDE DERECHO
            this.contents.fillRect(
                x + width - 2,
                y,
                2,
                height,
                borderColor
            );


            // LÍNEA LATERAL
            this.contents.fillRect(
                x + 8,
                y + 10,
                3,
                height - 20,

                stolen
                    ? '#ff5a5a'
                    : caught
                        ? '#f4d56a'
                        : seen
                            ? '#78a7d8'
                            : '#555b68'
            );
        };


    // =========================================================
    // DIBUJAR ENTRADA
    // =========================================================

    Window_GranadaMonDexVisualList.prototype.drawItem =
        function(index) {

            var rect =
                this.itemRect(
                    index
                );

            var entry =
                this.entryAt(
                    index
                );

            var species =
                this.speciesAt(
                    index
                );

            var seen =
                this.isSeen(
                    entry
                );

            var caught =
                this.isCaught(
                    entry
                );

            var stolen =
                this.isStolen(
                    entry
                );

            var number =
                GM.DexListVisual.pad3(
                    index + 1
                );


            // =================================================
            // TARJETA
            // =================================================

            this.drawCard(
                rect,
                seen,
                caught,
                stolen
            );


            var cardX =
                rect.x + 4;

            var cardY =
                rect.y + 5;

            var cardWidth =
                rect.width - 8;


            // =================================================
            // MINIATURA
            // =================================================

            var imageX =
                cardX + 24;

            var imageY =
                cardY + 8;

            var imageSize =
                78;


            this.contents.gradientFillRect(
                imageX - 4,
                imageY - 4,
                imageSize + 8,
                imageSize + 8,

                stolen
                    ? '#3e2930'
                    : seen
                        ? '#303847'
                        : '#222730',

                '#11161e',
                false
            );


            var imageBorder =
                stolen
                    ? '#ff5a5a'
                    : caught
                        ? '#d9c76f'
                        : seen
                            ? '#73869e'
                            : '#454b58';


            // BORDE MINIATURA

            this.contents.fillRect(
                imageX - 4,
                imageY - 4,
                imageSize + 8,
                2,
                imageBorder
            );

            this.contents.fillRect(
                imageX - 4,
                imageY + imageSize + 2,
                imageSize + 8,
                2,
                imageBorder
            );

            this.contents.fillRect(
                imageX - 4,
                imageY - 4,
                2,
                imageSize + 8,
                imageBorder
            );

            this.contents.fillRect(
                imageX + imageSize + 2,
                imageY - 4,
                2,
                imageSize + 8,
                imageBorder
            );


            // POKÉMON / SILUETA
            this.drawPokemonImage(
                species,
                seen,
                imageX,
                imageY,
                imageSize,
                imageSize
            );


            // =================================================
            // NÚMERO
            // =================================================

            var numberX =
                imageX +
                imageSize +
                24;


            this.contents.fontBold =
                true;

            this.contents.fontSize =
                23;


            if (stolen) {

                this.changeTextColor(
                    '#ff7777'
                );

            }

            else {

                this.changeTextColor(
                    seen
                        ? this.systemColor()
                        : '#9097a5'
                );
            }


            this.drawText(
                '#' + number,
                numberX,
                cardY + 10,
                110
            );


            this.contents.fontBold =
                false;


            // =================================================
            // NOMBRE
            // =================================================

            var nameX =
                numberX + 118;


            var rightWidth =
                260;


            var nameWidth =
                Math.max(
                    200,

                    cardX +
                    cardWidth -
                    rightWidth -
                    nameX
                );


            this.contents.fontSize =
                25;


            if (seen) {

                this.contents.fontBold =
                    true;


                if (stolen) {

                    this.changeTextColor(
                        '#ffffff'
                    );

                }

                else {

                    this.resetTextColor();
                }


                this.drawText(

                    (
                        entry &&
                        entry.name
                    )

                        ? entry.name

                        : species

                            ? species.name

                            : (
                                'Pokémon #' +
                                (
                                    index + 1
                                )
                            ),

                    nameX,

                    cardY + 9,

                    nameWidth
                );


                this.contents.fontBold =
                    false;

            }

            else {

                this.changeTextColor(
                    '#737986'
                );

                this.drawText(
                    '??????????',
                    nameX,
                    cardY + 9,
                    nameWidth
                );
            }


            // =================================================
            // ESTADO INFERIOR
            // =================================================

            this.contents.fontSize =
                16;


            if (!seen) {

                this.changeTextColor(
                    '#686e7a'
                );

                this.drawText(
                    'REGISTRO DESCONOCIDO',
                    numberX,
                    cardY + 57,
                    310
                );
            }

            else if (stolen) {

                this.changeTextColor(
                    '#e6d9dc'
                );

                this.drawText(
                    'REGISTRO COMPLETO',
                    numberX,
                    cardY + 57,
                    260
                );
            }

            else if (caught) {

                this.changeTextColor(
                    '#d7dbe4'
                );

                this.drawText(
                    'REGISTRO COMPLETO',
                    numberX,
                    cardY + 57,
                    260
                );
            }

            else {

                this.changeTextColor(
                    '#9eb4d0'
                );

                this.drawText(
                    'AVISTADO',
                    numberX,
                    cardY + 57,
                    180
                );
            }


            // =================================================
            // HUEVO / SINGULAR
            // =================================================

            var special =
                seen
                    ? this.specialInfo(
                        species
                    )
                    : null;


            if (special) {

                this.contents.fontBold =
                    true;

                this.contents.fontSize =
                    16;

                this.changeTextColor(
                    special.color
                );

                this.drawText(
                    special.text,

                    cardX +
                    cardWidth -
                    250,

                    cardY + 12,

                    220,

                    'right'
                );

                this.contents.fontBold =
                    false;
            }


            // =================================================
            // ESTADO DERECHA
            // =================================================

            this.contents.fontSize =
                16;


            // TEAM ROCKET
            if (stolen) {

                this.contents.fontBold =
                    true;

                this.changeTextColor(
                    '#ff5a5a'
                );

                this.drawText(
                    '⚠ ROBADO',

                    cardX +
                    cardWidth -
                    250,

                    cardY + 57,

                    220,

                    'right'
                );

                this.contents.fontBold =
                    false;
            }


            // CAPTURADO NORMAL
            else if (caught) {

                this.contents.fontBold =
                    true;

                this.changeTextColor(
                    '#f4d56a'
                );

                this.drawText(
                    '✓ CAPTURADO',

                    cardX +
                    cardWidth -
                    250,

                    cardY + 57,

                    220,

                    'right'
                );

                this.contents.fontBold =
                    false;
            }


            // VISTO
            else if (seen) {

                this.changeTextColor(
                    '#9eb4d0'
                );

                this.drawText(
                    'VISTO',

                    cardX +
                    cardWidth -
                    250,

                    cardY + 57,

                    220,

                    'right'
                );
            }


            // BLOQUEADO
            else {

                this.changeTextColor(
                    '#606673'
                );

                this.drawText(
                    'BLOQUEADO',

                    cardX +
                    cardWidth -
                    250,

                    cardY + 57,

                    220,

                    'right'
                );
            }


            // =================================================
            // RESTAURAR
            // =================================================

            this.contents.fontSize =
                this.standardFontSize();

            this.contents.fontBold =
                false;

            this.resetTextColor();
        };


    // =========================================================
    // OK
    // =========================================================

    Scene_GranadaMonDex.prototype.onGMVisualDexOk =
        function() {

            var index =
                this._dexWindow
                    ? this._dexWindow.index()
                    : -1;


            if (index < 0) {

                SoundManager.playBuzzer();

                if (
                    this._dexWindow
                ) {
                    this._dexWindow.activate();
                }

                return;
            }


            var dex =
                $gameSystem._granadaMonDex ||
                [];


            var entry =
                dex[index] ||
                null;


            if (
                !entry ||
                (
                    entry.seen !== true &&
                    entry.caught !== true
                )
            ) {

                SoundManager.playBuzzer();

                this._dexWindow.activate();

                return;
            }


            if (entry.caught) {
                entry.seen = true;
            }


            if (GM.Dex) {
                GM.Dex.selectedIndex =
                    index;
            }


            if (
                typeof Scene_GranadaDexEntry !==
                'undefined'
            ) {

                SceneManager.push(
                    Scene_GranadaDexEntry
                );

            }

            else {

                SoundManager.playBuzzer();

                this._dexWindow.activate();
            }
        };


    // =========================================================
    // CREAR LISTA
    // =========================================================

    Scene_GranadaMonDex.prototype.createDexWindow =
        function() {


            // Reparación del Dex desde Pokémon poseídos
            if (
                GM.DexRecovery &&
                GM.DexRecovery.repairDexFromOwned
            ) {

                GM.DexRecovery
                    .repairDexFromOwned();
            }


            // Refuerzo Team Rocket.
            // Garantiza que antes de dibujar la lista se actualice
            // qué Pokémon está robado.
            if (
                GM.TeamRocket &&
                GM.TeamRocket.decorateDex
            ) {

                GM.TeamRocket
                    .decorateDex();
            }


            var y =
                this._titleWindow.height +
                this._summaryWindow.height;


            this._dexWindow =
                new Window_GranadaMonDexVisualList(
                    0,
                    y,
                    Graphics.boxWidth,
                    Graphics.boxHeight - y
                );


            // CANCELAR
            this._dexWindow.setHandler(
                'cancel',
                this.popScene.bind(
                    this
                )
            );


            // DEX RECOVERY
            if (
                typeof this.onDRDexOk ===
                'function'
            ) {

                this._dexWindow.setHandler(
                    'ok',
                    this.onDRDexOk.bind(
                        this
                    )
                );
            }


            // GRANADAMON DEX
            else if (
                typeof this.onGranadaDexOk ===
                'function'
            ) {

                this._dexWindow.setHandler(
                    'ok',
                    this.onGranadaDexOk.bind(
                        this
                    )
                );
            }


            // FALLBACK
            else {

                this._dexWindow.setHandler(
                    'ok',
                    this.onGMVisualDexOk.bind(
                        this
                    )
                );
            }


            this.addWindow(
                this._dexWindow
            );


            this._dexWindow.activate();

            this._dexWindow.select(0);


            if (
                this._summaryWindow &&
                this._summaryWindow.refresh
            ) {

                this._summaryWindow.refresh();
            }
        };


    // =========================================================
    // PÚBLICO
    // =========================================================

    window.Window_GranadaMonDexVisualList =
        Window_GranadaMonDexVisualList;


    console.log(
        'GranadaMon DexListVisual v1.1 + Team Rocket cargado correctamente.'
    );

})();