/*:
 * @plugindesc v2.1 GranadaMon - GMDEX como Front + GMBTL Back automático
 * @author OpenAI
 *
 * @help
 * GranadaMon_BattleSprites.js
 * ------------------------------------------------------------
 *
 * REQUIERE:
 * GranadaMon_Core.js
 * GranadaMon_Data.js
 * GranadaMon_Battle.js
 * GranadaMon_BattleUI.js
 * GranadaMon_BattleParty.js
 *
 * FRONT DEL RIVAL:
 *
 * img/pictures/GMDEX_001_Pidgey.png
 * ...
 * img/pictures/GMDEX_100_Weavile.png
 *
 * BACK DEL JUGADOR:
 *
 * img/pictures/GMBTL_001_Pidgey_Back.png
 * ...
 * img/pictures/GMBTL_100_Weavile_Back.png
 *
 * IMPORTANTE:
 *
 * - Los nombres de archivo se obtienen automáticamente
 *   desde GranadaMon_Data.js.
 *
 * - Ya NO existe aquí una segunda lista manual
 *   con los 100 Pokémon.
 *
 * - Pokédex y rival usan el MISMO GMDEX.
 *
 * - Si todavía no existe un Back, durante las pruebas
 *   se usa temporalmente el GMDEX correspondiente.
 */

