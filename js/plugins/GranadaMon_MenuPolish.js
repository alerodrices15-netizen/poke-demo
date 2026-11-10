//=============================================================================
// GranadaMon_MenuPolish.js
//=============================================================================

/*:
 * @plugindesc v1.3 GranadaMon - Perfil visual limpio del entrenador
 * @author OpenAI
 *
 * @help
 * ============================================================================
 * GRANADAMON - MENU POLISH
 * ============================================================================
 *
 * En el menú principal muestra:
 *
 * - Cara actual del personaje
 *
 * - Recuadro NOMBRE
 *      -> muestra el nombre actual del actor.
 *
 * - Recuadro NIVEL
 *      -> muestra la CLASE ACTUAL del actor.
 *      -> Ejemplo:
 *         Novato
 *         Aprendiz
 *         Entrenador
 *         Experto
 *         etc.
 *
 * IMPORTANTE:
 *
 * "NIVEL" NO usa el nivel numérico de RPG Maker.
 * Usa actor.currentClass().name.
 *
 * Por tanto, cuando cambies la clase del Actor 1,
 * el texto del recuadro NIVEL cambiará automáticamente.
 *
 * Se eliminan visualmente:
 *
 * - Nivel numérico
 * - PV
 * - PM
 * - PT
 * - Estados/iconos
 * - Ventana inferior izquierda de dinero
 *
 * No modifica ningún dato interno.
 *
 * No afecta a:
 * - Pokémon
 * - Mochila
 * - Pokédex
 * - Almacén
 * - Combates
 * - Guardado
 *
 * ============================================================================
 */

