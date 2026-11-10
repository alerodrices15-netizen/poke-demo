/*:
 * @plugindesc v1.0 GranadaMon - Base de datos de 100 Pokémon
 * @author OpenAI
 *
 * @help
 * GranadaMon_Data.js
 * ------------------------------------------------------------
 * REQUIERE:
 * 1. GranadaMon_Menu.js
 * 2. GranadaMon_Core.js
 * 3. GranadaMon_Data.js
 *
 * Este plugin contiene las especies disponibles en Pokémon Granada.
 */

(function() {

    'use strict';

    window.GranadaMon = window.GranadaMon || {};
    var GM = window.GranadaMon;

    // =========================================================
    // COMPROBACIÓN
    // =========================================================
    if (!GM.registerSpecies) {
        throw new Error('GranadaMon_Data necesita GranadaMon_Core.js encima.');
    }

    // =========================================================
    // FUNCIÓN PARA REGISTRAR POKÉMON
    // =========================================================
    function S(gdex, ndex, name, types, stats, from, to, desc) {
        GM.registerSpecies({
            granadaDex: gdex,
            nationalDex: ndex,
            name: name,
            types: types,
            baseStats: {
                hp: stats[0],
                attack: stats[1],
                defense: stats[2],
                spAttack: stats[3],
                spDefense: stats[4],
                speed: stats[5]
            },
            evolvesFrom: from,
            evolvesTo: to || [],
            learnset: [],
            evolutionRules: [],
            description: desc || "No hay datos disponibles.",
            sprites: {
                front: '',
                back: '',
                icon: ''
            }
        });
    }

    // --- 001-003: Pidgey, Pidgeotto, Pidgeot ---
    S(1, 16, "Pidgey", ["NORMAL","VOLADOR"], [40,45,40,35,35,56], null, [17], "Se oculta entre la hierba alta para evitar depredadores.");
    S(2, 17, "Pidgeotto", ["NORMAL","VOLADOR"], [63,60,55,50,50,71], 16, [18], "Vuela en círculos buscando presas con su aguda vista.");
    S(3, 18, "Pidgeot", ["NORMAL","VOLADOR"], [83,80,75,70,70,101], 17, [], "Puede alcanzar velocidades supersónicas cuando se lanza al ataque.");

    // --- 004-006: Magnemite, Magneton, Magnezone ---
    S(4, 81, "Magnemite", ["ELECTRICO","ACERO"], [25,35,70,95,55,45], null, [82], "Emite ondas magnéticas desde sus ojos laterales.");
    S(5, 82, "Magneton", ["ELECTRICO","ACERO"], [50,60,95,120,70,70], 81, [462], "Formado por tres Magnemite unidos, crea un campo magnético potente.");
    S(6, 462, "Magnezone", ["ELECTRICO","ACERO"], [70,70,115,130,90,60], 82, [], "Se cree que proviene del espacio exterior, aunque su origen es un misterio.");

    // --- 007-009: Abra, Kadabra, Alakazam ---
    S(7, 63, "Abra", ["PSIQUICO"], [25,20,15,105,55,90], null, [64], "Duerme 18 horas al día; puede teletransportarse si se siente amenazado.");
    S(8, 64, "Kadabra", ["PSIQUICO"], [40,35,30,120,70,105], 63, [65], "Emite ondas alfa que causan jaquecas a quienes están cerca.");
    S(9, 65, "Alakazam", ["PSIQUICO"], [55,50,45,135,95,120], 64, [], "Su cerebro supera al de cualquier superordenador.");

    // --- 010-012: Machop, Machoke, Machamp ---
    S(10, 66, "Machop", ["LUCHA"], [70,80,50,35,35,35], null, [67], "Entrena constantemente para desarrollar músculos de acero.");
    S(11, 67, "Machoke", ["LUCHA"], [80,100,70,50,60,45], 66, [68], "Lleva un cinturón de fuerza para controlar su inmenso poder.");
    S(12, 68, "Machamp", ["LUCHA"], [90,130,80,65,85,55], 67, [], "Puede realizar miles de golpes en un solo segundo.");

    // --- 013-015: Oddish, Gloom, Vileplume ---
    S(13, 43, "Oddish", ["PLANTA","VENENO"], [45,50,55,75,65,30], null, [44], "Se entierra de día para evitar el sol, solo sale de noche.");
    S(14, 44, "Gloom", ["PLANTA","VENENO"], [60,65,70,85,75,40], 43, [45], "Expulsa un olor fétido para defenderse de sus atacantes.");
    S(15, 45, "Vileplume", ["PLANTA","VENENO"], [75,80,85,110,90,50], 44, [], "Sus pétalos gigantes liberan polen tóxico altamente irritante.");

    // --- 016-018: Bellsprout, Weepinbell, Victreebel ---
    S(16, 69, "Bellsprout", ["PLANTA","VENENO"], [50,75,35,70,30,40], null, [70], "Es muy flexible y puede esquivar ataques con elegancia.");
    S(17, 70, "Weepinbell", ["PLANTA","VENENO"], [65,90,50,85,45,55], 69, [71], "Cuelga de las ramas esperando que una presa pase cerca.");
    S(18, 71, "Victreebel", ["PLANTA","VENENO"], [80,105,65,100,70,70], 70, [], "Atrae a sus presas con un aroma dulce antes de atraparlas.");

    // --- 019-021: Mareep, Flaaffy, Ampharos ---
    S(19, 179, "Mareep", ["ELECTRICO"], [55,40,40,65,45,35], null, [180], "Su lana acumula electricidad estática con el movimiento.");
    S(20, 180, "Flaaffy", ["ELECTRICO"], [70,55,55,80,60,45], 179, [181], "Tiene parches sin lana que son muy resistentes a la electricidad.");
    S(21, 181, "Ampharos", ["ELECTRICO"], [90,75,85,115,90,55], 180, [], "Su cola brilla con fuerza, sirviendo de faro en la oscuridad.");

    // =========================================================
    // 022-024: MEW, VICTINI, HOOPA
    // =========================================================

    S(
        22,
        151,
        "Mew",
        ["PSIQUICO"],
        [100,100,100,100,100,100],
        null,
        [],
        "Un Pokémon extremadamente raro que contiene la información genética de numerosas especies."
    );

    S(
        23,
        494,
        "Victini",
        ["PSIQUICO","FUEGO"],
        [100,100,100,100,100,100],
        null,
        [],
        "Se dice que transmite una energía extraordinaria a quienes establecen un fuerte vínculo con él."
    );

    S(
        24,
        720,
        "Hoopa",
        ["PSIQUICO","FANTASMA"],
        [80,110,60,150,130,70],
        null,
        [],
        "Utiliza sus misteriosos anillos para trasladar objetos y seres a grandes distancias."
    );

    // --- 025-027: Geodude, Graveler, Golem ---
    S(25, 74, "Geodude", ["ROCA","TIERRA"], [40,80,100,30,30,20], null, [75], "Se confunde fácilmente con una roca normal del suelo.");
    S(26, 75, "Graveler", ["ROCA","TIERRA"], [55,95,115,45,45,35], 74, [76], "Le gusta rodar por las laderas de las montañas.");
    S(27, 76, "Golem", ["ROCA","TIERRA"], [80,120,130,55,65,45], 75, [], "Su armadura de piedra es tan dura que resiste explosiones.");

    // =========================================================
    // 028-030: CELEBI, ZERAORA, VOLCANION
    // =========================================================

    S(
        28,
        251,
        "Celebi",
        ["PSIQUICO","PLANTA"],
        [100,100,100,100,100,100],
        null,
        [],
        "Un misterioso Pokémon capaz de viajar a través del tiempo y estrechamente ligado a los bosques."
    );

    S(
        29,
        807,
        "Zeraora",
        ["ELECTRICO"],
        [88,112,75,102,80,143],
        null,
        [],
        "Genera poderosas corrientes eléctricas y se desplaza a una velocidad extraordinaria."
    );

    S(
        30,
        721,
        "Volcanion",
        ["FUEGO","AGUA"],
        [80,110,120,130,90,70],
        null,
        [],
        "Expulsa vapor a enorme presión utilizando el agua y el fuego almacenados en su cuerpo."
    );

    // --- 031-033: Swinub, Piloswine, Mamoswine ---
    S(31, 220, "Swinub", ["HIELO","TIERRA"], [50,50,40,30,30,50], null, [221], "Usa su nariz sensible para buscar comida bajo la nieve.");
    S(32, 221, "Piloswine", ["HIELO","TIERRA"], [100,100,80,60,60,50], 220, [473], "Su pelaje largo le protege del frío más extremo.");
    S(33, 473, "Mamoswine", ["HIELO","TIERRA"], [110,130,80,70,60,80], 221, [], "Tiene colmillos masivos que crecen a lo largo de su vida.");

    // --- 034-036: Aron, Lairon, Aggron ---
    S(34, 304, "Aron", ["ACERO","ROCA"], [50,70,100,40,40,30], null, [305], "Se alimenta de hierro para fortalecer su armadura.");
    S(35, 305, "Lairon", ["ACERO","ROCA"], [60,90,140,50,50,40], 304, [306], "Lucha contra otros Lairon por territorio golpeando sus corazas.");
    S(36, 306, "Aggron", ["ACERO","ROCA"], [70,110,180,60,60,50], 305, [], "Es el protector natural de las montañas que habita.");

    // --- 037-039: Zubat, Golbat, Crobat ---
    S(37, 41, "Zubat", ["VENENO","VOLADOR"], [40,45,35,30,40,55], null, [42], "Vive en cuevas oscuras y utiliza ultrasonidos para orientarse.");
    S(38, 42, "Golbat", ["VENENO","VOLADOR"], [75,80,70,65,75,90], 41, [169], "Se alimenta de la sangre de otros Pokémon sin ser detectado.");
    S(39, 169, "Crobat", ["VENENO","VOLADOR"], [85,90,80,70,80,130], 42, [], "Sus cuatro alas le permiten volar en completo silencio.");

    // --- 040-042: Gastly, Haunter, Gengar ---
    S(40, 92, "Gastly", ["FANTASMA","VENENO"], [30,35,30,100,35,80], null, [93], "Compuesto mayoritariamente por gas venenoso.");
    S(41, 93, "Haunter", ["FANTASMA","VENENO"], [45,50,45,115,55,95], 92, [94], "Se esconde entre las sombras para asustar a los viajeros.");
    S(42, 94, "Gengar", ["FANTASMA","VENENO"], [60,65,60,130,75,110], 93, [], "Se dice que se oculta en la sombra de la gente.");

    // --- 043-045: Poliwag, Poliwhirl, Poliwrath ---
    S(43, 60, "Poliwag", ["AGUA"], [40,50,40,40,40,90], null, [61], "Su piel es tan fina que se puede ver su espiral intestinal.");
    S(44, 61, "Poliwhirl", ["AGUA"], [65,65,65,50,50,90], 60, [62], "Su espiral brilla cuando se siente relajado.");
    S(45, 62, "Poliwrath", ["AGUA","LUCHA"], [90,95,95,70,90,70], 61, [], "Es un experto nadador y luchador incansable.");

    // --- 046-048: Lotad, Lombre, Ludicolo ---
    S(46, 270, "Lotad", ["AGUA","PLANTA"], [40,30,30,40,50,30], null, [271], "Flota en estanques con su nenúfar en la cabeza.");
    S(47, 271, "Lombre", ["AGUA","PLANTA"], [60,50,50,60,70,50], 270, [272], "Le gusta salir de noche y asustar a la gente.");
    S(48, 272, "Ludicolo", ["AGUA","PLANTA"], [80,70,70,90,100,70], 271, [], "Su alegría es contagiosa y le encanta bailar.");

    // --- 049-051: Sandile, Krokorok, Krookodile ---
    S(49, 551, "Sandile", ["TIERRA","SINIESTRO"], [50,72,35,35,35,65], null, [552], "Se oculta bajo la arena esperando pacientemente a su presa.");
    S(50, 552, "Krokorok", ["TIERRA","SINIESTRO"], [60,82,45,45,45,74], 551, [553], "Sus ojos le permiten ver incluso en la oscuridad más absoluta.");
    S(51, 553, "Krookodile", ["TIERRA","SINIESTRO"], [95,117,80,65,70,92], 552, [], "Es el depredador alfa de los desiertos.");

    // --- 052-054: Starly, Staravia, Staraptor ---
    S(52, 396, "Starly", ["NORMAL","VOLADOR"], [40,55,30,30,30,60], null, [397], "Forman grandes bandadas para protegerse de los ataques.");
    S(53, 397, "Staravia", ["NORMAL","VOLADOR"], [55,75,50,40,40,80], 396, [398], "Son muy territoriales y pelean constantemente.");
    S(54, 398, "Staraptor", ["NORMAL","VOLADOR"], [85,120,70,50,60,100], 397, [], "Posee una fuerza increíble en sus alas.");

    // --- 055-057: Rookidee, Corvisquire, Corviknight ---
    S(55, 821, "Rookidee", ["VOLADOR"], [38,47,35,33,35,57], null, [822], "Un pájaro pequeño pero muy valiente y curioso.");
    S(56, 822, "Corvisquire", ["VOLADOR"], [68,67,55,43,55,77], 821, [823], "Es muy inteligente y aprende observando a los humanos.");
    S(57, 823, "Corviknight", ["VOLADOR","ACERO"], [98,87,105,53,85,67], 822, [], "Su armadura metálica lo hace un guerrero formidable.");

    // --- 058-060: Pichu, Pikachu, Raichu ---
    S(58, 172, "Pichu", ["ELECTRICO"], [20,40,15,35,35,60], null, [25], "Es muy joven y aún no controla bien su electricidad.");
    S(59, 25, "Pikachu", ["ELECTRICO"], [35,55,40,50,50,90], 172, [26], "Almacena electricidad en sus mejillas rojas.");
    S(60, 26, "Raichu", ["ELECTRICO"], [60,90,55,90,80,110], 25, [], "Si se carga demasiado, libera el exceso por su cola.");

    // --- 061-062: Growlithe, Arcanine ---
    S(61, 58, "Growlithe", ["FUEGO"], [55,70,45,70,50,60], null, [59], "Es un compañero muy leal y valiente.");
    S(62, 59, "Arcanine", ["FUEGO"], [90,110,80,100,80,95], 58, [], "Corre con tanta elegancia que parece volar.");

    // --- 063-065: Charmander, Charmeleon, Charizard ---
    S(63, 4, "Charmander", ["FUEGO"], [39,52,43,60,50,65], null, [5], "La llama de su cola indica su estado de salud.");
    S(64, 5, "Charmeleon", ["FUEGO"], [58,64,58,80,65,80], 4, [6], "Es muy agresivo y busca siempre una lucha desafiante.");
    S(65, 6, "Charizard", ["FUEGO","VOLADOR"], [78,84,78,109,85,100], 5, [], "Su aliento de fuego puede derretir casi cualquier cosa.");

    // --- 066-067: Magikarp, Gyarados ---
    S(66, 129, "Magikarp", ["AGUA"], [20,10,55,15,20,80], null, [130], "Es considerado el Pokémon más débil del mundo.");
    S(67, 130, "Gyarados", ["AGUA","VOLADOR"], [95,125,79,60,100,81], 129, [], "Una vez que se enfurece, no hay quien lo detenga.");

    // --- 068-070: Squirtle, Wartortle, Blastoise ---
    S(68, 7, "Squirtle", ["AGUA"], [44,48,65,50,64,43], null, [8], "Se esconde en su caparazón para protegerse.");
    S(69, 8, "Wartortle", ["AGUA"], [59,63,80,65,80,58], 7, [9], "Sus orejas y cola le sirven de timón al nadar.");
    S(70, 9, "Blastoise", ["AGUA"], [79,83,100,85,105,78], 8, [], "Sus cañones de agua son extremadamente precisos.");

    // --- 071-072: Feebas, Milotic ---
    S(71, 349, "Feebas", ["AGUA"], [20,15,20,10,55,80], null, [350], "Vive en aguas estancadas y poco pobladas.");
    S(72, 350, "Milotic", ["AGUA"], [95,60,79,100,125,81], 349, [], "Se dice que es el Pokémon más bello que existe.");

    // --- 073-081: Eevee y evoluciones ---
    S(73, 133, "Eevee", ["NORMAL"], [55,55,50,45,65,55], null, [134,135,136,196,197,470,471,700], "Tiene una estructura genética inestable.");
    S(74, 134, "Vaporeon", ["AGUA"], [130,65,60,110,95,65], 133, [], "Puede disolverse en el agua a voluntad.");
    S(75, 135, "Jolteon", ["ELECTRICO"], [65,65,60,110,95,130], 133, [], "Libera descargas eléctricas cuando se enfada.");
    S(76, 136, "Flareon", ["FUEGO"], [65,130,60,95,110,65], 133, [], "Acumula fuego en sus sacos internos.");
    S(77, 196, "Espeon", ["PSIQUICO"], [65,65,60,130,95,110], 133, [], "Predice el tiempo leyendo los movimientos de su pelaje.");
    S(78, 197, "Umbreon", ["SINIESTRO"], [95,65,110,60,130,65], 133, [], "Sus anillos brillan bajo la luz de la luna.");
    S(79, 470, "Leafeon", ["PLANTA"], [65,110,130,60,65,95], 133, [], "Realiza la fotosíntesis purificando el aire cercano.");
    S(80, 471, "Glaceon", ["HIELO"], [65,60,110,130,95,65], 133, [], "Puede congelar su pelaje para usarlo como agujas.");
    S(81, 700, "Sylveon", ["HADA"], [95,65,65,110,130,60], 133, [], "Sus cintas emiten un aura calmante.");

    // --- 082-083: Riolu, Lucario ---
    S(82, 447, "Riolu", ["LUCHA"], [40,70,40,35,40,60], null, [448], "Siente el aura de los seres vivos a su alrededor.");
    S(83, 448, "Lucario", ["LUCHA","ACERO"], [70,110,70,115,70,90], 447, [], "Es capaz de leer el corazón de sus enemigos.");

    // --- 084-086: Dratini, Dragonair, Dragonite ---
    S(84, 147, "Dratini", ["DRAGON"], [41,64,45,50,50,50], null, [148], "Vive en cascadas profundas y solitarias.");
    S(85, 148, "Dragonair", ["DRAGON"], [61,84,65,70,70,70], 147, [149], "Se dice que tiene el poder de controlar el clima.");
    S(86, 149, "Dragonite", ["DRAGON","VOLADOR"], [91,134,95,100,100,80], 148, [], "Puede dar la vuelta al mundo en menos de 24 horas.");

    // --- 087-090: Ralts, Kirlia, Gardevoir, Gallade ---
    S(87, 280, "Ralts", ["PSIQUICO","HADA"], [28,25,25,45,35,40], null, [281], "Siente las emociones de la gente con gran precisión.");
    S(88, 281, "Kirlia", ["PSIQUICO","HADA"], [38,35,35,65,55,50], 280, [282,475], "Baila con alegría cuando ve a su entrenador feliz.");
    S(89, 282, "Gardevoir", ["PSIQUICO","HADA"], [68,65,65,125,115,80], 281, [], "Daría su vida por proteger a su entrenador.");
    S(90, 475, "Gallade", ["PSIQUICO","LUCHA"], [68,125,65,65,115,80], 281, [], "Es un maestro de la espada y la cortesía.");

    // --- 091-093: Larvitar, Pupitar, Tyranitar ---
    S(91, 246, "Larvitar", ["ROCA","TIERRA"], [50,64,50,45,50,41], null, [247], "Se alimenta de montañas enteras mientras crece.");
    S(92, 247, "Pupitar", ["ROCA","TIERRA"], [70,84,70,65,70,51], 246, [248], "Dentro de su coraza se prepara para su evolución.");
    S(93, 248, "Tyranitar", ["ROCA","SINIESTRO"], [100,134,110,95,100,61], 247, [], "Es conocido por ser el Pokémon que derrumba montañas.");

    // --- 094-096: Caterpie, Metapod, Butterfree ---
    S(94, 10, "Caterpie", ["BICHO"], [45,30,35,20,20,45], null, [11], "Se mueve rápido para escapar de sus depredadores.");
    S(95, 11, "Metapod", ["BICHO"], [50,20,55,25,25,30], 10, [12], "Está endureciendo su caparazón para evolucionar.");
    S(96, 12, "Butterfree", ["BICHO","VOLADOR"], [60,45,50,90,80,70], 11, [], "Sus alas liberan polen tóxico mientras vuela.");

    // --- 097-098: Scyther, Scizor ---
    S(97, 123, "Scyther", ["BICHO","VOLADOR"], [70,110,80,55,80,105], null, [212], "Sus guadañas cortan troncos de árboles de un golpe.");
    S(98, 212, "Scizor", ["BICHO","ACERO"], [70,130,100,55,80,65], 123, [], "Sus pinzas pueden triturar metal con facilidad.");

    // --- 099-100: Sneasel, Weavile ---
    S(99, 215, "Sneasel", ["SINIESTRO","HIELO"], [55,95,55,35,75,115], null, [461], "Es muy astuto y suele robar huevos de otros nidos.");
    S(100, 461, "Weavile", ["SINIESTRO","HIELO"], [70,120,65,45,85,125], 215, [], "Se comunica con su manada mediante señales grabadas.");

    console.log(
        'GranadaMon: ' +
        GM.totalSpecies +
        ' especies cargadas con descripciones.'
    );

})();