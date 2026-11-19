import './style.css';
import { Game } from './core/Game';
const loading=document.getElementById('loading')!;
try { const game=new Game(document.getElementById('game') as HTMLCanvasElement);window.addEventListener('load',()=>{loading.style.opacity='0';setTimeout(()=>loading.remove(),550);}); } catch (error) { console.error(error);loading.innerHTML='<p>THE CITY COULD NOT LOAD. TRY A WEBGL-COMPATIBLE BROWSER.</p>'; }