(function() {

    'use strict';


    //=========================================================================
    // NAMESPACE
    //=========================================================================

    window.GranadaMon =
        window.GranadaMon || {};

    GranadaMon.MenuPolish =
        GranadaMon.MenuPolish || {};

    GranadaMon.MenuPolish.VERSION =
        '1.3';


    //=========================================================================
    // UTILIDAD
    //=========================================================================

    function clamp(value, min, max) {

        value =
            Number(value || 0);

        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );
    }


    //=========================================================================
    // OCULTAR LA VENTANA INFERIOR IZQUIERDA
    //=========================================================================

    var _GM_MenuPolish_SceneMenu_create =
        Scene_Menu.prototype.create;


    Scene_Menu.prototype.create = function() {

        _GM_MenuPolish_SceneMenu_create.call(
            this
        );


        // --------------------------------------------------------------------
        // OCULTAR DINERO
        // --------------------------------------------------------------------

        if (this._goldWindow) {

            this._goldWindow.hide();

            this._goldWindow.deactivate();

            this._goldWindow.visible =
                false;

            this._goldWindow.opacity =
                0;

            this._goldWindow.backOpacity =
                0;

            this._goldWindow.contentsOpacity =
                0;

            this._goldWindow.x =
                -9999;

            this._goldWindow.y =
                -9999;
        }


        // --------------------------------------------------------------------
        // ACTUALIZAR PERFIL
        // --------------------------------------------------------------------

        if (
            this._statusWindow &&
            this._statusWindow.refresh
        ) {

            this._statusWindow.refresh();
        }
    };


    //=========================================================================
    // EVITAR QUE LA VENTANA DE DINERO VUELVA A APARECER
    //=========================================================================

    var _GM_MenuPolish_SceneMenu_update =
        Scene_Menu.prototype.update;


    Scene_Menu.prototype.update = function() {

        _GM_MenuPolish_SceneMenu_update.call(
            this
        );


        if (this._goldWindow) {

            this._goldWindow.visible =
                false;
        }
    };


    //=========================================================================
    // REFRESCAR AL ABRIR EL MENÚ
    //=========================================================================

    var _GM_MenuPolish_SceneMenu_start =
        Scene_Menu.prototype.start;


    Scene_Menu.prototype.start = function() {

        _GM_MenuPolish_SceneMenu_start.call(
            this
        );


        if (this._goldWindow) {

            this._goldWindow.hide();

            this._goldWindow.visible =
                false;
        }


        if (
            this._statusWindow &&
            this._statusWindow.refresh
        ) {

            this._statusWindow.refresh();
        }
    };


    //=========================================================================
    // RECTÁNGULO REDONDEADO
    //=========================================================================

    Window_MenuStatus.prototype.gmProfileRoundRect =
        function(
            x,
            y,
            width,
            height,
            radius,
            fillColor,
            strokeColor,
            lineWidth
        ) {

            if (
                !this.contents ||
                !this.contents._context
            ) {

                return;
            }


            var ctx =
                this.contents._context;


            radius =
                clamp(
                    radius || 10,
                    0,
                    Math.min(
                        width / 2,
                        height / 2
                    )
                );


            ctx.save();

            ctx.beginPath();

            ctx.moveTo(
                x + radius,
                y
            );

            ctx.lineTo(
                x + width - radius,
                y
            );

            ctx.quadraticCurveTo(
                x + width,
                y,
                x + width,
                y + radius
            );

            ctx.lineTo(
                x + width,
                y + height - radius
            );

            ctx.quadraticCurveTo(
                x + width,
                y + height,
                x + width - radius,
                y + height
            );

            ctx.lineTo(
                x + radius,
                y + height
            );

            ctx.quadraticCurveTo(
                x,
                y + height,
                x,
                y + height - radius
            );

            ctx.lineTo(
                x,
                y + radius
            );

            ctx.quadraticCurveTo(
                x,
                y,
                x + radius,
                y
            );

            ctx.closePath();


            // ----------------------------------------------------------------
            // FONDO
            // ----------------------------------------------------------------

            ctx.fillStyle =
                fillColor ||
                'rgba(17,21,31,0.84)';

            ctx.fill();


            // ----------------------------------------------------------------
            // BORDE
            // ----------------------------------------------------------------

            if (strokeColor) {

                ctx.strokeStyle =
                    strokeColor;

                ctx.lineWidth =
                    Number(
                        lineWidth || 2
                    );

                ctx.stroke();
            }


            ctx.restore();

            this.contents._setDirty();
        };


    //=========================================================================
    // RECUADRO DE INFORMACIÓN
    //=========================================================================

    Window_MenuStatus.prototype.gmDrawProfileBox =
        function(
            x,
            y,
            width,
            height,
            title,
            value,
            accent
        ) {

            accent =
                accent ||
                '#7ecbff';


            // ----------------------------------------------------------------
            // SOMBRA
            // ----------------------------------------------------------------

            this.gmProfileRoundRect(
                x + 3,
                y + 4,
                width,
                height,
                12,
                'rgba(0,0,0,0.35)',
                null,
                0
            );


            // ----------------------------------------------------------------
            // CAJA PRINCIPAL
            // ----------------------------------------------------------------

            this.gmProfileRoundRect(
                x,
                y,
                width,
                height,
                12,
                'rgba(18,23,34,0.84)',
                'rgba(255,255,255,0.65)',
                2
            );


            // ----------------------------------------------------------------
            // ACENTO SUPERIOR
            // ----------------------------------------------------------------

            this.gmProfileRoundRect(
                x + 7,
                y + 7,
                width - 14,
                5,
                2,
                accent,
                null,
                0
            );


            // ----------------------------------------------------------------
            // TÍTULO
            // ----------------------------------------------------------------

            this.contents.fontSize =
                13;

            this.contents.fontBold =
                false;

            this.contents.textColor =
                '#aeb8ca';

            this.contents.outlineColor =
                'rgba(0,0,0,0.65)';

            this.contents.outlineWidth =
                3;


            this.drawText(
                String(title || ''),
                x + 12,
                y + 10,
                width - 24,
                20,
                'left'
            );


            // ----------------------------------------------------------------
            // VALOR
            // ----------------------------------------------------------------

            this.contents.fontSize =
                22;

            this.contents.fontBold =
                true;

            this.contents.textColor =
                '#ffffff';

            this.contents.outlineColor =
                'rgba(0,0,0,0.70)';

            this.contents.outlineWidth =
                4;


            this.drawText(
                String(value || ''),
                x + 12,
                y + 29,
                width - 24,
                30,
                'left'
            );


            // ----------------------------------------------------------------
            // RESTAURAR FUENTE
            // ----------------------------------------------------------------

            this.contents.fontBold =
                false;

            this.contents.fontSize =
                this.standardFontSize();

            this.resetTextColor();
        };


    //=========================================================================
    // CARA DEL ENTRENADOR
    //=========================================================================

    Window_MenuStatus.prototype.drawItemImage =
        function(index) {

            var actor =
                $gameParty.members()[
                    index
                ];


            if (!actor) {

                return;
            }


            var rect;


            if (
                typeof this.itemRectForText ===
                'function'
            ) {

                rect =
                    this.itemRectForText(
                        index
                    );

            } else {

                rect =
                    this.itemRect(
                        index
                    );
            }


            if (!rect) {

                return;
            }


            var faceWidth =
                144;

            var faceHeight =
                144;


            // ----------------------------------------------------------------
            // POSICIÓN DE LA CARA
            // ----------------------------------------------------------------

            var faceX =
                rect.x + 18;


            var faceY =
                rect.y +
                Math.max(
                    14,
                    Math.floor(
                        (
                            rect.height -
                            faceHeight
                        ) /
                        2
                    )
                );


            this.changePaintOpacity(
                actor.isBattleMember()
            );


            this.drawActorFace(
                actor,
                faceX,
                faceY,
                faceWidth,
                faceHeight
            );


            this.changePaintOpacity(
                true
            );
        };


    //=========================================================================
    // PERFIL DEL ENTRENADOR
    //=========================================================================
    //
    // DISEÑO:
    //
    //      ┌──────────────────────────────────────────────┐
    //      │ NOMBRE                                       │
    //      │ Rosa                                         │
    //      └──────────────────────────────────────────────┘
    //
    //      ┌──────────────────────────────────────────────┐
    //      │ NIVEL                                        │
    //      │ Aprendiz                                     │
    //      └──────────────────────────────────────────────┘
    //
    // Ambos rectángulos tienen exactamente el mismo tamaño.
    //
    //=========================================================================

    Window_MenuStatus.prototype.drawItemStatus =
        function(index) {


            // ----------------------------------------------------------------
            // ACTOR
            // ----------------------------------------------------------------

            var actor =
                $gameParty.members()[
                    index
                ];


            if (!actor) {

                return;
            }


            // ----------------------------------------------------------------
            // RECTÁNGULO DISPONIBLE
            // ----------------------------------------------------------------

            var rect;


            if (
                typeof this.itemRectForText ===
                'function'
            ) {

                rect =
                    this.itemRectForText(
                        index
                    );

            } else {

                rect =
                    this.itemRect(
                        index
                    );
            }


            if (!rect) {

                return;
            }


            //=========================================================================
            // DATOS DINÁMICOS
            //=========================================================================


            // ----------------------------------------------------------------
            // NOMBRE ACTUAL
            // ----------------------------------------------------------------
            //
            // Ejemplo:
            //
            // Rosa
            //
            // Si cambia el nombre durante la partida,
            // esta pantalla se actualiza automáticamente.
            // ----------------------------------------------------------------

            var nombre =
                typeof actor.name ===
                'function'

                    ? String(
                        actor.name() ||
                        ''
                      )

                    : '';


            // ----------------------------------------------------------------
            // "NIVEL" = CLASE ACTUAL
            // ----------------------------------------------------------------
            //
            // MUY IMPORTANTE:
            //
            // Aquí NO usamos:
            //
            // actor.level
            //
            // porque NO queremos:
            //
            // Nv. 1
            // Nv. 2
            // Nv. 3
            //
            //
            // Utilizamos:
            //
            // actor.currentClass().name
            //
            // Así podrá mostrar:
            //
            // Novato
            // Aprendiz
            // Entrenador
            // Experto
            // Maestro
            //
            // según la clase que tenga actualmente el actor.
            // ----------------------------------------------------------------

            var nivelTexto =
                '';


            if (
                actor.currentClass &&
                actor.currentClass()
            ) {

                nivelTexto =
                    String(
                        actor.currentClass().name ||
                        ''
                    );
            }


            //=========================================================================
            // POSICIÓN
            //=========================================================================

            var startX =
                rect.x +
                182;


            var startY =
                rect.y +
                22;


            /*
             * Ancho del bloque.
             *
             * Lo limitamos para que no se extienda absurdamente
             * por toda la pantalla y quede equilibrado con la cara.
             */

            var availableWidth =
                Math.max(
                    300,
                    rect.width -
                    220
                );


            var profileWidth =
                Math.min(
                    availableWidth,
                    540
                );


            /*
             * Ambos recuadros tienen EXACTAMENTE:
             *
             * - mismo X
             * - mismo ancho
             * - misma altura
             */

            var boxHeight =
                66;


            var gap =
                12;


            //=========================================================================
            // RECUADRO 1 - NOMBRE
            //=========================================================================

            this.gmDrawProfileBox(
                startX,
                startY,
                profileWidth,
                boxHeight,
                'NOMBRE',
                nombre,
                '#58bfff'
            );


            //=========================================================================
            // RECUADRO 2 - NIVEL
            //=========================================================================
            //
            // El título dice NIVEL.
            //
            // El valor mostrado es la clase actual:
            //
            // Novato / Aprendiz / etc.
            //
            //=========================================================================

            this.gmDrawProfileBox(
                startX,

                startY +
                boxHeight +
                gap,

                profileWidth,

                boxHeight,

                'NIVEL',

                nivelTexto,

                '#8bd178'
            );


            //=========================================================================
            // NO DIBUJAMOS NADA MÁS
            //=========================================================================
            //
            // NO:
            //
            // this.drawActorLevel(...)
            //
            // NO:
            //
            // this.drawActorHp(...)
            //
            // NO:
            //
            // this.drawActorMp(...)
            //
            // NO:
            //
            // this.drawActorTp(...)
            //
            // NO:
            //
            // this.drawActorIcons(...)
            //
            // NO:
            //
            // this.drawActorClass(...)
            //
            //
            // Porque la clase ya se utiliza arriba
            // como valor del recuadro "NIVEL".
            //
            //=========================================================================
        };


    //=========================================================================
    // LOG
    //=========================================================================

    console.log(
        'GranadaMon MenuPolish v1.3 cargado: NOMBRE + NIVEL DE ENTRENADOR dinámico.'
    );


})();