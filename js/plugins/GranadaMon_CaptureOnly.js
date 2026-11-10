/*:
 * @plugindesc v7.2 GranadaMon - Captura GO con puntería real + balance suavizado
 * @author OpenAI
 *
 * @help
 * GranadaMon_CaptureOnly.js
 * ------------------------------------------------------------
 * REQUIERE:
 * - GranadaMon_Core
 * - GranadaMon_Bag
 * - GranadaMon_Capture
 * - GranadaMon_BattleSprites
 *
 * FONDO:
 *   img/pictures/GM_Capture_BG.png
 *
 * COMANDOS:
 *   GranadaMonCaptureOnlyGD 59 5
 *   GranadaMonCaptureOnly 25 5
 *
 * BALANCE:
 *   GranadaMonCaptureRates 40
 *
 * CONTROLES:
 * - Izquierda / Derecha: cambiar Poké Ball
 * - OK / Enter: lanzar
 * - Esc: abandonar
 * - Ratón/táctil: pulsa SALIR para abandonar
 * - Ratón/táctil: toca una Ball para seleccionarla
 * - Táctil/ratón: coge la Ball, apunta y desliza hacia arriba para lanzar
 * - La dirección REAL del gesto determina si aciertas o fallas al Pokémon.
 *
 * PUNTERÍA:
 * - Un lanzamiento demasiado a izquierda/derecha falla físicamente.
 * - Si golpeas al Pokémon pero no el círculo, no recibes bonus de timing.
 * - Si golpeas dentro del círculo: Bien / Genial / Excelente según su tamaño.
 *
 * BALANCE DE CAPTURA SUAVIZADO:
 * - Recupera la puntería real de la versión 7.1, pero con captura menos dura.
 * - Base según nivel:
 *     66% - (nivel × 0,55%)
 *     mínimo 18%, máximo 63,5%
 * - Poké Ball   x1.00
 * - Super Ball  x1.35
 * - Ultra Ball  x1.70
 * - Master Ball 100%
 * - Timing:
 *     Normal     x0.78
 *     Bien       x0.95
 *     Genial     x1.10
 *     Excelente  x1.25
 * - Máximo sin Master Ball: 88%
 *
 * REGLAS DEL EVENTO:
 * - SOLO una captura exitosa elimina el evento.
 * - Si huye, abandonas o te quedas sin Balls, el evento permanece.
 */
