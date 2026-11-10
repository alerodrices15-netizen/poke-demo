/*:
 * @plugindesc v1.0 GranadaMon - Evita errores por SE eliminados y los sustituye por sonidos existentes
 * @author OpenAI
 *
 * @help
 * GranadaMon_AudioSafety.js
 * ------------------------------------------------------------
 * Colocar AL FINAL del gestor de plugins.
 *
 * Este plugin está ajustado al contenido actual de audio/se:
 * 122 sonidos, cada uno en .ogg y .m4a.
 *
 * Si RPG Maker, un evento, una animación o un plugin intenta
 * reproducir un SE que ya no existe, se sustituye por un sonido
 * existente parecido. Si no existe una sustitución concreta,
 * simplemente no se reproduce el sonido, evitando Loading Error.
 *
 * No modifica BGM, BGS ni ME. Solo audio/se.
 *
 * @requiredAssets audio/se/Decision1
 * @requiredAssets audio/se/Move1
 * @requiredAssets audio/se/Damage1
 * @requiredAssets audio/se/Damage2
 * @requiredAssets audio/se/Damage3
 * @requiredAssets audio/se/Damage4
 * @requiredAssets audio/se/Damage5
 * @requiredAssets audio/se/Heal2
 * @requiredAssets audio/se/Magic1
 * @requiredAssets audio/se/Magic2
 * @requiredAssets audio/se/Magic3
 * @requiredAssets audio/se/Magic4
 * @requiredAssets audio/se/Coin
 * @requiredAssets audio/se/Computer
 * @requiredAssets audio/se/Darkness2
 * @requiredAssets audio/se/Darkness4
 * @requiredAssets audio/se/Earth2
 * @requiredAssets audio/se/Flash1
 * @requiredAssets audio/se/Flash2
 * @requiredAssets audio/se/Laser1
 * @requiredAssets audio/se/Laser2
 * @requiredAssets audio/se/Liquid
 * @requiredAssets audio/se/Leakage
 * @requiredAssets audio/se/Dive
 * @requiredAssets audio/se/Move2
 * @requiredAssets audio/se/Move3
 * @requiredAssets audio/se/Move4
 * @requiredAssets audio/se/Move5
 * @requiredAssets audio/se/Noise
 * @requiredAssets audio/se/Paralyze1
 * @requiredAssets audio/se/Parry
 */

