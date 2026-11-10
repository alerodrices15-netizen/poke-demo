/*:
 * @plugindesc GranadaMon - Cargador Firebase compatible con RPG Maker MV
 * @author OpenAI
 *
 * Firebase 8.10.1
 */

(function() {
    'use strict';

    var FIREBASE_VERSION = '8.10.1';

    var FIREBASE_SCRIPTS = [
        'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/firebase-app.js',
        'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/firebase-auth.js',
        'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/firebase-firestore.js'
    ];

    function loadScript(url) {

        return new Promise(function(resolve, reject) {

            var script = document.createElement('script');

            script.type = 'text/javascript';
            script.src = url;
            script.async = false;

            script.onload = function() {

                console.log(
                    '[GranadaMon Firebase] Cargado: ' + url
                );

                resolve();

            };

            script.onerror = function() {

                console.error(
                    '[GranadaMon Firebase] Error cargando: ' + url
                );

                reject(
                    new Error(
                        'No se pudo cargar Firebase: ' + url
                    )
                );

            };

            document.head.appendChild(script);

        });

    }

    function firebaseAlreadyLoaded() {

        return (
            window.firebase &&
            typeof firebase.initializeApp === 'function' &&
            typeof firebase.auth === 'function' &&
            typeof firebase.firestore === 'function'
        );

    }

    window.GranadaMonFirebaseReady = new Promise(
        function(resolve, reject) {

            if (firebaseAlreadyLoaded()) {

                console.log(
                    '[GranadaMon Firebase] Firebase ya estaba cargado.'
                );

                resolve(window.firebase);

                return;

            }

            loadScript(FIREBASE_SCRIPTS[0])

                .then(function() {

                    return loadScript(
                        FIREBASE_SCRIPTS[1]
                    );

                })

                .then(function() {

                    return loadScript(
                        FIREBASE_SCRIPTS[2]
                    );

                })

                .then(function() {

                    if (!firebaseAlreadyLoaded()) {

                        throw new Error(
                            'Firebase terminó de cargar pero sus servicios no están disponibles.'
                        );

                    }

                    console.log(
                        '[GranadaMon Firebase] Firebase 8.10.1 listo.'
                    );

                    resolve(
                        window.firebase
                    );

                })

                .catch(function(error) {

                    console.error(
                        '[GranadaMon Firebase]',
                        error
                    );

                    reject(
                        error
                    );

                });

        }
    );

})();