(function(){'use strict';
window.GranadaMon=window.GranadaMon||{}
;
var GM=window.GranadaMon;
var BG_NAME='GM_Capture_BG';
var MAX_POKEMON_HEIGHT=150;
var RING_MAX=74;
var RING_MIN=20;
var ENTRANCE_FRAMES=42;
var AIM_SENSITIVITY=0.95;
var AIM_MIN_HIT_RADIUS=46;
var AIM_MAX_HIT_RADIUS=96;
GM.CaptureOnly=GM.CaptureOnly||{}
;
GM.CaptureOnly.pending=null;
GM.CaptureOnly.version='7.2';
function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value||0)));
}
function depsOK(){var ok=!!(GM.getSpecies&&GM.getSpeciesByGranadaDex&&GM.createPokemon&&GM.markSeen&&GM.markCaught&&GM.getItemQuantity&&GM.loseItem&&GM.BallVisuals&&GM.BallVisuals.bitmap&&GM.Capture&&GM.Capture.getBagBalls&&GM.Capture.createBallSprite&&GM.BattleSprites&&GM.BattleSprites.frontFilename);
if(!ok){console.error('GranadaMon_CaptureOnly v7.2: falta alguna dependencia.');
if(window.$gameMessage){$gameMessage.add('Error de captura. Abre F8 y revisa la consola.');
}
}
return ok;
}
function roundedPath(ctx,x,y,w,h,radius){radius=Math.max(0,Math.min(radius,w/2,h/2));
ctx.beginPath();
ctx.moveTo(x+radius,y);
ctx.lineTo(x+w-radius,y);
ctx.quadraticCurveTo(x+w,y,x+w,y+radius);
ctx.lineTo(x+w,y+h-radius);
ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
ctx.lineTo(x+radius,y+h);
ctx.quadraticCurveTo(x,y+h,x,y+h-radius);
ctx.lineTo(x,y+radius);
ctx.quadraticCurveTo(x,y,x+radius,y);
ctx.closePath();
}
function roundRect(bitmap,x,y,w,h,radius,fill,alpha,stroke,lineWidth){if(!bitmap||!bitmap._context){return;
}
var ctx=bitmap._context;
ctx.save();
roundedPath(ctx,x,y,w,h,radius);
ctx.globalAlpha=alpha==null?1:alpha;
ctx.fillStyle=fill;
ctx.fill();
if(stroke){ctx.globalAlpha=1;
ctx.strokeStyle=stroke;
ctx.lineWidth=Number(lineWidth||2);
ctx.stroke();
}
ctx.restore();
bitmap._setDirty();
}
function ellipse(bitmap,cx,cy,rx,ry,color,alpha){if(!bitmap||!bitmap._context){return;
}
var ctx=bitmap._context;
ctx.save();
ctx.globalAlpha=alpha==null?1:alpha;
ctx.fillStyle=color;
ctx.beginPath();
if(ctx.ellipse){ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
}
else{ctx.translate(cx,cy);
ctx.scale(rx,ry);
ctx.arc(0,0,1,0,Math.PI*2,false);
}
ctx.fill();
ctx.restore();
bitmap._setDirty();
}
function fitCover(sprite){if(!sprite||!sprite.bitmap||!sprite.bitmap.width||!sprite.bitmap.height){return;
}
var sx=Graphics.boxWidth/sprite.bitmap.width;
var sy=Graphics.boxHeight/sprite.bitmap.height;
var scale=Math.max(sx,sy);
sprite.scale.x=scale;
sprite.scale.y=scale;
sprite.x=Math.round((Graphics.boxWidth-sprite.bitmap.width*scale)/2);
sprite.y=Math.round((Graphics.boxHeight-sprite.bitmap.height*scale)/2);
}
function percent(value){return Math.round(clamp(value,0,1)*100);
}
GM.CaptureOnly.levelBaseChance=function(level){level=clamp(Math.floor(Number(level||1)),1,100);
return clamp(0.66-level*0.0055,0.18,0.635);
}
;
GM.CaptureOnly.ballMultiplier=function(ballKey){ballKey=String(ballKey||'').toUpperCase();
if(ballKey==='SUPER_BALL'){return 1.35;
}
if(ballKey==='ULTRA_BALL'){return 1.70;
}
if(ballKey==='MASTER_BALL'){return Infinity;
}
return 1.00;
}
;
GM.CaptureOnly.timing=function(ratio){ratio=clamp(ratio,0,1);
if(ratio<=0.22){return{grade:'EXCELLENT',text:'¡Excelente!',mult:1.25}
;
}
if(ratio<=0.42){return{grade:'GREAT',text:'¡Genial!',mult:1.10}
;
}
if(ratio<=0.68){return{grade:'GOOD',text:'¡Bien!',mult:0.95}
;
}
return{grade:'NORMAL',text:'',mult:0.78}
;
}
;
GM.CaptureOnly.baseChance=function(pokemon,ballKey){ballKey=String(ballKey||'').toUpperCase();
if(ballKey==='MASTER_BALL'){return 1;
}
var level=pokemon?Math.max(1,Number(pokemon.level||1)):1;
var base=GM.CaptureOnly.levelBaseChance(level);
var mult=GM.CaptureOnly.ballMultiplier(ballKey);
if(!isFinite(mult)){return 1;
}
return clamp(base*mult,0.12,0.86);
}
;
GM.CaptureOnly.finalChance=function(pokemon,ballKey,ringRatio){ballKey=String(ballKey||'').toUpperCase();
if(ballKey==='MASTER_BALL'){return 1;
}
var timing=GM.CaptureOnly.timing(ringRatio);
var chance=GM.CaptureOnly.baseChance(pokemon,ballKey)*timing.mult;
return clamp(chance,0.08,0.88);
}
;
GM.CaptureOnly.aimData=function(scene,releaseX,releaseY,startX,startY){var targetX=scene&&scene._pokemonSprite?Number(scene._pokemonSprite.x||Graphics.boxWidth/2):Graphics.boxWidth/2;
var targetY=scene&&scene.pokemonCenterY?Number(scene.pokemonCenterY()):Math.round(Graphics.boxHeight*0.40);
releaseX=Number(releaseX);
releaseY=Number(releaseY);
startX=Number(startX);
startY=Number(startY);
var hasGesture=isFinite(releaseX)&&isFinite(releaseY)&&isFinite(startX)&&isFinite(startY);
if(!hasGesture){return{hit:true,ringHit:true,aimX:targetX,aimY:targetY,offsetX:0,hitRadius:AIM_MAX_HIT_RADIUS,side:'',pointer:false}
;
}
var gestureDx=releaseX-startX;
var gestureDy=releaseY-startY;
if(gestureDy>-10){gestureDy=-10;
}
var remainingY=targetY-releaseY;
var slopeXPerY=gestureDx/gestureDy;
var aimX=releaseX+remainingY*slopeXPerY*AIM_SENSITIVITY;
aimX=clamp(aimX,-140,Graphics.boxWidth+140);
var visualWidth=120;
if(scene&&scene._pokemonSprite&&scene._pokemonSprite.bitmap&&scene._pokemonSprite.bitmap.width){visualWidth=scene._pokemonSprite.bitmap.width*Math.abs(scene._pokemonSprite.scale.x||1);
}
var hitRadius=clamp(visualWidth*0.38,AIM_MIN_HIT_RADIUS,AIM_MAX_HIT_RADIUS);
var offsetX=aimX-targetX;
var hit=Math.abs(offsetX)<=hitRadius;
var ringRadius=scene?Number(scene._ringRadius||RING_MAX):RING_MAX;
var ringHit=hit&&Math.abs(offsetX)<=ringRadius;
return{hit:hit,ringHit:ringHit,aimX:aimX,aimY:targetY,offsetX:offsetX,hitRadius:hitRadius,side:offsetX<0?'izquierda':'derecha',pointer:true}
;
}
;
GM.CaptureOnly.color=function(chance){chance=clamp(chance,0,1);
if(chance>=0.65){return'#4bd47b';
}
if(chance>=0.42){return'#e5ce4b';
}
if(chance>=0.24){return'#ef9b3c';
}
return'#e55757';
}
;
GM.CaptureOnly.difficultyLabel=function(chance){chance=clamp(chance,0,1);
if(chance>=0.65){return{text:'FÁCIL',color:'#4bd47b'}
;
}
if(chance>=0.42){return{text:'MEDIA',color:'#e5ce4b'}
;
}
if(chance>=0.24){return{text:'DIFÍCIL',color:'#ef9b3c'}
;
}
return{text:'MUY DIFÍCIL',color:'#e55757'}
;
}
;
GM.CaptureOnly.roll=function(pokemon,ballKey,ringRatio){ballKey=String(ballKey||'').toUpperCase();
var timing=GM.CaptureOnly.timing(ringRatio);
if(ballKey==='MASTER_BALL'){return{captured:true,shakes:3,chance:1,timing:timing,text:timing.text||'¡Excelente!'}
;
}
var chance=GM.CaptureOnly.finalChance(pokemon,ballKey,ringRatio);
var roll=Math.random();
if(roll<chance){return{captured:true,shakes:3,chance:chance,timing:timing,text:timing.text}
;
}
var miss=(roll-chance)/Math.max(0.0001,1-chance);
var shakes=0;
if(miss<0.16){shakes=3;
}
else if(miss<0.39){shakes=2;
}
else if(miss<0.68){shakes=1;
}
return{captured:false,shakes:shakes,chance:chance,timing:timing,text:timing.text}
;
}
;
GM.CaptureOnly.fleeChance=function(pokemon,failures){failures=Math.max(0,Number(failures||0));
if(failures<2){return 0;
}
var table={2:0.08,3:0.16,4:0.28,5:0.42,6:0.58,7:0.72}
;
var chance=failures>=8?0.82:Number(table[failures]||0);
var level=pokemon?Math.max(1,Number(pokemon.level||1)):1;
chance+=Math.min(0.08,level*0.0012);
return clamp(chance,0,0.88);
}
;
GM.CaptureOnly.ratesForLevel=function(level){level=clamp(Math.floor(Number(level||1)),1,100);
var fake={level:level}
;
var keys=['POKE_BALL','SUPER_BALL','ULTRA_BALL','MASTER_BALL'];
var result=[];
for(var i=0;
i<keys.length;
i++){var key=keys[i];
result.push({key:key,normal:GM.CaptureOnly.finalChance(fake,key,0.90),good:GM.CaptureOnly.finalChance(fake,key,0.60),great:GM.CaptureOnly.finalChance(fake,key,0.40),excellent:GM.CaptureOnly.finalChance(fake,key,0.20)}
);
}
return result;
}
;
GM.CaptureOnly.behaviorWeights=function(level){level=clamp(Math.floor(Number(level||1)),1,100);
if(level<=15){return{calm:0.70,restless:0.20,evasive:0.08,aggressive:0.02}
;
}
if(level<=30){return{calm:0.30,restless:0.45,evasive:0.20,aggressive:0.05}
;
}
if(level<=45){return{calm:0.10,restless:0.35,evasive:0.40,aggressive:0.15}
;
}
return{calm:0.05,restless:0.20,evasive:0.40,aggressive:0.35}
;
}
;
GM.CaptureOnly.pickBehavior=function(level){var weights=GM.CaptureOnly.behaviorWeights(level);
var roll=Math.random();
var order=['calm','restless','evasive','aggressive'];
var acc=0;
for(var i=0;
i<order.length;
i++){var key=order[i];
acc+=Number(weights[key]||0);
if(roll<=acc){return key;
}
}
return'restless';
}
;
GM.CaptureOnly.behaviorData=function(kind){var table={calm:{name:'CALMADO',ringMult:0.90,minDelay:300,maxExtra:260,actions:['hop','feint','hop','idlelook']}
,restless:{name:'INQUIETO',ringMult:1.00,minDelay:205,maxExtra:220,actions:['hop','sidestep','feint','sidestep']}
,evasive:{name:'ESQUIVO',ringMult:1.08,minDelay:155,maxExtra:190,actions:['sidestep','sidestep','hop','feint']}
,aggressive:{name:'AGRESIVO',ringMult:1.15,minDelay:125,maxExtra:170,actions:['charge','feint','charge','hop']}
}
;
return(table[String(kind||'').toLowerCase()]||table.restless);
}
;
GM.CaptureOnly.moodData=function(failures){failures=Math.max(0,Number(failures||0));
if(failures<=0){return{name:'TRANQUILO',ringMult:1.00,actionMult:1.00}
;
}
if(failures===1){return{name:'ALERTA',ringMult:1.03,actionMult:0.92}
;
}
if(failures===2){return{name:'NERVIOSO',ringMult:1.06,actionMult:0.84}
;
}
if(failures===3){return{name:'INQUIETO',ringMult:1.09,actionMult:0.78}
;
}
return{name:'TENSO',ringMult:1.12,actionMult:0.72}
;
}
;
GM.CaptureOnly.failureText=function(pokemon,shakes){var name=pokemon&&pokemon.name?pokemon.name:'El Pokémon';
shakes=Math.max(0,Number(shakes||0));
if(shakes>=3){return('¡No puede ser! ¡'+name+' escapó en el último instante!');
}
if(shakes===2){return('¡Por poco! '+name+' se ha liberado.');
}
if(shakes===1){return(name+' ha roto la Poké Ball.');
}
return('¡'+name+' ha salido inmediatamente!');
}
;
GM.CaptureOnly.storePokemon=function(pokemon){if(!$gameSystem||!pokemon){return null;
}
$gameSystem._granadaMonParty=$gameSystem._granadaMonParty||[];
$gameSystem._granadaMonStorage=$gameSystem._granadaMonStorage||[];
if(GM.resetBattleStages){GM.resetBattleStages(pokemon);
}
var destination;
if($gameSystem._granadaMonParty.length<6){$gameSystem._granadaMonParty.push(pokemon);
destination='PARTY';
}
else{$gameSystem._granadaMonStorage.push(pokemon);
destination='STORAGE';
}
GM.markCaught(pokemon.speciesId);
if(GM.syncDex){GM.syncDex();
}
return destination;
}
;
GM.CaptureOnly.ensureResolvedRegistry=function(){if(!$gameSystem){return{}
;
}
if(!$gameSystem._granadaMonResolvedCaptureEvents){$gameSystem._granadaMonResolvedCaptureEvents={}
;
}
return($gameSystem._granadaMonResolvedCaptureEvents);
}
;
GM.CaptureOnly.eventKey=function(mapId,eventId){return(String(Number(mapId||0))+':'+String(Number(eventId||0)));
}
;
GM.CaptureOnly.markEventResolved=function(mapId,eventId){mapId=Number(mapId||0);
eventId=Number(eventId||0);
if(!mapId||!eventId||!$gameSystem){return;
}
var registry=GM.CaptureOnly.ensureResolvedRegistry();
registry[GM.CaptureOnly.eventKey(mapId,eventId)]=true;
}
;
GM.CaptureOnly.isEventResolved=function(mapId,eventId){mapId=Number(mapId||0);
eventId=Number(eventId||0);
if(!mapId||!eventId){return false;
}
var registry=GM.CaptureOnly.ensureResolvedRegistry();
var key=GM.CaptureOnly.eventKey(mapId,eventId);
if(registry[key]){return true;
}
if($gameSelfSwitches&&$gameSelfSwitches.value([mapId,eventId,'A'])){return true;
}
return false;
}
;
GM.CaptureOnly.resolveEvent=function(context){if(!context){return;
}
var mapId=Number(context.mapId||0);
var eventId=Number(context.eventId||0);
if(!mapId||!eventId){return;
}
GM.CaptureOnly.markEventResolved(mapId,eventId);
if($gameSelfSwitches){$gameSelfSwitches.setValue([mapId,eventId,'A'],true);
}
if($gameMap&&$gameMap.mapId()===mapId){var ev=$gameMap.event(eventId);
if(ev&&ev.erase){ev.erase();
}
}
}
;
GM.CaptureOnly.eventDataUsesCaptureOnly=function(eventData){if(!eventData||!eventData.pages){return false;
}
for(var p=0;
p<eventData.pages.length;
p++){var page=eventData.pages[p];
if(!page||!page.list){continue;
}
for(var i=0;
i<page.list.length;
i++){var command=page.list[i];
if(!command||command.code!==356){continue;
}
var line=String(command.parameters&&command.parameters.length?command.parameters[0]:'').trim().toLowerCase();
if(line.indexOf('granadamoncaptureonlygd')===0||line.indexOf('granadamoncaptureonly')===0){return true;
}
}
}
return false;
}
;
GM.CaptureOnly.shouldEraseEvent=function(gameEvent){if(!gameEvent){return false;
}
var mapId=Number(gameEvent._mapId||0);
var eventId=Number(gameEvent._eventId||0);
if(!mapId||!eventId){return false;
}
var registry=GM.CaptureOnly.ensureResolvedRegistry();
if(registry[GM.CaptureOnly.eventKey(mapId,eventId)]){return true;
}
var eventData=gameEvent.event?gameEvent.event():null;
if(GM.CaptureOnly.eventDataUsesCaptureOnly(eventData)&&$gameSelfSwitches&&$gameSelfSwitches.value([mapId,eventId,'A'])){GM.CaptureOnly.markEventResolved(mapId,eventId);
return true;
}
return false;
}
;
var _GMCO6_GameEvent_refresh=Game_Event.prototype.refresh;
Game_Event.prototype.refresh=function(){_GMCO6_GameEvent_refresh.call(this);
if(!this._erased&&GM.CaptureOnly.shouldEraseEvent(this)){this._erased=true;
_GMCO6_GameEvent_refresh.call(this);
}
}
;
GM.CaptureOnly.start=function(nationalDex,level,mapId,eventId){if(!depsOK()){return false;
}
mapId=Number(mapId||0);
eventId=Number(eventId||0);
if(GM.CaptureOnly.isEventResolved(mapId,eventId)){if($gameMessage){$gameMessage.add('Este Pokémon ya no está aquí.');
}
return false;
}
var species=GM.getSpecies(Number(nationalDex));
if(!species){if($gameMessage){$gameMessage.add('No existe ese Pokémon.');
}
return false;
}
var pokemon=GM.createPokemon(Number(nationalDex),clamp(Number(level||1),1,100));
if(!pokemon){return false;
}
GM.markSeen(pokemon.speciesId);
if(GM.syncDex){GM.syncDex();
}
GM.CaptureOnly.pending={pokemon:pokemon,mapId:mapId,eventId:eventId}
;
SceneManager.push(Scene_GranadaMonCaptureOnly);
return true;
}
;
function Sprite_GMRing(){this.initialize.apply(this,arguments);
}
Sprite_GMRing.prototype=Object.create(Sprite.prototype);
Sprite_GMRing.prototype.constructor=Sprite_GMRing;
Sprite_GMRing.prototype.initialize=function(){Sprite.prototype.initialize.call(this);
this.bitmap=new Bitmap(210,210);
this.anchor.x=0.5;
this.anchor.y=0.5;
this._radius=RING_MAX;
this._color='#4bd47b';
this.redraw();
}
;
Sprite_GMRing.prototype.setData=function(radius,color){radius=Math.round(radius);
if(radius===this._radius&&color===this._color){return;
}
this._radius=radius;
this._color=color;
this.redraw();
}
;
Sprite_GMRing.prototype.redraw=function(){var b=this.bitmap;
var ctx=b._context;
b.clear();
ctx.save();
ctx.globalAlpha=0.26;
ctx.strokeStyle='#ffffff';
ctx.lineWidth=3;
ctx.beginPath();
ctx.arc(105,105,RING_MAX,0,Math.PI*2);
ctx.stroke();
ctx.globalAlpha=0.16;
ctx.strokeStyle=this._color;
ctx.lineWidth=12;
ctx.beginPath();
ctx.arc(105,105,this._radius,0,Math.PI*2);
ctx.stroke();
ctx.globalAlpha=0.98;
ctx.strokeStyle=this._color;
ctx.lineWidth=5;
ctx.shadowColor=this._color;
ctx.shadowBlur=8;
ctx.beginPath();
ctx.arc(105,105,this._radius,0,Math.PI*2);
ctx.stroke();
ctx.restore();
b._setDirty();
}
;
function Scene_GranadaMonCaptureOnly(){this.initialize.apply(this,arguments);
}
Scene_GranadaMonCaptureOnly.prototype=Object.create(Scene_Base.prototype);
Scene_GranadaMonCaptureOnly.prototype.constructor=Scene_GranadaMonCaptureOnly;
Scene_GranadaMonCaptureOnly.prototype.initialize=function(){Scene_Base.prototype.initialize.call(this);
this._context=null;
this._pokemon=null;
this._pokemonSprite=null;
this._pokemonScale=0.45;
this._pokemonVisualHeight=MAX_POKEMON_HEIGHT;
this._pokemonGroundY=355;
this._ring=null;
this._ringPhase=1;
this._ringDir=-1;
this._ringRadius=RING_MAX;
this._ringFrozen=false;
this._balls=[];
this._ballIndex=0;
this._selectedBallSprite=null;
this._anim=null;
this._captured=false;
this._fled=false;
this._closing=false;
this._retry=0;
this._finish=0;
this._lock=18;
this._frame=0;
this._failCount=0;
this._gradeFrames=0;
this._successFxFrames=0;
this._impactFlashFrames=0;
this._captureBannerFrames=0;
this._momentFrames=0;
this._entranceFrames=ENTRANCE_FRAMES;
this._pokemonAction=null;
this._behaviorKind='restless';
this._behavior=null;
this._mood=null;
this._nextActionAt=240;
this._vulnerableFrames=0;
this._newDexEntry=false;
this._difficultyPulse=0;
this._touchStartX=0;
this._touchStartY=0;
this._touchTracking=false;
this._touchStartedOnBall=false;
this._dragBallActive=false;
this._dragBallScreenX=0;
this._dragBallScreenY=0;
this._exitButton=null;
}
;
Scene_GranadaMonCaptureOnly.prototype.create=function(){Scene_Base.prototype.create.call(this);
this._context=GM.CaptureOnly.pending;
this._pokemon=this._context?this._context.pokemon:null;
if(!this._pokemon){SceneManager.pop();
return;
}
this._pokemonGroundY=Math.round(Graphics.boxHeight*0.57);
this.setupBehavior();
this.createBackground();
this.createGroundShadow();
this.createPokemon();
this.createRing();
this.createHud();
this.createBallDock();
this.createTouchControls();
this.createMomentCue();
this.createSuccessFx();
this.createImpactFlash();
this.createCaptureBanner();
this.refreshBalls(true);
this.refreshDifficulty();
this.setMessage('Observa el movimiento y lanza en el momento adecuado.');
}
;
Scene_GranadaMonCaptureOnly.prototype.setupBehavior=function(){var level=Math.max(1,Number(this._pokemon.level||1));
this._behaviorKind=GM.CaptureOnly.pickBehavior(level);
this._behavior=GM.CaptureOnly.behaviorData(this._behaviorKind);
this._mood=GM.CaptureOnly.moodData(this._failCount);
this.scheduleNextWildAction();
}
;
Scene_GranadaMonCaptureOnly.prototype.scheduleNextWildAction=function(){var behavior=this._behavior||GM.CaptureOnly.behaviorData('restless');
var mood=this._mood||GM.CaptureOnly.moodData(this._failCount);
var delay=(Number(behavior.minDelay||200)+Math.floor(Math.random()*Number(behavior.maxExtra||200)))*clamp(Number(mood.actionMult||1),0.55,1.25);
this._nextActionAt=this._frame+Math.max(70,Math.floor(delay));
}
;
Scene_GranadaMonCaptureOnly.prototype.createBackground=function(){var self=this;
this._background=new Sprite(ImageManager.loadPicture(BG_NAME));
this.addChild(this._background);
this._background.bitmap.addLoadListener(function(){fitCover(self._background);
}
);
var w=Graphics.boxWidth;
var h=Graphics.boxHeight;
var overlay=new Bitmap(w,h);
var ctx=overlay._context;
ctx.save();
var top=ctx.createLinearGradient(0,0,0,145);
top.addColorStop(0,'rgba(11,34,43,0.24)');
top.addColorStop(1,'rgba(11,34,43,0)');
ctx.fillStyle=top;
ctx.fillRect(0,0,w,145);
var bottom=ctx.createLinearGradient(0,h-205,0,h);
bottom.addColorStop(0,'rgba(9,27,21,0)');
bottom.addColorStop(1,'rgba(9,27,21,0.32)');
ctx.fillStyle=bottom;
ctx.fillRect(0,h-205,w,205);
ctx.restore();
overlay._setDirty();
this._backgroundOverlay=new Sprite(overlay);
this.addChild(this._backgroundOverlay);
}
;
Scene_GranadaMonCaptureOnly.prototype.createGroundShadow=function(){var b=new Bitmap(220,58);
ellipse(b,110,29,68,13,'#142818',0.20);
ellipse(b,110,27,48,8,'#17361d',0.12);
this._shadow=new Sprite(b);
this._shadow.anchor.x=0.5;
this._shadow.anchor.y=0.5;
this._shadow.x=Graphics.boxWidth/2;
this._shadow.y=this._pokemonGroundY+7;
this.addChild(this._shadow);
}
;
Scene_GranadaMonCaptureOnly.prototype.createPokemon=function(){var filename=GM.BattleSprites.frontFilename(this._pokemon);
var sprite=new Sprite();
sprite.anchor.x=0.5;
sprite.anchor.y=1.0;
sprite.x=Graphics.boxWidth/2;
sprite.y=this._pokemonGroundY;
sprite.alpha=0;
sprite.scale.x=0.20;
sprite.scale.y=0.20;
if(filename){sprite.bitmap=ImageManager.loadPicture(filename);
}
this._pokemonSprite=sprite;
this.addChild(sprite);
var self=this;
if(sprite.bitmap){sprite.bitmap.addLoadListener(function(){var bw=sprite.bitmap.width||1;
var bh=sprite.bitmap.height||1;
self._pokemonScale=clamp(Math.min(MAX_POKEMON_HEIGHT/bh,180/bw),0.18,0.72);
self._pokemonVisualHeight=bh*self._pokemonScale;
}
);
}
}
;
Scene_GranadaMonCaptureOnly.prototype.pokemonCenterY=function(){return(this._pokemonGroundY-this._pokemonVisualHeight*0.48);
}
;
Scene_GranadaMonCaptureOnly.prototype.createRing=function(){this._ring=new Sprite_GMRing();
this._ring.x=Graphics.boxWidth/2;
this._ring.y=this.pokemonCenterY();
this._ring.alpha=0;
this.addChild(this._ring);
}
;
Scene_GranadaMonCaptureOnly.prototype.currentRingSpeed=function(){var level=Math.max(1,Number(this._pokemon.level||1));
var levelT=clamp((level-1)/59,0,1);
var speed=0.0115+levelT*0.0215;
var behavior=this._behavior||GM.CaptureOnly.behaviorData(this._behaviorKind);
var mood=this._mood||GM.CaptureOnly.moodData(this._failCount);
speed*=Number(behavior.ringMult||1);
speed*=Number(mood.ringMult||1);
if(this._vulnerableFrames>0){speed*=0.80;
}
return clamp(speed,0.010,0.039);
}
;
Scene_GranadaMonCaptureOnly.prototype.createHud=function(){var w=Graphics.boxWidth;
var h=Graphics.boxHeight;
this._title=new Sprite(new Bitmap(380,54));
this._title.x=Math.round((w-380)/2);
this._title.y=14;
roundRect(this._title.bitmap,0,0,380,54,22,'#17343a',0.90,'rgba(255,255,255,0.20)',2);
this._title.bitmap.fontSize=23;
this._title.bitmap.textColor='#ffffff';
this._title.bitmap.outlineColor='rgba(0,0,0,0.38)';
this._title.bitmap.outlineWidth=3;
this.addChild(this._title);
this._difficulty=new Sprite(new Bitmap(206,34));
this._difficulty.x=16;
this._difficulty.y=20;
this.addChild(this._difficulty);
this._fails=new Sprite(new Bitmap(154,34));
this._fails.x=w-170;
this._fails.y=20;
this.addChild(this._fails);
this.refreshFails();
var msgW=Math.min(610,w-40);
this._message=new Sprite(new Bitmap(msgW,58));
this._message.x=Math.round((w-msgW)/2);
this._message.y=h-188;
this.addChild(this._message);
this._help=new Sprite(new Bitmap(w,28));
this._help.y=h-218;
this._help.bitmap.fontSize=15;
this._help.bitmap.textColor='#ffffff';
this._help.bitmap.outlineColor='rgba(0,0,0,0.72)';
this._help.bitmap.outlineWidth=4;
this._help.bitmap.drawText('← / → Cambiar Ball  ·  Coge, apunta y desliza ↑  ·  Esc / SALIR',0,0,w,24,'center');
this.addChild(this._help);
this._grade=new Sprite(new Bitmap(360,70));
this._grade.anchor.x=0.5;
this._grade.anchor.y=0.5;
this._grade.x=w/2;
this._grade.y=this._pokemonGroundY-this._pokemonVisualHeight-35;
this._grade.visible=false;
this.addChild(this._grade);
}
;
Scene_GranadaMonCaptureOnly.prototype.refreshDifficulty=function(){if(!this._difficulty){return;
}
var b=this._difficulty.bitmap;
b.clear();
var ball=this.currentBall();
var chance=ball?GM.CaptureOnly.baseChance(this._pokemon,ball.key):0;
var info=GM.CaptureOnly.difficultyLabel(chance);
var behavior=this._behavior||GM.CaptureOnly.behaviorData(this._behaviorKind);
roundRect(b,0,0,206,30,15,'#17343a',0.86,info.color,2);
b.fontSize=13;
b.textColor='#ffffff';
b.outlineColor='rgba(0,0,0,0.45)';
b.outlineWidth=3;
b.drawText(info.text+'  ·  '+behavior.name,6,2,194,25,'center');
this._difficultyPulse=18;
}
;
Scene_GranadaMonCaptureOnly.prototype.refreshFails=function(){if(!this._fails){return;
}
var b=this._fails.bitmap;
b.clear();
roundRect(b,0,0,154,30,15,'#ffffff',0.76,'rgba(255,255,255,0.45)',1);
b.fontSize=15;
b.textColor='#243d42';
b.outlineWidth=0;
b.drawText('Fallos: '+this._failCount,8,2,138,25,'center');
}
;
Scene_GranadaMonCaptureOnly.prototype.setMessage=function(text){if(!this._message){return;
}
var b=this._message.bitmap;
b.clear();
roundRect(b,0,0,b.width,54,20,'#16362d',0.90,'rgba(255,255,255,0.16)',2);
b.fontSize=19;
b.textColor='#ffffff';
b.outlineColor='rgba(0,0,0,0.35)';
b.outlineWidth=3;
b.drawText(String(text||''),14,2,b.width-28,48,'center');
}
;
Scene_GranadaMonCaptureOnly.prototype.showGrade=function(text){if(!text||!this._grade){return;
}
var lower=String(text).toLowerCase();
var outline='#1d6046';
var size=34;
if(lower.indexOf('excelente')>=0){outline='#d99423';
size=39;
if(SoundManager.playOk){SoundManager.playOk();
}
}
else if(lower.indexOf('genial')>=0){outline='#3479a9';
size=36;
if(SoundManager.playCursor){SoundManager.playCursor();
}
}
var b=this._grade.bitmap;
b.clear();
b.fontSize=size;
b.textColor='#ffffff';
b.outlineColor=outline;
b.outlineWidth=8;
b.drawText(text,0,0,360,64,'center');
this._grade.y=this._pokemonGroundY-this._pokemonVisualHeight-32;
this._grade.visible=true;
this._grade.alpha=1;
this._grade.scale.x=0.58;
this._grade.scale.y=0.58;
this._gradeFrames=56;
}
;
Scene_GranadaMonCaptureOnly.prototype.createBallDock=function(){var w=Math.min(680,Graphics.boxWidth-24);
var h=126;
var x=Math.round((Graphics.boxWidth-w)/2);
var y=Graphics.boxHeight-132;
this._ballPanel=new Sprite(new Bitmap(w,h));
this._ballPanel.x=x;
this._ballPanel.y=y;
roundRect(this._ballPanel.bitmap,0,0,w,h,26,'#f7fbf8',0.92,'rgba(255,255,255,0.85)',2);
roundRect(this._ballPanel.bitmap,12,10,w-24,4,2,'#78d8b6',0.52);
this.addChild(this._ballPanel);
this._ballContainer=new Sprite();
this._ballContainer.x=x;
this._ballContainer.y=y;
this.addChild(this._ballContainer);
}
;
Scene_GranadaMonCaptureOnly.prototype.createTouchControls=function(){var w=104;
var h=42;
this._exitButton=new Sprite(new Bitmap(w,h));
this._exitButton.x=Graphics.boxWidth-w-16;
this._exitButton.y=58;
roundRect(this._exitButton.bitmap,0,0,w,h,18,'#17343a',0.92,'rgba(255,255,255,0.42)',2);
this._exitButton.bitmap.fontSize=17;
this._exitButton.bitmap.textColor='#ffffff';
this._exitButton.bitmap.outlineColor='rgba(0,0,0,0.42)';
this._exitButton.bitmap.outlineWidth=3;
this._exitButton.bitmap.drawText('SALIR',0,2,w,h-4,'center');
this.addChild(this._exitButton);
}
;
Scene_GranadaMonCaptureOnly.prototype.isPointInsideSprite=function(sprite,x,y){if(!sprite||!sprite.visible||!sprite.bitmap){return false;
}
var width=sprite.bitmap.width*Math.abs(sprite.scale.x||1);
var height=sprite.bitmap.height*Math.abs(sprite.scale.y||1);
return(x>=sprite.x&&x<=sprite.x+width&&y>=sprite.y&&y<=sprite.y+height);
}
;
Scene_GranadaMonCaptureOnly.prototype.ballIndexAtPoint=function(screenX,screenY){if(!this._ballPanel||!this._ballPanel.visible||!this._ballContainer||!this._ballContainer.visible||!this._balls||!this._balls.length){return-1;
}
var localX=screenX-this._ballContainer.x;
var localY=screenY-this._ballContainer.y;
var panelW=this._ballPanel.bitmap.width;
var panelH=this._ballPanel.bitmap.height;
if(localX<0||localX>panelW||localY<0||localY>panelH){return-1;
}
var count=this._balls.length;
var slotW=Math.min(150,Math.floor((panelW-30)/count));
var totalW=slotW*count;
var startX=Math.round((panelW-totalW)/2);
if(localX<startX||localX>=startX+totalW){return-1;
}
var index=Math.floor((localX-startX)/slotW);
if(index<0||index>=count){return-1;
}
return index;
}
;
Scene_GranadaMonCaptureOnly.prototype.selectBallByTouch=function(index){if(index<0||index>=this._balls.length||index===this._ballIndex){return;
}
this._ballIndex=index;
if(SoundManager.playCursor){SoundManager.playCursor();
}
this.refreshBalls(false);
this.refreshDifficulty();
}
;
Scene_GranadaMonCaptureOnly.prototype.captureControlsAvailable=function(){return!!(!this._captured&&!this._closing&&!this._anim&&!this._pokemonAction&&this._entranceFrames<=0&&this._retry<=0&&this._lock<=0);
}
;
Scene_GranadaMonCaptureOnly.prototype.updateTouchControls=function(){var x=Number(TouchInput.x||0);
var y=Number(TouchInput.y||0);
if(!this._dragBallActive&&TouchInput.isTriggered()&&this.isPointInsideSprite(this._exitButton,x,y)){this._touchTracking=false;
this._touchStartedOnBall=false;
this._dragBallActive=false;
this.abandonCapture();
return;
}
if(!this.captureControlsAvailable()){if(TouchInput.isReleased()){this._touchTracking=false;
this._touchStartedOnBall=false;
this._dragBallActive=false;
}
return;
}
if(TouchInput.isTriggered()){var ballIndex=this.ballIndexAtPoint(x,y);
if(ballIndex>=0){this.selectBallByTouch(ballIndex);
this._touchStartX=x;
this._touchStartY=y;
this._touchTracking=true;
this._touchStartedOnBall=true;
this._dragBallActive=true;
this._dragBallScreenX=x;
this._dragBallScreenY=y;
if(this._selectedBallSprite&&this._ballContainer){this._selectedBallSprite.x=x-this._ballContainer.x;
this._selectedBallSprite.y=y-this._ballContainer.y;
this._selectedBallSprite.scale.x=0.30;
this._selectedBallSprite.scale.y=0.30;
this._selectedBallSprite.rotation=0;
}
}
else{this._touchTracking=false;
this._touchStartedOnBall=false;
this._dragBallActive=false;
}
}
if(this._touchTracking&&this._touchStartedOnBall&&this._dragBallActive&&TouchInput.isPressed()){this._dragBallScreenX=x;
this._dragBallScreenY=y;
if(this._selectedBallSprite&&this._ballContainer){this._selectedBallSprite.x=x-this._ballContainer.x;
this._selectedBallSprite.y=y-this._ballContainer.y;
this._selectedBallSprite.scale.x=0.30;
this._selectedBallSprite.scale.y=0.30;
this._selectedBallSprite.rotation=0;
}
}
if(this._touchTracking&&this._touchStartedOnBall&&TouchInput.isReleased()){var dx=x-this._touchStartX;
var dy=y-this._touchStartY;
var upwardDistance=-dy;
var verticalEnough=upwardDistance>=58;
var directionEnough=upwardDistance>=Math.abs(dx)*0.65;
var releaseX=x;
var releaseY=y;
var dragStartX=this._touchStartX;
var dragStartY=this._touchStartY;
this._touchTracking=false;
this._touchStartedOnBall=false;
this._dragBallActive=false;
if(verticalEnough&&directionEnough){this.throwBall(releaseX,releaseY,dragStartX,dragStartY);
}
else{this.refreshBalls(false);
this.refreshDifficulty();
}
}
}
;
Scene_GranadaMonCaptureOnly.prototype.refreshBalls=function(reset){var previous=this.currentBall();
var previousKey=previous?previous.key:null;
this._balls=GM.Capture.getBagBalls()||[];
this._selectedBallSprite=null;
if(reset){this._ballIndex=0;
}
else if(previousKey){for(var p=0;
p<this._balls.length;
p++){if(this._balls[p].key===previousKey){this._ballIndex=p;
break;
}
}
}
if(this._ballIndex>=this._balls.length){this._ballIndex=Math.max(0,this._balls.length-1);
}
while(this._ballContainer.children.length){this._ballContainer.removeChildAt(0);
}
var panelW=this._ballPanel.bitmap.width;
if(!this._balls.length){var empty=new Sprite(new Bitmap(panelW,112));
empty.bitmap.fontSize=21;
empty.bitmap.textColor='#334841';
empty.bitmap.outlineWidth=0;
empty.bitmap.drawText('No tienes ninguna Poké Ball',0,35,panelW,34,'center');
this._ballContainer.addChild(empty);
if(this._ring){this._ring.visible=false;
}
return;
}
if(this._ring&&!this._anim&&!this._closing&&this._entranceFrames<=0){this._ring.visible=true;
}
var count=this._balls.length;
var slotW=Math.min(150,Math.floor((panelW-30)/count));
var totalW=slotW*count;
var startX=Math.round((panelW-totalW)/2);
for(var i=0;
i<count;
i++){var item=this._balls[i];
var x=startX+i*slotW;
var selected=i===this._ballIndex;
var slot=new Sprite(new Bitmap(slotW-8,108));
slot.x=x+4;
slot.y=12;
if(selected){roundRect(slot.bitmap,0,0,slotW-8,104,20,'#dff9ef',0.98,'#58cfa5',3);
}
else{roundRect(slot.bitmap,3,3,slotW-14,98,18,'#ffffff',0.12,'rgba(70,110,98,0.10)',1);
}
this._ballContainer.addChild(slot);
var ballSprite=new Sprite(GM.BallVisuals.bitmap(item.key));
ballSprite.anchor.x=0.5;
ballSprite.anchor.y=0.5;
ballSprite.x=x+slotW/2;
ballSprite.y=selected?44:47;
ballSprite.scale.x=selected?0.26:0.22;
ballSprite.scale.y=selected?0.26:0.22;
this._ballContainer.addChild(ballSprite);
if(selected){this._selectedBallSprite=ballSprite;
}
var label=new Sprite(new Bitmap(slotW,56));
label.x=x;
label.y=62;
label.bitmap.fontSize=selected?16:15;
label.bitmap.textColor='#263b35';
label.bitmap.outlineWidth=0;
label.bitmap.drawText(item.name,0,0,slotW,23,'center');
label.bitmap.fontSize=18;
label.bitmap.textColor=selected?'#197557':'#49645a';
label.bitmap.drawText('× '+GM.getItemQuantity(item.key),0,24,slotW,27,'center');
this._ballContainer.addChild(label);
}
}
;
Scene_GranadaMonCaptureOnly.prototype.currentBall=function(){return(this._balls.length?this._balls[this._ballIndex]:null);
}
;
Scene_GranadaMonCaptureOnly.prototype.changeBall=function(delta){if(this._balls.length<=1){return;
}
this._ballIndex=(this._ballIndex+delta+this._balls.length)%this._balls.length;
SoundManager.playCursor();
this.refreshBalls(false);
this.refreshDifficulty();
}
;
Scene_GranadaMonCaptureOnly.prototype.updateSelectedBall=function(){if(!this._selectedBallSprite||this._anim||this._closing||this._dragBallActive){return;
}
var pulse=1+Math.sin(this._frame*0.09)*0.026;
this._selectedBallSprite.scale.x=0.26*pulse;
this._selectedBallSprite.scale.y=0.26*pulse;
this._selectedBallSprite.rotation=Math.sin(this._frame*0.045)*0.025;
}
;
Scene_GranadaMonCaptureOnly.prototype.createMomentCue=function(){this._moment=new Sprite(new Bitmap(300,54));
this._moment.anchor.x=0.5;
this._moment.anchor.y=0.5;
this._moment.x=Graphics.boxWidth/2;
this._moment.y=this._pokemonGroundY-this._pokemonVisualHeight-72;
this._moment.visible=false;
this.addChild(this._moment);
}
;
Scene_GranadaMonCaptureOnly.prototype.showMomentCue=function(){if(!this._moment){return;
}
var b=this._moment.bitmap;
b.clear();
roundRect(b,28,7,244,40,18,'#17343a',0.92,'#8ee8c5',2);
b.fontSize=22;
b.textColor='#ffffff';
b.outlineColor='rgba(0,0,0,0.45)';
b.outlineWidth=4;
b.drawText('¡AHORA!',0,7,300,36,'center');
this._moment.visible=true;
this._moment.alpha=1;
this._moment.scale.x=0.72;
this._moment.scale.y=0.72;
this._momentFrames=45;
}
;
Scene_GranadaMonCaptureOnly.prototype.updateMomentCue=function(){if(!this._moment||!this._moment.visible){return;
}
if(this._momentFrames>0){this._momentFrames--;
this._moment.scale.x+=(1-this._moment.scale.x)*0.18;
this._moment.scale.y+=(1-this._moment.scale.y)*0.18;
if(this._momentFrames<12){this._moment.alpha=Math.max(0,this._moment.alpha-0.09);
}
}
if(this._momentFrames<=0){this._moment.visible=false;
}
}
;
Scene_GranadaMonCaptureOnly.prototype.createImpactFlash=function(){var b=new Bitmap(Graphics.boxWidth,Graphics.boxHeight);
b.fillAll('#ffffff');
this._impactFlash=new Sprite(b);
this._impactFlash.visible=false;
this._impactFlash.alpha=0;
this.addChild(this._impactFlash);
}
;
Scene_GranadaMonCaptureOnly.prototype.startImpactFlash=function(alpha){if(!this._impactFlash){return;
}
this._impactFlash.visible=true;
this._impactFlash.alpha=alpha==null?0.32:alpha;
this._impactFlashFrames=10;
}
;
Scene_GranadaMonCaptureOnly.prototype.updateImpactFlash=function(){if(!this._impactFlashFrames||!this._impactFlash){return;
}
this._impactFlashFrames--;
this._impactFlash.alpha*=0.72;
if(this._impactFlashFrames<=0){this._impactFlash.alpha=0;
this._impactFlash.visible=false;
}
}
;
Scene_GranadaMonCaptureOnly.prototype.createSuccessFx=function(){this._successFx=new Sprite(new Bitmap(300,220));
this._successFx.anchor.x=0.5;
this._successFx.anchor.y=0.5;
this._successFx.x=Graphics.boxWidth/2;
this._successFx.y=this._pokemonGroundY+25;
this._successFx.visible=false;
this.addChild(this._successFx);
}
;
Scene_GranadaMonCaptureOnly.prototype.startSuccessFx=function(){if(!this._successFx){return;
}
var a=this._anim;
if(a){this._successFx.x=a.tx;
this._successFx.y=a.gy;
}
var b=this._successFx.bitmap;
var ctx=b._context;
b.clear();
ctx.save();
ctx.translate(150,110);
ctx.strokeStyle='#fff3a0';
ctx.fillStyle='#fff3a0';
ctx.lineWidth=4;
ctx.shadowColor='#ffe96a';
ctx.shadowBlur=12;
for(var i=0;
i<12;
i++){var angle=Math.PI*2*i/12;
var r1=38;
var r2=86;
ctx.beginPath();
ctx.moveTo(Math.cos(angle)*r1,Math.sin(angle)*r1);
ctx.lineTo(Math.cos(angle)*r2,Math.sin(angle)*r2);
ctx.stroke();
ctx.beginPath();
ctx.arc(Math.cos(angle)*98,Math.sin(angle)*78,4,0,Math.PI*2);
ctx.fill();
}
ctx.restore();
b._setDirty();
this._successFx.visible=true;
this._successFx.alpha=1;
this._successFx.scale.x=0.48;
this._successFx.scale.y=0.48;
this._successFxFrames=52;
}
;
Scene_GranadaMonCaptureOnly.prototype.updateSuccessFx=function(){if(!this._successFxFrames||!this._successFx||!this._successFx.visible){return;
}
this._successFxFrames--;
this._successFx.scale.x+=0.024;
this._successFx.scale.y+=0.024;
if(this._successFxFrames<18){this._successFx.alpha-=0.06;
}
if(this._successFxFrames<=0){this._successFx.visible=false;
}
}
;
Scene_GranadaMonCaptureOnly.prototype.createCaptureBanner=function(){this._captureBanner=new Sprite(new Bitmap(560,116));
this._captureBanner.anchor.x=0.5;
this._captureBanner.anchor.y=0.5;
this._captureBanner.x=Graphics.boxWidth/2;
this._captureBanner.y=135;
this._captureBanner.visible=false;
this.addChild(this._captureBanner);
}
;
Scene_GranadaMonCaptureOnly.prototype.showCaptureBanner=function(destination,isNew){if(!this._captureBanner){return;
}
var b=this._captureBanner.bitmap;
b.clear();
roundRect(b,0,0,560,112,24,'#153c34',0.95,'#79e0ba',3);
b.fontSize=30;
b.textColor='#ffffff';
b.outlineColor='rgba(0,0,0,0.38)';
b.outlineWidth=4;
b.drawText('¡CAPTURADO!',12,8,536,42,'center');
var species=GM.getSpecies?GM.getSpecies(this._pokemon.speciesId):null;
var gd=species?Number(species.granadaDex||0):0;
b.fontSize=18;
b.textColor='#dcfff2';
b.outlineWidth=2;
if(isNew){var numberText=gd>0?'  ·  #'+String(gd):'';
b.drawText('¡Nueva entrada en la Pokédex!'+numberText+'  '+this._pokemon.name,18,57,524,34,'center');
}
else if(destination==='STORAGE'){b.drawText(this._pokemon.name+' se ha enviado al almacenamiento.',18,57,524,34,'center');
}
else{b.drawText(this._pokemon.name+' se ha unido a tu equipo.',18,57,524,34,'center');
}
this._captureBanner.visible=true;
this._captureBanner.alpha=0;
this._captureBanner.scale.x=0.72;
this._captureBanner.scale.y=0.72;
this._captureBannerFrames=150;
}
;
Scene_GranadaMonCaptureOnly.prototype.updateCaptureBanner=function(){if(!this._captureBannerFrames||!this._captureBanner||!this._captureBanner.visible){return;
}
this._captureBannerFrames--;
this._captureBanner.alpha+=(1-this._captureBanner.alpha)*0.18;
this._captureBanner.scale.x+=(1-this._captureBanner.scale.x)*0.16;
this._captureBanner.scale.y+=(1-this._captureBanner.scale.y)*0.16;
if(this._captureBannerFrames<24){this._captureBanner.alpha-=0.045;
this._captureBanner.y-=0.25;
}
if(this._captureBannerFrames<=0){this._captureBanner.visible=false;
}
}
;
Scene_GranadaMonCaptureOnly.prototype.startWildAction=function(){if(this._pokemonAction||this._anim||this._captured||this._closing||this._retry>0||this._entranceFrames>0||!this._balls.length){return;
}
var behavior=this._behavior||GM.CaptureOnly.behaviorData(this._behaviorKind);
var kinds=behavior.actions&&behavior.actions.length?behavior.actions:['hop','sidestep','feint'];
var kind=kinds[Math.floor(Math.random()*kinds.length)];
var durations={hop:46,sidestep:42,feint:40,charge:54,idlelook:38}
;
this._pokemonAction={kind:kind,frame:0,duration:Number(durations[kind]||42),dir:Math.random()<0.5?-1:1,baseX:Graphics.boxWidth/2,baseY:this._pokemonGroundY,baseScale:this._pokemonScale}
;
this._ringFrozen=true;
this._vulnerableFrames=0;
if(this._moment){this._moment.visible=false;
}
if(this._ring){this._ring.visible=false;
}
this._lock=Math.max(this._lock,this._pokemonAction.duration+3);
if(kind==='charge'&&SoundManager.playCursor){SoundManager.playCursor();
}
}
;
Scene_GranadaMonCaptureOnly.prototype.updateWildAction=function(){var a=this._pokemonAction;
if(!a||!this._pokemonSprite){return;
}
a.frame++;
var t=clamp(a.frame/a.duration,0,1);
var wave=Math.sin(t*Math.PI);
var p=this._pokemonSprite;
p.alpha=1;
if(a.kind==='hop'){p.x=a.baseX;
p.y=a.baseY-wave*42;
p.scale.x=a.baseScale*(1+wave*0.055);
p.scale.y=a.baseScale*(1+wave*0.055);
p.rotation=Math.sin(t*Math.PI*2)*0.025;
if(this._shadow){this._shadow.scale.x=1-wave*0.28;
this._shadow.scale.y=1-wave*0.18;
this._shadow.alpha=1-wave*0.34;
}
}
if(a.kind==='sidestep'){p.x=a.baseX+wave*68*a.dir;
p.y=a.baseY;
p.rotation=wave*0.075*a.dir;
p.scale.x=a.baseScale;
p.scale.y=a.baseScale;
if(this._shadow){this._shadow.x=Graphics.boxWidth/2+wave*46*a.dir;
}
}
if(a.kind==='feint'){p.x=a.baseX+Math.sin(t*Math.PI*2)*8;
p.y=a.baseY;
p.scale.x=a.baseScale*(1+wave*0.14);
p.scale.y=a.baseScale*(1-wave*0.05);
p.rotation=Math.sin(t*Math.PI*4)*0.038;
}
if(a.kind==='charge'){var chargeWave=Math.sin(t*Math.PI);
p.x=a.baseX+Math.sin(t*Math.PI*2)*5*a.dir;
p.y=a.baseY+chargeWave*8;
p.scale.x=a.baseScale*(1+chargeWave*0.24);
p.scale.y=a.baseScale*(1+chargeWave*0.24);
p.rotation=Math.sin(t*Math.PI*2)*0.025;
if(this._shadow){this._shadow.scale.x=1+chargeWave*0.24;
this._shadow.scale.y=1+chargeWave*0.12;
this._shadow.alpha=0.85;
}
}
if(a.kind==='idlelook'){p.x=a.baseX+Math.sin(t*Math.PI*2)*3;
p.y=a.baseY;
p.scale.x=a.baseScale*(1+wave*0.025);
p.scale.y=a.baseScale*(1+wave*0.025);
p.rotation=Math.sin(t*Math.PI*2)*0.018;
}
if(a.frame>=a.duration){p.x=a.baseX;
p.y=a.baseY;
p.scale.x=a.baseScale;
p.scale.y=a.baseScale;
p.rotation=0;
if(this._shadow){this._shadow.x=Graphics.boxWidth/2;
this._shadow.scale.x=1;
this._shadow.scale.y=1;
this._shadow.alpha=1;
}
this._pokemonAction=null;
this._ringFrozen=false;
this._vulnerableFrames=54;
this.showMomentCue();
this.scheduleNextWildAction();
if(this._ring&&this._balls.length&&!this._closing){this._ring.visible=true;
}
}
}
;
Scene_GranadaMonCaptureOnly.prototype.update=function(){Scene_Base.prototype.update.call(this);
this._frame++;
if(this._lock>0){this._lock--;
}
if(this._vulnerableFrames>0){this._vulnerableFrames--;
}
if(this._difficultyPulse>0&&this._difficulty){this._difficultyPulse--;
var difficultyPulse=1+Math.sin(this._difficultyPulse*0.45)*0.012;
this._difficulty.scale.x=difficultyPulse;
this._difficulty.scale.y=difficultyPulse;
}
else if(this._difficulty){this._difficulty.scale.x=1;
this._difficulty.scale.y=1;
}
this.updatePokemon();
this.updateRing();
this.updateGrade();
this.updateMomentCue();
this.updateSelectedBall();
this.updateSuccessFx();
this.updateImpactFlash();
this.updateCaptureBanner();
this.updateClosingFx();
this.updateTouchControls();
if(this._anim){this.updateCaptureAnimation();
}
else if(!this._captured&&!this._closing&&!this._pokemonAction&&this._entranceFrames<=0&&this._retry<=0&&this._lock<=0){this.updateControls();
}
if(this._retry>0){this._retry--;
if(this._retry===0&&!this._captured&&!this._closing){this.refreshBalls(false);
this.refreshDifficulty();
this._ballPanel.visible=true;
this._ballContainer.visible=true;
if(this._balls.length){this._ring.visible=true;
this._ringFrozen=false;
var mood=this._mood||GM.CaptureOnly.moodData(this._failCount);
this.setMessage(this._pokemon.name+' está '+String(mood.name||'alerta').toLowerCase()+'. Espera tu oportunidad.');
}
else{this._ring.visible=false;
this.setMessage('Te has quedado sin Poké Balls. Pulsa SALIR o Esc para volver.');
}
}
}
if(this._finish>0){this._finish--;
if(this._finish===0){GM.CaptureOnly.pending=null;
SceneManager.pop();
}
}
}
;
Scene_GranadaMonCaptureOnly.prototype.updateControls=function(){if(Input.isTriggered('left')||Input.isTriggered('up')){this.changeBall(-1);
}
else if(Input.isTriggered('right')||Input.isTriggered('down')){this.changeBall(1);
}
if(Input.isTriggered('ok')){this.throwBall();
}
else if(Input.isTriggered('cancel')){this.abandonCapture();
}
}
;
Scene_GranadaMonCaptureOnly.prototype.updatePokemon=function(){if(!this._pokemonSprite||this._captured||this._fled||this._anim){return;
}
var p=this._pokemonSprite;
if(this._entranceFrames>0){var elapsed=ENTRANCE_FRAMES-this._entranceFrames;
var t=clamp(elapsed/ENTRANCE_FRAMES,0,1);
var ease=1-Math.pow(1-t,3);
p.alpha=ease;
p.x=Graphics.boxWidth/2;
p.y=this._pokemonGroundY+(1-ease)*26;
var entranceScale=this._pokemonScale*(0.58+0.42*ease);
p.scale.x=entranceScale;
p.scale.y=entranceScale;
p.rotation=0;
if(this._shadow){this._shadow.alpha=0.22+0.78*ease;
this._shadow.scale.x=0.72+0.28*ease;
this._shadow.scale.y=0.72+0.28*ease;
}
if(this._ring){this._ring.visible=false;
}
this._entranceFrames--;
if(this._entranceFrames<=0){p.y=this._pokemonGroundY;
p.scale.x=this._pokemonScale;
p.scale.y=this._pokemonScale;
p.alpha=1;
if(this._shadow){this._shadow.alpha=1;
this._shadow.scale.x=1;
this._shadow.scale.y=1;
}
if(this._ring&&this._balls.length){this._ring.visible=true;
this._ringFrozen=false;
}
}
return;
}
if(this._pokemonAction){this.updateWildAction();
return;
}
if(this._frame>=this._nextActionAt&&this._retry<=0&&!this._closing&&!this._anim&&this._balls.length){this.startWildAction();
return;
}
p.alpha=Math.min(1,p.alpha+0.06);
var breath=1+Math.sin(this._frame*0.035)*0.010;
var targetScale=this._pokemonScale*breath;
var current=p.scale.x;
current+=(targetScale-current)*0.13;
p.scale.x=current;
p.scale.y=current;
p.x=Graphics.boxWidth/2;
p.y=this._pokemonGroundY;
p.rotation=0;
}
;
Scene_GranadaMonCaptureOnly.prototype.updateRing=function(){if(!this._ring||!this._ring.visible||!this._pokemonSprite){return;
}
this._ring.alpha=Math.min(1,this._ring.alpha+0.07);
if(!this._ringFrozen&&!this._anim){this._ringPhase+=this._ringDir*this.currentRingSpeed();
if(this._ringPhase<=0){this._ringPhase=0;
this._ringDir=1;
}
if(this._ringPhase>=1){this._ringPhase=1;
this._ringDir=-1;
}
var smooth=this._ringPhase*this._ringPhase*(3-2*this._ringPhase);
this._ringRadius=RING_MIN+(RING_MAX-RING_MIN)*smooth;
}
var ball=this.currentBall();
var base=ball?GM.CaptureOnly.baseChance(this._pokemon,ball.key):0;
this._ring.x=this._pokemonSprite.x;
this._ring.y=this.pokemonCenterY();
this._ring.setData(this._ringRadius,GM.CaptureOnly.color(base));
}
;
Scene_GranadaMonCaptureOnly.prototype.updateGrade=function(){if(!this._gradeFrames||!this._grade||!this._grade.visible){return;
}
this._gradeFrames--;
this._grade.scale.x+=(1-this._grade.scale.x)*0.16;
this._grade.scale.y+=(1-this._grade.scale.y)*0.16;
if(this._gradeFrames<16){this._grade.alpha-=0.07;
}
if(this._gradeFrames<=0){this._grade.visible=false;
}
}
;
Scene_GranadaMonCaptureOnly.prototype.updateClosingFx=function(){if(this._fled&&this._pokemonSprite){this._pokemonSprite.x+=5.5;
this._pokemonSprite.alpha=Math.max(0,this._pokemonSprite.alpha-0.035);
}
}
;
Scene_GranadaMonCaptureOnly.prototype.abandonCapture=function(){if(this._closing||this._captured||this._anim){return;
}
SoundManager.playCancel();
this._closing=true;
this._ringFrozen=true;
if(this._ring){this._ring.visible=false;
}
if(this._ballPanel){this._ballPanel.visible=false;
}
if(this._ballContainer){this._ballContainer.visible=false;
}
if(this._moment){this._moment.visible=false;
}
this.setMessage('Has abandonado la captura. El Pokémon sigue aquí.');
this._finish=45;
}
;
Scene_GranadaMonCaptureOnly.prototype.throwBall=function(originX,originY,dragStartX,dragStartY){if(this._pokemonAction||this._entranceFrames>0){SoundManager.playBuzzer();
return;
}
var item=this.currentBall();
if(!item||GM.getItemQuantity(item.key)<=0){SoundManager.playBuzzer();
this.refreshBalls(false);
this.refreshDifficulty();
if(!this._balls.length){this.setMessage('No tienes Poké Balls. Pulsa SALIR o Esc para volver.');
}
return;
}
var hasPointerOrigin=isFinite(Number(originX))&&isFinite(Number(originY))&&isFinite(Number(dragStartX))&&isFinite(Number(dragStartY));
var aim=GM.CaptureOnly.aimData(this,originX,originY,dragStartX,dragStartY);
var ratio=aim.ringHit?this._ringRadius/RING_MAX:0.90;
var result;
if(aim.hit){result=GM.CaptureOnly.roll(this._pokemon,item.key,ratio);
}
else{result={captured:false,shakes:0,chance:0,timing:{grade:'MISS',text:'',mult:0}
,text:'',aimMiss:true,missSide:aim.side}
;
}
result.aim=aim;
GM.loseItem(item.key,1);
this.refreshBalls(false);
this.refreshDifficulty();
this._ringFrozen=true;
this._ring.visible=false;
this._ballPanel.visible=false;
this._ballContainer.visible=false;
if(this._moment){this._moment.visible=false;
}
if(aim.hit&&aim.ringHit&&result.text){this.showGrade(result.text);
}
var ball=GM.Capture.createBallSprite(item.key);
ball.x=hasPointerOrigin?Number(originX):Graphics.boxWidth/2;
ball.y=hasPointerOrigin?Number(originY):Graphics.boxHeight-72;
ball.scale.x=0.27;
ball.scale.y=0.27;
this.addChild(ball);
if(aim.hit){this.setMessage('¡Has lanzado una '+item.name+'!');
}
else{this.setMessage('¡La Poké Ball va desviada hacia la '+aim.side+'!');
}
this._anim={sprite:ball,result:result,phase:'throw',frame:0,shake:0,shakeSoundPlayed:false,sx:ball.x,sy:ball.y,tx:aim.aimX,ty:aim.aimY,pokemonX:this._pokemonSprite.x,pokemonY:this.pokemonCenterY(),gy:this._pokemonGroundY+28,missExitX:aim.aimX+(aim.offsetX<0?-170:170),missExitY:Math.max(30,aim.aimY-100)}
;
}
;
Scene_GranadaMonCaptureOnly.prototype.updateCaptureAnimation=function(){var a=this._anim;
if(!a||!a.sprite){return;
}
var ball=a.sprite;
a.frame++;
if(a.phase==='throw'){var t=Math.min(1,a.frame/28);
var ease=1-Math.pow(1-t,2);
ball.x=a.sx+(a.tx-a.sx)*ease;
ball.y=a.sy+(a.ty-a.sy)*ease-Math.sin(t*Math.PI)*150;
ball.rotation+=0.34;
if(a.frame>=28){ball.x=a.tx;
ball.y=a.ty;
ball.rotation=0;
if(a.result&&a.result.aimMiss){a.phase='missFly';
a.frame=0;
if(SoundManager.playBuzzer){SoundManager.playBuzzer();
}
}
else{a.phase='absorb';
a.frame=0;
this.startImpactFlash(0.34);
if(SoundManager.playOk){SoundManager.playOk();
}
}
}
return;
}
if(a.phase==='missFly'){var missT=Math.min(1,a.frame/18);
ball.x=a.tx+(a.missExitX-a.tx)*missT;
ball.y=a.ty+(a.missExitY-a.ty)*missT-Math.sin(missT*Math.PI)*24;
ball.rotation+=0.40;
ball.alpha=1-missT*0.55;
if(a.frame>=18){this.aimFailure();
}
return;
}
if(a.phase==='absorb'){var absorbT=Math.min(1,a.frame/18);
this._pokemonSprite.alpha=1-absorbT;
this._pokemonSprite.y=this._pokemonGroundY-absorbT*(this._pokemonVisualHeight*0.38);
var ps=this._pokemonScale*(1-absorbT*0.84);
this._pokemonSprite.scale.x=ps;
this._pokemonSprite.scale.y=ps;
if(a.frame>=18){this._pokemonSprite.visible=false;
a.phase='drop';
a.frame=0;
}
return;
}
if(a.phase==='drop'){var dropT=Math.min(1,a.frame/20);
ball.y=a.ty+(a.gy-a.ty)*dropT*dropT;
if(a.frame>=20){ball.y=a.gy;
a.phase='wait';
a.frame=0;
}
return;
}
if(a.phase==='wait'){if(a.frame>=14){a.frame=0;
a.phase=a.result.shakes>0?'shake':'escape';
}
return;
}
if(a.phase==='shake'){var shakeDurations=[21,25,31];
var duration=shakeDurations[Math.min(a.shake,2)];
var shakeT=clamp(a.frame/duration,0,1);
var amp=[0.25,0.21,0.17][Math.min(a.shake,2)];
var lateral=[8,7,6][Math.min(a.shake,2)];
ball.rotation=Math.sin(shakeT*Math.PI*2)*amp;
ball.x=a.tx+Math.sin(shakeT*Math.PI*2)*lateral;
ball.y=a.gy-Math.sin(shakeT*Math.PI)*2.5;
if(!a.shakeSoundPlayed&&a.frame>=Math.floor(duration*0.45)){a.shakeSoundPlayed=true;
if(SoundManager.playCursor){SoundManager.playCursor();
}
}
if(a.frame>=duration){ball.rotation=0;
ball.x=a.tx;
ball.y=a.gy;
a.shake++;
a.frame=0;
a.shakeSoundPlayed=false;
if(a.shake<a.result.shakes){a.pauseDuration=[14,19,27][Math.min(a.shake-1,2)];
a.phase='pause';
}
else{a.phase=a.result.captured?'success':'escape';
}
}
return;
}
if(a.phase==='pause'){if(a.frame>=Number(a.pauseDuration||14)){a.phase='shake';
a.frame=0;
}
return;
}
if(a.phase==='success'){var pulse=1+Math.sin(a.frame*0.45)*0.025;
ball.scale.x=0.27*pulse;
ball.scale.y=0.27*pulse;
if(a.frame>=34){this.captureSuccess();
}
return;
}
if(a.phase==='escape'){if(a.frame>=12){this.captureFailure();
}
}
}
;
Scene_GranadaMonCaptureOnly.prototype.captureSuccess=function(){if(!this._anim||this._captured){return;
}
this._captured=true;
this._closing=true;
var beforeEntry=GM.getDexEntry?GM.getDexEntry(this._pokemon.speciesId):null;
var wasCaught=!!(beforeEntry&&beforeEntry.caught===true);
var destination=GM.CaptureOnly.storePokemon(this._pokemon);
this._newDexEntry=!wasCaught;
GM.CaptureOnly.resolveEvent(this._context);
if(destination==='STORAGE'){this.setMessage('¡Has capturado a '+this._pokemon.name+'! Se ha enviado al almacenamiento.');
}
else{this.setMessage('¡Has capturado a '+this._pokemon.name+'!');
}
if(SoundManager.playRecovery){SoundManager.playRecovery();
}
else{SoundManager.playOk();
}
this.startSuccessFx();
this.showCaptureBanner(destination,this._newDexEntry);
if(this._help){this._help.visible=false;
}
if(this._fails){this._fails.visible=false;
}
if(this._difficulty){this._difficulty.visible=false;
}
if(this._moment){this._moment.visible=false;
}
if(this._ring){this._ring.visible=false;
}
if(this._ballPanel){this._ballPanel.visible=false;
}
if(this._ballContainer){this._ballContainer.visible=false;
}
this._anim=null;
this._finish=180;
}
;
Scene_GranadaMonCaptureOnly.prototype.aimFailure=function(){var a=this._anim;
if(!a){return;
}
var side=a.result&&a.result.missSide?a.result.missSide:'lado';
if(a.sprite&&a.sprite.parent){a.sprite.parent.removeChild(a.sprite);
}
this._anim=null;
this._pokemonAction=null;
this._failCount++;
this._mood=GM.CaptureOnly.moodData(this._failCount);
this.refreshFails();
this.refreshDifficulty();
this._pokemonSprite.visible=true;
this._pokemonSprite.alpha=1;
this._pokemonSprite.x=Graphics.boxWidth/2;
this._pokemonSprite.y=this._pokemonGroundY;
this._pokemonSprite.scale.x=this._pokemonScale;
this._pokemonSprite.scale.y=this._pokemonScale;
this._pokemonSprite.rotation=0;
var fleeChance=GM.CaptureOnly.fleeChance(this._pokemon,this._failCount);
if(fleeChance>0&&Math.random()<fleeChance){this.pokemonFled();
return;
}
this.setMessage('¡Has fallado! La Poké Ball pasó por la '+side+'.');
this._ringPhase=1;
this._ringDir=-1;
this._ringRadius=RING_MAX;
this._ringFrozen=false;
this._vulnerableFrames=0;
this.scheduleNextWildAction();
this._retry=42;
}
;
Scene_GranadaMonCaptureOnly.prototype.captureFailure=function(){var a=this._anim;
if(!a){return;
}
var shakes=a.result?Number(a.result.shakes||0):0;
if(a.sprite&&a.sprite.parent){a.sprite.parent.removeChild(a.sprite);
}
this.startImpactFlash(0.25);
this._anim=null;
this._pokemonAction=null;
this._failCount++;
this._mood=GM.CaptureOnly.moodData(this._failCount);
this.refreshFails();
this.refreshDifficulty();
this._pokemonSprite.visible=true;
this._pokemonSprite.alpha=0;
this._pokemonSprite.x=Graphics.boxWidth/2;
this._pokemonSprite.y=this._pokemonGroundY-10;
this._pokemonSprite.scale.x=this._pokemonScale*0.26;
this._pokemonSprite.scale.y=this._pokemonScale*0.26;
var fleeChance=GM.CaptureOnly.fleeChance(this._pokemon,this._failCount);
if(fleeChance>0&&Math.random()<fleeChance){this.pokemonFled();
return;
}
this.setMessage(GM.CaptureOnly.failureText(this._pokemon,shakes));
if(SoundManager.playBuzzer){SoundManager.playBuzzer();
}
this._ringPhase=1;
this._ringDir=-1;
this._ringRadius=RING_MAX;
this._ringFrozen=false;
this._vulnerableFrames=0;
this.scheduleNextWildAction();
this._retry=64;
}
;
Scene_GranadaMonCaptureOnly.prototype.pokemonFled=function(){this._fled=true;
this._closing=true;
this._ringFrozen=true;
this._vulnerableFrames=0;
if(this._pokemonSprite){this._pokemonSprite.visible=true;
this._pokemonSprite.alpha=1;
this._pokemonSprite.x=Graphics.boxWidth/2;
this._pokemonSprite.y=this._pokemonGroundY;
this._pokemonSprite.scale.x=this._pokemonScale;
this._pokemonSprite.scale.y=this._pokemonScale;
}
if(this._ring){this._ring.visible=false;
}
if(this._ballPanel){this._ballPanel.visible=false;
}
if(this._ballContainer){this._ballContainer.visible=false;
}
if(this._moment){this._moment.visible=false;
}
if(SoundManager.playEscape){SoundManager.playEscape();
}
else{SoundManager.playCancel();
}
this.setMessage('¡'+this._pokemon.name+' ha huido! Podrás encontrarlo de nuevo.');
this._finish=105;
}
;
window.Scene_GranadaMonCaptureOnly=Scene_GranadaMonCaptureOnly;
var _GMCO6_pluginCommand=Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand=function(command,args){_GMCO6_pluginCommand.call(this,command,args);
var cmd=String(command||'').toLowerCase();
if(cmd==='granadamoncaptureonlygd'){if(!depsOK()){return;
}
var gdex=Number(args[0]||0);
var level=Number(args[1]||1);
var species=GM.getSpeciesByGranadaDex(gdex);
if(!species){if($gameMessage){$gameMessage.add('No existe el Pokémon Granada #'+gdex+'.');
}
return;
}
GM.CaptureOnly.start(species.nationalDex,level,$gameMap?$gameMap.mapId():0,this._eventId||0);
}
if(cmd==='granadamoncaptureonly'){GM.CaptureOnly.start(Number(args[0]||0),Number(args[1]||1),$gameMap?$gameMap.mapId():0,this._eventId||0);
}
if(cmd==='granadamoncapturerates'){var rateLevel=clamp(Number(args[0]||1),1,100);
var rates=GM.CaptureOnly.ratesForLevel(rateLevel);
if($gameMessage){$gameMessage.add('Captura directa · Nivel '+Math.floor(rateLevel));
var names={POKE_BALL:'Poké Ball',SUPER_BALL:'Super Ball',ULTRA_BALL:'Ultra Ball',MASTER_BALL:'Master Ball'}
;
for(var ri=0;
ri<rates.length;
ri++){var rate=rates[ri];
$gameMessage.add(names[rate.key]+': Bien '+percent(rate.good)+'% · Genial '+percent(rate.great)+'% · Excelente '+percent(rate.excellent)+'%');
}
}
}
}
;
console.log('GranadaMon CaptureOnly v7.2 PUNTERÍA REAL + balance suavizado cargado correctamente.');
}
)();