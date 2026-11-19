import { gameVariables } from '../data/variables';
import { LIVERPOOL_LOCATIONS } from '../data/locations';
import { LIVERPOOL_TRAVEL_DESTINATIONS } from '../data/travel';
import { LIVERPOOL_SATELLITE_URL, worldToMapPercent } from '../data/geography';
import type { MissionManager } from '../missions/MissionManager';

type MapTarget = { x: number; z: number; label: string } | null;

export class UI {
  private interaction = document.getElementById('interaction')!;
  private dialogue = document.getElementById('dialogue')!;
  private dialogueText = document.getElementById('dialogue-text')!;
  private speaker = document.getElementById('speaker')!;
  private step = 0;
  private dialogueLines: string[] = [...gameVariables.openingMission.dialogue];
  private dialogueMode: 'offer' | 'none' = 'none';
  private mapZoom = 1;
  private travelBuilt = false;

  constructor(private missions: MissionManager) {
    document.title = gameVariables.game.title;
    const brand = document.querySelector('.brand');
    if (brand) brand.textContent = gameVariables.game.title;
    const startLogo = document.querySelector('.start-logo');
    if (startLogo) startLogo.textContent = gameVariables.game.title;

    document.getElementById('dialogue-next')!.addEventListener('click', () => this.nextDialogue());
    document.getElementById('map-close')!.addEventListener('click', () => this.toggleMap(false));
    document.getElementById('map-button')!.addEventListener('click', () => this.toggleMap());
    document.getElementById('map-zoom-in')?.addEventListener('click', () => this.setMapZoom(0.35));
    document.getElementById('map-zoom-out')?.addEventListener('click', () => this.setMapZoom(-0.35));
    document.getElementById('map-zoom-reset')?.addEventListener('click', () => { this.mapZoom = 1; this.applyMapZoom(); });
    document.getElementById('minimap')!.addEventListener('click', () => this.toggleMap(true));
    document.getElementById('location-close')!.addEventListener('click', () => this.closeLocation());
    document.getElementById('travel-close')?.addEventListener('click', () => this.closeTravel());
    this.buildTravelDoors();
    document.querySelector('[data-action="interact"]')?.addEventListener('click', () => {
      window.dispatchEvent(new Event('game-interact'));
    });
    this.buildMaps();
  }

  private buildMaps() {
    document.querySelectorAll<HTMLElement>('[data-map-surface]').forEach((surface) => {
      const content = document.createElement('div');
      content.className = 'map-content';
      content.dataset.mapContent = '';
      content.style.backgroundImage = 'url("' + LIVERPOOL_SATELLITE_URL + '")';
      surface.appendChild(content);
      surface.addEventListener('wheel', (event) => {
        event.preventDefault();
        this.setMapZoom(event.deltaY < 0 ? 0.2 : -0.2);
      }, { passive: false });

      for (const location of LIVERPOOL_LOCATIONS) {
        const marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'geo-place-pin';
        marker.textContent = '•';
        marker.title = location.name;
        marker.setAttribute('aria-label', `Explorar ${location.name}`);
        const point = worldToMapPercent(location.world);
        marker.style.left = `${point.x}%`;
        marker.style.top = `${point.y}%`;
        marker.addEventListener('click', (event) => {
          event.stopPropagation();
          this.openLocation(location.id);
        });
        content.appendChild(marker);
      }

      const player = document.createElement('span');
      player.className = 'map-player';
      player.dataset.mapPlayer = '';
      content.appendChild(player);

      const objective = document.createElement('span');
      objective.className = 'map-objective';
      objective.dataset.mapObjective = '';
      objective.textContent = '◆';
      objective.hidden = true;
      content.appendChild(objective);

      const mission = document.createElement('span');
      mission.className = 'map-mission';
      mission.dataset.mapMission = '';
      mission.textContent = 'J';
      const jackPlace = LIVERPOOL_LOCATIONS.find((place) => place.id === 'st-peters')!;
      const jackPoint = worldToMapPercent({ x: jackPlace.world.x, z: jackPlace.world.z + 10 });
      mission.style.left = `${jackPoint.x}%`;
      mission.style.top = `${jackPoint.y}%`;
      content.appendChild(mission);
    });
  }

  private setMapZoom(delta: number) {
    this.mapZoom = Math.max(1, Math.min(4.5, this.mapZoom + delta));
    this.applyMapZoom();
  }

