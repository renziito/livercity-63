import { gameVariables } from '../data/variables';
import type { MissionManager } from '../missions/MissionManager';

type MapTarget = { x: number; z: number; label: string } | null;

export class UI {
  private interaction = document.getElementById('interaction')!;
  private dialogue = document.getElementById('dialogue')!;
  private dialogueText = document.getElementById('dialogue-text')!;
  private speaker = document.getElementById('speaker')!;
  private step = 0;
  private dialogueLines = [...gameVariables.openingMission.dialogue];
  private dialogueMode: 'offer' | 'none' = 'none';

  constructor(private missions: MissionManager) {
    document.title = gameVariables.game.title;
    const brand = document.querySelector('.brand');
    if (brand) brand.textContent = gameVariables.game.title;
    const startLogo = document.querySelector('.start-logo');
    if (startLogo) startLogo.textContent = gameVariables.game.title;

    document.getElementById('dialogue-next')!.addEventListener('click', () => this.nextDialogue());
    document.getElementById('map-close')!.addEventListener('click', () => this.toggleMap(false));
    document.getElementById('map-button')!.addEventListener('click', () => this.toggleMap());
    document.getElementById('minimap')!.addEventListener('click', () => this.toggleMap(true));
    document.querySelector('[data-action="interact"]')?.addEventListener('click', () => {
      window.dispatchEvent(new Event('game-interact'));
    });
  }

  bindStart(callback: () => void) {
    document.getElementById('start-button')!.addEventListener('click', () => {
      document.getElementById('start-screen')!.classList.add('hidden');
      window.setTimeout(() => document.getElementById('start-screen')?.remove(), 750);
      callback();
    });
  }

  bindInteract(callback: () => void) {
    window.addEventListener('game-interact', callback);
    window.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'e' && !this.dialogueVisible()) callback();
    });
  }

  bindMap(callback: () => void) {
    window.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'm' && !this.dialogueVisible()) callback();
    });
  }

  toggleMap(force?: boolean) {
    const panel = document.getElementById('map-panel')!;
    const open = force === undefined ? panel.hidden : force;
    panel.hidden = !open;
    document.getElementById('minimap')?.classList.toggle('map-expanded', open);
  }

  updateMap(position: { x: number; z: number }, target: MapTarget, missionStage: string) {
    document.querySelectorAll<HTMLElement>('[data-map-player]').forEach((player) => {
      const x = ((position.x + 130) / 260) * 100;
      const y = ((position.z + 110) / 220) * 100;
      player.style.left = `${Math.max(2, Math.min(98, x))}%`;
      player.style.top = `${Math.max(2, Math.min(98, y))}%`;
    });

    document.querySelectorAll<HTMLElement>('[data-map-objective]').forEach((marker) => {
      if (!target) {
        marker.hidden = true;
        return;
      }
      marker.hidden = false;
      marker.style.left = `${((target.x + 130) / 260) * 100}%`;
      marker.style.top = `${((target.z + 110) / 220) * 100}%`;
      marker.title = target.label;
    });

    document.querySelectorAll<HTMLElement>('[data-map-mission]').forEach((marker) => {
      marker.hidden = missionStage !== 'available';
    });
    const status = document.querySelectorAll<HTMLElement>('[data-map-status]');
    status.forEach((el) => {
      el.textContent = missionStage === 'available'
        ? 'MISSION AVAILABLE · FIND JACK'
        : missionStage === 'to-shop'
          ? 'MISSION · FIND THE INSTRUMENT'
          : missionStage === 'return-to-jack'
            ? 'MISSION · RETURN TO JACK'
            : 'LEVEL MISSIONS COMPLETE';
    });
  }

  setInteraction(text: string) {
    this.interaction.hidden = !text || this.dialogueVisible();
    document.getElementById('interaction-copy')!.textContent = text;
  }

  openProtagonistDialogue() {
    if (this.missions.stage === 'available') {
      this.dialogueMode = 'offer';
      this.step = 0;
      this.speaker.textContent = gameVariables.characters.john.displayName.toUpperCase();
      this.dialogueText.textContent = this.dialogueLines[0];
      document.getElementById('dialogue-next')!.textContent = 'CONTINUE →';
      this.dialogue.hidden = false;
      this.setInteraction('');
      return;
    }

    if (this.missions.stage === 'return-to-jack') {
      this.missions.completeFirstMission();
      this.notify('MISSION COMPLETE · REPUTATION +' + this.missions.reputation);
      this.refresh();
      return;
    }

    if (this.missions.stage === 'to-shop') {
      this.notify('I need you to find that instrument first.');
      return;
    }

    this.notify('Good to see you again.');
  }

  acceptMission() {
    this.missions.acceptFirstMission();
    this.dialogue.hidden = true;
    this.dialogueMode = 'none';
    this.notify('MISSION ACCEPTED · GO TO NEEDLE & GROOVE');
    this.refresh();
  }

  private nextDialogue() {
    this.step++;
    if (this.step < this.dialogueLines.length) {
      this.dialogueText.textContent = this.dialogueLines[this.step];
      if (this.step === this.dialogueLines.length - 1) {
        document.getElementById('dialogue-next')!.textContent = 'ACCEPT MISSION →';
      }
      return;
    }
    this.acceptMission();
  }

  private dialogueVisible() {
    return !this.dialogue.hidden;
  }

  notify(message: string) {
    const element = document.getElementById('toast')!;
    element.textContent = message;
    element.classList.add('show');
    window.setTimeout(() => element.classList.remove('show'), 2600);
  }

  refresh() {
    document.getElementById('cash')!.textContent = String(this.missions.cash);
    document.getElementById('rep')!.textContent = String(this.missions.reputation);
  }
}
