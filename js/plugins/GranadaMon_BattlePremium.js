/*:
 * @plugindesc v2.0 GranadaMon - Combate Premium: turnos secuenciales, IA, mochila completa, captura por PS, entrenadores y FX
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattlePremium.js
 * ------------------------------------------------------------
 * CAPA PREMIUM PARA EL SISTEMA DE COMBATE DE GRANADAMON.
 *
 * REQUIERE (ya instalados en Pokémon Granada):
 * - GranadaMon_Core
 * - GranadaMon_Data
 * - GranadaMon_Moves
 * - GranadaMon_State
 * - GranadaMon_Experience
 * - GranadaMon_Bag
 * - GranadaMon_BattleCore
 * - GranadaMon_Battle
 * - GranadaMon_BattleUI
 * - GranadaMon_Capture
 * - GranadaMon_BattleParty
 * - GranadaMon_BattleSprites
 * - GranadaMon_BattleEffects
 * - GranadaMon_BattleAnimations
 * - GranadaMon_Dex
 * - GranadaMon_BattleClassic
 *
 * COLOCAR:
 *   DESPUÉS de GranadaMon_BattleClassic.
 *
 * NO sustituye GranadaMon_BattleClassic. Lo amplía.
 *
 * ------------------------------------------------------------
 * QUÉ AÑADE
 * ------------------------------------------------------------
 * - Turnos realmente secuenciales.
 * - Nunca ataca un Pokémon que ya se ha debilitado.
 * - IA rival que valora potencia, precisión y efectividad.
 * - Cambio de Pokémon consume turno.
 * - Si tu Pokémon cae, debes elegir sustituto sin regalar otro turno.
 * - Mochila en combate con Poké Balls + Curación.
 * - Curar/revivir correctamente consume turno; cancelar/fallar no.
 * - Captura en combate según NIVEL + BALL + PS restantes.
 * - Poké Ball x1.00 / Super Ball x1.35 / Ultra Ball x1.70.
 * - Master Ball = 100%.
 * - Captura normal limitada a 95%.
 * - Combates contra entrenadores con varios Pokémon.
 * - En combates de entrenador no se puede capturar ni huir.
 * - Entradas, banners, partículas, flashes, feedback de efectividad,
 *   curación y transiciones entre Pokémon rivales.
 *
 * ------------------------------------------------------------
 * COMBATES SALVAJES (siguen igual)
 * ------------------------------------------------------------
 *   GranadaMonBattle 25 12
 *   GranadaMonBattleGD 63 12
 *
 * ------------------------------------------------------------
 * ENTRENADORES
 * ------------------------------------------------------------
 * FORMATO GRANADA DEX:
 *   GranadaMonTrainerBattleGD NOMBRE|GD:NIVEL,GD:NIVEL,GD:NIVEL
 *
 * EJEMPLO:
 *   GranadaMonTrainerBattleGD Alberto|63:12,59:14,18:15
 *
 * FORMATO NATIONAL DEX:
 *   GranadaMonTrainerBattle NOMBRE|NDEX:NIVEL,NDEX:NIVEL
 *
 * EJEMPLO:
 *   GranadaMonTrainerBattle Entrenador UGR|25:12,94:15
 *
 * El evento del entrenador se marca como resuelto (Self Switch A)
 * SOLO al ganar. Si pierdes, puedes volver a intentarlo.
 *
 * ------------------------------------------------------------
 * OBJETOS DE CURACIÓN ADMITIDOS
 * ------------------------------------------------------------
 * Compatible con las claves españolas originales y las nuevas:
 * POCION / POTION
 * SUPERPOCION / SUPER_POTION
 * HIPERPOCION / HYPER_POTION
 * POCION_MAXIMA / MAX_POTION
 * REVIVIR / REVIVE
 * REVIVIR_MAXIMO / MAX_REVIVE
 *
 * Imágenes opcionales en img/pictures/:
 * GM_Item_Potion.png
 * GM_Item_SuperPotion.png
 * GM_Item_HyperPotion.png
 * GM_Item_MaxPotion.png
 * GM_Item_Revive.png
 * GM_Item_MaxRevive.png
 */
