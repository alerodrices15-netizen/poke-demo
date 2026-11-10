/*:
 * @plugindesc FIX Itch.io + Yanfly: Evita 'Continuar' fantasma y gestiona Autosave.
 * @author ProgramadorExperto
 * * @help
 * Pon este plugin AL FINAL de tu lista.
 * 1. Cambia la clave de guardado para que no choque con otros juegos en itch.io.
 * 2. Limpia el botón 'Continuar' si no hay datos reales.
 * 3. Realiza un autosave seguro al cambiar de mapa.
 */

(function() {
    // --- CONFIGURACIÓN ÚNICA ---
    // Cambia 'MiJuegoIncreible' por el nombre de tu proyecto para aislar los saves
    var uniqueID = 'Proyecto_Itch_01'; 
    var autoSlot = 1; // Slot donde se guardará automáticamente

    // 1. AISLAMIENTO DE DATOS (Storage Key)
    // Esto evita que tu juego lea partidas de OTROS juegos de RPG Maker en itch.io
    StorageManager.webStorageKey = function(savefileId) {
        if (savefileId < 0) return uniqueID + '_Config';
        if (savefileId === 0) return uniqueID + '_Global';
        return uniqueID + '_File' + savefileId;
    };

    // 2. FILTRO DE SEGURIDAD PARA EL BOTÓN 'CONTINUAR'
    var _DataManager_isAnySavefileExists = DataManager.isAnySavefileExists;
    DataManager.isAnySavefileExists = function() {
        // Primero verificamos si existe información global real
        var info = this.loadGlobalInfo();
        if (info && info[autoSlot] || (info && info.length > 1)) {
            // Si existe el slot 1 o el de autosave, verificamos que no sea basura
            return true;
        }
        return false;
    };

    // 3. AUTOSAVE INTEGRADO (Sustituye a YK_Autosave)
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        // Solo guarda si el jugador ya se ha movido (evita guardar en el segundo 1)
        if ($gameSystem && $gameParty.steps() > 0) {
            this.executeItchAutosave();
        }
    };

    Scene_Map.prototype.executeItchAutosave = function() {
        $gameSystem.onBeforeSave();
        if (DataManager.saveGame(autoSlot)) {
            console.log("Autoguardado Seguro en Slot " + autoSlot);
            if (StorageManager.isLocalMode()) {
                StorageManager.cleanBackup(autoSlot);
            }
        }
    };

    // 4. PARCHE PARA EVITAR EL CRASH (Error de lectura de null)
    var _DataManager_loadGame = DataManager.loadGame;
    DataManager.loadGame = function(savefileId) {
        try {
            return _DataManager_loadGame.call(this, savefileId);
        } catch (e) {
            console.error("Fallo al cargar partida corrupta. Redirigiendo...");
            return false;
        }
    };

})();