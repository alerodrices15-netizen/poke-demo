/*:
 * @plugindesc v1.0 GranadaMon - Pulido de Equipo y Almacenamiento
 * @author OpenAI
 *
 * @help
 * GranadaMon_StoragePolish.js
 * ------------------------------------------------------------
 * AÑADIR, NO SUSTITUIR.
 *
 * Colócalo DEBAJO de:
 * - GranadaMon_Storage.js
 * - GranadaMon_StorageVisual.js
 * - GranadaMon_UIEffects.js
 *
 * Añade:
 * - Etiquetas visuales por tipo.
 * - DEBILITADO / PS BAJOS.
 * - Contador Equipo X/6.
 * - Contador Almacenamiento X Pokémon.
 * - Fondos diferenciados.
 */

(function() {
    'use strict';

    window.GranadaMon =
        window.GranadaMon || {};

    var GM =
        window.GranadaMon;

    if (!GM.UIX) {

        console.warn(
            'GranadaMon_StoragePolish: falta GranadaMon_UIEffects.js.'
        );

        return;
    }

    var UIX =
        GM.UIX;

    function partyData() {

        return (
            $gameSystem &&
            $gameSystem._granadaMonParty
        )
            ? $gameSystem._granadaMonParty
            : [];
    }

    function storageData() {

        return (
            $gameSystem &&
            $gameSystem._granadaMonStorage
        )
            ? $gameSystem._granadaMonStorage
            : [];
    }

    // =========================================================
    // TARJETAS
    // =========================================================

    if (
        GM.StorageVisual &&
        GM.StorageVisual.drawPokemonCard &&
        !GM.StorageVisual._gmPolishWrapped
    ) {

        GM.StorageVisual._gmPolishWrapped =
            true;

        var _drawPokemonCard =
            GM.StorageVisual.drawPokemonCard;

        GM.StorageVisual.drawPokemonCard =
            function(
                win,
                rect,
                mon,
                index,
                options
            ) {

                _drawPokemonCard.call(
                    this,
                    win,
                    rect,
                    mon,
                    index,
                    options
                );

                if (
                    !win ||
                    !win.contents ||
                    !mon
                ) {
                    return;
                }

                var species =
                    UIX.speciesForMon(
                        mon
                    );

                if (!species) {
                    return;
                }

                var x =
                    rect.x +
                    150;

                var y =
                    rect.y +
                    rect.height -
                    27;

                var chipW =
                    82;

                var types =
                    species.types ||
                    [];

                for (
                    var i = 0;
                    i <
                        Math.min(
                            types.length,
                            2
                        );
                    i++
                ) {

                    UIX.drawTypeChip(
                        win,
                        types[i],

                        x +
                        i *
                        (
                            chipW +
                            6
                        ),

                        y,
                        chipW,
                        20
                    );
                }

                var hp =
                    Number(
                        mon.hp ||
                        0
                    );

                var maxHp =
                    Math.max(
                        1,
                        Number(
                            mon.maxHp ||
                            1
                        )
                    );

                var ratio =
                    hp /
                    maxHp;

                var label =
                    '';

                var color =
                    '';

                if (
                    hp <=
                    0
                ) {

                    label =
                        'DEBILITADO';

                    color =
                        '#e25b5b';

                } else if (
                    ratio <=
                    0.25
                ) {

                    label =
                        'PS BAJOS';

                    color =
                        '#f1b65a';
                }

                if (label) {

                    var oldSize =
                        win.contents.fontSize;

                    var oldBold =
                        win.contents.fontBold;

                    win.contents.fontSize =
                        12;

                    win.contents.fontBold =
                        true;

                    win.contents.fillRect(
                        rect.x +
                        4,
                        rect.y +
                        6,
                        4,
                        rect.height -
                        12,
                        color
                    );

                    win.changeTextColor(
                        color
                    );

                    win.contents.drawText(
                        label,

                        rect.x +
                        rect.width -
                        132,

                        rect.y +
                        rect.height -
                        27,

                        118,
                        20,
                        'right'
                    );

                    win.resetTextColor();

                    win.contents.fontSize =
                        oldSize;

                    win.contents.fontBold =
                        oldBold;
                }
            };
    }

    function updateTitle(
        scene,
        text
    ) {

        if (
            !scene ||
            !scene._titleWindow
        ) {
            return;
        }

        if (
            scene._titleWindow._title ===
            text
        ) {
            return;
        }

        scene._titleWindow._title =
            text;

        if (
            scene._titleWindow.refresh
        ) {
            scene._titleWindow.refresh();
        }
    }

    // =========================================================
    // EQUIPO
    // =========================================================

    if (
        typeof Scene_GranadaMonParty !==
        'undefined'
    ) {

        var _Party_create =
            Scene_GranadaMonParty.prototype.create;

        Scene_GranadaMonParty.prototype.create =
            function() {

                _Party_create.call(
                    this
                );

                UIX.addPattern(
                    this,
                    'party'
                );
            };

        var _Party_update =
            Scene_GranadaMonParty.prototype.update;

        Scene_GranadaMonParty.prototype.update =
            function() {

                _Party_update.call(
                    this
                );

                var count =
                    0;

                var party =
                    partyData();

                for (
                    var i = 0;
                    i < party.length;
                    i++
                ) {

                    if (party[i]) {
                        count++;
                    }
                }

                updateTitle(
                    this,
                    'Equipo Pokémon  ·  ' +
                    count +
                    '/6'
                );
            };
    }

    // =========================================================
    // ALMACENAMIENTO
    // =========================================================

    if (
        typeof Scene_GranadaMonStorage !==
        'undefined'
    ) {

        var _Storage_create =
            Scene_GranadaMonStorage.prototype.create;

        Scene_GranadaMonStorage.prototype.create =
            function() {

                _Storage_create.call(
                    this
                );

                UIX.addPattern(
                    this,
                    'storage'
                );
            };

        var _Storage_update =
            Scene_GranadaMonStorage.prototype.update;

        Scene_GranadaMonStorage.prototype.update =
            function() {

                _Storage_update.call(
                    this
                );

                updateTitle(
                    this,

                    'Almacenamiento  ·  ' +
                    storageData().length +
                    ' Pokémon'
                );
            };
    }

    console.log(
        'GranadaMon_StoragePolish v1.0 cargado.'
    );

})();