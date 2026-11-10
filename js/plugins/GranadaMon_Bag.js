/*:
 * @plugindesc v1.9 GranadaMon - Mochila definitiva + kit inicial automático
 * @author OpenAI
 *
 * @help
 * GranadaMon_Bag.js
 * ------------------------------------------------------------
 * REQUIERE:
 * GranadaMon_Core.js
 *
 * RECOMENDADO:
 * GranadaMon_Experience.js para que los Caramelos suban de nivel
 * usando el sistema real de EXP, estadísticas y movimientos.
 *
 * COMANDOS:
 * GranadaMonGiveItem CLAVE CANTIDAD
 * GranadaMonRemoveItem CLAVE CANTIDAD
 * GranadaMonUseItem CLAVE SLOT
 *
 * OBJETOS ACTIVOS:
 * POKE_BALL
 * SUPER_BALL
 * ULTRA_BALL
 * POTION
 * REVIVE
 * GYM_BADGE
 * CANDY
 *
 * IMÁGENES EN img/pictures/:
 * GM_Ball_Poke.png
 * GM_Ball_Super.png
 * GM_Ball_Ultra.png
 * GM_Item_Potion.png
 * GM_Item_Revive.png
 * GM_Item_GymBadge.png
 * GM_Item_Candy.png
 *
 * v1.9
 * - Kit inicial automático al comenzar una Nueva partida.
 * - Entrega: 15 Poké Ball, 3 Pociones, 1 Revivir y 1 Caramelo.
 *
 * v1.8
 * - Eliminada Master Ball.
 * - Curación reducida a Poción y Revivir.
 * - Añadida Medalla de Gimnasio como coleccionable.
 * - Añadido Caramelo: sube exactamente 1 nivel.
 * - El Caramelo permite elegir a qué Pokémon del equipo aplicarlo.
 * - El Caramelo usa GranadaMon_Experience para recalcular estadísticas
 *   y procesar movimientos, sin provocar evolución.
 */