(function() {

    'use strict';


    window.GranadaMon =
        window.GranadaMon || {};


    var GM =
        window.GranadaMon;


    // =========================================================
    // COMPROBACIÓN
    // =========================================================

    if (
        !GM.getSpecies ||
        !GM.getSpeciesByGranadaDex
    ) {

        throw new Error(
            'GranadaMon_BattleSprites necesita GranadaMon_Core.js y GranadaMon_Data.js.'
        );

    }


    if (
        !GM.Battle ||
        typeof Scene_GranadaMonBattle ===
        'undefined'
    ) {

        throw new Error(
            'GranadaMon_BattleSprites necesita GranadaMon_Battle.js.'
        );

    }


    GM.BattleSprites =
        GM.BattleSprites || {};


    var BS =
        GM.BattleSprites;


    BS.version =
        '2.1';


    // =========================================================
    // TAMAÑO
    // =========================================================

    BS.enemyBitmapSize =
        340;


    BS.playerBitmapSize =
        390;


    BS.spriteScale =
        0.92;


    // =========================================================
    // CACHÉ PARA COMPROBAR BACKS
    // =========================================================

    BS._pictureProbeCache =
        BS._pictureProbeCache || {};


    // =========================================================
    // 001 / 002 / 100
    // =========================================================

    BS.padDex =
        function(number) {

            number =
                Number(
                    number || 0
                );


            if (
                number < 10
            ) {

                return (
                    '00' +
                    number
                );

            }


            if (
                number < 100
            ) {

                return (
                    '0' +
                    number
                );

            }


            return String(
                number
            );

        };


    // =========================================================
    // DATOS DEL POKÉMON
    // =========================================================
    //
    // Ya no existe una tabla duplicada aquí.
    //
    // pokemon.speciesId = número Pokédex Nacional.
    //
    // Los datos se obtienen directamente de:
    //
    // GranadaMon_Data.js
    //
    // Ejemplo:
    //
    // speciesId 151
    // -> Mew
    // -> Granada Dex 022
    //
    // =========================================================

    BS.getSpeciesData =
        function(pokemon) {

            if (!pokemon) {

                return null;

            }


            var nationalDex =
                Number(
                    pokemon.speciesId || 0
                );


            if (!nationalDex) {

                return null;

            }


            var species =
                GM.getSpecies(
                    nationalDex
                );


            if (!species) {

                return null;

            }


            return {

                granada:
                    Number(
                        species.granadaDex || 0
                    ),

                national:
                    Number(
                        species.nationalDex || 0
                    ),

                name:
                    String(
                        species.name || ''
                    )

            };

        };


    // =========================================================
    // FRONT = GMDEX
    // =========================================================

    BS.frontFilename =
        function(pokemon) {

            var data =
                BS.getSpeciesData(
                    pokemon
                );


            if (
                !data ||
                !data.granada ||
                !data.name
            ) {

                return null;

            }


            return (

                'GMDEX_' +

                BS.padDex(
                    data.granada
                ) +

                '_' +

                data.name

            );

        };


    // =========================================================
    // BACK = GMBTL
    // =========================================================

    BS.backFilename =
        function(pokemon) {

            var data =
                BS.getSpeciesData(
                    pokemon
                );


            if (
                !data ||
                !data.granada ||
                !data.name
            ) {

                return null;

            }


            return (

                'GMBTL_' +

                BS.padDex(
                    data.granada
                ) +

                '_' +

                data.name +

                '_Back'

            );

        };


    // =========================================================
    // COMPROBAR SI EXISTE IMAGEN
    // SIN PROVOCAR LOADING ERROR
    // =========================================================

    BS.pictureExists =
        function(
            filename,
            callback
        ) {

            if (!filename) {

                callback(
                    false
                );

                return;

            }


            if (

                Object
                    .prototype
                    .hasOwnProperty
                    .call(

                        BS._pictureProbeCache,
                        filename

                    )

            ) {

                callback(

                    BS
                        ._pictureProbeCache[
                            filename
                        ]

                );


                return;

            }


            var image =
                new Image();


            var url =

                'img/pictures/' +

                encodeURIComponent(
                    filename
                ) +

                '.png';


            image.onload =
                function() {

                    BS._pictureProbeCache[
                        filename
                    ] =
                        true;


                    callback(
                        true
                    );

                };


            image.onerror =
                function() {

                    BS._pictureProbeCache[
                        filename
                    ] =
                        false;


                    callback(
                        false
                    );

                };


            image.src =
                url;

        };


    // =========================================================
    // CARGAR IMAGEN ESCALADA
    // =========================================================

    BS.loadScaledBitmap =
        function(
            filename,
            size,
            callback
        ) {

            if (!filename) {

                return;

            }


            var source =
                ImageManager.loadPicture(
                    filename
                );


            var makeBitmap =
                function() {

                    if (

                        !source ||

                        source.width <= 0 ||

                        source.height <= 0

                    ) {

                        return;

                    }


                    var target =
                        new Bitmap(
                            size,
                            size
                        );


                    // Mantener proporción aunque algún PNG
                    // no sea exactamente cuadrado.

                    var scale =
                        Math.min(

                            size /
                            source.width,

                            size /
                            source.height

                        );


                    var dw =
                        Math.floor(

                            source.width *
                            scale

                        );


                    var dh =
                        Math.floor(

                            source.height *
                            scale

                        );


                    var dx =
                        Math.floor(

                            (
                                size -
                                dw
                            ) /
                            2

                        );


                    var dy =
                        Math.floor(

                            (
                                size -
                                dh
                            ) /
                            2

                        );


                    target.blt(

                        source,

                        0,
                        0,

                        source.width,
                        source.height,

                        dx,
                        dy,

                        dw,
                        dh

                    );


                    callback(
                        target
                    );

                };


            if (
                source.isReady()
            ) {

                makeBitmap();

            }

            else {

                source.addLoadListener(
                    makeBitmap
                );

            }

        };


    // =========================================================
    // EVITAR CARGAS ANTIGUAS
    // =========================================================

    BS.isStillCurrent =
        function(
            scene,
            pokemon,
            side
        ) {

            if (
                SceneManager._scene !==
                scene
            ) {

                return false;

            }


            if (
                side ===
                'Back'
            ) {

                return (

                    GM.Battle
                        .playerPokemon ===
                    pokemon

                );

            }


            return (

                GM.Battle.enemy ===
                pokemon

            );

        };


    // =========================================================
    // APLICAR BITMAP
    // =========================================================

    BS.setSpriteBitmap =
        function(
            scene,
            sprite,
            pokemon,
            side,
            filename,
            size
        ) {

            BS.loadScaledBitmap(

                filename,

                size,

                function(bitmap) {

                    if (

                        !BS.isStillCurrent(
                            scene,
                            pokemon,
                            side
                        )

                    ) {

                        return;

                    }


                    sprite.bitmap =
                        bitmap;


                    sprite.anchor.x =
                        0.5;


                    sprite.anchor.y =
                        0.5;


                    sprite.scale.x =
                        BS.spriteScale;


                    sprite.scale.y =
                        BS.spriteScale;


                    sprite.alpha =
                        1;


                    sprite.visible =
                        true;


                    sprite._gmRealBattleSprite =
                        true;


                    sprite._gmBattlePokemon =
                        pokemon;


                    sprite._gmBattleSide =
                        side;


                    sprite._gmBattleFilename =
                        filename;

                }

            );

        };


    // =========================================================
    // RIVAL: USAR GMDEX
    // =========================================================

    BS.applyFront =
        function(
            scene,
            sprite,
            pokemon
        ) {

            if (
                !scene ||
                !sprite ||
                !pokemon
            ) {

                return false;

            }


            var filename =
                BS.frontFilename(
                    pokemon
                );


            if (!filename) {

                return false;

            }


            BS.setSpriteBitmap(

                scene,

                sprite,

                pokemon,

                'Front',

                filename,

                BS.enemyBitmapSize

            );


            return true;

        };


    // =========================================================
    // JUGADOR: USAR GMBTL BACK
    // =========================================================

    BS.applyBack =
        function(
            scene,
            sprite,
            pokemon
        ) {

            if (
                !scene ||
                !sprite ||
                !pokemon
            ) {

                return false;

            }


            var back =
                BS.backFilename(
                    pokemon
                );


            var fallbackFront =
                BS.frontFilename(
                    pokemon
                );


            if (
                !back ||
                !fallbackFront
            ) {

                return false;

            }


            // Evitamos que quede visible el Pokémon
            // anterior mientras comprobamos la imagen.

            sprite.visible =
                false;


            BS.pictureExists(

                back,

                function(exists) {

                    if (

                        !BS.isStillCurrent(

                            scene,
                            pokemon,
                            'Back'

                        )

                    ) {

                        return;

                    }


                    // Si todavía no has creado el Back:
                    // usamos temporalmente el GMDEX.

                    var filename =

                        exists

                            ? back

                            : fallbackFront;


                    BS.setSpriteBitmap(

                        scene,

                        sprite,

                        pokemon,

                        'Back',

                        filename,

                        BS.playerBitmapSize

                    );

                }

            );


            return true;

        };


    // =========================================================
    // REFRESCAR JUGADOR
    // =========================================================

    BS.refreshPlayer =
        function(scene) {

            if (

                !scene ||

                !scene._playerPokemonSprite ||

                !GM.Battle.playerPokemon

            ) {

                return;

            }


            BS.applyBack(

                scene,

                scene._playerPokemonSprite,

                GM.Battle.playerPokemon

            );

        };


    // =========================================================
    // REFRESCAR RIVAL
    // =========================================================

    BS.refreshEnemy =
        function(scene) {

            if (

                !scene ||

                !scene._enemyPokemonSprite ||

                !GM.Battle.enemy

            ) {

                return;

            }


            BS.applyFront(

                scene,

                scene._enemyPokemonSprite,

                GM.Battle.enemy

            );

        };


    BS.refreshAll =
        function(scene) {

            BS.refreshPlayer(
                scene
            );


            BS.refreshEnemy(
                scene
            );

        };


    // =========================================================
    // AL ENTRAR EN BATALLA
    // =========================================================

    var _GMBattleSprites_create =
        Scene_GranadaMonBattle
            .prototype
            .create;


    Scene_GranadaMonBattle
        .prototype
        .create =
        function() {

            _GMBattleSprites_create
                .call(
                    this
                );


            BS.refreshAll(
                this
            );

        };


    // =========================================================
    // AL CAMBIAR DE POKÉMON
    // =========================================================

    if (

        Scene_GranadaMonBattle
            .prototype
            .refreshGMSwitchedPokemonVisual

    ) {

        var _GMBattleSprites_refreshSwitch =

            Scene_GranadaMonBattle
                .prototype
                .refreshGMSwitchedPokemonVisual;


        Scene_GranadaMonBattle
            .prototype
            .refreshGMSwitchedPokemonVisual =
            function() {

                _GMBattleSprites_refreshSwitch
                    .call(
                        this
                    );


                BS.refreshPlayer(
                    this
                );

            };

    }


    // =========================================================
    // REFRESCO GENERAL DEL BATTLE UI
    // =========================================================

    if (

        Scene_GranadaMonBattle
            .prototype
            .refreshBattleUI

    ) {

        var _GMBattleSprites_refreshUI =

            Scene_GranadaMonBattle
                .prototype
                .refreshBattleUI;


        Scene_GranadaMonBattle
            .prototype
            .refreshBattleUI =
            function() {

                _GMBattleSprites_refreshUI
                    .call(
                        this
                    );


                BS.refreshAll(
                    this
                );

            };

    }


    // =========================================================
    // CARGADO
    // =========================================================

    console.log(
        'GranadaMon BattleSprites v2.1 cargado correctamente.'
    );


})();