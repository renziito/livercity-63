import { gameVariables } from '../data/variables';
import type { MissionManager } from '../missions/MissionManager';

export class UI {
  private interaction = document.getElementById('interaction')!;
  private dialogue = document.getElementById('dialogue')!;
  private dialogueText = document.getElementById('dialogue-text')!;
  private speaker = document.getElementById('speaker')!;
  private step = 0;
  private dialogueLines = [...gameVariables.openingMission.dialogue];

  constructor(private missions: MissionManager) {
    document.title = gameVariables.game.title;
    const brand = document.querySelector('.brand');
    if (brand) brand.textContent = gameVariables.game.title;
    const startLogo = document.querySelector('.start-logo');
    if (startLogo) startLogo.textContent = gameVariables.game.title;

    document.getElementById('dialogue-next')!.addEventListener('click', () => this.nextDialogue());
    document.getElementById('map-close')!.addEventListener('click', () => this.toggleMap(false));
    document.getElementById('map-button')!.addEventListener('click', () => this.toggleMap());
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
      if (event.key.toLowerCase() === 'm') callback();
    });
  }

  toggleMap(force?: boolean) {
    const panel = document.getElementById('map-panel')!;
    panel.hidden = force === undefined ? !panel.hidden : !force;
  }

  updateMap(position: { x: number; z: number }) {
    const player = document.getElementById('map-player');
    const objective = document.getElementById('map-objective');
    if (player) {
      const x = ((position.x + 27) / 54) * 100;
      const y = ((position.z + 32) / 64) * 100;
      player.style.left = `${Math.max(2, Math.min(98, x))}%`;
      player.style.top = `${Math.max(2, Math.min(98, y))}%`;
    }
    if (objective) {
      const targetX = ((-1.5 + 27) / 54) * 100;
      const targetY = ((-13.7 + 32) / 64) * 100;
      objective.style.left = `${targetX}%`;
      objective.style.top = `${targetY}%`;
    }
  }

  setInteraction(text: string) {
    this.interaction.hidden = !text || this.dialogueVisible();
    document.getElementById('interaction-copy')!.textContent = text;
  }

  openProtagonistDialogue() {
    this.step = 0;
    this.speaker.textContent = gameVariables.characters.john.displayName.toUpperCase();
    this.dialogueText.textContent = this.dialogueLines[0];
    this.dialogue.hidden = false;
    this.setInteraction('');
  }

  private nextDialogue() {
    this.step++;
    if (this.step < this.dialogueLines.length) {
      this.dialogueText.textContent = this.dialogueLines[this.step];
      return;
    }
    this.dialogue.hidden = true;
    this.missions.completeFirstMission();
    this.notify(`MISSION COMPLETE · £${this.missions.cash} · REPUTATION +${this.missions.reputation}`);
    this.refresh();
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
    document.getElementById('mission-title')!.textContent = this.missions.title;
    document.getElementById('mission-copy')!.textContent = this.missions.copy;
    document.getElementById('mission-progress')!.style.width = `${this.missions.progress * 100}%`;
    document.getElementById('cash')!.textContent = String(this.missions.cash);
    document.getElementById('rep')!.textContent = String(this.missions.reputation);
  }
}
