/*:
 * @plugindesc v6.0 GranadaMon - Animaciones de combate cinematográficas y simples
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleAnimations.js
 * ------------------------------------------------------------
 * SUSTITUYE por completo a la versión anterior.
 *
 * REQUIERE:
 * - GranadaMon_Battle
 * - GranadaMon_BattleSprites
 *
 * COLOCAR después de GranadaMon_BattleEffects.
 *
 * No cambia daño, PP, estados, turnos ni captura.
 * SOLO controla la presentación visual de los movimientos.
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    if (typeof Scene_GranadaMonBattle === 'undefined') {
        throw new Error(
            'GranadaMon_BattleAnimations necesita GranadaMon_Battle.js'
        );
    }

    GM.BattleAnimations =
        GM.BattleAnimations || {};

    var BA =
        GM.BattleAnimations;

    BA.version = '6.0';

    // =========================================================
    // UTILIDADES
    // =========================================================

    BA.clamp = function(v, min, max) {
        return Math.max(
            min,
            Math.min(
                max,
                Number(v || 0)
            )
        );
    };

    BA.lerp = function(a, b, t) {
        return a +
            (b - a) *
            t;
    };

    BA.easeOut = function(t) {
        t =
            BA.clamp(
                t,
                0,
                1
            );

        return 1 -
            Math.pow(
                1 -
                t,
                3
            );
    };

    BA.easeInOut = function(t) {
        t =
            BA.clamp(
                t,
                0,
                1
            );

        return t < 0.5
            ? 4 *
              t *
              t *
              t
            : 1 -
              Math.pow(
                  -2 *
                  t +
                  2,
                  3
              ) /
              2;
    };

    BA.sprite = function(scene, pokemon) {
        if (
            !scene ||
            !pokemon
        ) {
            return null;
        }

        if (
            GM.Battle &&
            pokemon ===
            GM.Battle.playerPokemon
        ) {
            return (
                scene._playerPokemonSprite ||
                scene._playerSprite ||
                null
            );
        }

        if (
            GM.Battle &&
            pokemon ===
            GM.Battle.enemy
        ) {
            return (
                scene._enemyPokemonSprite ||
                scene._enemySprite ||
                null
            );
        }

        return null;
    };

    BA.position = function(scene, pokemon) {
        var sprite =
            BA.sprite(
                scene,
                pokemon
            );

        if (!sprite) {
            return {
                x:
                    Graphics.boxWidth /
                    2,

                y:
                    Graphics.boxHeight /
                    2
            };
        }

        return {
            x:
                Number(
                    sprite.x || 0
                ),

            y:
                Number(
                    sprite.y || 0
                )
        };
    };

    BA.layer = function(scene) {
        if (
            !scene._gmBattleAnimationLayer
        ) {
            scene._gmBattleAnimationLayer =
                new Sprite();

            scene.addChild(
                scene._gmBattleAnimationLayer
            );
        }

        return scene._gmBattleAnimationLayer;
    };

    BA.remove = function(object) {
        if (
            object &&
            object.parent
        ) {
            object.parent.removeChild(
                object
            );
        }
    };

    BA.typeColor = function(type) {
        type =
            String(
                type || 'NORMAL'
            ).toUpperCase();

        var colors = {
            NORMAL: '#f4f0df',
            FUEGO: '#ff6a30',
            AGUA: '#4cc5ff',
            PLANTA: '#61d368',
            ELECTRICO: '#ffe143',
            PSIQUICO: '#da67ff',
            HIELO: '#9beeff',
            ROCA: '#baa276',
            TIERRA: '#d69b58',
            VENENO: '#b15bd0',
            FANTASMA: '#7662c7',
            LUCHA: '#df5d4e',
            ACERO: '#cbd4db',
            VOLADOR: '#a8c4ff',
            BICHO: '#a9cb3d',
            DRAGON: '#7864ff',
            SINIESTRO: '#56505e',
            HADA: '#ff9fd0'
        };

        return (
            colors[type] ||
            colors.NORMAL
        );
    };

    BA.category = function(move) {
        var c =
            String(
                move &&
                move.category ||
                ''
            ).toUpperCase();

        if (
            c === 'PHYSICAL' ||
            c === 'FISICO' ||
            c === 'FÍSICO'
        ) {
            return 'PHYSICAL';
        }

        if (
            c === 'STATUS' ||
            c === 'ESTADO'
        ) {
            return 'STATUS';
        }

        if (
            c === 'SPECIAL' ||
            c === 'ESPECIAL'
        ) {
            return 'SPECIAL';
        }

        return Number(
            move &&
            move.power ||
            0
        ) > 0
            ? 'SPECIAL'
            : 'STATUS';
    };

    // =========================================================
    // EFECTOS
    // =========================================================

    BA.makeOrb = function(color, size) {
        size =
            Number(
                size || 52
            );

        var b =
            new Bitmap(
                size,
                size
            );

        var c =
            size / 2;

        b.drawCircle(
            c,
            c,
            c - 2,
            color
        );

        b.drawCircle(
            c -
            size *
            0.13,
            c -
            size *
            0.13,
            size *
            0.18,
            'rgba(255,255,255,0.82)'
        );

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;
        s.anchor.y = 0.5;

        return s;
    };

    BA.makeRing = function(
        color,
        size,
        thickness
    ) {
        size =
            Number(
                size || 130
            );

        thickness =
            Number(
                thickness || 7
            );

        var b =
            new Bitmap(
                size,
                size
            );

        var ctx =
            b._context;

        ctx.save();

        ctx.strokeStyle =
            color;

        ctx.lineWidth =
            thickness;

        ctx.globalAlpha =
            0.95;

        ctx.beginPath();

        ctx.arc(
            size / 2,
            size / 2,
            size / 2 -
            thickness,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;
        s.anchor.y = 0.5;

        return s;
    };

    BA.makeSlash = function(color) {
        var b =
            new Bitmap(
                150,
                110
            );

        var ctx =
            b._context;

        ctx.save();

        ctx.strokeStyle =
            color;

        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.95;

        for (
            var i = 0;
            i < 3;
            i++
        ) {
            ctx.beginPath();

            ctx.moveTo(
                30 +
                i *
                22,
                88
            );

            ctx.lineTo(
                82 +
                i *
                22,
                20
            );

            ctx.stroke();
        }

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;
        s.anchor.y = 0.5;

        return s;
    };

    BA.makeBurst = function(color) {
        var b =
            new Bitmap(
                180,
                180
            );

        var ctx =
            b._context;

        var c = 90;

        ctx.save();

        ctx.strokeStyle =
            color;

        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.92;

        for (
            var i = 0;
            i < 12;
            i++
        ) {
            var angle =
                Math.PI *
                2 *
                i /
                12;

            ctx.beginPath();

            ctx.moveTo(
                c +
                Math.cos(angle) *
                25,
                c +
                Math.sin(angle) *
                25
            );

            ctx.lineTo(
                c +
                Math.cos(angle) *
                74,
                c +
                Math.sin(angle) *
                74
            );

            ctx.stroke();
        }

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;
        s.anchor.y = 0.5;

        return s;
    };

    BA.makeLightning = function(
        scene,
        from,
        to,
        color
    ) {
        var b =
            new Bitmap(
                Graphics.boxWidth,
                Graphics.boxHeight
            );

        var ctx =
            b._context;

        ctx.save();

        ctx.strokeStyle =
            color;

        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;

        ctx.beginPath();

        ctx.moveTo(
            from.x,
            from.y -
            20
        );

        var segments = 7;

        for (
            var i = 1;
            i < segments;
            i++
        ) {
            var t =
                i /
                segments;

            var x =
                BA.lerp(
                    from.x,
                    to.x,
                    t
                ) +
                (
                    Math.random() -
                    0.5
                ) *
                52;

            var y =
                BA.lerp(
                    from.y -
                    20,
                    to.y -
                    30,
                    t
                ) +
                (
                    Math.random() -
                    0.5
                ) *
                35;

            ctx.lineTo(
                x,
                y
            );
        }

        ctx.lineTo(
            to.x,
            to.y -
            30
        );

        ctx.stroke();

        ctx.strokeStyle =
            '#ffffff';

        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.88;

        ctx.stroke();

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        BA.layer(scene).addChild(
            s
        );

        return s;
    };

    BA.makeMoveBanner = function(scene, move) {
        if (!move) return null;

        var b =
            new Bitmap(
                360,
                54
            );

        var ctx =
            b._context;

        ctx.save();

        ctx.fillStyle =
            'rgba(23,38,32,0.87)';

        ctx.strokeStyle =
            BA.typeColor(
                move.type
            );

        ctx.lineWidth = 3;

        var x = 2;
        var y = 2;
        var w = 356;
        var h = 50;
        var r = 18;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        b._setDirty();

        b.fontSize = 23;
        b.fontBold = true;
        b.textColor = '#ffffff';
        b.outlineColor =
            'rgba(0,0,0,0.65)';
        b.outlineWidth = 3;

        b.drawText(
            move.name,
            10,
            4,
            340,
            44,
            'center'
        );

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;

        s.x =
            Graphics.boxWidth /
            2;

        s.y = 120;
        s.alpha = 0;

        BA.layer(scene).addChild(
            s
        );

        return s;
    };

    // =========================================================
    // SPRITES
    // =========================================================

    BA.setBlend = function(sprite, rgba) {
        if (
            sprite &&
            sprite.setBlendColor
        ) {
            sprite.setBlendColor(
                rgba
            );
        }
    };

    BA.restore = function(sprite, base) {
        if (
            !sprite ||
            !base
        ) {
            return;
        }

        sprite.x = base.x;
        sprite.y = base.y;
        sprite.scale.x = base.sx;
        sprite.scale.y = base.sy;
        sprite.rotation = base.rotation;
        sprite.alpha = base.alpha;

        BA.setBlend(
            sprite,
            [0, 0, 0, 0]
        );
    };

    BA.snapshot = function(sprite) {
        return {
            x:
                sprite
                    ? Number(sprite.x || 0)
                    : 0,

            y:
                sprite
                    ? Number(sprite.y || 0)
                    : 0,

            sx:
                sprite
                    ? Number(sprite.scale.x || 1)
                    : 1,

            sy:
                sprite
                    ? Number(sprite.scale.y || 1)
                    : 1,

            rotation:
                sprite
                    ? Number(sprite.rotation || 0)
                    : 0,

            alpha:
                sprite
                    ? Number(
                        sprite.alpha == null
                            ? 1
                            : sprite.alpha
                    )
                    : 1
        };
    };

    // =========================================================
    // PARTÍCULAS
    // =========================================================

    BA.makeParticle = function(color, size) {
        size =
            Number(
                size || 12
            );

        var b =
            new Bitmap(
                size,
                size
            );

        var ctx =
            b._context;

        ctx.save();

        ctx.fillStyle =
            color;

        ctx.shadowColor =
            color;

        ctx.shadowBlur =
            Math.max(
                2,
                size *
                0.45
            );

        ctx.beginPath();

        ctx.arc(
            size / 2,
            size / 2,
            Math.max(
                2,
                size *
                0.30
            ),
            0,
            Math.PI *
            2
        );

        ctx.fill();

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;
        s.anchor.y = 0.5;

        return s;
    };

    BA.spawnParticles = function(
        scene,
        x,
        y,
        color,
        count,
        speed,
        gravity
    ) {
        var list = [];

        count =
            Number(
                count || 10
            );

        speed =
            Number(
                speed || 4.5
            );

        gravity =
            Number(
                gravity == null
                    ? 0.10
                    : gravity
            );

        for (
            var i = 0;
            i < count;
            i++
        ) {
            var p =
                BA.makeParticle(
                    i % 4 === 0
                        ? '#ffffff'
                        : color,
                    8 +
                    Math.floor(
                        Math.random() *
                        8
                    )
                );

            var angle =
                Math.PI *
                2 *
                Math.random();

            var magnitude =
                speed *
                (
                    0.45 +
                    Math.random() *
                    0.85
                );

            p.x =
                x +
                (
                    Math.random() -
                    0.5
                ) *
                16;

            p.y =
                y +
                (
                    Math.random() -
                    0.5
                ) *
                12;

            p._vx =
                Math.cos(angle) *
                magnitude;

            p._vy =
                Math.sin(angle) *
                magnitude -
                1.4;

            p._gravity =
                gravity;

            p._life =
                18 +
                Math.floor(
                    Math.random() *
                    16
                );

            p._maxLife =
                p._life;

            p._rot =
                (
                    Math.random() -
                    0.5
                ) *
                0.26;

            p.scale.x =
                0.65 +
                Math.random() *
                0.55;

            p.scale.y =
                p.scale.x;

            BA.layer(scene).addChild(
                p
            );

            list.push(p);
        }

        return list;
    };

    BA.updateParticles = function(list) {
        if (!list) return;

        for (
            var i = list.length - 1;
            i >= 0;
            i--
        ) {
            var p =
                list[i];

            p._life--;

            p.x += p._vx;
            p.y += p._vy;

            p._vy += p._gravity;

            p.rotation += p._rot;

            p.alpha =
                Math.max(
                    0,
                    p._life /
                    p._maxLife
                );

            p.scale.x *= 0.985;
            p.scale.y *= 0.985;

            if (
                p._life <=
                0
            ) {
                BA.remove(p);

                list.splice(
                    i,
                    1
                );
            }
        }
    };

    BA.makeImpactFlash = function(scene, color) {
        var b =
            new Bitmap(
                190,
                190
            );

        var ctx =
            b._context;

        ctx.save();

        var g =
            ctx.createRadialGradient(
                95,
                95,
                4,
                95,
                95,
                90
            );

        g.addColorStop(
            0,
            'rgba(255,255,255,0.95)'
        );

        g.addColorStop(
            0.28,
            color
        );

        g.addColorStop(
            1,
            'rgba(255,255,255,0)'
        );

        ctx.fillStyle = g;

        ctx.fillRect(
            0,
            0,
            190,
            190
        );

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        s.anchor.x = 0.5;
        s.anchor.y = 0.5;

        BA.layer(scene).addChild(
            s
        );

        return s;
    };

    BA.makeSpeedLines = function(
        scene,
        from,
        to,
        color
    ) {
        var b =
            new Bitmap(
                Graphics.boxWidth,
                Graphics.boxHeight
            );

        var ctx =
            b._context;

        var dx =
            to.x -
            from.x;

        var dy =
            to.y -
            from.y;

        var len =
            Math.sqrt(
                dx *
                dx +
                dy *
                dy
            ) ||
            1;

        var ux =
            dx /
            len;

        var uy =
            dy /
            len;

        ctx.save();

        ctx.strokeStyle =
            color;

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (
            var i = 0;
            i < 8;
            i++
        ) {
            var t =
                0.18 +
                Math.random() *
                0.46;

            var px =
                BA.lerp(
                    from.x,
                    to.x,
                    t
                ) +
                (
                    Math.random() -
                    0.5
                ) *
                80;

            var py =
                BA.lerp(
                    from.y,
                    to.y,
                    t
                ) +
                (
                    Math.random() -
                    0.5
                ) *
                60;

            var l =
                24 +
                Math.random() *
                42;

            ctx.globalAlpha =
                0.24 +
                Math.random() *
                0.44;

            ctx.beginPath();

            ctx.moveTo(
                px -
                ux *
                l,
                py -
                uy *
                l
            );

            ctx.lineTo(
                px +
                ux *
                5,
                py +
                uy *
                5
            );

            ctx.stroke();
        }

        ctx.restore();

        b._setDirty();

        var s =
            new Sprite(b);

        s.alpha = 0;

        BA.layer(scene).addChild(
            s
        );

        return s;
    };

    // =========================================================
    // HP VISUAL
    // =========================================================

    BA.startHpTween = function(
        scene,
        pokemon,
        fromHp,
        toHp,
        duration
    ) {
        if (
            !scene ||
            !pokemon
        ) {
            return;
        }

        fromHp =
            Number(
                fromHp || 0
            );

        toHp =
            Number(
                toHp || 0
            );

        duration =
            Math.max(
                1,
                Number(
                    duration || 18
                )
            );

        pokemon._gmVisualHpOverride =
            fromHp;

        scene._gmHpTweens =
            scene._gmHpTweens || [];

        for (
            var i =
                scene._gmHpTweens.length -
                1;
            i >= 0;
            i--
        ) {
            if (
                scene._gmHpTweens[i].pokemon ===
                pokemon
            ) {
                scene._gmHpTweens.splice(
                    i,
                    1
                );
            }
        }

        scene._gmHpTweens.push({
            pokemon: pokemon,
            from: fromHp,
            to: toHp,
            frame: 0,
            duration: duration
        });
    };

    BA.updateHpTweens = function(scene) {
        if (
            !scene ||
            !scene._gmHpTweens ||
            !scene._gmHpTweens.length
        ) {
            return;
        }

        for (
            var i =
                scene._gmHpTweens.length -
                1;
            i >= 0;
            i--
        ) {
            var t =
                scene._gmHpTweens[i];

            t.frame++;

            var p =
                BA.clamp(
                    t.frame /
                    t.duration,
                    0,
                    1
                );

            var eased =
                p < 0.5
                    ? 2 *
                      p *
                      p
                    : 1 -
                      Math.pow(
                          -2 *
                          p +
                          2,
                          2
                      ) /
                      2;

            t.pokemon._gmVisualHpOverride =
                BA.lerp(
                    t.from,
                    t.to,
                    eased
                );

            if (
                scene._enemyStatusWindow &&
                scene._enemyStatusWindow.refresh
            ) {
                scene._enemyStatusWindow.refresh();
            }

            if (
                scene._playerStatusWindow &&
                scene._playerStatusWindow.refresh
            ) {
                scene._playerStatusWindow.refresh();
            }

            if (
                p >=
                1
            ) {
                t.pokemon._gmVisualHpOverride =
                    t.to;

                delete t.pokemon._gmVisualHpOverride;

                scene._gmHpTweens.splice(
                    i,
                    1
                );
            }
        }
    };

    BA.clearStaleVisualHp = function(scene) {
        if (!scene) return;

        var tweens =
            scene._gmHpTweens || [];

        if (tweens.length) {
            return;
        }

        var player =
            GM.Battle
                ? GM.Battle.playerPokemon
                : null;

        var enemy =
            GM.Battle
                ? GM.Battle.enemy
                : null;

        if (
            player &&
            player._gmVisualHpOverride != null
        ) {
            delete player._gmVisualHpOverride;
        }

        if (
            enemy &&
            enemy._gmVisualHpOverride != null
        ) {
            delete enemy._gmVisualHpOverride;
        }
    };

    BA.beginDamageVisual = function(
        scene,
        meta,
        defender,
        duration
    ) {
        if (
            !meta ||
            meta._hpTweenStarted ||
            Number(meta.damage || 0) <=
            0
        ) {
            return;
        }

        meta._hpTweenStarted = true;

        BA.startHpTween(
            scene,
            defender,
            Number(meta.beforeHp || 0),
            Number(meta.afterHp || 0),
            duration || 18
        );
    };

    // =========================================================
    // FÍSICO
    // =========================================================

    BA.physicalAnimation = function(
        scene,
        attacker,
        defender,
        move,
        meta
    ) {
        var a =
            BA.sprite(
                scene,
                attacker
            );

        var d =
            BA.sprite(
                scene,
                defender
            );

        if (!a || !d) return null;

        var ab = BA.snapshot(a);
        var db = BA.snapshot(d);
        var color =
            BA.typeColor(move.type);

        var banner =
            BA.makeMoveBanner(
                scene,
                move
            );

        var slash = null;
        var burst = null;
        var flash = null;

        var lines =
            BA.makeSpeedLines(
                scene,
                {
                    x: ab.x,
                    y: ab.y
                },
                {
                    x: db.x,
                    y: db.y
                },
                color
            );

        var particles = [];
        var frame = 0;
        var total = 58;
        var hit =
            meta.hit !== false;

        var dx =
            db.x -
            ab.x;

        var dy =
            db.y -
            ab.y;

        var len =
            Math.sqrt(
                dx *
                dx +
                dy *
                dy
            ) ||
            1;

        var ux =
            dx /
            len;

        var uy =
            dy /
            len;

        return function() {
            frame++;

            BA.updateParticles(
                particles
            );

            if (banner) {
                banner.alpha =
                    Math.min(
                        1,
                        frame /
                        6
                    );

                if (
                    frame >
                    total -
                    8
                ) {
                    banner.alpha =
                        Math.max(
                            0,
                            (
                                total -
                                frame
                            ) /
                            8
                        );
                }
            }

            if (
                frame <=
                8
            ) {
                var pre =
                    BA.easeOut(
                        frame /
                        8
                    );

                a.x =
                    ab.x -
                    ux *
                    18 *
                    pre;

                a.y =
                    ab.y -
                    uy *
                    10 *
                    pre;

                a.scale.x =
                    ab.sx *
                    (
                        1 -
                        0.025 *
                        pre
                    );

                a.scale.y =
                    ab.sy *
                    (
                        1 +
                        0.025 *
                        pre
                    );
            }

            if (
                frame >=
                    9 &&
                frame <=
                    17
            ) {
                var rush =
                    BA.easeOut(
                        (
                            frame -
                            9
                        ) /
                        8
                    );

                a.x =
                    BA.lerp(
                        ab.x -
                        ux *
                        18,
                        db.x -
                        ux *
                        72,
                        rush
                    );

                a.y =
                    BA.lerp(
                        ab.y -
                        uy *
                        10,
                        db.y -
                        uy *
                        42,
                        rush
                    );

                a.scale.x =
                    ab.sx *
                    (
                        1 +
                        0.08 *
                        rush
                    );

                a.scale.y =
                    ab.sy *
                    (
                        1 +
                        0.08 *
                        rush
                    );

                if (lines) {
                    lines.alpha =
                        Math.min(
                            0.85,
                            lines.alpha +
                            0.18
                        );
                }
            }

            if (
                frame ===
                18
            ) {
                if (lines) {
                    lines.alpha = 0;
                }

                if (hit) {
                    BA.beginDamageVisual(
                        scene,
                        meta,
                        defender,
                        20
                    );

                    slash =
                        BA.makeSlash(
                            color
                        );

                    slash.x = db.x;
                    slash.y = db.y - 28;
                    slash.scale.x = 0.48;
                    slash.scale.y = 0.48;

                    BA.layer(scene).addChild(
                        slash
                    );

                    burst =
                        BA.makeBurst(
                            color
                        );

                    burst.x = db.x;
                    burst.y = db.y - 30;
                    burst.scale.x = 0.18;
                    burst.scale.y = 0.18;

                    BA.layer(scene).addChild(
                        burst
                    );

                    flash =
                        BA.makeImpactFlash(
                            scene,
                            color
                        );

                    flash.x = db.x;
                    flash.y = db.y - 30;
                    flash.scale.x = 0.35;
                    flash.scale.y = 0.35;

                    particles =
                        particles.concat(
                            BA.spawnParticles(
                                scene,
                                db.x,
                                db.y - 28,
                                color,
                                14,
                                5.4,
                                0.12
                            )
                        );

                    BA.setBlend(
                        d,
                        [
                            255,
                            255,
                            255,
                            210
                        ]
                    );
                }
            }

            if (
                frame >=
                    18 &&
                frame <=
                    34 &&
                hit
            ) {
                var q =
                    frame -
                    18;

                var fade =
                    Math.max(
                        0,
                        1 -
                        q /
                        16
                    );

                d.x =
                    db.x +
                    ux *
                    (
                        13 *
                        (
                            1 -
                            fade
                        )
                    ) +
                    Math.sin(
                        q *
                        2.8
                    ) *
                    7 *
                    fade;

                d.y =
                    db.y +
                    uy *
                    (
                        8 *
                        (
                            1 -
                            fade
                        )
                    );

                d.rotation =
                    Math.sin(
                        q *
                        2.1
                    ) *
                    0.018 *
                    fade;

                if (slash) {
                    slash.alpha = fade;
                    slash.scale.x += 0.06;
                    slash.scale.y += 0.06;
                }

                if (burst) {
                    burst.alpha = fade;
                    burst.scale.x += 0.07;
                    burst.scale.y += 0.07;
                }

                if (flash) {
                    flash.alpha =
                        Math.max(
                            0,
                            0.90 -
                            q *
                            0.09
                        );

                    flash.scale.x += 0.11;
                    flash.scale.y += 0.11;
                }
            }

            if (
                frame ===
                35
            ) {
                BA.restore(
                    d,
                    db
                );

                BA.setBlend(
                    d,
                    [0, 0, 0, 0]
                );

                BA.remove(slash);
                BA.remove(burst);
                BA.remove(flash);

                slash = null;
                burst = null;
                flash = null;
            }

            if (
                frame >=
                28
            ) {
                var back =
                    BA.easeInOut(
                        (
                            frame -
                            28
                        ) /
                        26
                    );

                a.x =
                    BA.lerp(
                        a.x,
                        ab.x,
                        back
                    );

                a.y =
                    BA.lerp(
                        a.y,
                        ab.y,
                        back
                    );

                a.scale.x =
                    BA.lerp(
                        a.scale.x,
                        ab.sx,
                        back
                    );

                a.scale.y =
                    BA.lerp(
                        a.scale.y,
                        ab.sy,
                        back
                    );
            }

            if (
                frame >=
                total
            ) {
                BA.restore(
                    a,
                    ab
                );

                BA.restore(
                    d,
                    db
                );

                BA.remove(slash);
                BA.remove(burst);
                BA.remove(flash);
                BA.remove(lines);

                for (
                    var i = 0;
                    i < particles.length;
                    i++
                ) {
                    BA.remove(
                        particles[i]
                    );
                }

                BA.remove(banner);

                return true;
            }

            return false;
        };
    };

    // =========================================================
    // ESPECIAL
    // =========================================================

    BA.projectileAnimation = function(
        scene,
        attacker,
        defender,
        move,
        meta
    ) {
        var a =
            BA.sprite(
                scene,
                attacker
            );

        var d =
            BA.sprite(
                scene,
                defender
            );

        if (!a || !d) return null;

        var ab = BA.snapshot(a);
        var db = BA.snapshot(d);

        var color =
            BA.typeColor(move.type);

        var banner =
            BA.makeMoveBanner(
                scene,
                move
            );

        var orb =
            BA.makeOrb(
                color,
                62
            );

        var chargeRing =
            BA.makeRing(
                color,
                118,
                5
            );

        var burst = null;
        var impactRing = null;
        var flash = null;
        var particles = [];

        var frame = 0;
        var total = 68;
        var hit =
            meta.hit !== false;

        orb.x = ab.x;
        orb.y = ab.y - 42;
        orb.scale.x = 0.10;
        orb.scale.y = 0.10;

        BA.layer(scene).addChild(
            orb
        );

        chargeRing.x = ab.x;
        chargeRing.y = ab.y - 40;
        chargeRing.scale.x = 0.22;
        chargeRing.scale.y = 0.22;
        chargeRing.alpha = 0;

        BA.layer(scene).addChild(
            chargeRing
        );

        return function() {
            frame++;

            BA.updateParticles(
                particles
            );

            if (banner) {
                banner.alpha =
                    Math.min(
                        1,
                        frame /
                        7
                    );

                if (
                    frame >
                    total -
                    9
                ) {
                    banner.alpha =
                        Math.max(
                            0,
                            (
                                total -
                                frame
                            ) /
                            9
                        );
                }
            }

            if (
                frame <=
                13
            ) {
                var charge =
                    BA.easeOut(
                        frame /
                        13
                    );

                orb.scale.x =
                    BA.lerp(
                        0.10,
                        0.82,
                        charge
                    );

                orb.scale.y =
                    orb.scale.x;

                chargeRing.alpha =
                    charge *
                    0.75;

                chargeRing.scale.x =
                    BA.lerp(
                        0.22,
                        0.92,
                        charge
                    );

                chargeRing.scale.y =
                    chargeRing.scale.x;

                chargeRing.rotation += 0.06;

                a.scale.x =
                    ab.sx *
                    (
                        1 +
                        0.035 *
                        charge
                    );

                a.scale.y =
                    ab.sy *
                    (
                        1 +
                        0.035 *
                        charge
                    );
            }

            if (
                frame >=
                    14 &&
                frame <=
                    39
            ) {
                var t =
                    BA.easeInOut(
                        (
                            frame -
                            14
                        ) /
                        25
                    );

                orb.x =
                    BA.lerp(
                        ab.x,
                        db.x,
                        t
                    );

                orb.y =
                    BA.lerp(
                        ab.y -
                        42,
                        db.y -
                        34,
                        t
                    ) -
                    Math.sin(
                        t *
                        Math.PI
                    ) *
                    66;

                orb.rotation += 0.22;

                orb.scale.x =
                    0.82 +
                    Math.sin(
                        frame *
                        0.75
                    ) *
                    0.08;

                orb.scale.y =
                    orb.scale.x;

                chargeRing.alpha =
                    Math.max(
                        0,
                        chargeRing.alpha -
                        0.08
                    );

                if (
                    frame %
                    2 ===
                    0
                ) {
                    particles =
                        particles.concat(
                            BA.spawnParticles(
                                scene,
                                orb.x,
                                orb.y,
                                color,
                                2,
                                1.5,
                                -0.01
                            )
                        );
                }
            }

            if (
                frame ===
                40
            ) {
                BA.remove(orb);
                orb = null;

                if (hit) {
                    BA.beginDamageVisual(
                        scene,
                        meta,
                        defender,
                        22
                    );

                    burst =
                        BA.makeBurst(
                            color
                        );

                    burst.x = db.x;
                    burst.y = db.y - 32;
                    burst.scale.x = 0.15;
                    burst.scale.y = 0.15;

                    BA.layer(scene).addChild(
                        burst
                    );

                    impactRing =
                        BA.makeRing(
                            color,
                            140,
                            7
                        );

                    impactRing.x = db.x;
                    impactRing.y = db.y - 32;
                    impactRing.scale.x = 0.18;
                    impactRing.scale.y = 0.18;

                    BA.layer(scene).addChild(
                        impactRing
                    );

                    flash =
                        BA.makeImpactFlash(
                            scene,
                            color
                        );

                    flash.x = db.x;
                    flash.y = db.y - 32;
                    flash.scale.x = 0.32;
                    flash.scale.y = 0.32;

                    particles =
                        particles.concat(
                            BA.spawnParticles(
                                scene,
                                db.x,
                                db.y - 32,
                                color,
                                18,
                                5.7,
                                0.08
                            )
                        );

                    BA.setBlend(
                        d,
                        [
                            255,
                            255,
                            255,
                            220
                        ]
                    );
                }
            }

            if (
                frame >=
                    40 &&
                frame <=
                    56 &&
                hit
            ) {
                var impact =
                    frame -
                    40;

                var f =
                    Math.max(
                        0,
                        1 -
                        impact /
                        16
                    );

                d.x =
                    db.x +
                    Math.sin(
                        impact *
                        2.9
                    ) *
                    8 *
                    f;

                d.rotation =
                    Math.sin(
                        impact *
                        2.4
                    ) *
                    0.022 *
                    f;

                if (burst) {
                    burst.scale.x += 0.09;
                    burst.scale.y += 0.09;
                    burst.alpha = f;
                }

                if (impactRing) {
                    impactRing.scale.x += 0.075;
                    impactRing.scale.y += 0.075;
                    impactRing.alpha = f;
                }

                if (flash) {
                    flash.scale.x += 0.10;
                    flash.scale.y += 0.10;

                    flash.alpha =
                        Math.max(
                            0,
                            0.9 -
                            impact *
                            0.075
                        );
                }
            }

            if (
                frame ===
                57
            ) {
                BA.restore(
                    d,
                    db
                );

                BA.setBlend(
                    d,
                    [0, 0, 0, 0]
                );
            }

            if (
                frame >
                43
            ) {
                a.scale.x +=
                    (
                        ab.sx -
                        a.scale.x
                    ) *
                    0.16;

                a.scale.y +=
                    (
                        ab.sy -
                        a.scale.y
                    ) *
                    0.16;
            }

            if (
                frame >=
                total
            ) {
                BA.restore(a, ab);
                BA.restore(d, db);

                BA.remove(orb);
                BA.remove(chargeRing);
                BA.remove(burst);
                BA.remove(impactRing);
                BA.remove(flash);

                for (
                    var i = 0;
                    i < particles.length;
                    i++
                ) {
                    BA.remove(
                        particles[i]
                    );
                }

                BA.remove(banner);

                return true;
            }

            return false;
        };
    };

    // =========================================================
    // ELÉCTRICO
    // =========================================================

    BA.electricAnimation = function(
        scene,
        attacker,
        defender,
        move,
        meta
    ) {
        var a =
            BA.sprite(
                scene,
                attacker
            );

        var d =
            BA.sprite(
                scene,
                defender
            );

        if (!a || !d) return null;

        var ab = BA.snapshot(a);
        var db = BA.snapshot(d);

        var banner =
            BA.makeMoveBanner(
                scene,
                move
            );

        var bolts = [];
        var sparks = [];

        var ring =
            BA.makeRing(
                '#ffe143',
                132,
                7
            );

        var impactRing = null;
        var flash = null;
        var frame = 0;
        var total = 60;

        var hit =
            meta.hit !== false;

        ring.x = ab.x;
        ring.y = ab.y - 25;
        ring.scale.x = 0.18;
        ring.scale.y = 0.18;
        ring.alpha = 0;

        BA.layer(scene).addChild(
            ring
        );

        return function() {
            frame++;

            BA.updateParticles(
                sparks
            );

            if (banner) {
                banner.alpha =
                    Math.min(
                        1,
                        frame /
                        6
                    );

                if (
                    frame >
                    total -
                    8
                ) {
                    banner.alpha =
                        Math.max(
                            0,
                            (
                                total -
                                frame
                            ) /
                            8
                        );
                }
            }

            if (
                frame <=
                12
            ) {
                var c =
                    BA.easeOut(
                        frame /
                        12
                    );

                ring.alpha = c;

                ring.scale.x =
                    BA.lerp(
                        0.18,
                        1.02,
                        c
                    );

                ring.scale.y =
                    ring.scale.x;

                ring.rotation += 0.09;

                a.scale.x =
                    ab.sx *
                    (
                        1 +
                        0.045 *
                        Math.sin(
                            frame *
                            1.5
                        )
                    );

                a.scale.y =
                    ab.sy *
                    (
                        1 +
                        0.045 *
                        Math.sin(
                            frame *
                            1.5
                        )
                    );
            }

            if (
                hit &&
                (
                    frame === 14 ||
                    frame === 18 ||
                    frame === 22 ||
                    frame === 27
                )
            ) {
                if (
                    frame ===
                    14
                ) {
                    BA.beginDamageVisual(
                        scene,
                        meta,
                        defender,
                        24
                    );
                }

                var bolt =
                    BA.makeLightning(
                        scene,
                        {
                            x: ab.x,
                            y: ab.y - 25
                        },
                        {
                            x: db.x,
                            y: db.y
                        },
                        frame % 2
                            ? '#ffffff'
                            : '#ffe143'
                    );

                bolt._life = 6;

                bolts.push(
                    bolt
                );

                sparks =
                    sparks.concat(
                        BA.spawnParticles(
                            scene,
                            db.x,
                            db.y - 30,
                            '#ffe143',
                            7,
                            4.2,
                            0.03
                        )
                    );

                BA.setBlend(
                    d,
                    [
                        255,
                        245,
                        90,
                        215
                    ]
                );

                if (!impactRing) {
                    impactRing =
                        BA.makeRing(
                            '#ffe143',
                            130,
                            6
                        );

                    impactRing.x = db.x;
                    impactRing.y = db.y - 30;
                    impactRing.scale.x = 0.24;
                    impactRing.scale.y = 0.24;

                    BA.layer(scene).addChild(
                        impactRing
                    );

                    flash =
                        BA.makeImpactFlash(
                            scene,
                            '#ffe143'
                        );

                    flash.x = db.x;
                    flash.y = db.y - 30;
                    flash.scale.x = 0.30;
                    flash.scale.y = 0.30;
                }
            }

            for (
                var i =
                    bolts.length -
                    1;
                i >= 0;
                i--
            ) {
                bolts[i]._life--;

                bolts[i].alpha =
                    Math.max(
                        0,
                        bolts[i]._life /
                        6
                    );

                if (
                    bolts[i]._life <=
                    0
                ) {
                    BA.remove(
                        bolts[i]
                    );

                    bolts.splice(
                        i,
                        1
                    );
                }
            }

            if (
                frame >=
                    14 &&
                frame <=
                    36 &&
                hit
            ) {
                var z =
                    frame -
                    14;

                var fade =
                    Math.max(
                        0.2,
                        1 -
                        z /
                        26
                    );

                d.x =
                    db.x +
                    Math.sin(
                        frame *
                        3.7
                    ) *
                    7 *
                    fade;

                d.y =
                    db.y +
                    Math.sin(
                        frame *
                        2.4
                    ) *
                    2;

                d.rotation =
                    Math.sin(
                        frame *
                        2.8
                    ) *
                    0.03 *
                    fade;

                if (impactRing) {
                    impactRing.scale.x += 0.035;
                    impactRing.scale.y += 0.035;

                    impactRing.alpha =
                        Math.max(
                            0,
                            1 -
                            z /
                            24
                        );
                }

                if (flash) {
                    flash.scale.x += 0.055;
                    flash.scale.y += 0.055;

                    flash.alpha =
                        Math.max(
                            0,
                            0.82 -
                            z *
                            0.035
                        );
                }
            }

            if (
                frame ===
                37
            ) {
                BA.restore(
                    d,
                    db
                );

                BA.setBlend(
                    d,
                    [0, 0, 0, 0]
                );
            }

            if (
                frame >
                31
            ) {
                ring.alpha -= 0.055;
            }

            if (
                frame >=
                total
            ) {
                BA.restore(a, ab);
                BA.restore(d, db);

                for (
                    var j = 0;
                    j < bolts.length;
                    j++
                ) {
                    BA.remove(
                        bolts[j]
                    );
                }

                for (
                    var k = 0;
                    k < sparks.length;
                    k++
                ) {
                    BA.remove(
                        sparks[k]
                    );
                }

                BA.remove(ring);
                BA.remove(impactRing);
                BA.remove(flash);
                BA.remove(banner);

                return true;
            }

            return false;
        };
    };

    // =========================================================
    // ESTADO
    // =========================================================

    BA.statusAnimation = function(
        scene,
        attacker,
        defender,
        move
    ) {
        var target =
            BA.sprite(
                scene,
                defender
            ) ||
            BA.sprite(
                scene,
                attacker
            );

        if (!target) return null;

        var tb =
            BA.snapshot(target);

        var color =
            BA.typeColor(move.type);

        var banner =
            BA.makeMoveBanner(
                scene,
                move
            );

        var rings = [];
        var motes = [];
        var frame = 0;
        var total = 58;

        return function() {
            frame++;

            BA.updateParticles(
                motes
            );

            if (banner) {
                banner.alpha =
                    Math.min(
                        1,
                        frame /
                        6
                    );

                if (
                    frame >
                    total -
                    8
                ) {
                    banner.alpha =
                        Math.max(
                            0,
                            (
                                total -
                                frame
                            ) /
                            8
                        );
                }
            }

            if (
                frame === 6 ||
                frame === 15 ||
                frame === 24
            ) {
                var r =
                    BA.makeRing(
                        color,
                        132,
                        5
                    );

                r.x = tb.x;
                r.y = tb.y - 25;
                r.scale.x = 0.26;
                r.scale.y = 0.26;
                r.alpha = 0.92;
                r._life = 28;

                rings.push(r);

                BA.layer(scene).addChild(
                    r
                );

                motes =
                    motes.concat(
                        BA.spawnParticles(
                            scene,
                            tb.x,
                            tb.y - 12,
                            color,
                            6,
                            1.7,
                            -0.055
                        )
                    );
            }

            for (
                var i =
                    rings.length -
                    1;
                i >= 0;
                i--
            ) {
                var ring =
                    rings[i];

                ring._life--;

                ring.scale.x += 0.038;
                ring.scale.y += 0.038;
                ring.rotation += 0.025;

                ring.alpha =
                    Math.max(
                        0,
                        ring._life /
                        28
                    );

                if (
                    ring._life <=
                    0
                ) {
                    BA.remove(ring);

                    rings.splice(
                        i,
                        1
                    );
                }
            }

            if (
                frame <=
                38
            ) {
                target.y =
                    tb.y +
                    Math.sin(
                        frame *
                        0.42
                    ) *
                    4;

                target.scale.x =
                    tb.sx *
                    (
                        1 +
                        Math.sin(
                            frame *
                            0.30
                        ) *
                        0.018
                    );

                target.scale.y =
                    tb.sy *
                    (
                        1 +
                        Math.sin(
                            frame *
                            0.30
                        ) *
                        0.018
                    );

                BA.setBlend(
                    target,
                    [
                        255,
                        255,
                        255,
                        Math.floor(
                            40 +
                            Math.sin(
                                frame *
                                0.62
                            ) *
                            30
                        )
                    ]
                );
            }

            if (
                frame >=
                total
            ) {
                BA.restore(
                    target,
                    tb
                );

                for (
                    var j = 0;
                    j < rings.length;
                    j++
                ) {
                    BA.remove(
                        rings[j]
                    );
                }

                for (
                    var k = 0;
                    k < motes.length;
                    k++
                ) {
                    BA.remove(
                        motes[k]
                    );
                }

                BA.remove(banner);

                return true;
            }

            return false;
        };
    };

    // =========================================================
    // SELECCIÓN
    // =========================================================

    BA.createAnimation = function(
        scene,
        attacker,
        defender,
        move,
        meta
    ) {
        if (
            !scene ||
            !attacker ||
            !defender ||
            !move
        ) {
            return null;
        }

        var type =
            String(
                move.type || 'NORMAL'
            ).toUpperCase();

        var category =
            BA.category(move);

        if (
            category ===
            'STATUS'
        ) {
            return BA.statusAnimation(
                scene,
                attacker,
                defender,
                move,
                meta
            );
        }

        if (
            type ===
            'ELECTRICO'
        ) {
            return BA.electricAnimation(
                scene,
                attacker,
                defender,
                move,
                meta
            );
        }

        if (
            category ===
            'PHYSICAL'
        ) {
            return BA.physicalAnimation(
                scene,
                attacker,
                defender,
                move,
                meta
            );
        }

        return BA.projectileAnimation(
            scene,
            attacker,
            defender,
            move,
            meta
        );
    };

    // =========================================================
    // COLA
    // =========================================================

    BA.addAnimation = function(
        scene,
        animation
    ) {
        if (
            !scene ||
            !animation
        ) {
            return;
        }

        scene._gmAnimationQueue =
            scene._gmAnimationQueue || [];

        scene._gmAnimationQueue.push(
            animation
        );
    };

    BA.enqueue =
        BA.addAnimation;

    BA.isBusy = function(scene) {
        return !!(
            scene &&
            scene._gmAnimationQueue &&
            scene._gmAnimationQueue.length
        );
    };

    BA.update = function(scene) {
        if (!scene) return;

        if (
            BA.updateHpTweens
        ) {
            BA.updateHpTweens(scene);
        }

        var queue =
            scene._gmAnimationQueue || [];

        if (!queue.length) {
            if (
                BA.clearStaleVisualHp
            ) {
                BA.clearStaleVisualHp(
                    scene
                );
            }

            if (
                scene._gmAnimationsLocked
            ) {
                scene._gmAnimationsLocked =
                    false;

                if (
                    scene._commandWindow &&
                    scene._commandWindow.visible &&
                    !scene._battleEnded &&
                    !(
                        scene._moveWindow &&
                        scene._moveWindow.visible
                    ) &&
                    !(
                        scene._gmBallWindow &&
                        scene._gmBallWindow.visible
                    ) &&
                    !(
                        scene._gmBattlePartyWindow &&
                        scene._gmBattlePartyWindow.visible
                    )
                ) {
                    scene._commandWindow.activate();
                }
            }

            return;
        }

        scene._gmAnimationsLocked =
            true;

        if (scene._commandWindow) {
            scene._commandWindow.deactivate();
        }

        if (scene._moveWindow) {
            scene._moveWindow.deactivate();
        }

        var current =
            queue[0];

        var finished =
            false;

        try {
            finished =
                current();
        } catch (error) {
            console.error(
                'GranadaMon BattleAnimations v6:',
                error
            );

            finished = true;
        }

        if (finished) {
            queue.shift();

            if (
                scene._enemyStatusWindow &&
                scene._enemyStatusWindow.refresh
            ) {
                scene._enemyStatusWindow.refresh();
            }

            if (
                scene._playerStatusWindow &&
                scene._playerStatusWindow.refresh
            ) {
                scene._playerStatusWindow.refresh();
            }
        }
    };

    // =========================================================
    // UPDATE
    // =========================================================

    var _BA_update =
        Scene_GranadaMonBattle.prototype.update;

    Scene_GranadaMonBattle.prototype.update =
        function() {

            if (_BA_update) {
                _BA_update.call(this);
            }

            BA.update(this);
        };

    // =========================================================
    // MOVIMIENTO
    // =========================================================

    var _BA_performMove =
        Scene_GranadaMonBattle.prototype.performMove;

    Scene_GranadaMonBattle.prototype.performMove =
        function(
            attacker,
            defender,
            instance,
            move,
            messages
        ) {
            var beforeHp =
                defender
                    ? Number(
                        defender.hp || 0
                    )
                    : 0;

            var beforeMessages =
                messages
                    ? messages.length
                    : 0;

            var result;

            if (_BA_performMove) {
                result =
                    _BA_performMove.call(
                        this,
                        attacker,
                        defender,
                        instance,
                        move,
                        messages
                    );
            }

            var afterHp =
                defender
                    ? Number(
                        defender.hp || 0
                    )
                    : beforeHp;

            var added =
                messages
                    ? messages.slice(
                        beforeMessages
                    )
                    : [];

            var joined =
                added.join(' ').toLowerCase();

            var meta = {
                damage:
                    Math.max(
                        0,
                        beforeHp -
                        afterHp
                    ),

                hit:
                    joined.indexOf(
                        'ha fallado'
                    ) ===
                    -1 &&
                    joined.indexOf(
                        'ataque ha fallado'
                    ) ===
                    -1,

                messages:
                    added,

                beforeHp:
                    beforeHp,

                afterHp:
                    afterHp,

                attacker:
                    attacker,

                defender:
                    defender
            };

            if (
                meta.damage >
                    0 &&
                defender
            ) {
                defender._gmVisualHpOverride =
                    beforeHp;
            }

            if (
                move &&
                attacker &&
                defender
            ) {
                var animation =
                    BA.createAnimation(
                        this,
                        attacker,
                        defender,
                        move,
                        meta
                    );

                if (animation) {
                    BA.addAnimation(
                        this,
                        animation
                    );

                } else if (
                    meta.damage >
                        0 &&
                    defender &&
                    defender._gmVisualHpOverride != null
                ) {
                    delete defender._gmVisualHpOverride;
                }
            }

            return result;
        };

    // =========================================================
    // CREAR BATALLA
    // =========================================================

    var _BA_create =
        Scene_GranadaMonBattle.prototype.create;

    Scene_GranadaMonBattle.prototype.create =
        function() {

            if (_BA_create) {
                _BA_create.call(this);
            }

            this._gmAnimationQueue = [];
            this._gmAnimationsLocked = false;
            this._gmHpTweens = [];

            BA.layer(this);
        };

    console.log(
        'GranadaMon BattleAnimations v6.0 cargado correctamente.'
    );

})();