(function() {
    'use strict';
    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;
    if (!GM.Battle || typeof Scene_GranadaMonBattle === 'undefined') {
        throw new Error('GranadaMon_BattlePremium necesita GranadaMon_Battle.js.');
    }
    if (!GM.Capture || !GM.BattleParty || !GM.BattleSprites) {
        throw new Error('GranadaMon_BattlePremium necesita Capture, BattleParty y BattleSprites.');
    }
    GM.BattlePremium = GM.BattlePremium || {};
    var BP = GM.BattlePremium;
    BP.VERSION = '2.0';
    BP.trainer = null;
    BP.pendingTrainerEvent = null;

    BP.clamp = function(value, min, max) {
        return Math.max(min, Math.min(max, Number(value || 0)));
    };

    BP.isAlive = function(pokemon) {
        return !!pokemon && Number(pokemon.hp || 0) > 0 && !pokemon.fainted;
    };

    BP.party = function() {
        if (!$gameSystem) return [];
        $gameSystem._granadaMonParty = $gameSystem._granadaMonParty || [];
        return $gameSystem._granadaMonParty;
    };

    BP.roundedPath = function(ctx, x, y, w, h, radius) {
        radius = Math.max(0, Math.min(radius, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    BP.roundRect = function(bitmap, x, y, w, h, radius, fill, alpha, stroke, lineWidth) {
        if (!bitmap || !bitmap._context) return;
        var ctx = bitmap._context;
        ctx.save();
        BP.roundedPath(ctx, x, y, w, h, radius);
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = Number(lineWidth || 2);
            ctx.stroke();
        }
        ctx.restore();
        bitmap._setDirty();
    };

    BP.animationBusy = function(scene) {
        if (!scene) return false;
        if (GM.BattleAnimations && typeof GM.BattleAnimations.isBusy === 'function') {
            if (GM.BattleAnimations.isBusy(scene)) return true;
        }
        if (scene._gmCaptureAnimation) return true;
        if (scene._gmOutcomeState) return true;
        return false;
    };

    BP.refreshScene = function(scene) {
        if (!scene) return;
        if (scene._fieldWindow && scene._fieldWindow.refresh) scene._fieldWindow.refresh();
        if (scene._enemyStatusWindow && scene._enemyStatusWindow.refresh) scene._enemyStatusWindow.refresh();
        if (scene._playerStatusWindow && scene._playerStatusWindow.refresh) scene._playerStatusWindow.refresh();
        if (scene._moveWindow && scene._moveWindow.refresh) scene._moveWindow.refresh();
        if (scene._gmBattlePartyWindow && scene._gmBattlePartyWindow.refresh) scene._gmBattlePartyWindow.refresh();
        if (scene.refreshBattleUI) scene.refreshBattleUI();
    };

    BP.activateMainCommand = function(scene) {
        if (!scene || scene._battleEnded || scene._gmOutcomeState || scene._gmPremiumTrainerTransition) return;
        if (scene._commandWindow) {
            scene._commandWindow.show();
            scene._commandWindow.activate();
            if (scene._commandWindow.index() < 0) scene._commandWindow.select(0);
        }
        if (scene._logWindow && GM.Battle.playerPokemon) {
            scene._logWindow.setText('¿Qué hará ' + GM.Battle.playerPokemon.name + '?');
        }
    };

    BP.levelBaseChance = function(level) {
        level = BP.clamp(Math.floor(Number(level || 1)), 1, 100);
        return BP.clamp(0.80 - level * 0.013, 0.08, 0.75);
    };

    BP.ballMultiplier = function(ballKey) {
        ballKey = String(ballKey || '').toUpperCase();
        if (ballKey === 'SUPER_BALL') return 1.35;
        if (ballKey === 'ULTRA_BALL') return 1.70;
        if (ballKey === 'MASTER_BALL') return Infinity;
        return 1.00;
    };

    BP.hpMultiplier = function(pokemon) {
        if (!pokemon) return 0.80;
        var maxHp = Math.max(1, Number(pokemon.maxHp || 1));
        var hp = BP.clamp(Number(pokemon.hp || 0), 0, maxHp);
        var rate = hp / maxHp;
        if (rate <= 0.25) return 1.55;
        if (rate <= 0.50) return 1.25;
        if (rate <= 0.75) return 1.00;
        return 0.80;
    };

    BP.battleCaptureChance = function(pokemon, ballKey) {
        ballKey = String(ballKey || '').toUpperCase();
        if (ballKey === 'MASTER_BALL') return 1;
        var mult = BP.ballMultiplier(ballKey);
        var chance = BP.levelBaseChance(pokemon ? pokemon.level : 1) * mult * BP.hpMultiplier(pokemon);
        return BP.clamp(chance, 0.01, 0.95);
    };

    BP.rollCapture = function(pokemon, ballKey) {
        ballKey = String(ballKey || '').toUpperCase();
        if (ballKey === 'MASTER_BALL') {
            return { captured: true, shakes: 3, chance: 1 };
        }
        var chance = BP.battleCaptureChance(pokemon, ballKey);
        var roll = Math.random();
        if (roll < chance) {
            return { captured: true, shakes: 3, chance: chance };
        }
        var miss = (roll - chance) / Math.max(0.0001, 1 - chance);
        var shakes = 0;
        if (miss < 0.16) shakes = 3;
        else if (miss < 0.40) shakes = 2;
        else if (miss < 0.70) shakes = 1;
        return { captured: false, shakes: shakes, chance: chance };
    };

    GM.Capture.ballMultiplier = function(ballKey) {
        return BP.ballMultiplier(ballKey);
    };

    GM.Capture.calculate = function(pokemon, ballKey) {
        return BP.rollCapture(pokemon, ballKey);
    };

    BP.HEALING_KEYS = {
        POCION: true,
        POTION: true,
        SUPERPOCION: true,
        SUPER_POTION: true,
        HIPERPOCION: true,
        HYPER_POTION: true,
        POCION_MAXIMA: true,
        MAX_POTION: true,
        REVIVIR: true,
        REVIVE: true,
        REVIVIR_MAXIMO: true,
        MAX_REVIVE: true
    };

    BP.ITEM_PICTURES = {
        POCION: 'GM_Item_Potion',
        POTION: 'GM_Item_Potion',
        SUPERPOCION: 'GM_Item_SuperPotion',
        SUPER_POTION: 'GM_Item_SuperPotion',
        HIPERPOCION: 'GM_Item_HyperPotion',
        HYPER_POTION: 'GM_Item_HyperPotion',
        POCION_MAXIMA: 'GM_Item_MaxPotion',
        MAX_POTION: 'GM_Item_MaxPotion',
        REVIVIR: 'GM_Item_Revive',
        REVIVE: 'GM_Item_Revive',
        REVIVIR_MAXIMO: 'GM_Item_MaxRevive',
        MAX_REVIVE: 'GM_Item_MaxRevive'
    };

    BP.patchHealingDefinitions = function() {
        if (!GM.getItem) return;
        var defs = {
            POCION: { type: 'HEAL_HP', amount: 20 },
            POTION: { type: 'HEAL_HP', amount: 20 },
            SUPERPOCION: { type: 'HEAL_HP', amount: 50 },
            SUPER_POTION: { type: 'HEAL_HP', amount: 50 },
            HIPERPOCION: { type: 'HEAL_HP', amount: 120 },
            HYPER_POTION: { type: 'HEAL_HP', amount: 120 },
            POCION_MAXIMA: { type: 'HEAL_HP', full: true },
            MAX_POTION: { type: 'HEAL_HP', full: true },
            REVIVIR: { type: 'REVIVE', percent: 50 },
            REVIVE: { type: 'REVIVE', percent: 50 },
            REVIVIR_MAXIMO: { type: 'REVIVE', percent: 100 },
            MAX_REVIVE: { type: 'REVIVE', percent: 100 }
        };
        for (var key in defs) {
            if (!defs.hasOwnProperty(key)) continue;
            var item = GM.getItem(key);
            if (!item) continue;
            item.effect = defs[key];
            item.consumable = true;
            if (GM.BagCategory) item.category = GM.BagCategory.HEAL;
        }
    };

    BP.patchHealingDefinitions();

    BP.isHealingItem = function(item) {
        if (!item) return false;
        var key = String(item.key || '').toUpperCase();
        if (BP.HEALING_KEYS[key]) return true;
        return !!(
            GM.BagCategory &&
            item.category === GM.BagCategory.HEAL &&
            item.effect &&
            (
                item.effect.type === 'HEAL_HP' ||
                item.effect.type === 'REVIVE'
            )
        );
    };

    BP.healingItemsInBag = function() {
        var result = [];
        if (!GM.ItemList || !GM.getItemQuantity) return result;

        for (var i = 0; i < GM.ItemList.length; i++) {
            var item = GM.ItemList[i];

            if (!BP.isHealingItem(item)) continue;
            if (GM.getItemQuantity(item.key) <= 0) continue;

            var exists = false;

            for (var j = 0; j < result.length; j++) {
                if (result[j].key === item.key) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                result.push(item);
            }
        }

        return result;
    };

    BP.canUseHealingOn = function(item, pokemon) {
        if (!item || !pokemon || !item.effect) return false;

        var effect = item.effect;

        if (effect.type === 'REVIVE') {
            return Number(pokemon.hp || 0) <= 0;
        }

        if (effect.type === 'HEAL_HP') {
            return (
                Number(pokemon.hp || 0) > 0 &&
                Number(pokemon.hp || 0) < Number(pokemon.maxHp || 1)
            );
        }

        return false;
    };

    function Window_GMPremiumBagCategory() {
        this.initialize.apply(this, arguments);
    }

    Window_GMPremiumBagCategory.prototype =
        Object.create(Window_HorzCommand.prototype);

    Window_GMPremiumBagCategory.prototype.constructor =
        Window_GMPremiumBagCategory;

    Window_GMPremiumBagCategory.prototype.initialize =
        function(x, y, width) {
            this._gmWidth = width;

            Window_HorzCommand.prototype.initialize.call(
                this,
                x,
                y
            );

            this.hide();
            this.deactivate();
            this.opacity = 245;
        };

    Window_GMPremiumBagCategory.prototype.windowWidth =
        function() {
            return this._gmWidth || Math.min(
                620,
                Graphics.boxWidth - 60
            );
        };

    Window_GMPremiumBagCategory.prototype.maxCols =
        function() {
            return BP.trainer
                ? 1
                : 2;
        };

    Window_GMPremiumBagCategory.prototype.makeCommandList =
        function() {
            if (!BP.trainer) {
                this.addCommand(
                    'Poké Balls',
                    'balls',
                    true
                );
            }

            this.addCommand(
                'Curación',
                'heal',
                true
            );
        };

    Window_GMPremiumBagCategory.prototype.drawItem =
        function(index) {
            var rect =
                this.itemRectForText(index);

            var selected =
                index === this.index();

            var symbol =
                this.commandSymbol(index);

            var fill =
                symbol === 'balls'
                    ? '#dca33f'
                    : '#5aa968';

            BP.roundRect(
                this.contents,
                rect.x + 4,
                rect.y + 4,
                rect.width - 8,
                rect.height - 8,
                12,
                selected
                    ? fill
                    : '#f5f6f2',
                selected
                    ? 0.96
                    : 0.92,
                selected
                    ? '#ffffff'
                    : 'rgba(55,70,65,0.18)',
                selected
                    ? 2
                    : 1
            );

            this.changeTextColor(
                selected
                    ? '#ffffff'
                    : '#2d3d38'
            );

            this.contents.fontSize =
                selected
                    ? 21
                    : 19;

            this.drawText(
                this.commandName(index),
                rect.x + 8,
                rect.y,
                rect.width - 16,
                'center'
            );

            this.resetTextColor();
        };

    function Window_GMPremiumBagItems() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GMPremiumBagItems.prototype =
        Object.create(
            Window_Selectable.prototype
        );

    Window_GMPremiumBagItems.prototype.constructor =
        Window_GMPremiumBagItems;

    Window_GMPremiumBagItems.prototype.initialize =
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

            this._mode =
                'heal';

            this._data =
                [];

            this.hide();
            this.deactivate();

            this.opacity =
                245;
        };

    Window_GMPremiumBagItems.prototype.setMode =
        function(mode) {
            this._mode =
                mode ||
                'heal';

            this.refresh();
        };

    Window_GMPremiumBagItems.prototype.makeItemList =
        function() {
            this._data =
                this._mode === 'balls'
                    ? (
                        GM.Capture.getBagBalls
                            ? GM.Capture.getBagBalls()
                            : []
                    )
                    : BP.healingItemsInBag();
        };

    Window_GMPremiumBagItems.prototype.maxItems =
        function() {
            return this._data
                ? this._data.length
                : 0;
        };

    Window_GMPremiumBagItems.prototype.item =
        function() {
            return (
                this._data &&
                this.index() >= 0
            )
                ? this._data[
                    this.index()
                  ]
                : null;
        };

    Window_GMPremiumBagItems.prototype.itemHeight =
        function() {
            return 62;
        };

    Window_GMPremiumBagItems.prototype.drawItem =
        function(index) {
            var item =
                this._data[index];

            if (!item) {
                return;
            }

            var rect =
                this.itemRectForText(
                    index
                );

            var selected =
                index ===
                this.index();

            BP.roundRect(
                this.contents,
                rect.x + 3,
                rect.y + 3,
                rect.width - 6,
                rect.height - 6,
                12,
                selected
                    ? '#e8f7f1'
                    : '#ffffff',
                selected
                    ? 0.98
                    : 0.82,
                selected
                    ? '#69c9a7'
                    : 'rgba(55,70,65,0.12)',
                selected
                    ? 2
                    : 1
            );

            var iconX =
                rect.x + 10;

            var iconY =
                rect.y + 7;

            var picName =
                BP.ITEM_PICTURES[
                    String(
                        item.key ||
                        ''
                    ).toUpperCase()
                ];

            if (
                this._mode === 'balls' &&
                GM.BallVisuals &&
                GM.BallVisuals.bitmap
            ) {
                var ballBmp =
                    GM.BallVisuals.bitmap(
                        item.key
                    );

                if (
                    ballBmp &&
                    ballBmp.width > 0
                ) {
                    var bs =
                        Math.min(
                            ballBmp.width,
                            ballBmp.height
                        );

                    this.contents.blt(
                        ballBmp,
                        0,
                        0,
                        bs,
                        bs,
                        iconX,
                        iconY,
                        44,
                        44
                    );
                }
            }

            else if (picName) {
                var bmp =
                    ImageManager.loadPicture(
                        picName
                    );

                if (
                    bmp &&
                    bmp.isReady &&
                    bmp.isReady() &&
                    bmp.width > 0
                ) {
                    var s =
                        Math.min(
                            bmp.width,
                            bmp.height
                        );

                    this.contents.blt(
                        bmp,
                        0,
                        0,
                        s,
                        s,
                        iconX,
                        iconY,
                        44,
                        44
                    );
                }

                else if (
                    bmp &&
                    bmp.addLoadListener
                ) {
                    var self =
                        this;

                    bmp.addLoadListener(
                        function() {
                            if (
                                self &&
                                self.contents
                            ) {
                                self.refresh();
                            }
                        }
                    );
                }
            }

            this.contents.fontSize =
                20;

            this.changeTextColor(
                '#263b35'
            );

            this.drawText(
                item.name ||
                item.key,
                rect.x + 64,
                rect.y + 7,
                rect.width - 155,
                'left'
            );

            this.contents.fontSize =
                18;

            this.changeTextColor(
                selected
                    ? '#197557'
                    : '#52665f'
            );

            this.drawText(
                '× ' +
                GM.getItemQuantity(
                    item.key
                ),
                rect.x +
                rect.width -
                90,
                rect.y + 8,
                72,
                'right'
            );

            this.resetTextColor();
        };

    Window_GMPremiumBagItems.prototype.refresh =
        function() {
            this.makeItemList();
            this.createContents();
            this.drawAllItems();
        };

    function Window_GMPremiumHealTarget() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GMPremiumHealTarget.prototype =
        Object.create(
            Window_Selectable.prototype
        );

    Window_GMPremiumHealTarget.prototype.constructor =
        Window_GMPremiumHealTarget;

    Window_GMPremiumHealTarget.prototype.initialize =
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

            this._item =
                null;

            this.hide();
            this.deactivate();

            this.opacity =
                245;
        };

    Window_GMPremiumHealTarget.prototype.setItem =
        function(item) {
            this._item =
                item ||
                null;

            this.refresh();
        };

    Window_GMPremiumHealTarget.prototype.maxItems =
        function() {
            return BP.party().length;
        };

    Window_GMPremiumHealTarget.prototype.pokemon =
        function() {
            return (
                BP.party()[
                    this.index()
                ] ||
                null
            );
        };

    Window_GMPremiumHealTarget.prototype.itemHeight =
        function() {
            return 70;
        };

    Window_GMPremiumHealTarget.prototype.isCurrentItemEnabled =
        function() {
            return BP.canUseHealingOn(
                this._item,
                this.pokemon()
            );
        };

    Window_GMPremiumHealTarget.prototype.drawItem =
        function(index) {
            var mon =
                BP.party()[index];

            if (!mon) {
                return;
            }

            var rect =
                this.itemRectForText(
                    index
                );

            var enabled =
                BP.canUseHealingOn(
                    this._item,
                    mon
                );

            var active =
                mon ===
                GM.Battle.playerPokemon;

            var hp =
                Math.max(
                    0,
                    Number(
                        mon.hp ||
                        0
                    )
                );

            var maxHp =
                Math.max(
                    1,
                    Number(
                        mon.maxHp ||
                        1
                    )
                );

            var rate =
                BP.clamp(
                    hp /
                    maxHp,
                    0,
                    1
                );

            BP.roundRect(
                this.contents,
                rect.x + 3,
                rect.y + 3,
                rect.width - 6,
                rect.height - 6,
                12,
                active
                    ? '#ecf7f2'
                    : '#ffffff',
                enabled
                    ? 0.95
                    : 0.58,
                active
                    ? '#66b99b'
                    : 'rgba(55,70,65,0.12)',
                active
                    ? 2
                    : 1
            );

            this.changePaintOpacity(
                enabled
            );

            this.contents.fontSize =
                20;

            this.changeTextColor(
                '#273c36'
            );

            this.drawText(
                mon.name ||
                'Pokémon',
                rect.x + 14,
                rect.y + 6,
                190,
                'left'
            );

            this.contents.fontSize =
                16;

            this.changeTextColor(
                '#53665f'
            );

            this.drawText(
                'Nv. ' +
                Number(
                    mon.level ||
                    1
                ),
                rect.x + 205,
                rect.y + 8,
                75,
                'left'
            );

            this.drawText(
                hp +
                '/' +
                maxHp +
                ' PS',
                rect.x +
                rect.width -
                160,
                rect.y + 8,
                140,
                'right'
            );

            var gx =
                rect.x + 14;

            var gy =
                rect.y + 40;

            var gw =
                rect.width - 34;

            this.contents.fillRect(
                gx,
                gy,
                gw,
                9,
                'rgba(30,45,40,0.15)'
            );

            var hpColor =
                rate <= 0.20
                    ? '#e05252'
                    : (
                        rate <= 0.50
                            ? '#e0bd45'
                            : '#59af67'
                    );

            this.contents.fillRect(
                gx,
                gy,
                Math.floor(
                    gw *
                    rate
                ),
                9,
                hpColor
            );

            this.changePaintOpacity(
                true
            );

            this.resetTextColor();
        };

    Window_GMPremiumHealTarget.prototype.refresh =
        function() {
            this.createContents();
            this.drawAllItems();
        };

    BP.createFx = function(scene) {
        var W =
            Graphics.boxWidth;

        var H =
            Graphics.boxHeight;

        var vignette =
            new Bitmap(
                W,
                H
            );

        var ctx =
            vignette._context;

        ctx.save();

        var g =
            ctx.createRadialGradient(
                W / 2,
                H / 2,
                Math.min(
                    W,
                    H
                ) *
                0.22,

                W / 2,
                H / 2,
                Math.max(
                    W,
                    H
                ) *
                0.68
            );

        g.addColorStop(
            0,
            'rgba(0,0,0,0)'
        );

        g.addColorStop(
            1,
            'rgba(5,16,14,0.19)'
        );

        ctx.fillStyle =
            g;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

        ctx.restore();

        vignette._setDirty();

        scene._gmPremiumVignette =
            new Sprite(
                vignette
            );

        scene.addChild(
            scene._gmPremiumVignette
        );

        scene._gmPremiumParticles =
            [];

        scene._gmPremiumParticleLayer =
            new Sprite();

        scene.addChild(
            scene._gmPremiumParticleLayer
        );

        for (
            var i = 0;
            i < 16;
            i++
        ) {
            var pb =
                new Bitmap(
                    12,
                    12
                );

            pb.drawCircle(
                6,
                6,
                2 +
                (
                    i %
                    3
                ),
                i %
                2
                    ? '#ffffff'
                    : '#d8f3c5'
            );

            var ps =
                new Sprite(
                    pb
                );

            ps.anchor.x =
                0.5;

            ps.anchor.y =
                0.5;

            ps.x =
                (
                    i *
                    89 +
                    47
                ) %
                W;

            ps.y =
                80 +
                (
                    (
                        i *
                        61
                    ) %
                    Math.max(
                        120,
                        H -
                        300
                    )
                );

            ps.alpha =
                0.08 +
                (
                    i %
                    4
                ) *
                0.025;

            ps._gmBaseX =
                ps.x;

            ps._gmBaseY =
                ps.y;

            ps._gmSpeed =
                0.15 +
                (
                    i %
                    5
                ) *
                0.035;

            ps._gmPhase =
                i *
                0.73;

            scene
                ._gmPremiumParticleLayer
                .addChild(
                    ps
                );

            scene
                ._gmPremiumParticles
                .push(
                    ps
                );
        }

        scene._gmPremiumIntro =
            new Sprite(
                new Bitmap(
                    Math.min(
                        610,
                        W -
                        40
                    ),
                    88
                )
            );

        scene._gmPremiumIntro.anchor.x =
            0.5;

        scene._gmPremiumIntro.anchor.y =
            0.5;

        scene._gmPremiumIntro.x =
            W /
            2;

        scene._gmPremiumIntro.y =
            110;

        scene._gmPremiumIntro.alpha =
            0;

        scene._gmPremiumIntro.scale.x =
            0.84;

        scene._gmPremiumIntro.scale.y =
            0.84;

        scene.addChild(
            scene._gmPremiumIntro
        );

        scene._gmPremiumCallout =
            new Sprite(
                new Bitmap(
                    500,
                    78
                )
            );

        scene._gmPremiumCallout.anchor.x =
            0.5;

        scene._gmPremiumCallout.anchor.y =
            0.5;

        scene._gmPremiumCallout.x =
            W /
            2;

        scene._gmPremiumCallout.y =
            Math.floor(
                H *
                0.22
            );

        scene._gmPremiumCallout.visible =
            false;

        scene.addChild(
            scene._gmPremiumCallout
        );

        var fb =
            new Bitmap(
                W,
                H
            );

        fb.fillAll(
            '#ffffff'
        );

        scene._gmPremiumFlash =
            new Sprite(
                fb
            );

        scene._gmPremiumFlash.alpha =
            0;

        scene._gmPremiumFlash.visible =
            false;

        scene.addChild(
            scene._gmPremiumFlash
        );

        scene._gmPremiumIntroFrames =
            78;

        scene._gmPremiumCalloutFrames =
            0;

        scene._gmPremiumFlashFrames =
            0;

        BP.drawIntro(
            scene
        );
    };

    BP.drawIntro = function(scene) {
        if (
            !scene ||
            !scene._gmPremiumIntro
        ) {
            return;
        }

        var b =
            scene._gmPremiumIntro.bitmap;

        b.clear();

        BP.roundRect(
            b,
            0,
            0,
            b.width,
            84,
            22,
            '#153b35',
            0.94,
            '#8bdabf',
            2
        );

        b.fontSize =
            16;

        b.textColor =
            '#bfeede';

        b.outlineWidth =
            0;

        var top =
            BP.trainer
                ? 'COMBATE DE ENTRENADOR'
                : 'ENCUENTRO SALVAJE';

        b.drawText(
            top,
            18,
            8,
            b.width -
            36,
            24,
            'center'
        );

        b.fontSize =
            28;

        b.textColor =
            '#ffffff';

        b.outlineColor =
            'rgba(0,0,0,0.42)';

        b.outlineWidth =
            4;

        var text =
            BP.trainer
                ? (
                    BP.trainer.name +
                    ' te desafía'
                )
                : (
                    '¡Ha aparecido ' +
                    (
                        GM.Battle.enemy
                            ? GM.Battle.enemy.name
                            : 'un Pokémon'
                    ) +
                    '!'
                );

        b.drawText(
            text,
            18,
            34,
            b.width -
            36,
            40,
            'center'
        );
    };

    BP.showCallout = function(
        scene,
        text,
        color
    ) {
        if (
            !scene ||
            !scene._gmPremiumCallout ||
            !text
        ) {
            return;
        }

        var b =
            scene._gmPremiumCallout.bitmap;

        b.clear();

        b.fontSize =
            31;

        b.textColor =
            '#ffffff';

        b.outlineColor =
            color ||
            '#315f54';

        b.outlineWidth =
            8;

        b.drawText(
            text,
            0,
            4,
            b.width,
            64,
            'center'
        );

        scene._gmPremiumCallout.visible =
            true;

        scene._gmPremiumCallout.alpha =
            1;

        scene._gmPremiumCallout.scale.x =
            0.62;

        scene._gmPremiumCallout.scale.y =
            0.62;

        scene._gmPremiumCalloutFrames =
            58;
    };

    BP.flash = function(
        scene,
        alpha
    ) {
        if (
            !scene ||
            !scene._gmPremiumFlash
        ) {
            return;
        }

        scene._gmPremiumFlash.visible =
            true;

        scene._gmPremiumFlash.alpha =
            alpha == null
                ? 0.24
                : alpha;

        scene._gmPremiumFlashFrames =
            10;
    };

    BP.updateFx = function(scene) {
        if (!scene) {
            return;
        }

        var frame =
            Graphics.frameCount ||
            0;

        if (
            scene._gmPremiumParticles
        ) {
            for (
                var i = 0;
                i <
                scene._gmPremiumParticles.length;
                i++
            ) {
                var p =
                    scene._gmPremiumParticles[i];

                p.y =
                    p._gmBaseY -
                    (
                        (
                            frame *
                            p._gmSpeed
                        ) %
                        34
                    );

                p.x =
                    p._gmBaseX +
                    Math.sin(
                        frame *
                        0.018 +
                        p._gmPhase
                    ) *
                    10;

                p.alpha =
                    0.07 +
                    (
                        Math.sin(
                            frame *
                            0.025 +
                            p._gmPhase
                        ) +
                        1
                    ) *
                    0.025;
            }
        }

        if (
            scene._gmPremiumIntroFrames >
                0 &&
            scene._gmPremiumIntro
        ) {
            scene._gmPremiumIntroFrames--;

            var intro =
                scene._gmPremiumIntro;

            intro.alpha +=
                (
                    1 -
                    intro.alpha
                ) *
                0.16;

            intro.scale.x +=
                (
                    1 -
                    intro.scale.x
                ) *
                0.16;

            intro.scale.y +=
                (
                    1 -
                    intro.scale.y
                ) *
                0.16;

            if (
                scene._gmPremiumIntroFrames <
                18
            ) {
                intro.alpha =
                    Math.max(
                        0,
                        intro.alpha -
                        0.07
                    );

                intro.y -=
                    0.6;
            }

            if (
                scene._gmPremiumIntroFrames ===
                0
            ) {
                intro.visible =
                    false;

                if (
                    !scene._gmPremiumTurn &&
                    !scene._gmPremiumTrainerTransition
                ) {
                    BP.activateMainCommand(
                        scene
                    );
                }
            }
        }

        if (
            scene._gmPremiumCalloutFrames >
                0 &&
            scene._gmPremiumCallout
        ) {
            scene._gmPremiumCalloutFrames--;

            var c =
                scene._gmPremiumCallout;

            c.scale.x +=
                (
                    1 -
                    c.scale.x
                ) *
                0.20;

            c.scale.y +=
                (
                    1 -
                    c.scale.y
                ) *
                0.20;

            if (
                scene._gmPremiumCalloutFrames <
                16
            ) {
                c.alpha =
                    Math.max(
                        0,
                        c.alpha -
                        0.07
                    );
            }

            if (
                scene._gmPremiumCalloutFrames ===
                0
            ) {
                c.visible =
                    false;
            }
        }

        if (
            scene._gmPremiumFlashFrames >
                0 &&
            scene._gmPremiumFlash
        ) {
            scene._gmPremiumFlashFrames--;

            scene._gmPremiumFlash.alpha *=
                0.70;

            if (
                scene._gmPremiumFlashFrames ===
                0
            ) {
                scene._gmPremiumFlash.alpha =
                    0;

                scene._gmPremiumFlash.visible =
                    false;
            }
        }
    };

    BP.inspectMessages = function(
        scene,
        messages,
        startIndex
    ) {
        startIndex =
            Math.max(
                0,
                Number(
                    startIndex ||
                    0
                )
            );

        for (
            var i = startIndex;
            i < messages.length;
            i++
        ) {
            var text =
                String(
                    messages[i] ||
                    ''
                );

            var lower =
                text.toLowerCase();

            if (
                lower.indexOf(
                    'supereficaz'
                ) >=
                    0 ||
                lower.indexOf(
                    'súper eficaz'
                ) >=
                    0
            ) {
                BP.showCallout(
                    scene,
                    '¡SUPEREFICAZ!',
                    '#d66045'
                );

                BP.flash(
                    scene,
                    0.18
                );

                return;
            }

            if (
                lower.indexOf(
                    'golpe crítico'
                ) >=
                    0 ||
                lower.indexOf(
                    'critico'
                ) >=
                    0 ||
                lower.indexOf(
                    'crítico'
                ) >=
                    0
            ) {
                BP.showCallout(
                    scene,
                    '¡GOLPE CRÍTICO!',
                    '#d9a638'
                );

                BP.flash(
                    scene,
                    0.22
                );

                return;
            }

            if (
                lower.indexOf(
                    'no es muy eficaz'
                ) >=
                0
            ) {
                BP.showCallout(
                    scene,
                    'NO ES MUY EFICAZ',
                    '#687d8a'
                );

                return;
            }

            if (
                lower.indexOf(
                    'no afecta'
                ) >=
                0
            ) {
                BP.showCallout(
                    scene,
                    'NO AFECTA',
                    '#69737d'
                );

                return;
            }
        }
    };

    BP.moveScore = function(
        attacker,
        defender,
        instance
    ) {
        if (
            !instance ||
            Number(
                instance.currentPP ||
                0
            ) <=
                0
        ) {
            return -9999;
        }

        var move =
            GM.getMove
                ? GM.getMove(
                    instance.id
                  )
                : null;

        if (!move) {
            return -9999;
        }

        var power =
            Math.max(
                0,
                Number(
                    move.power ||
                    0
                )
            );

        var accuracy =
            BP.clamp(
                Number(
                    move.accuracy == null
                        ? 100
                        : move.accuracy
                ),
                1,
                100
            ) /
            100;

        var effectiveness =
            GM.typeEffectiveness
                ? GM.typeEffectiveness(
                    move.type,
                    defender
                  )
                : 1;

        var score;

        if (
            power <=
            0
        ) {
            score =
                24 +
                Math.random() *
                24;
        }

        else {
            score =
                Math.max(
                    1,
                    power
                ) *
                accuracy *
                Math.max(
                    0.05,
                    effectiveness
                );

            if (
                effectiveness >=
                2
            ) {
                score *=
                    1.35;
            }

            if (
                effectiveness ===
                0
            ) {
                score *=
                    0.02;
            }

            score *=
                0.86 +
                Math.random() *
                0.30;
        }

        return score;
    };

    Scene_GranadaMonBattle.prototype.enemyMove =
        function() {
            var enemy =
                GM.Battle.enemy;

            var player =
                GM.Battle.playerPokemon;

            if (
                !enemy ||
                !enemy.moves
            ) {
                return null;
            }

            var best =
                null;

            var bestScore =
                -99999;

            for (
                var i = 0;
                i < enemy.moves.length;
                i++
            ) {
                var inst =
                    enemy.moves[i];

                var score =
                    BP.moveScore(
                        enemy,
                        player,
                        inst
                    );

                if (
                    score >
                    bestScore
                ) {
                    bestScore =
                        score;

                    best =
                        inst;
                }
            }

            return best;
        };

    Scene_GranadaMonBattle.prototype.executeTurn =
        function(
            playerInstance,
            playerMove
        ) {
            if (
                this._gmPremiumTurn ||
                this._battleEnded ||
                this._gmOutcomeState
            ) {
                return;
            }

            var player =
                GM.Battle.playerPokemon;

            var enemy =
                GM.Battle.enemy;

            if (
                !BP.isAlive(
                    player
                ) ||
                !BP.isAlive(
                    enemy
                )
            ) {
                return;
            }

            var enemyInstance =
                this.enemyMove();

            var enemyMove =
                enemyInstance &&
                GM.getMove
                    ? GM.getMove(
                        enemyInstance.id
                      )
                    : null;

            var order =
                enemyMove
                    ? GM.compareTurnOrder(
                        player,
                        playerMove,
                        enemy,
                        enemyMove
                      )
                    : -1;

            var playerAction = {
                actor:
                    player,

                target:
                    enemy,

                instance:
                    playerInstance,

                move:
                    playerMove,

                side:
                    'PLAYER'
            };

            var enemyAction =
                enemyMove
                    ? {
                        actor:
                            enemy,

                        target:
                            player,

                        instance:
                            enemyInstance,

                        move:
                            enemyMove,

                        side:
                            'ENEMY'
                    }
                    : null;

            var actions =
                order <=
                    0
                    ? [
                        playerAction,
                        enemyAction
                      ]
                    : [
                        enemyAction,
                        playerAction
                      ];

            if (!enemyAction) {
                actions =
                    [
                        playerAction
                    ];
            }

            this._gmPremiumTurn = {
                actions:
                    actions,

                index:
                    0,

                phase:
                    'START',

                frame:
                    0,

                messages:
                    []
            };

            if (
                this._commandWindow
            ) {
                this._commandWindow.deactivate();
            }

            if (
                this._moveWindow
            ) {
                this._moveWindow.hide();
                this._moveWindow.deactivate();
            }
        };

    BP.startTurnAction = function(
        scene,
        state
    ) {
        var action =
            state.actions[
                state.index
            ];

        if (
            !action ||
            !BP.isAlive(
                action.actor
            ) ||
            !BP.isAlive(
                action.target
            )
        ) {
            state.phase =
                'AFTER';

            state.frame =
                0;

            return;
        }

        var before =
            state.messages.length;

        scene.performMove(
            action.actor,
            action.target,
            action.instance,
            action.move,
            state.messages
        );

        if (
            scene._logWindow
        ) {
            scene._logWindow.setText(
                state.messages.join(
                    '\n'
                )
            );
        }

        BP.inspectMessages(
            scene,
            state.messages,
            before
        );

        BP.refreshScene(
            scene
        );

        state.phase =
            'WAIT';

        state.frame =
            0;
    };

    BP.updateTurn = function(scene) {
        var state =
            scene._gmPremiumTurn;

        if (!state) {
            return;
        }

        state.frame++;

        if (
            state.phase ===
            'START'
        ) {
            BP.startTurnAction(
                scene,
                state
            );

            return;
        }

        if (
            state.phase ===
            'WAIT'
        ) {
            if (
                BP.animationBusy(
                    scene
                )
            ) {
                return;
            }

            if (
                state.frame <
                10
            ) {
                return;
            }

            state.phase =
                'AFTER';

            state.frame =
                0;

            return;
        }

        if (
            state.phase ===
            'AFTER'
        ) {
            var action =
                state.actions[
                    state.index
                ];

            BP.refreshScene(
                scene
            );

            if (
                action &&
                action.target ===
                    GM.Battle.enemy &&
                !BP.isAlive(
                    GM.Battle.enemy
                )
            ) {
                scene._gmPremiumTurn =
                    null;

                BP.handleEnemyKO(
                    scene
                );

                return;
            }

            if (
                action &&
                action.target ===
                    GM.Battle.playerPokemon &&
                !BP.isAlive(
                    GM.Battle.playerPokemon
                )
            ) {
                scene._gmPremiumTurn =
                    null;

                scene.loseCurrentPokemon();

                return;
            }

            state.index++;

            while (
                state.index <
                    state.actions.length &&
                !state.actions[
                    state.index
                ]
            ) {
                state.index++;
            }

            if (
                state.index >=
                state.actions.length
            ) {
                scene._gmPremiumTurn =
                    null;

                BP.activateMainCommand(
                    scene
                );

                return;
            }

            var next =
                state.actions[
                    state.index
                ];

            if (
                !next ||
                !BP.isAlive(
                    next.actor
                ) ||
                !BP.isAlive(
                    next.target
                )
            ) {
                scene._gmPremiumTurn =
                    null;

                if (
                    !BP.isAlive(
                        GM.Battle.enemy
                    )
                ) {
                    BP.handleEnemyKO(
                        scene
                    );
                }

                else if (
                    !BP.isAlive(
                        GM.Battle.playerPokemon
                    )
                ) {
                    scene.loseCurrentPokemon();
                }

                else {
                    BP.activateMainCommand(
                        scene
                    );
                }

                return;
            }

            state.phase =
                'START';

            state.frame =
                0;
        }
    };

    Scene_GranadaMonBattle.prototype.enemyFreeTurn =
        function() {
            if (
                this._gmPremiumSkipEnemyFreeTurn
            ) {
                this._gmPremiumSkipEnemyFreeTurn =
                    false;

                BP.refreshScene(
                    this
                );

                BP.activateMainCommand(
                    this
                );

                return;
            }

            if (
                this._battleEnded ||
                this._gmOutcomeState ||
                !BP.isAlive(
                    GM.Battle.enemy
                )
            ) {
                return;
            }

            var inst =
                this.enemyMove();

            var move =
                inst &&
                GM.getMove
                    ? GM.getMove(
                        inst.id
                      )
                    : null;

            if (
                !inst ||
                !move
            ) {
                BP.activateMainCommand(
                    this
                );

                return;
            }

            this._gmPremiumFreeTurn = {
                phase:
                    'START',

                frame:
                    0,

                instance:
                    inst,

                move:
                    move,

                messages:
                    []
            };

            if (
                this._commandWindow
            ) {
                this._commandWindow.deactivate();
            }
        };

    BP.updateFreeTurn = function(scene) {
        var s =
            scene._gmPremiumFreeTurn;

        if (!s) {
            return;
        }

        s.frame++;

        if (
            s.phase ===
            'START'
        ) {
            var enemy =
                GM.Battle.enemy;

            var player =
                GM.Battle.playerPokemon;

            if (
                !BP.isAlive(
                    enemy
                ) ||
                !BP.isAlive(
                    player
                )
            ) {
                scene._gmPremiumFreeTurn =
                    null;

                if (
                    !BP.isAlive(
                        player
                    )
                ) {
                    scene.loseCurrentPokemon();
                }

                else {
                    BP.activateMainCommand(
                        scene
                    );
                }

                return;
            }

            var before =
                s.messages.length;

            scene.performMove(
                enemy,
                player,
                s.instance,
                s.move,
                s.messages
            );

            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    s.messages.join(
                        '\n'
                    )
                );
            }

            BP.inspectMessages(
                scene,
                s.messages,
                before
            );

            BP.refreshScene(
                scene
            );

            s.phase =
                'WAIT';

            s.frame =
                0;

            return;
        }

        if (
            s.phase ===
            'WAIT'
        ) {
            if (
                BP.animationBusy(
                    scene
                )
            ) {
                return;
            }

            if (
                s.frame <
                10
            ) {
                return;
            }

            scene._gmPremiumFreeTurn =
                null;

            BP.refreshScene(
                scene
            );

            if (
                !BP.isAlive(
                    GM.Battle.playerPokemon
                )
            ) {
                scene.loseCurrentPokemon();
            }

            else {
                BP.activateMainCommand(
                    scene
                );
            }
        }
    };

    var _BP_basePartyCancel =
        Scene_GranadaMonBattle
            .prototype
            .onGMBattlePartyCancel;

    Scene_GranadaMonBattle.prototype.onGMBattlePartyCancel =
        function() {
            if (
                this._gmPremiumForcedSwitch
            ) {
                SoundManager.playBuzzer();

                if (
                    this._logWindow
                ) {
                    this._logWindow.setText(
                        'Debes elegir un Pokémon que pueda continuar.'
                    );
                }

                if (
                    this._gmBattlePartyWindow
                ) {
                    this._gmBattlePartyWindow.activate();
                }

                return;
            }

            if (
                _BP_basePartyCancel
            ) {
                return _BP_basePartyCancel.call(
                    this
                );
            }
        };

    var _BP_baseSwitch =
        Scene_GranadaMonBattle
            .prototype
            .executeGMPokemonSwitch;

    Scene_GranadaMonBattle.prototype.executeGMPokemonSwitch =
        function(nextPokemon) {
            var forced =
                !!this._gmPremiumForcedSwitch;

            if (forced) {
                this._gmPremiumSkipEnemyFreeTurn =
                    true;
            }

            if (BP.trainer) {
                BP.noteTrainerParticipant(
                    nextPokemon
                );
            }

            BP.showCallout(
                this,
                '¡ADELANTE, ' +
                String(
                    nextPokemon &&
                    nextPokemon.name ||
                    'POKÉMON'
                ).toUpperCase() +
                '!',
                '#3c8c70'
            );

            var result =
                _BP_baseSwitch
                    ? _BP_baseSwitch.call(
                        this,
                        nextPokemon
                      )
                    : undefined;

            this._gmPremiumForcedSwitch =
                false;

            return result;
        };

    var _BP_baseLoseCurrent =
        Scene_GranadaMonBattle
            .prototype
            .loseCurrentPokemon;

    Scene_GranadaMonBattle.prototype.loseCurrentPokemon =
        function() {
            if (
                this._battleEnded ||
                this._gmOutcomeState
            ) {
                return;
            }

            var party =
                BP.party();

            var hasAlternative =
                false;

            for (
                var i = 0;
                i < party.length;
                i++
            ) {
                if (
                    party[i] &&
                    party[i] !==
                        GM.Battle.playerPokemon &&
                    BP.isAlive(
                        party[i]
                    )
                ) {
                    hasAlternative =
                        true;

                    break;
                }
            }

            if (
                !hasAlternative ||
                !this._gmBattlePartyWindow
            ) {
                return _BP_baseLoseCurrent
                    ? _BP_baseLoseCurrent.call(
                        this
                      )
                    : this.loseBattle();
            }

            this._gmPremiumForcedSwitch =
                true;

            if (
                this._commandWindow
            ) {
                this._commandWindow.deactivate();
            }

            if (
                this._moveWindow
            ) {
                this._moveWindow.hide();
                this._moveWindow.deactivate();
            }

            if (
                this._gmPremiumBagCategory
            ) {
                this._gmPremiumBagCategory.hide();
                this._gmPremiumBagCategory.deactivate();
            }

            if (
                this._gmPremiumBagItems
            ) {
                this._gmPremiumBagItems.hide();
                this._gmPremiumBagItems.deactivate();
            }

            if (
                this._gmPremiumHealTarget
            ) {
                this._gmPremiumHealTarget.hide();
                this._gmPremiumHealTarget.deactivate();
            }

            if (
                this._logWindow
            ) {
                this._logWindow.setText(
                    GM.Battle
                        .playerPokemon
                        .name +
                    ' se ha debilitado. ¡Elige otro Pokémon!'
                );
            }

            BP.showCallout(
                this,
                '¡' +
                String(
                    GM.Battle.playerPokemon.name ||
                    'POKÉMON'
                ).toUpperCase() +
                ' SE HA DEBILITADO!',
                '#b94f4f'
            );

            if (
                SoundManager.playActorCollapse
            ) {
                SoundManager.playActorCollapse();
            }

            this._gmBattlePartyWindow.refresh();

            this._gmBattlePartyWindow.show();

            this._gmBattlePartyWindow.activate();

            var first =
                0;

            for (
                var j = 0;
                j < party.length;
                j++
            ) {
                if (
                    party[j] !==
                        GM.Battle.playerPokemon &&
                    BP.isAlive(
                        party[j]
                    )
                ) {
                    first =
                        j;

                    break;
                }
            }

            this._gmBattlePartyWindow.select(
                first
            );
        };

    BP.createBagWindows = function(scene) {
        var W =
            Graphics.boxWidth;

        var H =
            Graphics.boxHeight;

        var width =
            Math.min(
                640,
                W -
                50
            );

        var x =
            Math.floor(
                (
                    W -
                    width
                ) /
                2
            );

        var categoryY =
            Math.max(
                40,
                Math.floor(
                    H *
                    0.18
                )
            );

        scene._gmPremiumBagCategory =
            new Window_GMPremiumBagCategory(
                x,
                categoryY,
                width
            );

        scene._gmPremiumBagCategory.setHandler(
            'balls',
            function() {
                BP.openBagItems(
                    scene,
                    'balls'
                );
            }
        );

        scene._gmPremiumBagCategory.setHandler(
            'heal',
            function() {
                BP.openBagItems(
                    scene,
                    'heal'
                );
            }
        );

        scene._gmPremiumBagCategory.setHandler(
            'cancel',
            function() {
                BP.closeBag(
                    scene
                );
            }
        );

        scene.addWindow(
            scene._gmPremiumBagCategory
        );

        var itemsY =
            categoryY +
            scene._gmPremiumBagCategory.height +
            8;

        var itemsH =
            Math.min(
                270,
                H -
                itemsY -
                38
            );

        scene._gmPremiumBagItems =
            new Window_GMPremiumBagItems(
                x,
                itemsY,
                width,
                itemsH
            );

        scene._gmPremiumBagItems.setHandler(
            'ok',
            function() {
                BP.onBagItemOk(
                    scene
                );
            }
        );

        scene._gmPremiumBagItems.setHandler(
            'cancel',
            function() {
                BP.backToBagCategory(
                    scene
                );
            }
        );

        scene.addWindow(
            scene._gmPremiumBagItems
        );

        var targetW =
            Math.min(
                690,
                W -
                44
            );

        var targetH =
            Math.min(
                6 *
                70 +
                54,
                H -
                70
            );

        var targetX =
            Math.floor(
                (
                    W -
                    targetW
                ) /
                2
            );

        var targetY =
            Math.floor(
                (
                    H -
                    targetH
                ) /
                2
            );

        scene._gmPremiumHealTarget =
            new Window_GMPremiumHealTarget(
                targetX,
                targetY,
                targetW,
                targetH
            );

        scene._gmPremiumHealTarget.setHandler(
            'ok',
            function() {
                BP.onHealTargetOk(
                    scene
                );
            }
        );

        scene._gmPremiumHealTarget.setHandler(
            'cancel',
            function() {
                BP.cancelHealTarget(
                    scene
                );
            }
        );

        scene.addWindow(
            scene._gmPremiumHealTarget
        );
    };

    Scene_GranadaMonBattle.prototype.commandBag =
        function() {
            if (
                this._battleEnded ||
                this._gmOutcomeState ||
                this._gmPremiumTurn ||
                this._gmPremiumFreeTurn
            ) {
                return;
            }

            if (
                !this._gmPremiumBagCategory
            ) {
                SoundManager.playBuzzer();

                BP.activateMainCommand(
                    this
                );

                return;
            }

            if (
                this._commandWindow
            ) {
                this._commandWindow.deactivate();
            }

            if (
                this._moveWindow
            ) {
                this._moveWindow.hide();
                this._moveWindow.deactivate();
            }

            if (
                this._gmBallWindow
            ) {
                this._gmBallWindow.hide();
                this._gmBallWindow.deactivate();
            }

            if (
                this._gmBattlePartyWindow
            ) {
                this._gmBattlePartyWindow.hide();
                this._gmBattlePartyWindow.deactivate();
            }

            this._gmPremiumBagCategory.refresh();

            this._gmPremiumBagCategory.show();

            this._gmPremiumBagCategory.activate();

            this._gmPremiumBagCategory.select(
                0
            );

            if (
                this._logWindow
            ) {
                this._logWindow.setText(
                    BP.trainer
                        ? 'Elige un objeto de curación.'
                        : '¿Qué quieres usar?'
                );
            }
        };

    BP.openBagItems = function(
        scene,
        mode
    ) {
        scene._gmPremiumBagCategory.deactivate();

        scene._gmPremiumBagItems.setMode(
            mode
        );

        scene._gmPremiumBagItems.show();

        scene._gmPremiumBagItems.activate();

        if (
            scene._gmPremiumBagItems.maxItems() >
            0
        ) {
            scene._gmPremiumBagItems.select(
                0
            );

            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    mode === 'balls'
                        ? 'Elige una Poké Ball.'
                        : 'Elige un objeto de curación.'
                );
            }
        }

        else {
            scene._gmPremiumBagItems.select(
                -1
            );

            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    mode === 'balls'
                        ? 'No tienes Poké Balls.'
                        : 'No tienes objetos de curación.'
                );
            }
        }
    };

    BP.backToBagCategory = function(scene) {
        scene._gmPremiumBagItems.hide();

        scene._gmPremiumBagItems.deactivate();

        scene._gmPremiumBagItems.deselect();

        scene._gmPremiumBagCategory.show();

        scene._gmPremiumBagCategory.activate();
    };

    BP.closeBag = function(scene) {
        if (
            scene._gmPremiumBagCategory
        ) {
            scene._gmPremiumBagCategory.hide();
            scene._gmPremiumBagCategory.deactivate();
            scene._gmPremiumBagCategory.deselect();
        }

        if (
            scene._gmPremiumBagItems
        ) {
            scene._gmPremiumBagItems.hide();
            scene._gmPremiumBagItems.deactivate();
            scene._gmPremiumBagItems.deselect();
        }

        if (
            scene._gmPremiumHealTarget
        ) {
            scene._gmPremiumHealTarget.hide();
            scene._gmPremiumHealTarget.deactivate();
            scene._gmPremiumHealTarget.deselect();
        }

        BP.activateMainCommand(
            scene
        );
    };

    BP.onBagItemOk = function(scene) {
        var item =
            scene._gmPremiumBagItems.item();

        if (!item) {
            SoundManager.playBuzzer();

            scene._gmPremiumBagItems.activate();

            return;
        }

        if (
            scene._gmPremiumBagItems._mode ===
            'balls'
        ) {
            if (
                BP.trainer
            ) {
                SoundManager.playBuzzer();

                if (
                    scene._logWindow
                ) {
                    scene._logWindow.setText(
                        'No puedes capturar el Pokémon de otro entrenador.'
                    );
                }

                scene._gmPremiumBagItems.activate();

                return;
            }

            if (
                GM.getItemQuantity(
                    item.key
                ) <=
                0
            ) {
                SoundManager.playBuzzer();

                scene._gmPremiumBagItems.refresh();

                scene._gmPremiumBagItems.activate();

                return;
            }

            GM.loseItem(
                item.key,
                1
            );

            scene._gmPremiumBagCategory.hide();

            scene._gmPremiumBagCategory.deactivate();

            scene._gmPremiumBagItems.hide();

            scene._gmPremiumBagItems.deactivate();

            var result =
                GM.Capture.calculate(
                    GM.Battle.enemy,
                    item.key
                );

            if (
                scene.startGMCaptureAnimation
            ) {
                scene.startGMCaptureAnimation(
                    item,
                    result
                );
            }

            else {
                SoundManager.playBuzzer();

                BP.activateMainCommand(
                    scene
                );
            }

            return;
        }

        scene._gmPremiumBagItems.deactivate();

        scene._gmPremiumBagItems.hide();

        scene._gmPremiumBagCategory.hide();

        scene._gmPremiumBagCategory.deactivate();

        scene._gmPremiumHealTarget.setItem(
            item
        );

        scene._gmPremiumHealTarget.show();

        scene._gmPremiumHealTarget.activate();

        var party =
            BP.party();

        var first =
            0;

        for (
            var i = 0;
            i < party.length;
            i++
        ) {
            if (
                BP.canUseHealingOn(
                    item,
                    party[i]
                )
            ) {
                first =
                    i;

                break;
            }
        }

        scene._gmPremiumHealTarget.select(
            first
        );

        if (
            scene._logWindow
        ) {
            scene._logWindow.setText(
                '¿Sobre qué Pokémon quieres usar ' +
                item.name +
                '?'
            );
        }
    };

    BP.cancelHealTarget = function(scene) {
        scene._gmPremiumHealTarget.hide();

        scene._gmPremiumHealTarget.deactivate();

        scene._gmPremiumHealTarget.deselect();

        scene._gmPremiumBagItems.show();

        scene._gmPremiumBagItems.activate();

        if (
            scene._gmPremiumBagItems.index() <
                0 &&
            scene._gmPremiumBagItems.maxItems() >
                0
        ) {
            scene._gmPremiumBagItems.select(
                0
            );
        }
    };

    BP.onHealTargetOk = function(scene) {
        var item =
            scene._gmPremiumHealTarget._item;

        var pokemon =
            scene._gmPremiumHealTarget.pokemon();

        if (
            !item ||
            !pokemon
        ) {
            SoundManager.playBuzzer();

            scene._gmPremiumHealTarget.activate();

            return;
        }

        if (
            !BP.canUseHealingOn(
                item,
                pokemon
            )
        ) {
            SoundManager.playBuzzer();

            if (
                scene._logWindow
            ) {
                if (
                    item.effect &&
                    item.effect.type ===
                        'REVIVE'
                ) {
                    scene._logWindow.setText(
                        pokemon.name +
                        ' no está debilitado.'
                    );
                }

                else if (
                    Number(
                        pokemon.hp ||
                        0
                    ) <=
                    0
                ) {
                    scene._logWindow.setText(
                        'No puedes usar esa cura sobre un Pokémon debilitado.'
                    );
                }

                else {
                    scene._logWindow.setText(
                        pokemon.name +
                        ' ya tiene los PS al máximo.'
                    );
                }
            }

            scene._gmPremiumHealTarget.activate();

            return;
        }

        var oldHp =
            Number(
                pokemon.hp ||
                0
            );

        var result =
            GM.useBagItemOnPokemon
                ? GM.useBagItemOnPokemon(
                    item.key,
                    pokemon
                  )
                : {
                    success:
                        false,

                    message:
                        'No tiene efecto.'
                };

        if (
            !result ||
            !result.success
        ) {
            SoundManager.playBuzzer();

            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    result &&
                    result.message
                        ? result.message
                        : 'No tiene efecto.'
                );
            }

            scene._gmPremiumHealTarget.activate();

            return;
        }

        scene._gmPremiumHealTarget.hide();

        scene._gmPremiumHealTarget.deactivate();

        scene._gmPremiumHealTarget.deselect();

        scene._gmPremiumBagItems.hide();

        scene._gmPremiumBagCategory.hide();

        BP.refreshScene(
            scene
        );

        if (
            scene._logWindow
        ) {
            scene._logWindow.setText(
                result.message ||
                (
                    pokemon.name +
                    ' se ha recuperado.'
                )
            );
        }

        BP.showCallout(
            scene,
            Number(
                oldHp
            ) <=
                0
                ? '¡REVIVIDO!'
                : '¡RECUPERADO!',
            '#4ca86a'
        );

        BP.flash(
            scene,
            0.15
        );

        if (
            SoundManager.playRecovery
        ) {
            SoundManager.playRecovery();
        }

        setTimeout(
            function() {
                if (
                    SceneManager._scene ===
                        scene &&
                    !scene._battleEnded
                ) {
                    scene.enemyFreeTurn();
                }
            },
            560
        );
    };

    BP.makeTrainerEnemy = function(entry) {
        if (!entry) {
            return null;
        }

        var mon =
            GM.createPokemon(
                Number(
                    entry.nationalDex ||
                    0
                ),
                BP.clamp(
                    Number(
                        entry.level ||
                        1
                    ),
                    1,
                    100
                )
            );

        if (!mon) {
            return null;
        }

        if (
            GM.Battle.ensureUsableMove
        ) {
            GM.Battle.ensureUsableMove(
                mon
            );
        }

        if (
            GM.resetBattleStages
        ) {
            GM.resetBattleStages(
                mon
            );
        }

        return mon;
    };

    BP.noteTrainerParticipant = function(pokemon) {
        if (
            !BP.trainer ||
            !pokemon
        ) {
            return;
        }

        BP.trainer.participants =
            BP.trainer.participants ||
            {};

        BP.trainer.allParticipants =
            BP.trainer.allParticipants ||
            {};

        var key =
            pokemon.uid != null
                ? String(
                    pokemon.uid
                  )
                : String(
                    BP.party().indexOf(
                        pokemon
                    )
                  );

        BP.trainer.participants[
            key
        ] =
            pokemon;

        BP.trainer.allParticipants[
            key
        ] =
            pokemon;
    };

    BP.baseExpYield = function(enemy) {
        if (
            GM.BattleClassic &&
            GM.BattleClassic.baseExpYield
        ) {
            return GM.BattleClassic.baseExpYield(
                enemy
            );
        }

        var species =
            GM.getSpecies
                ? GM.getSpecies(
                    enemy.speciesId
                  )
                : null;

        if (
            !species ||
            !species.baseStats
        ) {
            return 50;
        }

        var s =
            species.baseStats;

        var total =
            Number(
                s.hp ||
                0
            ) +
            Number(
                s.attack ||
                0
            ) +
            Number(
                s.defense ||
                0
            ) +
            Number(
                s.spAttack ||
                0
            ) +
            Number(
                s.spDefense ||
                0
            ) +
            Number(
                s.speed ||
                0
            );

        return Math.max(
            20,
            Math.floor(
                total /
                3
            )
        );
    };

    BP.awardTrainerExp = function(enemy) {
        var messages =
            [];

        if (
            !BP.trainer ||
            !enemy ||
            !GM.gainExp
        ) {
            return messages;
        }

        var participants =
            [];

        var map =
            BP.trainer.participants ||
            {};

        for (
            var key in map
        ) {
            if (
                map.hasOwnProperty(
                    key
                ) &&
                map[key]
            ) {
                participants.push(
                    map[key]
                );
            }
        }

        if (
            !participants.length &&
            GM.Battle.playerPokemon
        ) {
            participants.push(
                GM.Battle.playerPokemon
            );
        }

        var total =
            Math.max(
                1,
                Math.floor(
                    (
                        BP.baseExpYield(
                            enemy
                        ) *
                        Math.max(
                            1,
                            Number(
                                enemy.level ||
                                1
                            )
                        )
                    ) /
                    7
                )
            );

        var each =
            Math.max(
                1,
                Math.floor(
                    total /
                    participants.length
                )
            );

        for (
            var i = 0;
            i < participants.length;
            i++
        ) {
            var p =
                participants[i];

            var oldLevel =
                Number(
                    p.level ||
                    1
                );

            var r =
                GM.gainExp(
                    p,
                    each
                );

            if (
                !r ||
                !r.success
            ) {
                continue;
            }

            messages.push(
                p.name +
                ' gana ' +
                Number(
                    r.amount ||
                    each
                ) +
                ' EXP.'
            );

            if (
                Number(
                    p.level ||
                    1
                ) >
                oldLevel
            ) {
                messages.push(
                    '¡' +
                    p.name +
                    ' sube al nivel ' +
                    p.level +
                    '!'
                );
            }
        }

        return messages;
    };

    BP.startTrainerBattle = function(
        name,
        team,
        eventContext
    ) {
        name =
            String(
                name ||
                'Entrenador'
            );

        team =
            team ||
            [];

        if (
            !team.length
        ) {
            if (
                $gameMessage
            ) {
                $gameMessage.add(
                    'El entrenador no tiene ningún Pokémon válido.'
                );
            }

            return false;
        }

        var player =
            GM.Battle.firstUsablePokemon
                ? GM.Battle.firstUsablePokemon()
                : null;

        if (!player) {
            if (
                $gameMessage
            ) {
                $gameMessage.add(
                    'No tienes ningún Pokémon disponible para combatir.'
                );
            }

            return false;
        }

        var enemy =
            BP.makeTrainerEnemy(
                team[0]
            );

        if (!enemy) {
            if (
                $gameMessage
            ) {
                $gameMessage.add(
                    'No se ha podido crear el primer Pokémon rival.'
                );
            }

            return false;
        }

        if (
            GM.Battle.ensureUsableMove
        ) {
            GM.Battle.ensureUsableMove(
                player
            );
        }

        if (
            GM.resetBattleStages
        ) {
            GM.resetBattleStages(
                player
            );
        }

        BP.trainer = {
            name:
                name,

            team:
                team,

            index:
                0,

            participants:
                {},

            allParticipants:
                {},

            eventContext:
                eventContext ||
                null
        };

        BP.noteTrainerParticipant(
            player
        );

        GM.Battle.playerPokemon =
            player;

        GM.Battle.enemy =
            enemy;

        GM.Battle.result =
            null;

        if (
            GM.markSeen
        ) {
            GM.markSeen(
                enemy.speciesId
            );
        }

        if (
            GM.BattleClassic &&
            GM.BattleClassic.beginContext
        ) {
            GM.BattleClassic.beginContext();
        }

        SceneManager.push(
            Scene_GranadaMonBattle
        );

        return true;
    };

    BP.hasNextTrainerEnemy = function() {
        return !!(
            BP.trainer &&
            BP.trainer.index +
            1 <
            BP.trainer.team.length
        );
    };

    BP.resolveTrainerEvent = function() {
        if (
            !BP.trainer ||
            !BP.trainer.eventContext
        ) {
            return;
        }

        var mapId =
            Number(
                BP.trainer.eventContext.mapId ||
                0
            );

        var eventId =
            Number(
                BP.trainer.eventContext.eventId ||
                0
            );

        if (
            !mapId ||
            !eventId
        ) {
            return;
        }

        if (
            $gameSelfSwitches
        ) {
            $gameSelfSwitches.setValue(
                [
                    mapId,
                    eventId,
                    'A'
                ],
                true
            );
        }

        if (
            $gameMap &&
            $gameMap.mapId() ===
                mapId
        ) {
            var ev =
                $gameMap.event(
                    eventId
                );

            if (
                ev &&
                ev.erase
            ) {
                ev.erase();
            }
        }
    };

    BP.recordTrainerEnemyDefeat = function(enemy) {
        if (!enemy) {
            return;
        }

        if (
            GM.BattleClassic &&
            GM.BattleClassic.recordDefeat
        ) {
            GM.BattleClassic.recordDefeat(
                enemy
            );
        }
    };

    BP.handleEnemyKO = function(scene) {
        var enemy =
            GM.Battle.enemy;

        if (!enemy) {
            return;
        }

        if (
            !BP.trainer
        ) {
            scene.winBattle();

            return;
        }

        BP.recordTrainerEnemyDefeat(
            enemy
        );

        var expMessages =
            BP.awardTrainerExp(
                enemy
            );

        if (
            BP.hasNextTrainerEnemy()
        ) {
            scene._gmPremiumTrainerTransition = {
                phase:
                    'WAIT_ANIM',

                frame:
                    0,

                enemy:
                    enemy,

                expMessages:
                    expMessages
            };

            if (
                scene._commandWindow
            ) {
                scene._commandWindow.deactivate();
            }

            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    enemy.name +
                    ' se ha debilitado.'
                );
            }

            BP.showCallout(
                scene,
                '¡' +
                String(
                    enemy.name ||
                    'POKÉMON'
                ).toUpperCase() +
                ' SE HA DEBILITADO!',
                '#b94f4f'
            );

            if (
                SoundManager.playEnemyCollapse
            ) {
                SoundManager.playEnemyCollapse();
            }

            return;
        }

        if (
            scene._logWindow
        ) {
            var finalText =
                enemy.name +
                ' se ha debilitado.\n' +
                (
                    expMessages.length
                        ? expMessages.join(
                            '\n'
                          )
                        : ''
                );

            scene._logWindow.setText(
                finalText
            );
        }

        BP.showCallout(
            scene,
            '¡VICTORIA CONTRA ' +
            BP.trainer.name.toUpperCase() +
            '!',
            '#3f9670'
        );

        BP.resolveTrainerEvent();

        if (
            GM.BattleClassic &&
            GM.BattleClassic.context
        ) {
            GM.BattleClassic.context.resolved =
                true;

            GM.BattleClassic.context.outcome =
                'WIN';
        }

        var winners =
            BP.trainer &&
            BP.trainer.allParticipants
                ? BP.trainer.allParticipants
                : {};

        for (
            var wk in winners
        ) {
            if (
                !winners.hasOwnProperty(
                    wk
                )
            ) {
                continue;
            }

            var pm =
                winners[wk];

            if (!pm) {
                continue;
            }

            pm.battleRecord =
                pm.battleRecord ||
                {};

            pm.battleRecord.wins =
                Number(
                    pm.battleRecord.wins ||
                    0
                ) +
                1;
        }

        setTimeout(
            function() {
                if (
                    SceneManager._scene !==
                    scene
                ) {
                    return;
                }

                scene._battleEnded =
                    true;

                GM.Battle.result =
                    'WIN';

                if (
                    GM.BattleClassic &&
                    GM.BattleClassic.startOutcome
                ) {
                    GM.BattleClassic.startOutcome(
                        scene,
                        'WIN',
                        {
                            expMessages:
                                expMessages
                        }
                    );
                }

                else {
                    scene.winBattle();
                }
            },
            520
        );
    };

    BP.updateTrainerTransition = function(scene) {
        var s =
            scene._gmPremiumTrainerTransition;

        if (!s) {
            return;
        }

        s.frame++;

        if (
            s.phase ===
            'WAIT_ANIM'
        ) {
            if (
                BP.animationBusy(
                    scene
                )
            ) {
                return;
            }

            if (
                s.frame <
                8
            ) {
                return;
            }

            s.phase =
                'FAINT';

            s.frame =
                0;

            s.sprite =
                scene._enemyPokemonSprite ||
                null;

            if (
                s.sprite
            ) {
                s.baseY =
                    Number(
                        s.sprite.y ||
                        0
                    );

                s.baseAlpha =
                    Number(
                        s.sprite.alpha == null
                            ? 1
                            : s.sprite.alpha
                    );
            }

            return;
        }

        if (
            s.phase ===
            'FAINT'
        ) {
            var t =
                BP.clamp(
                    s.frame /
                    30,
                    0,
                    1
                );

            if (
                s.sprite
            ) {
                s.sprite.y =
                    s.baseY +
                    42 *
                    t;

                s.sprite.alpha =
                    s.baseAlpha *
                    (
                        1 -
                        t
                    );

                s.sprite.scale.y =
                    Math.max(
                        0.05,
                        Number(
                            s.sprite.scale.y ||
                            1
                        ) *
                        (
                            1 -
                            0.045
                        )
                    );
            }

            if (
                s.frame >=
                31
            ) {
                if (
                    s.sprite
                ) {
                    s.sprite.visible =
                        false;
                }

                s.phase =
                    'EXP';

                s.frame =
                    0;

                if (
                    scene._logWindow &&
                    s.expMessages &&
                    s.expMessages.length
                ) {
                    scene._logWindow.setText(
                        s.expMessages.join(
                            '\n'
                        )
                    );
                }
            }

            return;
        }

        if (
            s.phase ===
            'EXP'
        ) {
            if (
                s.frame <
                (
                    s.expMessages &&
                    s.expMessages.length
                        ? 64
                        : 24
                )
            ) {
                return;
            }

            BP.trainer.index++;

            var next =
                BP.makeTrainerEnemy(
                    BP.trainer.team[
                        BP.trainer.index
                    ]
                );

            if (!next) {
                scene._gmPremiumTrainerTransition =
                    null;

                scene.winBattle();

                return;
            }

            BP.trainer.participants =
                {};

            BP.noteTrainerParticipant(
                GM.Battle.playerPokemon
            );

            GM.Battle.enemy =
                next;

            if (
                GM.markSeen
            ) {
                GM.markSeen(
                    next.speciesId
                );
            }

            if (
                GM.BattleClassic &&
                GM.BattleClassic.recordEncounter
            ) {
                GM.BattleClassic.recordEncounter(
                    next
                );
            }

            if (
                GM.BattleSprites &&
                GM.BattleSprites.refreshEnemy
            ) {
                GM.BattleSprites.refreshEnemy(
                    scene
                );
            }

            BP.refreshScene(
                scene
            );

            s.phase =
                'SEND';

            s.frame =
                0;

            s.sprite =
                scene._enemyPokemonSprite ||
                null;

            if (
                s.sprite
            ) {
                s.targetX =
                    Number(
                        s.sprite.x ||
                        Math.floor(
                            Graphics.boxWidth *
                            0.73
                        )
                    );

                s.targetY =
                    Number(
                        s.sprite.y ||
                        Math.floor(
                            Graphics.boxHeight *
                            0.31
                        )
                    );

                s.sprite.x =
                    s.targetX +
                    130;

                s.sprite.y =
                    s.targetY -
                    15;

                s.sprite.alpha =
                    0;

                s.sprite.visible =
                    true;
            }

            if (
                scene._logWindow
            ) {
                scene._logWindow.setText(
                    BP.trainer.name +
                    ' envía a ' +
                    next.name +
                    '.'
                );
            }

            BP.showCallout(
                scene,
                '¡' +
                String(
                    next.name ||
                    'POKÉMON'
                ).toUpperCase() +
                ' ENTRA EN COMBATE!',
                '#397ca4'
            );

            if (
                SoundManager.playOk
            ) {
                SoundManager.playOk();
            }

            return;
        }

        if (
            s.phase ===
            'SEND'
        ) {
            var st =
                BP.clamp(
                    s.frame /
                    34,
                    0,
                    1
                );

            var ease =
                1 -
                Math.pow(
                    1 -
                    st,
                    3
                );

            if (
                s.sprite
            ) {
                s.sprite.x =
                    s.targetX +
                    130 *
                    (
                        1 -
                        ease
                    );

                s.sprite.y =
                    s.targetY -
                    15 *
                    (
                        1 -
                        ease
                    ) -
                    Math.sin(
                        st *
                        Math.PI
                    ) *
                    8;

                s.sprite.alpha =
                    ease;
            }

            if (
                s.frame >=
                36
            ) {
                if (
                    s.sprite
                ) {
                    s.sprite.x =
                        s.targetX;

                    s.sprite.y =
                        s.targetY;

                    s.sprite.alpha =
                        1;
                }

                scene._gmPremiumTrainerTransition =
                    null;

                BP.activateMainCommand(
                    scene
                );
            }
        }
    };

    var _BP_baseCommandRun =
        Scene_GranadaMonBattle
            .prototype
            .commandRun;

    Scene_GranadaMonBattle.prototype.commandRun =
        function() {
            if (
                BP.trainer
            ) {
                SoundManager.playBuzzer();

                if (
                    this._logWindow
                ) {
                    this._logWindow.setText(
                        'No puedes huir de un combate contra entrenador.'
                    );
                }

                if (
                    this._commandWindow
                ) {
                    this._commandWindow.activate();
                }

                return;
            }

            return _BP_baseCommandRun
                ? _BP_baseCommandRun.call(
                    this
                  )
                : undefined;
        };

    var _BP_sceneCreate =
        Scene_GranadaMonBattle
            .prototype
            .create;

    Scene_GranadaMonBattle.prototype.create =
        function() {
            _BP_sceneCreate.call(
                this
            );

            BP.createBagWindows(
                this
            );

            BP.createFx(
                this
            );

            if (
                this._commandWindow
            ) {
                this._commandWindow.deactivate();
            }

            if (
                BP.trainer &&
                this._logWindow
            ) {
                this._logWindow.setText(
                    BP.trainer.name +
                    ' quiere combatir.'
                );
            }
        };

    var _BP_sceneUpdate =
        Scene_GranadaMonBattle
            .prototype
            .update;

    Scene_GranadaMonBattle.prototype.update =
        function() {
            _BP_sceneUpdate.call(
                this
            );

            BP.updateFx(
                this
            );

            BP.updateTurn(
                this
            );

            BP.updateFreeTurn(
                this
            );

            BP.updateTrainerTransition(
                this
            );
        };

    var _BP_sceneTerminate =
        Scene_GranadaMonBattle
            .prototype
            .terminate;

    Scene_GranadaMonBattle.prototype.terminate =
        function() {
            var wasTrainer =
                !!BP.trainer;

            var result =
                GM.Battle
                    ? GM.Battle.result
                    : null;

            var returnValue =
                _BP_sceneTerminate
                    ? _BP_sceneTerminate.call(
                        this
                      )
                    : undefined;

            if (
                wasTrainer
            ) {
                BP.trainer =
                    null;
            }

            BP.pendingTrainerEvent =
                null;

            return returnValue;
        };

    BP.parseTrainerTeam = function(
        raw,
        granadaDexMode
    ) {
        raw =
            String(
                raw ||
                ''
            ).trim();

        if (!raw) {
            return [];
        }

        var chunks =
            raw.split(
                ','
            );

        var team =
            [];

        for (
            var i = 0;
            i < chunks.length;
            i++
        ) {
            var pair =
                String(
                    chunks[i] ||
                    ''
                )
                .trim()
                .split(
                    ':'
                );

            if (
                pair.length <
                1
            ) {
                continue;
            }

            var dex =
                Number(
                    pair[0] ||
                    0
                );

            var level =
                BP.clamp(
                    Number(
                        pair[1] ||
                        1
                    ),
                    1,
                    100
                );

            var nationalDex =
                dex;

            if (
                granadaDexMode
            ) {
                var species =
                    GM.getSpeciesByGranadaDex
                        ? GM.getSpeciesByGranadaDex(
                            dex
                          )
                        : null;

                if (!species) {
                    continue;
                }

                nationalDex =
                    Number(
                        species.nationalDex ||
                        0
                    );
            }

            else if (
                GM.getSpecies &&
                !GM.getSpecies(
                    nationalDex
                )
            ) {
                continue;
            }

            if (
                nationalDex >
                0
            ) {
                team.push({
                    nationalDex:
                        nationalDex,

                    level:
                        level
                });
            }

            if (
                team.length >=
                6
            ) {
                break;
            }
        }

        return team;
    };

    var _BP_pluginCommand =
        Game_Interpreter
            .prototype
            .pluginCommand;

    Game_Interpreter.prototype.pluginCommand =
        function(
            command,
            args
        ) {
            _BP_pluginCommand.call(
                this,
                command,
                args
            );

            var cmd =
                String(
                    command ||
                    ''
                ).toLowerCase();

            if (
                cmd !==
                    'granadamontrainerbattlegd' &&
                cmd !==
                    'granadamontrainerbattle'
            ) {
                return;
            }

            var raw =
                (
                    args ||
                    []
                ).join(
                    ' '
                );

            var parts =
                raw.split(
                    '|'
                );

            var name =
                String(
                    parts[0] ||
                    'Entrenador'
                ).trim();

            var teamRaw =
                String(
                    parts[1] ||
                    ''
                ).trim();

            var team =
                BP.parseTrainerTeam(
                    teamRaw,
                    cmd ===
                    'granadamontrainerbattlegd'
                );

            var eventContext = {
                mapId:
                    $gameMap
                        ? $gameMap.mapId()
                        : 0,

                eventId:
                    Number(
                        this._eventId ||
                        0
                    )
            };

            if (
                eventContext.mapId &&
                eventContext.eventId &&
                $gameSelfSwitches &&
                $gameSelfSwitches.value(
                    [
                        eventContext.mapId,
                        eventContext.eventId,
                        'A'
                    ]
                )
            ) {
                if (
                    $gameMessage
                ) {
                    $gameMessage.add(
                        name +
                        ' ya ha sido derrotado.'
                    );
                }

                return;
            }

            BP.startTrainerBattle(
                name,
                team,
                eventContext
            );
        };

    console.log(
        'GranadaMon BattlePremium v2.0 cargado correctamente.'
    );
})();