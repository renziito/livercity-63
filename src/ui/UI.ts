import { gameVariables } from '../data/variables';
import type { MissionManager } from '../missions/MissionManager';
export class UI {
  private interaction=document.getElementById('interaction')!;private dialogue=document.getElementById('dialogue')!;private dialogueText=document.getElementById('dialogue-text')!;private speaker=document.getElementById('speaker')!;private step=0;private dialogueLines=[...gameVariables.openingMission.dialogue];
  constructor(private missions:MissionManager){
    document.getElementById('dialogue-next')!.addEventListener('click',()=>this.nextDialogue());
    document.getElementById('map-close')!.addEventListener('click',()=>this.toggleMap(false));
    document.getElementById('map-button')!.addEventListener('click',()=>this.toggleMap());
    document.querySelector('[data-action="interact"]')?.addEventListener('click',()=>window.dispatchEvent(new Event('game-interact')));
  }
  bindStart(cb:()=>void){document.getElementById('start-button')!.addEventListener('click',()=>{document.getElementById('start-screen')!.classList.add('hidden');setTimeout(()=>document.getElementById('start-screen')!.remove(),750);cb();});}
  bindInteract(cb:()=>void){window.addEventListener('game-interact',cb);window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&!this.dialogueVisible())cb();});}
  bindMap(cb:()=>void){window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='m')cb();});}
  toggleMap(force?:boolean){const el=document.getElementById('map-panel')!;el.hidden=force===undefined?!el.hidden:!force;}
  setInteraction(text:string){this.interaction.hidden=!text||this.dialogueVisible();document.getElementById('interaction-copy')!.textContent=text;}
  openProtagonistDialogue(){this.step=0;this.speaker.textContent=gameVariables.characters.john.displayName.toUpperCase();this.dialogueText.textContent=this.dialogueLines[0];this.dialogue.hidden=false;this.setInteraction('');}
  private nextDialogue(){this.step++;if(this.step<this.dialogueLines.length){this.dialogueText.textContent=this.dialogueLines[this.step];return;}this.dialogue.hidden=true;this.missions.completeFirstMission();this.notify(`MISSION COMPLETE · £${this.missions.cash} · REPUTATION +${this.missions.reputation}`);this.refresh();}
  private dialogueVisible(){return !this.dialogue.hidden;}
  notify(message:string){const el=document.getElementById('toast')!;el.textContent=message;el.classList.add('show');window.setTimeout(()=>el.classList.remove('show'),2600);}
  refresh(){document.getElementById('mission-title')!.textContent=this.missions.title;document.getElementById('mission-copy')!.textContent=this.missions.copy;document.getElementById('mission-progress')!.style.width=`${this.missions.progress*100}%`;document.getElementById('cash')!.textContent=String(this.missions.cash);document.getElementById('rep')!.textContent=String(this.missions.reputation);}
}
