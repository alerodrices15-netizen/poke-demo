/*:
 * @plugindesc v1.1 GranadaMon - Núcleo visual: tipos, patrones, avisos y nuevos registros
 * @author OpenAI
 *
 * @help
 * GranadaMon_UIEffects.js
 * ------------------------------------------------------------
 * AÑADIR, NO SUSTITUIR.
 *
 * Colócalo DEBAJO de:
 * - GranadaMon_Core.js
 * - GranadaMon_Data.js
 * - GranadaMon_Dex.js
 * - GranadaMon_Capture.js
 * - GranadaMon_CaptureOnly.js (si lo usas)
 *
 * Y ENCIMA de los otros plugins *Polish de esta tanda.
 *
 * No requiere imágenes nuevas.
 *
 * Aporta:
 * - Colores comunes por tipo.
 * - Etiquetas visuales de tipo.
 * - Fondos/patrones sutiles por pantalla.
 * - Avisos animados en pantalla.
 * - Aviso NUEVO REGISTRO al obtener por primera vez un Pokémon.
 * - NO muestra NUEVO REGISTRO al capturarlo, porque el sistema de
 *   captura ya muestra su propio aviso.
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    GM.UIX = GM.UIX || {};
    var UIX = GM.UIX;

    UIX.version = '1.1';

    UIX.typeColors = {
        NORMAL:   '#a8a878',
        FIRE:     '#f08030',
        WATER:    '#6890f0',
        ELECTRIC: '#f8d030',
        GRASS:    '#78c850',
        ICE:      '#98d8d8',
        FIGHTING: '#c03028',
        POISON:   '#a040a0',
        GROUND:   '#e0c068',
        FLYING:   '#a890f0',
        PSYCHIC:  '#f85888',
        BUG:      '#a8b820',
        ROCK:     '#b8a038',
        GHOST:    '#705898',
        DRAGON:   '#7038f8',
        DARK:     '#705848',
        STEEL:    '#b8b8d0',
        FAIRY:    '#ee99ac'
    };

    UIX.typeNames = {
        NORMAL: 'NORMAL',
        FIRE: 'FUEGO',
        WATER: 'AGUA',
        ELECTRIC: 'ELÉCTRICO',
        GRASS: 'PLANTA',
        ICE: 'HIELO',
        FIGHTING: 'LUCHA',
        POISON: 'VENENO',
        GROUND: 'TIERRA',
        FLYING: 'VOLADOR',
        PSYCHIC: 'PSÍQUICO',
        BUG: 'BICHO',
        ROCK: 'ROCA',
        GHOST: 'FANTASMA',
        DRAGON: 'DRAGÓN',
        DARK: 'SINIESTRO',
        STEEL: 'ACERO',
        FAIRY: 'HADA'
    };

    UIX.typeColor = function(type) {
        type = String(type || '').toUpperCase();

        return UIX.typeColors[type] || '#8ebcff';
    };

    UIX.typeName = function(type) {
        type = String(type || '').toUpperCase();

        return UIX.typeNames[type] || type || '—';
    };

    UIX.speciesForMon = function(mon) {
        if (!mon || !GM.getSpecies) {
            return null;
        }

        return GM.getSpecies(mon.speciesId) || null;
    };

    UIX.pad3 = function(n) {
        var s = String(
            n == null
                ? '?'
                : n
        );

        while (s.length < 3) {
            s = '0' + s;
        }

        return s;
    };

    UIX.drawTypeChip = function(
        win,
        type,
        x,
        y,
        width,
        height
    ) {
        if (
            !win ||
            !win.contents ||
            !type
        ) {
            return;
        }

        width = width || 86;
        height = height || 22;

        var c = UIX.typeColor(type);

        var oldOpacity =
            win.contents.paintOpacity;

        var oldSize =
            win.contents.fontSize;

        var oldBold =
            win.contents.fontBold;

        win.contents.paintOpacity =
            220;

        win.contents.fillRect(
            x,
            y,
            width,
            height,
            c
        );

        win.contents.paintOpacity =
            255;

        win.contents.fillRect(
            x + 2,
            y + 2,
            width - 4,
            1,
            '#ffffff'
        );

        win.contents.fontSize =
            12;

        win.contents.fontBold =
            true;

        win.changeTextColor(
            '#ffffff'
        );

        win.contents.drawText(
            UIX.typeName(type),
            x + 4,
            y,
            width - 8,
            height,
            'center'
        );

        win.resetTextColor();

        win.contents.fontSize =
            oldSize;

        win.contents.fontBold =
            oldBold;

        win.contents.paintOpacity =
            oldOpacity;
    };

    UIX._patterns = {
        bag: {
            bg: '#0d131c',
            line: '#31465c',
            accent: '#f5d76e'
        },

        party: {
            bg: '#0d1319',
            line: '#29484a',
            accent: '#79dfca'
        },

        storage: {
            bg: '#0e111a',
            line: '#3d3555',
            accent: '#b878ff'
        },

        dex: {
            bg: '#10131c',
            line: '#303c59',
            accent: '#8ebcff'
        },

        entry: {
            bg: '#0c1119',
            line: '#2c3b50',
            accent: '#f4d56a'
        },

        menu: {
            bg: '#10141c',
            line: '#303749',
            accent: '#8ebcff'
        }
    };

    UIX.addPattern = function(
        scene,
        kind
    ) {
        if (
            !scene ||
            scene._gmUIXPattern
        ) {
            return;
        }

        var style =
            UIX._patterns[kind] ||
            UIX._patterns.menu;

        var bmp =
            new Bitmap(
                Graphics.boxWidth,
                Graphics.boxHeight
            );

        bmp.fillAll(
            style.bg
        );

        var x;
        var y;

        bmp.paintOpacity =
            70;

        for (
            x = 0;
            x < Graphics.boxWidth;
            x += 48
        ) {
            bmp.fillRect(
                x,
                0,
                1,
                Graphics.boxHeight,
                style.line
            );
        }

        for (
            y = 0;
            y < Graphics.boxHeight;
            y += 48
        ) {
            bmp.fillRect(
                0,
                y,
                Graphics.boxWidth,
                1,
                style.line
            );
        }

        bmp.paintOpacity =
            90;

        for (
            y = 24;
            y < Graphics.boxHeight;
            y += 96
        ) {
            for (
                x = 24;
                x < Graphics.boxWidth;
                x += 96
            ) {
                bmp.fillRect(
                    x,
                    y,
                    3,
                    3,
                    style.accent
                );
            }
        }

        bmp.paintOpacity =
            255;

        var spr =
            new Sprite(bmp);

        spr.opacity =
            150;

        scene._gmUIXPattern =
            spr;

        var index =
            Math.min(
                1,
                scene.children.length
            );

        scene.addChildAt(
            spr,
            index
        );
    };

    UIX.toastQueue =
        UIX.toastQueue ||
        [];

    UIX.queueToast = function(
        title,
        line1,
        line2,
        accent
    ) {
        UIX.toastQueue.push({
            title:
                String(
                    title ||
                    ''
                ),

            line1:
                String(
                    line1 ||
                    ''
                ),

            line2:
                String(
                    line2 ||
                    ''
                ),

            accent:
                accent ||
                '#f4d56a'
        });
    };

    UIX._makeToastSprite =
        function(data) {

            var w =
                Math.min(
                    620,
                    Graphics.boxWidth -
                    36
                );

            var h =
                96;

            var bmp =
                new Bitmap(
                    w,
                    h
                );

            bmp.gradientFillRect(
                0,
                0,
                w,
                h,
                '#222a38',
                '#0d1219',
                false
            );

            bmp.fillRect(
                0,
                0,
                w,
                3,
                data.accent
            );

            bmp.fillRect(
                0,
                h - 2,
                w,
                2,
                '#4a5266'
            );

            bmp.fillRect(
                0,
                0,
                2,
                h,
                '#4a5266'
            );

            bmp.fillRect(
                w - 2,
                0,
                2,
                h,
                '#4a5266'
            );

            bmp.fontFace =
                'GameFont';

            bmp.fontBold =
                true;

            bmp.fontSize =
                16;

            bmp.textColor =
                data.accent;

            bmp.drawText(
                data.title,
                18,
                8,
                w - 36,
                24,
                'left'
            );

            bmp.fontSize =
                23;

            bmp.textColor =
                '#ffffff';

            bmp.drawText(
                data.line1,
                18,
                30,
                w - 36,
                30,
                'left'
            );

            bmp.fontBold =
                false;

            bmp.fontSize =
                14;

            bmp.textColor =
                '#b9c0cf';

            bmp.drawText(
                data.line2,
                18,
                64,
                w - 36,
                20,
                'left'
            );

            var spr =
                new Sprite(bmp);

            spr.x =
                Math.floor(
                    (
                        Graphics.boxWidth -
                        w
                    ) /
                    2
                );

            spr.y =
                18;

            spr.opacity =
                0;

            spr._gmLife =
                0;

            return spr;
        };

    var _Scene_Base_update =
        Scene_Base.prototype.update;

    Scene_Base.prototype.update =
        function() {

            _Scene_Base_update.call(
                this
            );

            if (
                !this._gmUIXToast &&
                UIX.toastQueue.length >
                0
            ) {

                this._gmUIXToast =
                    UIX._makeToastSprite(
                        UIX.toastQueue.shift()
                    );

                this.addChild(
                    this._gmUIXToast
                );

                if (
                    SoundManager &&
                    SoundManager.playOk
                ) {
                    SoundManager.playOk();
                }
            }

            var spr =
                this._gmUIXToast;

            if (!spr) {
                return;
            }

            spr._gmLife++;

            if (
                spr._gmLife <=
                12
            ) {

                spr.opacity =
                    Math.min(
                        255,
                        spr.opacity +
                        24
                    );

                spr.y =
                    Math.max(
                        18,
                        spr.y -
                        1
                    );

            } else if (
                spr._gmLife >
                155
            ) {

                spr.opacity =
                    Math.max(
                        0,
                        spr.opacity -
                        18
                    );
            }

            if (
                spr._gmLife >
                172
            ) {

                this.removeChild(
                    spr
                );

                if (
                    spr.bitmap &&
                    spr.bitmap.destroy
                ) {
                    spr.bitmap.destroy();
                }

                this._gmUIXToast =
                    null;
            }
        };

    UIX.countDex =
        function() {

            var dex =
                (
                    $gameSystem &&
                    $gameSystem._granadaMonDex
                ) ||
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
                    dex[i] &&
                    dex[i].seen
                ) {
                    seen++;
                }

                if (
                    dex[i] &&
                    dex[i].caught
                ) {
                    caught++;
                }
            }

            return {
                seen:
                    seen,

                caught:
                    caught,

                total:
                    GM.totalSpecies ||
                    dex.length ||
                    100
            };
        };

    // =========================================================
    // CONTROL DEL AVISO DE NUEVO REGISTRO
    // =========================================================

    UIX._suppressDexToast =
        false;

    UIX.withSuppressedDexToast =
        function(callback, context, args) {

            var previous =
                UIX._suppressDexToast;

            UIX._suppressDexToast =
                true;

            try {

                return callback.apply(
                    context,
                    args ||
                    []
                );

            } finally {

                UIX._suppressDexToast =
                    previous;
            }
        };

    UIX.isCaptureContext =
        function() {

            if (
                UIX._suppressDexToast
            ) {
                return true;
            }

            var scene =
                SceneManager &&
                SceneManager._scene
                    ? SceneManager._scene
                    : null;

            if (!scene) {
                return false;
            }

            if (
                typeof Scene_GranadaMonCaptureOnly !==
                    'undefined' &&
                scene instanceof
                    Scene_GranadaMonCaptureOnly
            ) {
                return true;
            }

            return false;
        };

    // =========================================================
    // NUEVO REGISTRO
    // =========================================================

    if (
        GM.markCaught &&
        !GM._gmUIXMarkCaughtWrapped
    ) {

        GM._gmUIXMarkCaughtWrapped =
            true;

        var _GM_markCaught =
            GM.markCaught;

        GM.markCaught =
            function(nationalDex) {

                var entry =
                    GM.getDexEntry
                        ? GM.getDexEntry(
                            nationalDex
                        )
                        : null;

                var wasCaught =
                    !!(
                        entry &&
                        entry.caught
                    );

                var result =
                    _GM_markCaught.call(
                        GM,
                        nationalDex
                    );

                if (
                    result &&
                    !wasCaught &&
                    !UIX.isCaptureContext()
                ) {

                    var species =
                        GM.getSpecies
                            ? GM.getSpecies(
                                nationalDex
                            )
                            : null;

                    if (species) {

                        var label =
                            'NUEVO REGISTRO';

                        var accent =
                            '#8ebcff';

                        var extra =
                            'Añadido a la Pokédex';

                        if (
                            GM.Dex &&
                            GM.Dex.isSingular &&
                            GM.Dex.isSingular(
                                species
                            )
                        ) {

                            label =
                                'NUEVO REGISTRO · SINGULAR';

                            accent =
                                '#f4d56a';

                            extra =
                                'Pokémon singular registrado';

                        } else if (
                            GM.Dex &&
                            GM.Dex.isHatch &&
                            GM.Dex.isHatch(
                                species
                            )
                        ) {

                            label =
                                'NUEVO REGISTRO · ECLOSIÓN';

                            var hs =
                                GM.Dex.hatchStyle
                                    ? GM.Dex.hatchStyle(
                                        species
                                    )
                                    : null;

                            accent =
                                hs &&
                                hs.accent
                                    ? hs.accent
                                    : '#79dfca';

                            extra =
                                'Pokémon de eclosión registrado';

                        } else if (
                            species.types &&
                            species.types.length
                        ) {

                            accent =
                                UIX.typeColor(
                                    species.types[0]
                                );
                        }

                        UIX.queueToast(
                            label,

                            '#' +
                            UIX.pad3(
                                species.granadaDex
                            ) +
                            '  ' +
                            species.name,

                            extra,

                            accent
                        );
                    }
                }

                return result;
            };
    }

    // =========================================================
    // CAPTURAS: SUPRIMIR EL AVISO DUPLICADO
    // =========================================================

    if (
        GM.Capture &&
        GM.Capture.storeCapturedPokemon &&
        !GM.Capture._gmUIXStoreWrapped
    ) {

        GM.Capture._gmUIXStoreWrapped =
            true;

        var _GM_Capture_storeCapturedPokemon =
            GM.Capture.storeCapturedPokemon;

        GM.Capture.storeCapturedPokemon =
            function() {

                return UIX.withSuppressedDexToast(
                    _GM_Capture_storeCapturedPokemon,
                    this,
                    arguments
                );
            };
    }

    if (
        GM.CaptureOnly &&
        GM.CaptureOnly.storePokemon &&
        !GM.CaptureOnly._gmUIXStoreWrapped
    ) {

        GM.CaptureOnly._gmUIXStoreWrapped =
            true;

        var _GM_CaptureOnly_storePokemon =
            GM.CaptureOnly.storePokemon;

        GM.CaptureOnly.storePokemon =
            function() {

                return UIX.withSuppressedDexToast(
                    _GM_CaptureOnly_storePokemon,
                    this,
                    arguments
                );
            };
    }

    console.log(
        'GranadaMon_UIEffects v1.1 cargado: sin aviso duplicado al capturar.'
    );

})();