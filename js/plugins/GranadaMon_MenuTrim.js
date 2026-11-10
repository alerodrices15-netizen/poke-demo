/*:
 * @plugindesc v1.3 GranadaMon - Menú limpio con iconos y nombre Almacén
 * @author OpenAI
 *
 * @help
 * GranadaMon_MenuTrim.js
 * ------------------------------------------------------------
 * Colócalo DEBAJO de GranadaMon_Menu.js.
 * Si usas GranadaMon_MenuPolish.js, este debe ir DEBAJO de MenuTrim.
 *
 * Cambios:
 * - Oculta Habilidad, Equipo, Estado y Formación.
 * - Mantiene: Mochila, Pokémon, Pokédex, Almacén, Opciones, Guardar y Salir.
 * - Renombra Almacenamiento/Cajas como "Almacén".
 * - Dibuja un pequeño icono propio junto a cada opción.
 *
 * No necesita imágenes externas.
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    GM.MenuTrim = GM.MenuTrim || {};
    GM.MenuTrim.version = '1.3';

    // =========================================================
    // NOMBRES / FILTRADO
    // =========================================================

    GM.MenuTrim.HIDDEN_SYMBOLS = {
        skill: true,
        equip: true,
        status: true,
        formation: true
    };

    GM.MenuTrim.HIDDEN_NAMES = {
        'HABILIDAD': true,
        'HABILIDADES': true,
        'EQUIPO': true,
        'ESTADO': true,
        'FORMACIÓN': true,
        'FORMACION': true
    };

    GM.MenuTrim.isHiddenCommand = function(command) {
        if (!command) return false;

        var symbol = String(command.symbol || '').toLowerCase();
        var name = String(command.name || '').toUpperCase();

        return !!(
            GM.MenuTrim.HIDDEN_SYMBOLS[symbol] ||
            GM.MenuTrim.HIDDEN_NAMES[name]
        );
    };

    GM.MenuTrim.normalizeName = function(command) {
        if (!command) return;

        var symbol = String(command.symbol || '').toLowerCase();
        var name = String(command.name || '').toUpperCase();

        if (
            symbol === 'granadamonstorage' ||
            name === 'ALMACENAMIENTO' ||
            name === 'CAJAS' ||
            name === 'CAJAS POKÉMON' ||
            name === 'CAJAS POKEMON'
        ) {
            command.name = 'Almacén';
        }
    };

    var _Window_MenuCommand_makeCommandList =
        Window_MenuCommand.prototype.makeCommandList;

    Window_MenuCommand.prototype.makeCommandList = function() {
        _Window_MenuCommand_makeCommandList.call(this);

        var clean = [];

        for (var i = 0; i < this._list.length; i++) {
            var command = this._list[i];

            if (GM.MenuTrim.isHiddenCommand(command)) {
                continue;
            }

            GM.MenuTrim.normalizeName(command);
            clean.push(command);
        }

        this._list = clean;
    };

    // =========================================================
    // IDENTIFICAR TIPO DE COMANDO
    // =========================================================

    GM.MenuTrim.commandKind = function(command) {
        if (!command) return 'other';

        var symbol = String(command.symbol || '').toLowerCase();
        var name = String(command.name || '').toUpperCase();

        if (symbol === 'item' || name === 'MOCHILA') {
            return 'bag';
        }

        if (
            symbol === 'granadamonparty' ||
            name === 'POKÉMON' ||
            name === 'POKEMON'
        ) {
            return 'pokemon';
        }

        if (
            symbol === 'granadamondex' ||
            name === 'POKÉDEX' ||
            name === 'POKEDEX'
        ) {
            return 'dex';
        }

        if (
            symbol === 'granadamonstorage' ||
            name === 'ALMACÉN' ||
            name === 'ALMACEN' ||
            name === 'ALMACENAMIENTO' ||
            name === 'CAJAS'
        ) {
            return 'storage';
        }

        if (
            symbol === 'options' ||
            name === 'OPCIONES'
        ) {
            return 'options';
        }

        if (
            symbol === 'save' ||
            name === 'GUARDAR'
        ) {
            return 'save';
        }

        if (
            symbol === 'gameend' ||
            name === 'SALIR'
        ) {
            return 'exit';
        }

        return 'other';
    };

    // =========================================================
    // ICONOS
    // =========================================================

    GM.MenuTrim.drawIcon = function(win, kind, x, y, size) {
        if (!win || !win.contents) return;

        var b = win.contents;
        var s = size || 26;
        var cx = x + Math.floor(s / 2);
        var cy = y + Math.floor(s / 2);

        b.paintOpacity = 120;

        b.drawCircle(
            cx + 1,
            cy + 2,
            Math.floor(s * 0.46),
            '#151922'
        );

        b.paintOpacity = 255;

        // MOCHILA
        if (kind === 'bag') {

            b.fillRect(
                x + 5,
                y + 8,
                s - 10,
                s - 10,
                '#d99536'
            );

            b.fillRect(
                x + 8,
                y + 5,
                s - 16,
                5,
                '#f0b758'
            );

            b.fillRect(
                x + 9,
                y + 3,
                s - 18,
                4,
                '#9b6422'
            );

            b.fillRect(
                x + 8,
                y + s - 8,
                s - 16,
                3,
                '#a56724'
            );

        }

        // POKÉMON
        else if (kind === 'pokemon') {

            b.drawCircle(
                cx,
                cy,
                Math.floor(s * 0.43),
                '#78c95d'
            );

            b.fillRect(
                x + 3,
                cy - 2,
                s - 6,
                4,
                '#355437'
            );

            b.drawCircle(
                cx,
                cy,
                Math.floor(s * 0.16),
                '#f2f2f2'
            );

            b.drawCircle(
                cx,
                cy,
                Math.floor(s * 0.08),
                '#49674a'
            );

        }

        // POKÉDEX
        else if (kind === 'dex') {

            b.fillRect(
                x + 4,
                y + 4,
                s - 8,
                s - 7,
                '#d94f57'
            );

            b.fillRect(
                x + 7,
                y + 8,
                5,
                s - 15,
                '#ff7a7f'
            );

            b.fillRect(
                x + 14,
                y + 8,
                s - 20,
                3,
                '#f7dede'
            );

            b.fillRect(
                x + 14,
                y + 14,
                s - 20,
                3,
                '#f7dede'
            );

            b.fillRect(
                x + 14,
                y + 20,
                s - 20,
                3,
                '#f7dede'
            );

        }

        // ALMACÉN
        else if (kind === 'storage') {

            b.fillRect(
                x + 3,
                y + 5,
                s - 6,
                s - 9,
                '#6864d9'
            );

            b.fillRect(
                x + 5,
                y + 8,
                s - 10,
                2,
                '#a8a6ff'
            );

            b.fillRect(
                cx - 1,
                y + 7,
                2,
                s - 13,
                '#c0beff'
            );

            b.fillRect(
                x + 7,
                y + 13,
                5,
                4,
                '#d9d8ff'
            );

            b.fillRect(
                cx + 4,
                y + 13,
                5,
                4,
                '#d9d8ff'
            );

        }

        // OPCIONES
        else if (kind === 'options') {

            b.drawCircle(
                cx,
                cy,
                Math.floor(s * 0.34),
                '#b45bd6'
            );

            b.drawCircle(
                cx,
                cy,
                Math.floor(s * 0.14),
                '#f0d6f8'
            );

            b.fillRect(
                cx - 3,
                y + 1,
                6,
                6,
                '#b45bd6'
            );

            b.fillRect(
                cx - 3,
                y + s - 7,
                6,
                6,
                '#b45bd6'
            );

            b.fillRect(
                x + 1,
                cy - 3,
                6,
                6,
                '#b45bd6'
            );

            b.fillRect(
                x + s - 7,
                cy - 3,
                6,
                6,
                '#b45bd6'
            );

        }

        // GUARDAR
        else if (kind === 'save') {

            b.fillRect(
                x + 4,
                y + 3,
                s - 8,
                s - 6,
                '#439bc8'
            );

            b.fillRect(
                x + 8,
                y + 5,
                s - 16,
                7,
                '#d6eef8'
            );

            b.fillRect(
                x + 8,
                y + 16,
                s - 16,
                s - 21,
                '#a8d8ec'
            );

            b.fillRect(
                x + s - 11,
                y + 5,
                4,
                7,
                '#376a81'
            );

        }

        // SALIR
        else if (kind === 'exit') {

            b.fillRect(
                x + 5,
                y + 3,
                s - 12,
                s - 6,
                '#e68b52'
            );

            b.fillRect(
                x + s - 9,
                cy - 2,
                7,
                4,
                '#ffd0ae'
            );

            b.fillRect(
                x + s - 6,
                cy - 6,
                4,
                12,
                '#e68b52'
            );

            b.fillRect(
                x + s - 4,
                cy - 2,
                5,
                4,
                '#e68b52'
            );

        }

        else {

            b.drawCircle(
                cx,
                cy,
                Math.floor(s * 0.34),
                '#8d94a5'
            );
        }
    };

    // =========================================================
    // DIBUJO DEL MENÚ
    // =========================================================

    Window_MenuCommand.prototype.itemTextAlign = function() {
        return 'left';
    };

    Window_MenuCommand.prototype.drawItem = function(index) {

        var rect =
            this.itemRectForText(
                index
            );

        var command =
            this._list[
                index
            ];

        if (!command) {
            return;
        }

        var enabled =
            this.isCommandEnabled(
                index
            );

        var iconSize =
            26;

        var iconX =
            rect.x +
            2;

        var iconY =
            rect.y +
            Math.floor(
                (
                    rect.height -
                    iconSize
                ) /
                2
            );

        this.changePaintOpacity(
            enabled
        );

        GM.MenuTrim.drawIcon(
            this,
            GM.MenuTrim.commandKind(
                command
            ),
            iconX,
            iconY,
            iconSize
        );

        this.resetTextColor();

        this.drawText(
            command.name,
            rect.x + 38,
            rect.y,
            Math.max(
                0,
                rect.width - 42
            ),
            'left'
        );

        this.changePaintOpacity(
            true
        );
    };

    console.log(
        'GranadaMon MenuTrim v1.3 cargado: Almacén.'
    );

})();