(function() {

    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    // =========================================================
    // COMPROBACIÓN
    // =========================================================

    if (!GM.getSpecies) {
        throw new Error('GranadaMon_Bag necesita GranadaMon_Core.js.');
    }

    GM.Bag = GM.Bag || {};
    GM.Bag.version = '1.9';

    GM.Items = GM.Items || {};
    GM.ItemList = GM.ItemList || [];

    // =========================================================
    // ESTILO VISUAL
    // =========================================================

    GM.BagUI = GM.BagUI || {};

    GM.BagUI.c = {
        bg1: '#1b2230',
        bg2: '#0b1017',
        panel1: '#232a39',
        panel2: '#111720',
        border: '#d9d5e3',
        softBorder: '#676b82',
        teal: '#79dfca',
        blue: '#8ebcff',
        gold: '#f5d76e',
        white: '#f7f7fa',
        soft: '#d9dce7',
        muted: '#969db0'
    };

    GM.BagUI.clearChrome = function(win) {
        if (!win) return;
        win.opacity = 0;
        win.backOpacity = 0;
    };

    GM.BagUI.frame = function(win, x, y, width, height, options) {
        if (!win || !win.contents) return;

        options = options || {};

        var c = GM.BagUI.c;
        var top = options.top || c.panel1;
        var bottom = options.bottom || c.panel2;
        var border = options.border || c.softBorder;

        win.contents.gradientFillRect(
            x,
            y,
            width,
            height,
            top,
            bottom,
            false
        );

        win.contents.fillRect(x, y, width, 2, border);
        win.contents.fillRect(x, y + height - 2, width, 2, border);
        win.contents.fillRect(x, y, 2, height, border);
        win.contents.fillRect(x + width - 2, y, 2, height, border);

        if (width > 12 && height > 12) {
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

        if (options.accent) {
            win.contents.fillRect(
                x + 2,
                y + 2,
                width - 4,
                3,
                options.accent
            );
        }
    };

    GM.BagUI.text = function(
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

        if (!win || !win.contents) return;

        var oldSize = win.contents.fontSize;
        var oldBold = win.contents.fontBold;

        win.contents.fontSize = size || oldSize;
        win.contents.fontBold = !!bold;

        if (color) {
            win.changeTextColor(color);
        }

        win.contents.drawText(
            String(text || ''),
            x,
            y,
            width,
            height,
            align || 'left'
        );

        win.resetTextColor();

        win.contents.fontSize = oldSize;
        win.contents.fontBold = oldBold;
    };

    // =========================================================
    // CATEGORÍAS
    // =========================================================

    GM.BagCategory = {
        BALL: 'BALL',
        HEAL: 'HEAL',
        MEDAL: 'MEDAL',
        CANDY: 'CANDY',

        STATUS: 'HEAL',

        EVOLUTION: 'EVOLUTION_LEGACY',
        HELD: 'HELD_LEGACY',
        KEY: 'KEY_LEGACY',
        OTHER: 'OTHER_LEGACY'
    };

    GM.Bag.categoryName = function(category) {

        if (category === GM.BagCategory.BALL) {
            return 'POKÉ BALLS';
        }

        if (category === GM.BagCategory.HEAL) {
            return 'CURACIÓN';
        }

        if (category === GM.BagCategory.MEDAL) {
            return 'MEDALLAS';
        }

        if (category === GM.BagCategory.CANDY) {
            return 'CARAMELOS';
        }

        return 'MOCHILA';
    };

    GM.Bag.categoryHelp = function(category) {

        if (category === GM.BagCategory.BALL) {
            return 'Poké Balls disponibles para capturar Pokémon.';
        }

        if (category === GM.BagCategory.HEAL) {
            return 'Poción para recuperar PS y Revivir para recuperar Pokémon debilitados.';
        }

        if (category === GM.BagCategory.MEDAL) {
            return 'Aquí se guardan las Medallas de Gimnasio conseguidas durante la aventura.';
        }

        if (category === GM.BagCategory.CANDY) {
            return 'Cada Caramelo sube 1 nivel al Pokémon que elijas.';
        }

        return 'Elige un bolsillo.';
    };

    // =========================================================
    // ÚNICOS OBJETOS PERMITIDOS
    // =========================================================

    GM.Bag.ALLOWED_KEYS = {
        POKE_BALL: true,
        SUPER_BALL: true,
        ULTRA_BALL: true,
        POTION: true,
        REVIVE: true,
        GYM_BADGE: true,
        CANDY: true
    };

    GM.Bag.isAllowedKey = function(key) {
        return !!GM.Bag.ALLOWED_KEYS[
            String(key || '').toUpperCase()
        ];
    };

    // =========================================================
    // IMÁGENES
    // =========================================================
    // Se conserva GM.BallVisuals por compatibilidad con Capture.
    // =========================================================

    GM.BallVisuals = GM.BallVisuals || {};

    GM.BallVisuals.files = {
        POKE_BALL: 'GM_Ball_Poke',
        SUPER_BALL: 'GM_Ball_Super',
        ULTRA_BALL: 'GM_Ball_Ultra',

        POTION: 'GM_Item_Potion',
        POCION: 'GM_Item_Potion',

        REVIVE: 'GM_Item_Revive',
        REVIVIR: 'GM_Item_Revive',

        GYM_BADGE: 'GM_Item_GymBadge',
        CANDY: 'GM_Item_Candy'
    };

    GM.BallVisuals.exists = function(key) {

        key =
            String(
                key || ''
            ).toUpperCase();

        return !!GM.BallVisuals.files[key];
    };

    GM.BallVisuals.filename = function(key) {

        key =
            String(
                key || ''
            ).toUpperCase();

        return GM.BallVisuals.files[key] || null;
    };

    GM.BallVisuals.bitmap = function(key) {

        var filename =
            GM.BallVisuals.filename(
                key
            );

        if (!filename) {
            return null;
        }

        return ImageManager.loadPicture(
            filename
        );
    };

    GM.BallVisuals.draw = function(
        targetBitmap,
        cx,
        cy,
        size,
        key,
        refreshCallback
    ) {

        if (!targetBitmap) {
            return;
        }

        var source =
            GM.BallVisuals.bitmap(
                key
            );

        if (!source) {
            return;
        }

        size =
            Math.max(
                16,
                Math.floor(
                    Number(
                        size || 48
                    )
                )
            );

        var dx =
            Math.floor(
                cx -
                size / 2
            );

        var dy =
            Math.floor(
                cy -
                size / 2
            );

        var drawImage =
            function() {

                if (
                    source.width <= 0 ||
                    source.height <= 0
                ) {
                    return;
                }

                targetBitmap.blt(
                    source,
                    0,
                    0,
                    source.width,
                    source.height,
                    dx,
                    dy,
                    size,
                    size
                );
            };

        if (source.isReady()) {
            drawImage();
        } else if (refreshCallback) {
            source.addLoadListener(
                refreshCallback
            );
        }
    };

    // =========================================================
    // REGISTRO DE OBJETOS
    // =========================================================

    GM.registerItem = function(data) {

        if (!data || !data.key) {
            return;
        }

        data.key =
            String(
                data.key
            ).toUpperCase();

        GM.Items[
            data.key
        ] =
            data;

        for (
            var i = 0;
            i < GM.ItemList.length;
            i++
        ) {

            if (
                GM.ItemList[i].key ===
                data.key
            ) {

                GM.ItemList[i] =
                    data;

                return;
            }
        }

        GM.ItemList.push(
            data
        );
    };

    GM.getItem = function(key) {

        if (key == null) {
            return null;
        }

        return (
            GM.Items[
                String(
                    key
                ).toUpperCase()
            ] ||
            null
        );
    };

    // =========================================================
    // GUARDADO
    // =========================================================

    var _Game_System_initialize =
        Game_System.prototype.initialize;

    Game_System.prototype.initialize =
        function() {

            _Game_System_initialize.call(
                this
            );

            this.initGranadaMonBag();
        };

    Game_System.prototype.initGranadaMonBag =
        function() {

            if (
                !this._granadaMonBag
            ) {

                this._granadaMonBag =
                    {};
            }
        };

    GM.Bag.ensureData =
        function() {

            if (!$gameSystem) {
                return;
            }

            if (
                !$gameSystem._granadaMonBag
            ) {

                $gameSystem._granadaMonBag =
                    {};
            }

            GM.Bag.cleanLegacyInventory();
        };

    // =========================================================
    // LIMPIEZA DE OBJETOS ANTIGUOS
    // =========================================================

    GM.Bag.cleanLegacyInventory =
        function() {

            if (
                !$gameSystem ||
                !$gameSystem._granadaMonBag
            ) {
                return;
            }

            var bag =
                $gameSystem._granadaMonBag;

            // Poción antigua
            if (
                Number(
                    bag.POCION || 0
                ) > 0
            ) {

                bag.POTION =
                    Number(
                        bag.POTION || 0
                    ) +
                    Number(
                        bag.POCION || 0
                    );

                bag.POCION =
                    0;
            }

            // Revivir antiguo
            if (
                Number(
                    bag.REVIVIR || 0
                ) > 0
            ) {

                bag.REVIVE =
                    Number(
                        bag.REVIVE || 0
                    ) +
                    Number(
                        bag.REVIVIR || 0
                    );

                bag.REVIVIR =
                    0;
            }

            var removed = [
                'MASTER_BALL',

                'SUPERPOCION',
                'HIPERPOCION',
                'POCION_MAXIMA',
                'REVIVIR_MAXIMO',

                'SUPER_POTION',
                'HYPER_POTION',
                'MAX_POTION',
                'MAX_REVIVE',

                'ANTIDOTO',
                'ANTIPARALIZADOR',
                'DESPERTAR',
                'ANTIHIELO',
                'CURA_TOTAL'
            ];

            for (
                var i = 0;
                i < removed.length;
                i++
            ) {

                bag[
                    removed[i]
                ] =
                    0;
            }
        };

    // =========================================================
    // CANTIDADES
    // =========================================================

    GM.getItemQuantity =
        function(key) {

            if (!$gameSystem) {
                return 0;
            }

            if (
                !$gameSystem._granadaMonBag
            ) {

                $gameSystem._granadaMonBag =
                    {};
            }

            key =
                String(
                    key || ''
                ).toUpperCase();

            return Number(
                $gameSystem
                    ._granadaMonBag[
                        key
                    ] ||
                0
            );
        };

    GM.gainItem =
        function(
            key,
            amount
        ) {

            GM.Bag.ensureData();

            if (!$gameSystem) {
                return false;
            }

            key =
                String(
                    key || ''
                ).toUpperCase();

            amount =
                Math.floor(
                    Number(
                        amount || 0
                    )
                );

            if (
                !GM.getItem(key) ||
                amount === 0
            ) {
                return false;
            }

            if (
                !GM.Bag.isAllowedKey(
                    key
                )
            ) {
                return false;
            }

            $gameSystem
                ._granadaMonBag[
                    key
                ] =
                Math.max(
                    0,
                    GM.getItemQuantity(
                        key
                    ) +
                    amount
                );

            return true;
        };

    GM.loseItem =
        function(
            key,
            amount
        ) {

            amount =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            amount || 0
                        )
                    )
                );

            return GM.gainItem(
                key,
                -amount
            );
        };

    GM.hasItem =
        function(
            key,
            amount
        ) {

            amount =
                Math.max(
                    1,
                    Math.floor(
                        Number(
                            amount || 1
                        )
                    )
                );

            return (
                GM.getItemQuantity(
                    key
                ) >=
                amount
            );
        };

    GM.itemsInCategory =
        function(category) {

            GM.Bag.ensureData();

            var result =
                [];

            for (
                var i = 0;
                i < GM.ItemList.length;
                i++
            ) {

                var item =
                    GM.ItemList[i];

                if (!item) {
                    continue;
                }

                if (
                    !GM.Bag.isAllowedKey(
                        item.key
                    )
                ) {
                    continue;
                }

                if (
                    item.category === category &&
                    GM.getItemQuantity(
                        item.key
                    ) > 0
                ) {

                    result.push(
                        item
                    );
                }
            }

            return result;
        };

    // =========================================================
    // CARAMELO: SUBIR EXACTAMENTE 1 NIVEL
    // =========================================================

    GM.Bag.raiseOneLevel =
        function(pokemon) {

            var result = {
                success: false,
                message: 'No tiene efecto.'
            };

            if (!pokemon) {
                return result;
            }

            var maxLevel =
                GM.Experience &&
                GM.Experience.MAX_LEVEL
                    ? Number(
                        GM.Experience.MAX_LEVEL
                    )
                    : 100;

            var currentLevel =
                Math.max(
                    1,
                    Number(
                        pokemon.level || 1
                    )
                );

            if (
                currentLevel >=
                maxLevel
            ) {

                result.message =
                    pokemon.name +
                    ' ya está al nivel máximo.';

                return result;
            }

            var targetLevel =
                currentLevel +
                1;

            // Sistema real de EXP del proyecto
            if (
                GM.gainExp &&
                GM.nextLevelExp &&
                GM.ensurePokemonExperience
            ) {

                GM.ensurePokemonExperience(
                    pokemon
                );

                var targetExp =
                    Number(
                        GM.nextLevelExp(
                            pokemon
                        ) ||
                        0
                    );

                var currentExp =
                    Number(
                        pokemon.exp || 0
                    );

                var expNeeded =
                    Math.max(
                        1,
                        targetExp -
                        currentExp
                    );

                var expResult =
                    GM.gainExp(
                        pokemon,
                        expNeeded
                    );

                if (
                    pokemon.level >=
                    targetLevel
                ) {

                    result.success =
                        true;

                    result.message =
                        pokemon.name +
                        ' ha subido al nivel ' +
                        pokemon.level +
                        '.';

                    result.expResult =
                        expResult;

                    return result;
                }
            }

            // Fallback
            pokemon.level =
                targetLevel;

            if (
                GM.expForSpeciesLevel
            ) {

                var species =
                    GM.getSpecies(
                        pokemon.speciesId
                    );

                pokemon.exp =
                    GM.expForSpeciesLevel(
                        species,
                        targetLevel
                    );
            }

            if (
                GM.recalculatePokemonStats
            ) {

                GM.recalculatePokemonStats(
                    pokemon
                );

            } else if (
                GM.calculateStats
            ) {

                var fallbackSpecies =
                    GM.getSpecies(
                        pokemon.speciesId
                    );

                if (
                    fallbackSpecies
                ) {

                    var oldMaxHp =
                        Number(
                            pokemon.maxHp || 1
                        );

                    var oldHp =
                        Number(
                            pokemon.hp || 0
                        );

                    var missingHp =
                        Math.max(
                            0,
                            oldMaxHp -
                            oldHp
                        );

                    var fainted =
                        oldHp <= 0;

                    var stats =
                        GM.calculateStats(
                            fallbackSpecies,
                            pokemon.level
                        );

                    pokemon.maxHp =
                        stats.hp;

                    pokemon.attack =
                        stats.attack;

                    pokemon.defense =
                        stats.defense;

                    pokemon.spAttack =
                        stats.spAttack;

                    pokemon.spDefense =
                        stats.spDefense;

                    pokemon.speed =
                        stats.speed;

                    pokemon.hp =
                        fainted
                            ? 0
                            : Math.max(
                                1,
                                pokemon.maxHp -
                                missingHp
                            );
                }
            }

            result.success =
                true;

            result.message =
                pokemon.name +
                ' ha subido al nivel ' +
                pokemon.level +
                '.';

            return result;
        };

    // =========================================================
    // USAR OBJETO
    // =========================================================

    GM.useBagItemOnPokemon =
        function(
            key,
            pokemon
        ) {

            var item =
                GM.getItem(
                    key
                );

            var result = {
                success: false,
                consumed: false,
                message: 'No tiene efecto.'
            };

            if (
                !item ||
                !pokemon
            ) {
                return result;
            }

            if (
                !GM.hasItem(
                    item.key,
                    1
                )
            ) {

                result.message =
                    'No tienes ese objeto.';

                return result;
            }

            if (
                item.battleOnly
            ) {

                result.message =
                    'Este objeto solo puede usarse durante un combate.';

                return result;
            }

            var effect =
                item.effect;

            if (!effect) {
                return result;
            }

            // =================================================
            // POCIÓN
            // =========================================================

            if (
                effect.type ===
                'HEAL_HP'
            ) {

                if (
                    pokemon.hp <= 0
                ) {

                    result.message =
                        'No se puede usar sobre un Pokémon debilitado.';

                    return result;
                }

                if (
                    pokemon.hp >=
                    pokemon.maxHp
                ) {

                    result.message =
                        'Sus PS ya están al máximo.';

                    return result;
                }

                var oldHp =
                    pokemon.hp;

                pokemon.hp =
                    Math.min(
                        pokemon.maxHp,
                        pokemon.hp +
                        Number(
                            effect.amount || 0
                        )
                    );

                result.success =
                    pokemon.hp >
                    oldHp;

                if (
                    result.success
                ) {

                    result.message =
                        pokemon.name +
                        ' ha recuperado ' +
                        (
                            pokemon.hp -
                            oldHp
                        ) +
                        ' PS.';
                }
            }

            // =================================================
            // REVIVIR
            // =========================================================

            else if (
                effect.type ===
                'REVIVE'
            ) {

                if (
                    pokemon.hp > 0
                ) {

                    result.message =
                        pokemon.name +
                        ' no está debilitado.';

                    return result;
                }

                pokemon.hp =
                    Math.max(
                        1,
                        Math.floor(
                            pokemon.maxHp *
                            Number(
                                effect.percent || 50
                            ) /
                            100
                        )
                    );

                pokemon.fainted =
                    false;

                result.success =
                    true;

                result.message =
                    pokemon.name +
                    ' ha revivido con ' +
                    pokemon.hp +
                    ' PS.';
            }

            // =================================================
            // CARAMELO
            // =========================================================

            else if (
                effect.type ===
                'LEVEL_UP'
            ) {

                var levelResult =
                    GM.Bag.raiseOneLevel(
                        pokemon
                    );

                result.success =
                    !!levelResult.success;

                result.message =
                    levelResult.message;

                result.levelUpData =
                    levelResult.expResult ||
                    null;
            }

            if (
                result.success &&
                item.consumable !== false
            ) {

                GM.loseItem(
                    item.key,
                    1
                );

                result.consumed =
                    true;
            }

            return result;
        };

    // =========================================================
    // CREAR OBJETO
    // =========================================================

    function I(
        key,
        name,
        category,
        price,
        description,
        effect,
        options
    ) {

        options =
            options || {};

        GM.registerItem({
            key: key,
            name: name,
            category: category,
            price: Number(price || 0),
            description: description || '',
            effect: effect || null,
            consumable: options.consumable !== false,
            battleOnly: options.battleOnly === true
        });
    }

    // =========================================================
    // POKÉ BALLS
    // =========================================================

    I(
        'POKE_BALL',
        'Poké Ball',
        GM.BagCategory.BALL,
        200,
        'Poké Ball estándar para capturar Pokémon salvajes.',
        null,
        {
            battleOnly: true
        }
    );

    I(
        'SUPER_BALL',
        'Super Ball',
        GM.BagCategory.BALL,
        600,
        'Poké Ball con una mayor eficacia de captura.',
        null,
        {
            battleOnly: true
        }
    );

    I(
        'ULTRA_BALL',
        'Ultra Ball',
        GM.BagCategory.BALL,
        800,
        'Poké Ball de gran eficacia para capturar Pokémon salvajes.',
        null,
        {
            battleOnly: true
        }
    );

    // =========================================================
    // CURACIÓN
    // =========================================================

    I(
        'POTION',
        'Poción',
        GM.BagCategory.HEAL,
        200,
        'Restaura 15 PS al Pokémon seleccionado.',
        {
            type: 'HEAL_HP',
            amount: 15
        }
    );

    I(
        'REVIVE',
        'Revivir',
        GM.BagCategory.HEAL,
        2000,
        'Reanima al Pokémon seleccionado con el 50% de sus PS máximos.',
        {
            type: 'REVIVE',
            percent: 50
        }
    );

    // =========================================================
    // MEDALLAS
    // =========================================================

    I(
        'GYM_BADGE',
        'Medalla de Gimnasio',
        GM.BagCategory.MEDAL,
        0,
        'Medalla conseguida al superar un Gimnasio. Es un objeto de colección.',
        null,
        {
            consumable: false
        }
    );

    // =========================================================
    // CARAMELOS
    // =========================================================

    I(
        'CANDY',
        'Caramelo',
        GM.BagCategory.CANDY,
        0,
        'Sube 1 nivel al Pokémon seleccionado.',
        {
            type: 'LEVEL_UP',
            levels: 1
        }
    );

    // =========================================================
    // TÍTULO
    // =========================================================

    function Window_GranadaBagTitle() {
        this.initialize.apply(this, arguments);
    }

    Window_GranadaBagTitle.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GranadaBagTitle.prototype.constructor =
        Window_GranadaBagTitle;

    Window_GranadaBagTitle.prototype.standardPadding =
        function() {

            return 10;
        };

    Window_GranadaBagTitle.prototype.initialize =
        function() {

            Window_Base.prototype.initialize.call(
                this,
                0,
                0,
                Graphics.boxWidth,
                90
            );

            GM.BagUI.clearChrome(
                this
            );

            this.refresh();
        };

    Window_GranadaBagTitle.prototype.refresh =
        function() {

            this.contents.clear();

            var c =
                GM.BagUI.c;

            var width =
                Math.min(
                    560,
                    this.contentsWidth() -
                    80
                );

            var height =
                58;

            var x =
                Math.floor(
                    (
                        this.contentsWidth() -
                        width
                    ) /
                    2
                );

            var y =
                4;

            GM.BagUI.frame(
                this,
                x,
                y,
                width,
                height,
                {
                    top: '#242b3d',
                    bottom: '#101621',
                    border: c.border,
                    accent: c.blue
                }
            );

            GM.BagUI.text(
                this,
                'MOCHILA',
                x,
                y + 2,
                width,
                30,
                'center',
                c.blue,
                24,
                true
            );

            GM.BagUI.text(
                this,
                '◀ ▶  cambiar bolsillo     ENTER  abrir     ESC  volver',
                x,
                y + 32,
                width,
                18,
                'center',
                c.muted,
                13,
                false
            );
        };

    // =========================================================
    // PESTAÑAS
    // =========================================================

    function Window_GranadaBagCategory() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GranadaBagCategory.prototype =
        Object.create(
            Window_HorzCommand.prototype
        );

    Window_GranadaBagCategory.prototype.constructor =
        Window_GranadaBagCategory;

    Window_GranadaBagCategory.prototype.initialize =
        function(
            x,
            y
        ) {

            this._gmVisualIndex =
                -999;

            this._gmVisualActive =
                null;

            Window_HorzCommand.prototype.initialize.call(
                this,
                x,
                y
            );

            GM.BagUI.clearChrome(
                this
            );
        };

    Window_GranadaBagCategory.prototype.windowWidth =
        function() {

            return Graphics.boxWidth - 28;
        };

    Window_GranadaBagCategory.prototype.windowHeight =
        function() {

            return 92;
        };

    Window_GranadaBagCategory.prototype.standardPadding =
        function() {

            return 10;
        };

    Window_GranadaBagCategory.prototype.maxCols =
        function() {

            return 4;
        };

    Window_GranadaBagCategory.prototype.numVisibleRows =
        function() {

            return 1;
        };

    Window_GranadaBagCategory.prototype.makeCommandList =
        function() {

            this.addCommand(
                'Poké Balls',
                GM.BagCategory.BALL
            );

            this.addCommand(
                'Curación',
                GM.BagCategory.HEAL
            );

            this.addCommand(
                'Medallas',
                GM.BagCategory.MEDAL
            );

            this.addCommand(
                'Caramelos',
                GM.BagCategory.CANDY
            );
        };

    Window_GranadaBagCategory.prototype.itemRect =
        function(index) {

            var gap =
                14;

            var total =
                this.contentsWidth();

            var columnWidth =
                Math.floor(
                    (
                        total -
                        gap * 3
                    ) /
                    4
                );

            return new Rectangle(
                index *
                (
                    columnWidth +
                    gap
                ),
                6,
                columnWidth,
                50
            );
        };

    Window_GranadaBagCategory.prototype.drawItem =
        function(index) {

            var rect =
                this.itemRect(
                    index
                );

            var c =
                GM.BagUI.c;

            var current =
                this.index() ===
                index;

            var focused =
                this.active &&
                current;

            var top =
                '#1d2330';

            var bottom =
                '#0d1219';

            var border =
                c.softBorder;

            var accent =
                null;

            var textColor =
                c.soft;

            if (current) {
                top = '#203a37';
                bottom = '#101b1a';
                border = c.teal;
                accent = c.teal;
                textColor = c.white;
            }

            if (focused) {
                top = '#2a514a';
                bottom = '#132522';
                border = c.gold;
                accent = c.gold;
                textColor = c.gold;
            }

            GM.BagUI.frame(
                this,
                rect.x,
                rect.y,
                rect.width,
                rect.height,
                {
                    top: top,
                    bottom: bottom,
                    border: border,
                    accent: accent
                }
            );

            if (focused) {

                GM.BagUI.text(
                    this,
                    '>',
                    rect.x + 8,
                    rect.y,
                    20,
                    rect.height,
                    'center',
                    c.gold,
                    20,
                    true
                );
            }

            GM.BagUI.text(
                this,
                this.commandName(
                    index
                ),
                rect.x + 25,
                rect.y,
                rect.width - 50,
                rect.height,
                'center',
                textColor,
                18,
                focused
            );
        };

    Window_GranadaBagCategory.prototype.redrawGranadaCategory =
        function() {

            if (!this.contents) {
                return;
            }

            this.contents.clear();
            this.drawAllItems();
        };

    Window_GranadaBagCategory.prototype.update =
        function() {

            Window_HorzCommand.prototype.update.call(
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

                this.redrawGranadaCategory();

                this.callUpdateHelp();
            }
        };

    Window_GranadaBagCategory.prototype.updateHelp =
        function() {

            if (
                this._helpWindow
            ) {

                this._helpWindow.setText(
                    GM.Bag.categoryHelp(
                        this.currentSymbol()
                    )
                );
            }
        };

    // =========================================================
    // LISTA
    // =========================================================

    function Window_GranadaBagList() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GranadaBagList.prototype =
        Object.create(
            Window_Selectable.prototype
        );

    Window_GranadaBagList.prototype.constructor =
        Window_GranadaBagList;

    Window_GranadaBagList.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._category =
                GM.BagCategory.BALL;

            this._data =
                [];

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

            GM.BagUI.clearChrome(
                this
            );

            this.refresh();
        };

    Window_GranadaBagList.prototype.standardPadding =
        function() {

            return 12;
        };

    Window_GranadaBagList.prototype.setCategory =
        function(category) {

            if (
                this._category !==
                category
            ) {

                this._category =
                    category;

                this.refresh();

                this.select(0);
            }
        };

    Window_GranadaBagList.prototype.makeItemList =
        function() {

            this._data =
                GM.itemsInCategory(
                    this._category
                ) ||
                [];
        };

    Window_GranadaBagList.prototype.maxItems =
        function() {

            return Math.max(
                this._data.length,
                1
            );
        };

    Window_GranadaBagList.prototype.item =
        function() {

            if (
                !this._data.length
            ) {

                return null;
            }

            return (
                this._data[
                    this.index()
                ] ||
                null
            );
        };

    Window_GranadaBagList.prototype.itemHeight =
        function() {

            return 86;
        };

    Window_GranadaBagList.prototype.isCurrentItemEnabled =
        function() {

            return !!this.item();
        };

    Window_GranadaBagList.prototype.drawBackground =
        function() {

            GM.BagUI.frame(
                this,
                0,
                0,
                this.contentsWidth(),
                this.contentsHeight(),
                {
                    top: GM.BagUI.c.bg1,
                    bottom: GM.BagUI.c.bg2,
                    border: GM.BagUI.c.softBorder
                }
            );
        };

    Window_GranadaBagList.prototype.drawEmpty =
        function() {

            var c =
                GM.BagUI.c;

            var y =
                Math.floor(
                    this.contentsHeight() /
                    2
                ) -
                28;

            GM.BagUI.text(
                this,
                GM.Bag.categoryName(
                    this._category
                ),
                0,
                y,
                this.contentsWidth(),
                28,
                'center',
                c.muted,
                18,
                true
            );

            GM.BagUI.text(
                this,
                'Este bolsillo está vacío.',
                0,
                y + 30,
                this.contentsWidth(),
                26,
                'center',
                c.muted,
                17,
                false
            );
        };

    Window_GranadaBagList.prototype.drawItem =
        function(index) {

            var item =
                this._data[
                    index
                ];

            if (!item) {
                return;
            }

            var rect =
                this.itemRect(
                    index
                );

            var c =
                GM.BagUI.c;

            var focused =
                this.active &&
                this.index() ===
                    index;

            var x =
                rect.x + 8;

            var y =
                rect.y + 7;

            var width =
                rect.width - 16;

            var height =
                rect.height - 12;

            GM.BagUI.frame(
                this,
                x,
                y,
                width,
                height,
                {
                    top:
                        focused
                            ? '#302a3d'
                            : '#202632',

                    bottom:
                        focused
                            ? '#17141f'
                            : '#10151c',

                    border:
                        focused
                            ? c.gold
                            : c.softBorder,

                    accent:
                        focused
                            ? c.gold
                            : c.blue
                }
            );

            if (
                focused
            ) {

                GM.BagUI.text(
                    this,
                    '>',
                    x + 7,
                    y,
                    22,
                    height,
                    'center',
                    c.gold,
                    24,
                    true
                );
            }

            var iconX =
                x + 36;

            var iconY =
                y + 11;

            var iconWidth =
                54;

            var iconHeight =
                52;

            GM.BagUI.frame(
                this,
                iconX,
                iconY,
                iconWidth,
                iconHeight,
                {
                    top: '#222938',
                    bottom: '#0e131b',
                    border:
                        focused
                            ? c.gold
                            : c.softBorder
                }
            );

            if (
                GM.BallVisuals.exists(
                    item.key
                )
            ) {

                var self =
                    this;

                GM.BallVisuals.draw(
                    this.contents,
                    iconX +
                    Math.floor(
                        iconWidth /
                        2
                    ),
                    iconY +
                    Math.floor(
                        iconHeight /
                        2
                    ),
                    44,
                    item.key,
                    function() {
                        self.refresh();
                    }
                );
            }

            var textX =
                iconX +
                iconWidth +
                18;

            var textWidth =
                width -
                255;

            GM.BagUI.text(
                this,
                item.name,
                textX,
                y + 9,
                textWidth,
                30,
                'left',
                c.white,
                23,
                true
            );

            var label =
                'OBJETO';

            if (
                item.category ===
                GM.BagCategory.BALL
            ) {

                label =
                    'CAPTURA';

            } else if (
                item.category ===
                GM.BagCategory.HEAL
            ) {

                label =
                    'CURACIÓN';

            } else if (
                item.category ===
                GM.BagCategory.MEDAL
            ) {

                label =
                    'COLECCIÓN';

            } else if (
                item.category ===
                GM.BagCategory.CANDY
            ) {

                label =
                    'SUBE 1 NIVEL';
            }

            GM.BagUI.text(
                this,
                label,
                textX,
                y + 42,
                textWidth,
                18,
                'left',
                focused
                    ? c.gold
                    : c.muted,
                13,
                false
            );

            var quantityWidth =
                90;

            var quantityHeight =
                40;

            var quantityX =
                x +
                width -
                quantityWidth -
                20;

            var quantityY =
                y +
                Math.floor(
                    (
                        height -
                        quantityHeight
                    ) /
                    2
                );

            GM.BagUI.frame(
                this,
                quantityX,
                quantityY,
                quantityWidth,
                quantityHeight,
                {
                    top:
                        focused
                            ? '#40351e'
                            : '#202635',

                    bottom: '#10151c',

                    border:
                        focused
                            ? c.gold
                            : c.softBorder
                }
            );

            GM.BagUI.text(
                this,
                'x ' +
                GM.getItemQuantity(
                    item.key
                ),
                quantityX,
                quantityY,
                quantityWidth,
                quantityHeight,
                'center',
                focused
                    ? c.gold
                    : c.white,
                19,
                true
            );
        };

    Window_GranadaBagList.prototype.redrawGranadaList =
        function() {

            if (!this.contents) {
                return;
            }

            this.contents.clear();

            this.drawBackground();

            if (
                this._data.length >
                0
            ) {

                this.drawAllItems();

            } else {

                this.drawEmpty();
            }
        };

    Window_GranadaBagList.prototype.refresh =
        function() {

            this.makeItemList();

            this.createContents();

            this.redrawGranadaList();

            this.callUpdateHelp();
        };

    Window_GranadaBagList.prototype.update =
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

                this.redrawGranadaList();

                this.callUpdateHelp();
            }
        };

    Window_GranadaBagList.prototype.updateHelp =
        function() {

            if (
                !this._helpWindow
            ) {
                return;
            }

            var item =
                this.item();

            if (!item) {

                this._helpWindow.setText(
                    GM.Bag.categoryHelp(
                        this._category
                    )
                );

                return;
            }

            this._helpWindow.setText(
                item.description +
                (
                    item.battleOnly
                        ? ' Solo puede usarse durante un combate o una captura.'
                        : ''
                )
            );
        };

    // =========================================================
    // AYUDA
    // =========================================================

    function Window_GranadaBagHelp() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GranadaBagHelp.prototype =
        Object.create(
            Window_Base.prototype
        );

    Window_GranadaBagHelp.prototype.constructor =
        Window_GranadaBagHelp;

    Window_GranadaBagHelp.prototype.initialize =
        function(
            x,
            y,
            width,
            height
        ) {

            this._text =
                '';

            Window_Base.prototype.initialize.call(
                this,
                x,
                y,
                width,
                height
            );

            GM.BagUI.clearChrome(
                this
            );

            this.refresh();
        };

    Window_GranadaBagHelp.prototype.setText =
        function(text) {

            text =
                String(
                    text || ''
                );

            if (
                this._text !==
                text
            ) {

                this._text =
                    text;

                this.refresh();
            }
        };

    Window_GranadaBagHelp.prototype.wrapText =
        function(
            text,
            maxWidth
        ) {

            var output =
                [];

            var paragraphs =
                String(
                    text || ''
                ).split(
                    '\n'
                );

            for (
                var p = 0;
                p < paragraphs.length;
                p++
            ) {

                var raw =
                    paragraphs[p].trim();

                if (!raw) {

                    output.push('');

                    continue;
                }

                var words =
                    raw.split(
                        /\s+/
                    );

                var line =
                    '';

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
                        maxWidth
                    ) {

                        line =
                            test;

                    } else {

                        if (
                            line
                        ) {

                            output.push(
                                line
                            );
                        }

                        line =
                            words[i];
                    }
                }

                if (
                    line
                ) {

                    output.push(
                        line
                    );
                }
            }

            return output;
        };

    Window_GranadaBagHelp.prototype.refresh =
        function() {

            this.contents.clear();

            var c =
                GM.BagUI.c;

            GM.BagUI.frame(
                this,
                0,
                0,
                this.contentsWidth(),
                this.contentsHeight(),
                {
                    top: '#202736',
                    bottom: '#0e141d',
                    border: c.border,
                    accent: c.gold
                }
            );

            GM.BagUI.text(
                this,
                'INFORMACIÓN',
                16,
                8,
                180,
                20,
                'left',
                c.gold,
                15,
                true
            );

            var lines =
                this.wrapText(
                    this._text,
                    this.contentsWidth() -
                    32
                );

            for (
                var i = 0;
                i < lines.length &&
                i < 3;
                i++
            ) {

                GM.BagUI.text(
                    this,
                    lines[i],
                    16,
                    34 +
                    i *
                    23,
                    this.contentsWidth() -
                    32,
                    22,
                    'left',
                    c.soft,
                    16,
                    false
                );
            }
        };

    // =========================================================
    // SELECCIÓN DE POKÉMON
    // =========================================================

    function Window_GranadaBagPokemon() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Window_GranadaBagPokemon.prototype =
        Object.create(
            Window_Selectable.prototype
        );

    Window_GranadaBagPokemon.prototype.constructor =
        Window_GranadaBagPokemon;

    Window_GranadaBagPokemon.prototype.initialize =
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

            GM.BagUI.clearChrome(
                this
            );

            this.hide();

            this.deactivate();

            this.refresh();
        };

    Window_GranadaBagPokemon.prototype.standardPadding =
        function() {

            return 14;
        };

    Window_GranadaBagPokemon.prototype.maxItems =
        function() {

            var party =
                (
                    $gameSystem &&
                    $gameSystem._granadaMonParty
                )
                    ? $gameSystem._granadaMonParty
                    : [];

            return Math.max(
                party.length,
                1
            );
        };

    Window_GranadaBagPokemon.prototype.pokemon =
        function() {

            var party =
                $gameSystem
                    ._granadaMonParty ||
                [];

            return (
                party[
                    this.index()
                ] ||
                null
            );
        };

    Window_GranadaBagPokemon.prototype.isCurrentItemEnabled =
        function() {

            return !!this.pokemon();
        };

    Window_GranadaBagPokemon.prototype.itemHeight =
        function() {

            return 62;
        };

    Window_GranadaBagPokemon.prototype.itemRect =
        function(index) {

            var rect =
                Window_Selectable.prototype.itemRect.call(
                    this,
                    index
                );

            rect.y +=
                42;

            return rect;
        };

    Window_GranadaBagPokemon.prototype.drawItem =
        function(index) {

            var rect =
                this.itemRect(
                    index
                );

            var party =
                $gameSystem
                    ._granadaMonParty ||
                [];

            var pokemon =
                party[
                    index
                ];

            var c =
                GM.BagUI.c;

            if (!pokemon) {
                return;
            }

            var focused =
                this.active &&
                this.index() ===
                    index;

            var x =
                rect.x +
                6;

            var y =
                rect.y +
                4;

            var width =
                rect.width -
                12;

            var height =
                rect.height -
                7;

            GM.BagUI.frame(
                this,
                x,
                y,
                width,
                height,
                {
                    top:
                        focused
                            ? '#302a3d'
                            : '#202632',

                    bottom:
                        focused
                            ? '#17141f'
                            : '#10151c',

                    border:
                        focused
                            ? c.gold
                            : c.softBorder,

                    accent:
                        focused
                            ? c.gold
                            : c.blue
                }
            );

            if (
                focused
            ) {

                GM.BagUI.text(
                    this,
                    '>',
                    x + 6,
                    y,
                    20,
                    height,
                    'center',
                    c.gold,
                    21,
                    true
                );
            }

            GM.BagUI.text(
                this,
                pokemon.name ||
                'Pokémon',
                x + 34,
                y,
                230,
                height,
                'left',
                c.white,
                20,
                true
            );

            GM.BagUI.text(
                this,
                'Nv. ' +
                pokemon.level,
                x + 275,
                y,
                100,
                height,
                'left',
                focused
                    ? c.gold
                    : c.soft,
                17,
                false
            );

            GM.BagUI.text(
                this,
                'PS ' +
                pokemon.hp +
                ' / ' +
                pokemon.maxHp,
                x + 390,
                y,
                width - 410,
                height,
                'right',
                c.teal,
                17,
                false
            );
        };

    Window_GranadaBagPokemon.prototype.redrawGranadaPokemon =
        function() {

            if (
                !this.contents
            ) {
                return;
            }

            this.contents.clear();

            var c =
                GM.BagUI.c;

            GM.BagUI.frame(
                this,
                0,
                0,
                this.contentsWidth(),
                this.contentsHeight(),
                {
                    top: c.bg1,
                    bottom: c.bg2,
                    border: c.border,
                    accent: c.gold
                }
            );

            GM.BagUI.text(
                this,
                'ELIGE UN POKÉMON',
                0,
                7,
                this.contentsWidth(),
                24,
                'center',
                c.gold,
                18,
                true
            );

            this.drawAllItems();
        };

    Window_GranadaBagPokemon.prototype.refresh =
        function() {

            this.createContents();

            this.redrawGranadaPokemon();
        };

    Window_GranadaBagPokemon.prototype.update =
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

                this.redrawGranadaPokemon();
            }
        };

    // =========================================================
    // ESCENA
    // =========================================================

    function Scene_GranadaMonBag() {
        this.initialize.apply(
            this,
            arguments
        );
    }

    Scene_GranadaMonBag.prototype =
        Object.create(
            Scene_MenuBase.prototype
        );

    Scene_GranadaMonBag.prototype.constructor =
        Scene_GranadaMonBag;

    Scene_GranadaMonBag.prototype.initialize =
        function() {

            Scene_MenuBase.prototype.initialize.call(
                this
            );

            this._selectedBagItem =
                null;
        };

    Scene_GranadaMonBag.prototype.create =
        function() {

            Scene_MenuBase.prototype.create.call(
                this
            );

            GM.Bag.ensureData();

            this.createTitleWindow();
            this.createHelpWindow();
            this.createCategoryWindow();
            this.createItemWindow();
            this.createPokemonWindow();

            this._categoryWindow.setHelpWindow(
                this._helpWindow
            );

            this._categoryWindow.callUpdateHelp();
        };

    Scene_GranadaMonBag.prototype.createTitleWindow =
        function() {

            this._titleWindow =
                new Window_GranadaBagTitle();

            this.addWindow(
                this._titleWindow
            );
        };

    Scene_GranadaMonBag.prototype.createHelpWindow =
        function() {

            var height =
                126;

            this._helpWindow =
                new Window_GranadaBagHelp(
                    16,
                    Graphics.boxHeight -
                    height -
                    12,
                    Graphics.boxWidth -
                    32,
                    height
                );

            this.addWindow(
                this._helpWindow
            );
        };

    Scene_GranadaMonBag.prototype.createCategoryWindow =
        function() {

            this._categoryWindow =
                new Window_GranadaBagCategory(
                    14,
                    this._titleWindow.height -
                    8
                );

            this._categoryWindow.setHandler(
                'ok',
                this.onCategoryOk.bind(
                    this
                )
            );

            this._categoryWindow.setHandler(
                'cancel',
                this.popScene.bind(
                    this
                )
            );

            this.addWindow(
                this._categoryWindow
            );
        };

    Scene_GranadaMonBag.prototype.createItemWindow =
        function() {

            var y =
                this._categoryWindow.y +
                this._categoryWindow.height -
                4;

            var height =
                this._helpWindow.y -
                y -
                10;

            this._itemWindow =
                new Window_GranadaBagList(
                    16,
                    y,
                    Graphics.boxWidth -
                    32,
                    height
                );

            this._itemWindow.setHelpWindow(
                this._helpWindow
            );

            this._itemWindow.setHandler(
                'ok',
                this.onItemOk.bind(
                    this
                )
            );

            this._itemWindow.setHandler(
                'cancel',
                this.onItemCancel.bind(
                    this
                )
            );

            this.addWindow(
                this._itemWindow
            );

            this._categoryWindow.activate();

            this._categoryWindow.select(0);

            this._itemWindow.deactivate();

            this._itemWindow.deselect();
        };

    Scene_GranadaMonBag.prototype.createPokemonWindow =
        function() {

            var width =
                Math.floor(
                    Graphics.boxWidth *
                    0.76
                );

            var height =
                Math.min(
                    Graphics.boxHeight -
                    140,
                    470
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

            this._pokemonWindow =
                new Window_GranadaBagPokemon(
                    x,
                    y,
                    width,
                    height
                );

            this._pokemonWindow.setHandler(
                'ok',
                this.onPokemonOk.bind(
                    this
                )
            );

            this._pokemonWindow.setHandler(
                'cancel',
                this.onPokemonCancel.bind(
                    this
                )
            );

            this.addWindow(
                this._pokemonWindow
            );
        };

    // =========================================================
    // ENTRAR EN BOLSILLO
    // =========================================================

    Scene_GranadaMonBag.prototype.onCategoryOk =
        function() {

            this._itemWindow.setCategory(
                this._categoryWindow.currentSymbol()
            );

            this._categoryWindow.deactivate();

            this._categoryWindow.redrawGranadaCategory();

            this._itemWindow.activate();

            this._itemWindow.select(0);

            this._itemWindow.redrawGranadaList();

            this._itemWindow.callUpdateHelp();
        };

    // =========================================================
    // VOLVER A CATEGORÍAS
    // =========================================================

    Scene_GranadaMonBag.prototype.onItemCancel =
        function() {

            this._itemWindow.deselect();

            this._itemWindow.deactivate();

            this._itemWindow.redrawGranadaList();

            this._categoryWindow.activate();

            this._categoryWindow.redrawGranadaCategory();

            this._categoryWindow.callUpdateHelp();
        };

    // =========================================================
    // PULSAR OBJETO
    // =========================================================

    Scene_GranadaMonBag.prototype.onItemOk =
        function() {

            var item =
                this._itemWindow.item();

            if (!item) {

                SoundManager.playBuzzer();

                this._itemWindow.activate();

                return;
            }

            // Poké Balls
            if (
                item.battleOnly
            ) {

                SoundManager.playBuzzer();

                this._helpWindow.setText(
                    item.name +
                    ' solo puede usarse durante un combate o una captura.'
                );

                this._itemWindow.activate();

                return;
            }

            // Medallas: solo coleccionables
            if (
                item.category ===
                GM.BagCategory.MEDAL
            ) {

                SoundManager.playCursor();

                this._helpWindow.setText(
                    item.description
                );

                this._itemWindow.activate();

                return;
            }

            if (
                !item.effect
            ) {

                SoundManager.playBuzzer();

                this._helpWindow.setText(
                    'Este objeto no puede utilizarse directamente.'
                );

                this._itemWindow.activate();

                return;
            }

            var party =
                $gameSystem
                    ._granadaMonParty ||
                [];

            if (
                !party.length
            ) {

                SoundManager.playBuzzer();

                this._helpWindow.setText(
                    'No tienes ningún Pokémon en el equipo.'
                );

                this._itemWindow.activate();

                return;
            }

            this._selectedBagItem =
                item;

            this._pokemonWindow.refresh();

            this._pokemonWindow.show();

            this._pokemonWindow.activate();

            this._pokemonWindow.select(0);

            this._pokemonWindow.redrawGranadaPokemon();

            this._itemWindow.deactivate();

            this._itemWindow.redrawGranadaList();
        };

    // =========================================================
    // CANCELAR POKÉMON
    // =========================================================

    Scene_GranadaMonBag.prototype.onPokemonCancel =
        function() {

            this._pokemonWindow.hide();

            this._pokemonWindow.deactivate();

            this._pokemonWindow.deselect();

            this._selectedBagItem =
                null;

            this._itemWindow.activate();

            this._itemWindow.redrawGranadaList();
        };

    // =========================================================
    // USAR EN POKÉMON
    // =========================================================

    Scene_GranadaMonBag.prototype.onPokemonOk =
        function() {

            var pokemon =
                this._pokemonWindow.pokemon();

            var item =
                this._selectedBagItem;

            if (
                !pokemon ||
                !item
            ) {

                SoundManager.playBuzzer();

                this._pokemonWindow.activate();

                return;
            }

            var result =
                GM.useBagItemOnPokemon(
                    item.key,
                    pokemon
                );

            if (
                !result.success
            ) {

                SoundManager.playBuzzer();

                this._helpWindow.setText(
                    result.message
                );

                this._pokemonWindow.activate();

                return;
            }

            SoundManager.playOk();

            this._helpWindow.setText(
                result.message
            );

            this._pokemonWindow.hide();

            this._pokemonWindow.deactivate();

            this._pokemonWindow.deselect();

            this._selectedBagItem =
                null;

            this._itemWindow.refresh();

            this._itemWindow.activate();

            this._itemWindow.select(0);

            this._itemWindow.redrawGranadaList();

            this._itemWindow.callUpdateHelp();
        };

    // =========================================================
    // MENÚ -> MOCHILA
    // =========================================================

    Scene_Menu.prototype.commandItem =
        function() {

            SceneManager.push(
                Scene_GranadaMonBag
            );
        };

    // =========================================================
    // KIT INICIAL AUTOMÁTICO - NUEVA PARTIDA
    // =========================================================

    GM.Bag.STARTER_KIT = {
        POKE_BALL: 15,
        POTION: 3,
        REVIVE: 1,
        CANDY: 1
    };

    GM.Bag.giveStarterKit =
        function() {

            var kit =
                GM.Bag.STARTER_KIT;

            for (
                var key in kit
            ) {

                if (
                    Object.prototype.hasOwnProperty.call(
                        kit,
                        key
                    )
                ) {

                    GM.gainItem(
                        key,
                        kit[key]
                    );
                }
            }
        };

    var _GM_Bag_DataManager_setupNewGame =
        DataManager.setupNewGame;

    DataManager.setupNewGame =
        function() {

            _GM_Bag_DataManager_setupNewGame.call(
                this
            );

            GM.Bag.ensureData();
            GM.Bag.giveStarterKit();
        };

    // =========================================================
    // CARGAR PARTIDA
    // =========================================================

    var _DataManager_extractSaveContents =
        DataManager.extractSaveContents;

    DataManager.extractSaveContents =
        function(contents) {

            _DataManager_extractSaveContents.call(
                this,
                contents
            );

            GM.Bag.ensureData();
        };

    // =========================================================
    // COMANDOS
    // =========================================================

    var _Game_Interpreter_pluginCommand =
        Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand =
        function(
            command,
            args
        ) {

            _Game_Interpreter_pluginCommand.call(
                this,
                command,
                args
            );

            if (
                command ===
                'GranadaMonGiveItem'
            ) {

                var key =
                    String(
                        args[0] || ''
                    ).toUpperCase();

                var amount =
                    Number(
                        args[1] || 1
                    );

                if (
                    GM.gainItem(
                        key,
                        amount
                    )
                ) {

                    var item =
                        GM.getItem(
                            key
                        );

                    if (
                        item
                    ) {

                        $gameMessage.add(
                            'Has recibido ' +
                            item.name +
                            ' x' +
                            amount +
                            '.'
                        );
                    }
                }
            }

            if (
                command ===
                'GranadaMonRemoveItem'
            ) {

                GM.loseItem(
                    String(
                        args[0] || ''
                    ).toUpperCase(),
                    Number(
                        args[1] || 1
                    )
                );
            }

            if (
                command ===
                'GranadaMonUseItem'
            ) {

                var useKey =
                    String(
                        args[0] || ''
                    ).toUpperCase();

                var slot =
                    Number(
                        args[1] || 1
                    ) -
                    1;

                var party =
                    $gameSystem
                        ._granadaMonParty ||
                    [];

                var pokemon =
                    party[
                        slot
                    ];

                if (
                    !pokemon
                ) {

                    $gameMessage.add(
                        'No hay ningún Pokémon en ese hueco.'
                    );

                    return;
                }

                var result =
                    GM.useBagItemOnPokemon(
                        useKey,
                        pokemon
                    );

                $gameMessage.add(
                    result.message
                );
            }
        };

    // =========================================================
    // PÚBLICO
    // =========================================================

    window.Scene_GranadaMonBag =
        Scene_GranadaMonBag;

    console.log(
        'GranadaMon Bag v1.9 cargado correctamente: kit inicial automático activo.'
    );

})();