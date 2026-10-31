// Script inline exécuté dans <head>, avant le premier affichage : décide si la page s'ouvre
// sur la carte 3D (data-scene="on") ou en mode classique, pour éviter tout flash de mise en page.
// Même logique que initSceneMode() dans lib/scene-mode.ts : les garder synchronisées.
// data-view : « map » sur l'accueil (carte plein écran), « panel » ailleurs (contenu en panneau).

export const sceneBootScript = `(function(){try{
var d=document.documentElement,m=window.matchMedia,on=false,gl=false;
d.dataset.view=location.pathname==="/"?"map":"panel";
try{var c=document.createElement("canvas").getContext("webgl2");gl=!!c;if(c){var x=c.getExtension("WEBGL_lose_context");x&&x.loseContext();}}catch(e){}
var q=new URLSearchParams(location.search).get("scene"),s=null,f=null;
try{s=localStorage.getItem("scene-mode");}catch(e){}
try{f=sessionStorage.getItem("scene-fallback");}catch(e){}
if(!gl)on=false;
else if(q==="3d"||q==="light")on=q==="3d";
else if(s==="3d"||s==="light")on=s==="3d";
else if(f)on=false;
else{var n=navigator.connection;on=!(m("(prefers-reduced-motion: reduce)").matches||(n&&n.saveData)||m("(pointer: coarse)").matches||!m("(min-width: 64rem)").matches);}
d.dataset.scene=on?"on":"off";
}catch(e){}})();`;
