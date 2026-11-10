/*:
 * @plugindesc Oculta el marcador de destino (Destination) - MV / MZ
 * @help Guarda este archivo en js/plugins y actívalo en Plugin Manager.
 */
(() => {
    function hideDest() {
        if (typeof Sprite_Destination !== "undefined" && Sprite_Destination.prototype) {
            Sprite_Destination.prototype.createBitmap = function() {
                this.bitmap = new Bitmap(1, 1);
                this.anchor.x = 0.5;
                this.anchor.y = 0.5;
                this.opacity = 0;
            };
            return true;
        }
        return false;
    }

    if (!hideDest()) {
        const _Scene_Map_start = Scene_Map.prototype.start;
        Scene_Map.prototype.start = function() {
            hideDest();
            _Scene_Map_start.call(this);
        };
    }
})();