  private applyMapZoom() {
    document.querySelectorAll<HTMLElement>('[data-map-content]').forEach((content) => {
      content.style.transform = 'scale(' + this.mapZoom + ')';
    });
    document.querySelectorAll<HTMLElement>('[data-map-zoom-level]').forEach((label) => {
      label.textContent = Math.round(this.mapZoom * 100) + '%';
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
      if (event.key.toLowerCase() === 'e' && !this.dialogueVisible() && !this.locationVisible()) callback();
    });
  }

  bindMap(callback: () => void) {
    window.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'm' && !this.dialogueVisible() && !this.locationVisible()) callback();
    });
  }

  toggleMap(force?: boolean) {
    const panel = document.getElementById('map-panel')!;
    const open = force === undefined ? panel.hidden : force;
    panel.hidden = !open;
    document.getElementById('minimap')?.classList.toggle('map-expanded', open);
  }

  updateMap(position: { x: number; z: number }, target: MapTarget, missionStage: string) {
    const playerPoint = worldToMapPercent(position);
    document.querySelectorAll<HTMLElement>('[data-map-player]').forEach((marker) => {
      marker.style.left = `${playerPoint.x}%`;
      marker.style.top = `${playerPoint.y}%`;
    });

    document.querySelectorAll<HTMLElement>('[data-map-objective]').forEach((marker) => {
      if (!target) {
        marker.hidden = true;
        return;
      }
      const point = worldToMapPercent(target);
      marker.hidden = false;
      marker.style.left = `${point.x}%`;
      marker.style.top = `${point.y}%`;
      marker.title = target.label;
    });

    document.querySelectorAll<HTMLElement>('[data-map-mission]').forEach((marker) => {
      marker.hidden = missionStage !== 'available';
    });

    document.querySelectorAll<HTMLElement>('[data-map-status]').forEach((element) => {
      element.textContent = missionStage === 'available'
        ? 'MISIÓN DISPONIBLE · BUSCA A JACK'
        : missionStage === 'to-shop'
          ? 'MISIÓN · VE AL LUGAR INDICADO'
          : missionStage === 'return-to-jack'
            ? 'MISIÓN · REGRESA CON JACK'
            : 'MISIÓN DEL NIVEL COMPLETADA';
    });
  }

  private buildTravelDoors() {
    if (this.travelBuilt) return;
    const grid = document.getElementById('travel-destinations');
    if (!grid) return;
    for (const destination of LIVERPOOL_TRAVEL_DESTINATIONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-door';
      button.dataset.travelId = destination.id;
      button.style.setProperty('--door-color', destination.color);
      const category = document.createElement('span');
      category.className = 'travel-door-category';
      category.textContent = destination.category;
      const title = document.createElement('strong');
      title.textContent = destination.label;
      const subtitle = document.createElement('small');
      subtitle.textContent = destination.subtitle;
      const action = document.createElement('span');
      action.className = 'travel-door-action';
      action.textContent = 'ENTRAR →';
      button.append(category, title, subtitle, action);
      button.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('livercity-travel-selected', { detail: { id: destination.id } }));
      });
      grid.appendChild(button);
    }
    this.travelBuilt = true;
  }

  openTravel() {
    this.toggleMap(false);
    const panel = document.getElementById('travel-panel');
    if (!panel) return;
    panel.hidden = false;
    window.dispatchEvent(new Event('livercity-location-open'));
    this.setInteraction('');
  }

  closeTravel() {
    const panel = document.getElementById('travel-panel');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    window.dispatchEvent(new Event('livercity-location-close'));
  }

  openLocation(locationId: string) {
    const location = LIVERPOOL_LOCATIONS.find((place) => place.id === locationId);
    if (!location) return;

    this.toggleMap(false);
    const panel = document.getElementById('location-panel')!;
    document.getElementById('location-name')!.textContent = location.name;
    document.getElementById('location-address')!.textContent = location.address;
    document.getElementById('location-description')!.textContent = location.description;
    document.getElementById('location-history')!.textContent = location.historicalNote;

    const mapsKey = document.querySelector<HTMLMetaElement>('meta[name="google-maps-embed-key"]')?.content.trim() ?? '';
    const streetView = document.getElementById('street-view-frame') as HTMLIFrameElement;
    const streetViewPlaceholder = document.getElementById('street-view-placeholder')!;
    const streetViewLink = document.getElementById('street-view-link') as HTMLAnchorElement;
    const googleMapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lon}`;
    streetViewLink.href = googleMapsUrl;

    if (mapsKey && !mapsKey.includes('%VITE_')) {
      const embedUrl = new URL('https://www.google.com/maps/embed/v1/streetview');
      embedUrl.searchParams.set('key', mapsKey);
      embedUrl.searchParams.set('location', `${location.lat},${location.lon}`);
      embedUrl.searchParams.set('heading', String(location.streetViewHeading));
      embedUrl.searchParams.set('pitch', String(location.streetViewPitch));
      embedUrl.searchParams.set('fov', '80');
      streetView.src = embedUrl.toString();
      streetView.hidden = false;
      streetViewPlaceholder.hidden = true;
    } else {
      streetView.removeAttribute('src');
      streetView.hidden = true;
      streetViewPlaceholder.hidden = false;
    }

    const gallery = document.getElementById('location-gallery')!;
    gallery.replaceChildren();
    if (location.gallery.length) {
      for (const photo of location.gallery) {
        const figure = document.createElement('figure');
        const image = document.createElement('img');
        image.src = new URL(photo.src, document.baseURI).toString();
        image.alt = photo.caption;
        image.loading = 'lazy';
        const caption = document.createElement('figcaption');
        caption.textContent = photo.caption;
        const credit = document.createElement('small');
        credit.textContent = photo.credit;
        figure.append(image, caption, credit);
        gallery.appendChild(figure);
      }
    } else {
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'Aún no hay fotografías publicadas aquí. Esta galería se completará con imágenes propias o seleccionadas y verificadas por el equipo de LiverCity.';
      gallery.appendChild(empty);
    }

    const website = document.getElementById('location-website') as HTMLAnchorElement;
    if (location.website) {
      website.href = location.website;
      website.hidden = false;
    } else {
      website.hidden = true;
    }
    panel.hidden = false;
    window.dispatchEvent(new Event('livercity-location-open'));
    this.setInteraction('');
  }

  closeLocation() {
    const panel = document.getElementById('location-panel')!;
    panel.hidden = true;
    const frame = document.getElementById('street-view-frame') as HTMLIFrameElement;
    frame.removeAttribute('src');
    window.dispatchEvent(new Event('livercity-location-close'));
  }

  private locationVisible() {
    return !document.getElementById('location-panel')!.hidden;
  }

  setInteraction(text: string) {
    this.interaction.hidden = !text || this.dialogueVisible() || this.locationVisible();
    document.getElementById('interaction-copy')!.textContent = text;
  }

  openProtagonistDialogue() {
    if (this.missions.stage === 'available') {
      const mission = this.missions.currentMission;
      if (!mission) {
        this.notify('¡Ya completaste todas las misiones de este nivel!');
        return;
      }
      this.dialogueMode = 'offer';
      this.step = 0;
      const character = gameVariables.characters[mission.characterId as keyof typeof gameVariables.characters];
      this.dialogueLines = mission.id.endsWith('-meet')
        ? [...gameVariables.openingMission.dialogue]
        : [mission.title, mission.objective, `Este capítulo transcurre entre ${mission.historicalDate}. ¡Sigamos con la historia!`];
      this.speaker.textContent = character.displayName.toUpperCase();
      this.dialogueText.textContent = this.dialogueLines[0];
      document.getElementById('dialogue-next')!.textContent = 'CONTINUAR →';
      this.dialogue.hidden = false;
      this.setInteraction('');
      return;
    }

    if (this.missions.stage === 'return-to-jack') {
      this.missions.completeFirstMission();
      this.notify(this.missions.currentMission
        ? '¡Misión completada! Tienes un nuevo encargo.'
        : '¡Nivel completado! Terminaste todas las misiones.');
      this.refresh();
      return;
    }

    if (this.missions.stage === 'to-shop') {
      this.notify('Primero tienes que cumplir el objetivo. ¡No te distraigas!');
      return;
    }
    this.notify('¡Qué bueno verte de nuevo!');
  }

  acceptMission() {
    this.missions.acceptFirstMission();
    this.dialogue.hidden = true;
    this.dialogueMode = 'none';
    const target = this.missions.target;
    this.notify(`MISIÓN ACEPTADA · VE A ${target?.label.toUpperCase() ?? 'TU OBJETIVO'}`);
    this.refresh();
  }

  private nextDialogue() {
    this.step++;
    if (this.step < this.dialogueLines.length) {
      this.dialogueText.textContent = this.dialogueLines[this.step];
      if (this.step === this.dialogueLines.length - 1) {
        document.getElementById('dialogue-next')!.textContent = 'ACEPTAR MISIÓN →';
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