(function() {
    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    GranadaMon.AudioSafety = GranadaMon.AudioSafety || {};

    var A = GranadaMon.AudioSafety;

    A.VERSION = '1.0';

    // =========================================================
    // SONIDOS QUE EXISTEN REALMENTE EN audio/se
    // =========================================================

    var availableNames = (
        'Absorb1,Absorb2,Break,Buzzer1,Buzzer2,Cancel1,Cancel2,Cat,' +
        'Chest1,Chest2,Close1,Close2,Close3,Coin,Collapse1,Collapse2,' +
        'Collapse3,Collapse4,Computer,Cow,Crash,Crossbow,Crow,Cursor1,' +
        'Cursor2,Damage1,Damage2,Damage3,Damage4,Damage5,Darkness1,' +
        'Darkness2,Darkness3,Darkness4,Darkness5,Decision1,Decision2,' +
        'Devil1,Devil2,Disappointment,Dive,Dog,Door1,Door2,Door3,Door4,' +
        'Down1,Down2,Earth1,Earth2,Earth3,Earth4,Earth5,Electrocardiogram,' +
        'Equip1,Equip2,Evasion1,Evasion2,Explosion1,Explosion2,Fall,' +
        'Fire1,Fire2,Fire3,Flash1,Flash2,Frog,Growl,Gun1,Gun2,Hammer,' +
        'Heal1,Heal2,Heal3,Horn,Horse,Ice1,Ice2,Ice3,Ice4,Ice5,Item1,' +
        'Item2,Item3,Jump1,Jump2,Key,Knock,Laser1,Laser2,Laugh,Launch,' +
        'Leakage,Liquid,Load,Machine,Magic1,Magic2,Magic3,Magic4,Miss,' +
        'Monster1,Monster2,Monster3,Monster4,Monster5,Move1,Move2,Move3,' +
        'Move4,Move5,Neon,Noise,Open1,Open2,Open3,Open4,Open5,Paralyze1,' +
        'Paralyze2,Paralyze3,Parry'
    ).split(',');

    A.AVAILABLE = {};

    for (var i = 0; i < availableNames.length; i++) {
        A.AVAILABLE[availableNames[i]] = true;
    }

    // =========================================================
    // SUSTITUCIONES DE LOS SONIDOS QUE YA NO EXISTEN
    // =========================================================

    A.FALLBACK = {

        // Sistema RPG Maker
        'Save':        'Decision1',
        'Battle1':     'Monster1',
        'Run':         'Move1',
        'Attack3':     'Damage3',
        'Recovery':    'Heal2',
        'Reflection':  'Magic2',
        'Shop1':       'Coin',

        // Golpes / ataques
        'Attack2':     'Damage2',
        'Battle3':     'Monster3',
        'Blow1':       'Damage1',
        'Blow2':       'Damage2',
        'Blow3':       'Damage3',
        'Slash1':      'Damage1',
        'Slash2':      'Damage2',
        'Slash3':      'Damage3',
        'Slash4':      'Damage4',
        'Slash5':      'Damage5',
        'Sword1':      'Parry',
        'Sword2':      'Damage2',
        'Sword3':      'Damage3',
        'Sword4':      'Damage4',
        'Sword5':      'Damage5',

        // Estados / magia
        'Blind':       'Darkness2',
        'Poison':      'Darkness2',
        'Powerup':     'Magic3',
        'Raise2':      'Heal3',
        'Saint2':      'Magic2',
        'Saint4':      'Magic4',
        'Silence':     'Darkness4',
        'Sleep':       'Magic1',
        'Skill1':      'Magic1',
        'Skill2':      'Magic2',
        'Skill3':      'Magic3',
        'Stare':       'Flash1',
        'Starlight':   'Flash2',
        'Teleport':    'Magic4',

        // Tecnología / sonido
        'Phone':       'Computer',
        'Sound2':      'Noise',
        'Sound3':      'Noise',

        // Tierra / arena
        'Sand':        'Earth2',

        // Electricidad
        'Thunder1':    'Laser1',
        'Thunder2':    'Laser1',
        'Thunder3':    'Laser2',
        'Thunder4':    'Paralyze1',
        'Thunder5':    'Laser1',
        'Thunder6':    'Laser2',
        'Thunder7':    'Paralyze1',
        'Thunder8':    'Laser2',
        'Thunder9':    'Paralyze2',
        'Thunder10':   'Paralyze3',

        // Movimiento / viento
        'Twine':       'Move2',
        'Up1':         'Move1',
        'Up3':         'Move3',
        'Up4':         'Move4',
        'Wind1':       'Move1',
        'Wind2':       'Move2',
        'Wind3':       'Move3',
        'Wind5':       'Move5',
        'Wind6':       'Move4',
        'Wind7':       'Move3',

        // Agua
        'Water1':      'Liquid',
        'Water2':      'Leakage',
        'Water4':      'Dive',
        'Water5':      'Liquid'
    };

    A._reported = {};

    // =========================================================
    // LOG SOLO UNA VEZ
    // =========================================================

    A.report = function(originalName, replacementName) {

        var key = String(originalName || '');

        if (!key || A._reported[key]) {
            return;
        }

        A._reported[key] = true;

        if (!window.console || !console.warn) {
            return;
        }

        if (replacementName) {

            console.warn(
                '[GranadaMon AudioSafety] SE eliminado: ' +
                originalName +
                ' -> usando ' +
                replacementName
            );

        } else {

            console.warn(
                '[GranadaMon AudioSafety] SE eliminado: ' +
                originalName +
                ' -> omitido para evitar Loading Error.'
            );

        }
    };

    // =========================================================
    // OBTENER NOMBRE SEGURO
    // =========================================================

    A.safeName = function(name) {

        name = String(name || '');

        if (!name) {
            return '';
        }

        if (A.AVAILABLE[name]) {
            return name;
        }

        var replacement =
            A.FALLBACK[name];

        if (
            replacement &&
            A.AVAILABLE[replacement]
        ) {

            A.report(
                name,
                replacement
            );

            return replacement;
        }

        A.report(
            name,
            ''
        );

        return '';
    };

    // =========================================================
    // COPIAR OBJETO SE
    // =========================================================

    A.safeSe = function(se) {

        if (!se) {
            return null;
        }

        var safeName =
            A.safeName(
                se.name
            );

        if (!safeName) {
            return null;
        }

        return {
            name: safeName,

            volume:
                se.volume != null
                    ? se.volume
                    : 90,

            pitch:
                se.pitch != null
                    ? se.pitch
                    : 100,

            pan:
                se.pan != null
                    ? se.pan
                    : 0
        };
    };

    // =========================================================
    // AudioManager.playSe
    // =========================================================

    var _GMAS_AudioManager_playSe =
        AudioManager.playSe;

    AudioManager.playSe = function(se) {

        var safeSe =
            A.safeSe(se);

        if (!safeSe) {
            return;
        }

        return _GMAS_AudioManager_playSe.call(
            this,
            safeSe
        );
    };

    // =========================================================
    // AudioManager.playStaticSe
    // =========================================================
    //
    // Aquí pasan SoundManager.playRecovery(),
    // playSave(), playBattleStart(), etc.
    //
    // =========================================================

    var _GMAS_AudioManager_playStaticSe =
        AudioManager.playStaticSe;

    AudioManager.playStaticSe = function(se) {

        var safeSe =
            A.safeSe(se);

        if (!safeSe) {
            return;
        }

        return _GMAS_AudioManager_playStaticSe.call(
            this,
            safeSe
        );
    };

    // =========================================================
    // AudioManager.loadStaticSe
    // =========================================================

    var _GMAS_AudioManager_loadStaticSe =
        AudioManager.loadStaticSe;

    AudioManager.loadStaticSe = function(se) {

        var safeSe =
            A.safeSe(se);

        if (!safeSe) {
            return;
        }

        return _GMAS_AudioManager_loadStaticSe.call(
            this,
            safeSe
        );
    };

    // =========================================================
    // FINAL
    // =========================================================

    console.log(
        'GranadaMon AudioSafety v1.0 cargado: ' +
        availableNames.length +
        ' SE permitidos.'
    );

})();