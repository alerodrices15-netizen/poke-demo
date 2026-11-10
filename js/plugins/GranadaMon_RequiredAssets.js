/*:
 * @plugindesc v1.0 GranadaMon - Protege recursos dinámicos al usar Exclude unused files
 * @author OpenAI
 *
 * @help
 * GranadaMon_RequiredAssets.js
 * ------------------------------------------------------------
 * Este plugin NO modifica el funcionamiento del juego.
 *
 * Su única función es impedir que RPG Maker MV elimine durante
 * el despliegue los recursos que GranadaMon carga dinámicamente
 * mediante JavaScript.
 *
 * Debe estar activado al desplegar el proyecto.
 *
 * ============================================================
 * GMDEX - FRONT / POKÉDEX
 * ============================================================
 *
 * @requiredAssets img/pictures/GMDEX_001_Pidgey
 * @requiredAssets img/pictures/GMDEX_002_Pidgeotto
 * @requiredAssets img/pictures/GMDEX_003_Pidgeot
 * @requiredAssets img/pictures/GMDEX_004_Magnemite
 * @requiredAssets img/pictures/GMDEX_005_Magneton
 * @requiredAssets img/pictures/GMDEX_006_Magnezone
 * @requiredAssets img/pictures/GMDEX_007_Abra
 * @requiredAssets img/pictures/GMDEX_008_Kadabra
 * @requiredAssets img/pictures/GMDEX_009_Alakazam
 * @requiredAssets img/pictures/GMDEX_010_Machop
 * @requiredAssets img/pictures/GMDEX_011_Machoke
 * @requiredAssets img/pictures/GMDEX_012_Machamp
 * @requiredAssets img/pictures/GMDEX_013_Oddish
 * @requiredAssets img/pictures/GMDEX_014_Gloom
 * @requiredAssets img/pictures/GMDEX_015_Vileplume
 * @requiredAssets img/pictures/GMDEX_016_Bellsprout
 * @requiredAssets img/pictures/GMDEX_017_Weepinbell
 * @requiredAssets img/pictures/GMDEX_018_Victreebel
 * @requiredAssets img/pictures/GMDEX_019_Mareep
 * @requiredAssets img/pictures/GMDEX_020_Flaaffy
 * @requiredAssets img/pictures/GMDEX_021_Ampharos
 * @requiredAssets img/pictures/GMDEX_022_Mew
 * @requiredAssets img/pictures/GMDEX_023_Victini
 * @requiredAssets img/pictures/GMDEX_024_Hoopa
 * @requiredAssets img/pictures/GMDEX_025_Geodude
 * @requiredAssets img/pictures/GMDEX_026_Graveler
 * @requiredAssets img/pictures/GMDEX_027_Golem
 * @requiredAssets img/pictures/GMDEX_028_Celebi
 * @requiredAssets img/pictures/GMDEX_029_Zeraora
 * @requiredAssets img/pictures/GMDEX_030_Volcanion
 * @requiredAssets img/pictures/GMDEX_031_Swinub
 * @requiredAssets img/pictures/GMDEX_032_Piloswine
 * @requiredAssets img/pictures/GMDEX_033_Mamoswine
 * @requiredAssets img/pictures/GMDEX_034_Aron
 * @requiredAssets img/pictures/GMDEX_035_Lairon
 * @requiredAssets img/pictures/GMDEX_036_Aggron
 * @requiredAssets img/pictures/GMDEX_037_Zubat
 * @requiredAssets img/pictures/GMDEX_038_Golbat
 * @requiredAssets img/pictures/GMDEX_039_Crobat
 * @requiredAssets img/pictures/GMDEX_040_Gastly
 * @requiredAssets img/pictures/GMDEX_041_Haunter
 * @requiredAssets img/pictures/GMDEX_042_Gengar
 * @requiredAssets img/pictures/GMDEX_043_Poliwag
 * @requiredAssets img/pictures/GMDEX_044_Poliwhirl
 * @requiredAssets img/pictures/GMDEX_045_Poliwrath
 * @requiredAssets img/pictures/GMDEX_046_Lotad
 * @requiredAssets img/pictures/GMDEX_047_Lombre
 * @requiredAssets img/pictures/GMDEX_048_Ludicolo
 * @requiredAssets img/pictures/GMDEX_049_Sandile
 * @requiredAssets img/pictures/GMDEX_050_Krokorok
 * @requiredAssets img/pictures/GMDEX_051_Krookodile
 * @requiredAssets img/pictures/GMDEX_052_Starly
 * @requiredAssets img/pictures/GMDEX_053_Staravia
 * @requiredAssets img/pictures/GMDEX_054_Staraptor
 * @requiredAssets img/pictures/GMDEX_055_Rookidee
 * @requiredAssets img/pictures/GMDEX_056_Corvisquire
 * @requiredAssets img/pictures/GMDEX_057_Corviknight
 * @requiredAssets img/pictures/GMDEX_058_Pichu
 * @requiredAssets img/pictures/GMDEX_059_Pikachu
 * @requiredAssets img/pictures/GMDEX_060_Raichu
 * @requiredAssets img/pictures/GMDEX_061_Growlithe
 * @requiredAssets img/pictures/GMDEX_062_Arcanine
 * @requiredAssets img/pictures/GMDEX_063_Charmander
 * @requiredAssets img/pictures/GMDEX_064_Charmeleon
 * @requiredAssets img/pictures/GMDEX_065_Charizard
 * @requiredAssets img/pictures/GMDEX_066_Magikarp
 * @requiredAssets img/pictures/GMDEX_067_Gyarados
 * @requiredAssets img/pictures/GMDEX_068_Squirtle
 * @requiredAssets img/pictures/GMDEX_069_Wartortle
 * @requiredAssets img/pictures/GMDEX_070_Blastoise
 * @requiredAssets img/pictures/GMDEX_071_Feebas
 * @requiredAssets img/pictures/GMDEX_072_Milotic
 * @requiredAssets img/pictures/GMDEX_073_Eevee
 * @requiredAssets img/pictures/GMDEX_074_Vaporeon
 * @requiredAssets img/pictures/GMDEX_075_Jolteon
 * @requiredAssets img/pictures/GMDEX_076_Flareon
 * @requiredAssets img/pictures/GMDEX_077_Espeon
 * @requiredAssets img/pictures/GMDEX_078_Umbreon
 * @requiredAssets img/pictures/GMDEX_079_Leafeon
 * @requiredAssets img/pictures/GMDEX_080_Glaceon
 * @requiredAssets img/pictures/GMDEX_081_Sylveon
 * @requiredAssets img/pictures/GMDEX_082_Riolu
 * @requiredAssets img/pictures/GMDEX_083_Lucario
 * @requiredAssets img/pictures/GMDEX_084_Dratini
 * @requiredAssets img/pictures/GMDEX_085_Dragonair
 * @requiredAssets img/pictures/GMDEX_086_Dragonite
 * @requiredAssets img/pictures/GMDEX_087_Ralts
 * @requiredAssets img/pictures/GMDEX_088_Kirlia
 * @requiredAssets img/pictures/GMDEX_089_Gardevoir
 * @requiredAssets img/pictures/GMDEX_090_Gallade
 * @requiredAssets img/pictures/GMDEX_091_Larvitar
 * @requiredAssets img/pictures/GMDEX_092_Pupitar
 * @requiredAssets img/pictures/GMDEX_093_Tyranitar
 * @requiredAssets img/pictures/GMDEX_094_Caterpie
 * @requiredAssets img/pictures/GMDEX_095_Metapod
 * @requiredAssets img/pictures/GMDEX_096_Butterfree
 * @requiredAssets img/pictures/GMDEX_097_Scyther
 * @requiredAssets img/pictures/GMDEX_098_Scizor
 * @requiredAssets img/pictures/GMDEX_099_Sneasel
 * @requiredAssets img/pictures/GMDEX_100_Weavile
 *
 * ============================================================
 * GMBTL - BACK SPRITES
 * ============================================================
 *
 * @requiredAssets img/pictures/GMBTL_001_Pidgey_Back
 * @requiredAssets img/pictures/GMBTL_002_Pidgeotto_Back
 * @requiredAssets img/pictures/GMBTL_003_Pidgeot_Back
 * @requiredAssets img/pictures/GMBTL_004_Magnemite_Back
 * @requiredAssets img/pictures/GMBTL_005_Magneton_Back
 * @requiredAssets img/pictures/GMBTL_006_Magnezone_Back
 * @requiredAssets img/pictures/GMBTL_007_Abra_Back
 * @requiredAssets img/pictures/GMBTL_008_Kadabra_Back
 * @requiredAssets img/pictures/GMBTL_009_Alakazam_Back
 * @requiredAssets img/pictures/GMBTL_010_Machop_Back
 * @requiredAssets img/pictures/GMBTL_011_Machoke_Back
 * @requiredAssets img/pictures/GMBTL_012_Machamp_Back
 * @requiredAssets img/pictures/GMBTL_013_Oddish_Back
 * @requiredAssets img/pictures/GMBTL_014_Gloom_Back
 * @requiredAssets img/pictures/GMBTL_015_Vileplume_Back
 * @requiredAssets img/pictures/GMBTL_016_Bellsprout_Back
 * @requiredAssets img/pictures/GMBTL_017_Weepinbell_Back
 * @requiredAssets img/pictures/GMBTL_018_Victreebel_Back
 * @requiredAssets img/pictures/GMBTL_019_Mareep_Back
 * @requiredAssets img/pictures/GMBTL_020_Flaaffy_Back
 * @requiredAssets img/pictures/GMBTL_021_Ampharos_Back
 * @requiredAssets img/pictures/GMBTL_022_Mew_Back
 * @requiredAssets img/pictures/GMBTL_023_Victini_Back
 * @requiredAssets img/pictures/GMBTL_024_Hoopa_Back
 * @requiredAssets img/pictures/GMBTL_025_Geodude_Back
 * @requiredAssets img/pictures/GMBTL_026_Graveler_Back
 * @requiredAssets img/pictures/GMBTL_027_Golem_Back
 * @requiredAssets img/pictures/GMBTL_028_Celebi_Back
 * @requiredAssets img/pictures/GMBTL_029_Zeraora_Back
 * @requiredAssets img/pictures/GMBTL_030_Volcanion_Back
 * @requiredAssets img/pictures/GMBTL_031_Swinub_Back
 * @requiredAssets img/pictures/GMBTL_032_Piloswine_Back
 * @requiredAssets img/pictures/GMBTL_033_Mamoswine_Back
 * @requiredAssets img/pictures/GMBTL_034_Aron_Back
 * @requiredAssets img/pictures/GMBTL_035_Lairon_Back
 * @requiredAssets img/pictures/GMBTL_036_Aggron_Back
 * @requiredAssets img/pictures/GMBTL_037_Zubat_Back
 * @requiredAssets img/pictures/GMBTL_038_Golbat_Back
 * @requiredAssets img/pictures/GMBTL_039_Crobat_Back
 * @requiredAssets img/pictures/GMBTL_040_Gastly_Back
 * @requiredAssets img/pictures/GMBTL_041_Haunter_Back
 * @requiredAssets img/pictures/GMBTL_042_Gengar_Back
 * @requiredAssets img/pictures/GMBTL_043_Poliwag_Back
 * @requiredAssets img/pictures/GMBTL_044_Poliwhirl_Back
 * @requiredAssets img/pictures/GMBTL_045_Poliwrath_Back
 * @requiredAssets img/pictures/GMBTL_046_Lotad_Back
 * @requiredAssets img/pictures/GMBTL_047_Lombre_Back
 * @requiredAssets img/pictures/GMBTL_048_Ludicolo_Back
 * @requiredAssets img/pictures/GMBTL_049_Sandile_Back
 * @requiredAssets img/pictures/GMBTL_050_Krokorok_Back
 * @requiredAssets img/pictures/GMBTL_051_Krookodile_Back
 * @requiredAssets img/pictures/GMBTL_052_Starly_Back
 * @requiredAssets img/pictures/GMBTL_053_Staravia_Back
 * @requiredAssets img/pictures/GMBTL_054_Staraptor_Back
 * @requiredAssets img/pictures/GMBTL_055_Rookidee_Back
 * @requiredAssets img/pictures/GMBTL_056_Corvisquire_Back
 * @requiredAssets img/pictures/GMBTL_057_Corviknight_Back
 * @requiredAssets img/pictures/GMBTL_058_Pichu_Back
 * @requiredAssets img/pictures/GMBTL_059_Pikachu_Back
 * @requiredAssets img/pictures/GMBTL_060_Raichu_Back
 * @requiredAssets img/pictures/GMBTL_061_Growlithe_Back
 * @requiredAssets img/pictures/GMBTL_062_Arcanine_Back
 * @requiredAssets img/pictures/GMBTL_063_Charmander_Back
 * @requiredAssets img/pictures/GMBTL_064_Charmeleon_Back
 * @requiredAssets img/pictures/GMBTL_065_Charizard_Back
 * @requiredAssets img/pictures/GMBTL_066_Magikarp_Back
 * @requiredAssets img/pictures/GMBTL_067_Gyarados_Back
 * @requiredAssets img/pictures/GMBTL_068_Squirtle_Back
 * @requiredAssets img/pictures/GMBTL_069_Wartortle_Back
 * @requiredAssets img/pictures/GMBTL_070_Blastoise_Back
 * @requiredAssets img/pictures/GMBTL_071_Feebas_Back
 * @requiredAssets img/pictures/GMBTL_072_Milotic_Back
 * @requiredAssets img/pictures/GMBTL_073_Eevee_Back
 * @requiredAssets img/pictures/GMBTL_074_Vaporeon_Back
 * @requiredAssets img/pictures/GMBTL_075_Jolteon_Back
 * @requiredAssets img/pictures/GMBTL_076_Flareon_Back
 * @requiredAssets img/pictures/GMBTL_077_Espeon_Back
 * @requiredAssets img/pictures/GMBTL_078_Umbreon_Back
 * @requiredAssets img/pictures/GMBTL_079_Leafeon_Back
 * @requiredAssets img/pictures/GMBTL_080_Glaceon_Back
 * @requiredAssets img/pictures/GMBTL_081_Sylveon_Back
 * @requiredAssets img/pictures/GMBTL_082_Riolu_Back
 * @requiredAssets img/pictures/GMBTL_083_Lucario_Back
 * @requiredAssets img/pictures/GMBTL_084_Dratini_Back
 * @requiredAssets img/pictures/GMBTL_085_Dragonair_Back
 * @requiredAssets img/pictures/GMBTL_086_Dragonite_Back
 * @requiredAssets img/pictures/GMBTL_087_Ralts_Back
 * @requiredAssets img/pictures/GMBTL_088_Kirlia_Back
 * @requiredAssets img/pictures/GMBTL_089_Gardevoir_Back
 * @requiredAssets img/pictures/GMBTL_090_Gallade_Back
 * @requiredAssets img/pictures/GMBTL_091_Larvitar_Back
 * @requiredAssets img/pictures/GMBTL_092_Pupitar_Back
 * @requiredAssets img/pictures/GMBTL_093_Tyranitar_Back
 * @requiredAssets img/pictures/GMBTL_094_Caterpie_Back
 * @requiredAssets img/pictures/GMBTL_095_Metapod_Back
 * @requiredAssets img/pictures/GMBTL_096_Butterfree_Back
 * @requiredAssets img/pictures/GMBTL_097_Scyther_Back
 * @requiredAssets img/pictures/GMBTL_098_Scizor_Back
 * @requiredAssets img/pictures/GMBTL_099_Sneasel_Back
 * @requiredAssets img/pictures/GMBTL_100_Weavile_Back
 *
 * ============================================================
 * FONDOS Y OBJETOS CARGADOS POR CÓDIGO
 * ============================================================
 *
 * @requiredAssets img/pictures/GM_Capture_BG
 * @requiredAssets img/pictures/GM_Battle_BG
 *
 * @requiredAssets img/pictures/GM_Ball_Poke
 * @requiredAssets img/pictures/GM_Ball_Super
 * @requiredAssets img/pictures/GM_Ball_Ultra
 *
 * @requiredAssets img/pictures/GM_Item_Potion
 * @requiredAssets img/pictures/GM_Item_Revive
 * @requiredAssets img/pictures/GM_Item_GymBadge
 * @requiredAssets img/pictures/GM_Item_Candy
 */

(function() {
    'use strict';

    console.log(
        'GranadaMon RequiredAssets v1.0 cargado: recursos dinámicos protegidos.'
    );

})();