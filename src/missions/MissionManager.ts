import { gameVariables } from '../data/variables';

export type MissionStage = 'available' | 'to-shop' | 'return-to-jack' | 'completed';

export class MissionManager {
  stage: MissionStage = 'available';
  cash = 0;
  reputation = 0;

  get target() {
    if (this.stage === 'to-shop') return { x: 5, z: 8, label: gameVariables.places.recordShop.displayName };
    if (this.stage === 'return-to-jack') return { x: -1.5, z: -13.7, label: gameVariables.characters.john.displayName };
    return null;
  }

  acceptFirstMission() {
    if (this.stage === 'available') this.stage = 'to-shop';
  }

  findInstrument() {
    if (this.stage === 'to-shop') this.stage = 'return-to-jack';
  }

  completeFirstMission() {
    if (this.stage !== 'return-to-jack') return;
    this.stage = 'completed';
    this.cash += gameVariables.openingMission.rewardCash;
    this.reputation += gameVariables.openingMission.rewardReputation;
  }
}
