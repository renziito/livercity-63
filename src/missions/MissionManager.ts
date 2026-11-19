import { gameVariables } from '../data/variables';
import { LIVERPOOL_LOCATIONS } from '../data/locations';

export type MissionStage = 'available' | 'to-shop' | 'return-to-jack' | 'completed';

export type CampaignMission = {
  id: string;
  chapterId: string;
  levelId: string;
  levelTitle: string;
  characterId: string;
  title: string;
  objective: string;
  historicalDate: string;
  targetId: string;
  rewardCash: number;
  rewardReputation: number;
};

export class MissionManager {
  stage: MissionStage = 'available';
  cash = 0;
  reputation = 0;
  activeLevelId = 'john-early';
  completedMissionIds = new Set<string>();
  readonly campaign: CampaignMission[] = gameVariables.chapters.flatMap((chapter) =>
    chapter.levels.flatMap((level) =>
      gameVariables.missionTemplates.map((template) => ({
        id: `${level.id}-${template.suffix}`,
        chapterId: chapter.id,
        levelId: level.id,
        levelTitle: level.title,
        characterId: level.characterId,
        title: template.title,
        objective: template.objective,
        historicalDate: chapter.years,
        targetId: template.targetId,
        rewardCash: template.reward,
        rewardReputation: template.reward
      }))
    )
  );

  get missionsForActiveLevel() {
    return this.campaign.filter((mission) => mission.levelId === this.activeLevelId);
  }

  get completedCount() {
    return this.completedMissionIds.size;
  }

  get target() {
    const findPlace = (id: string) => {
      const place = LIVERPOOL_LOCATIONS.find((location) => location.id === id);
      if (!place) return null;
      return {
        x: place.world.x,
        z: place.world.z + 5.7,
        label: place.name
      };
    };

    if (this.stage === 'to-shop') {
      return findPlace(this.currentMission?.targetId ?? 'recordshop');
    }
    const church = LIVERPOOL_LOCATIONS.find((location) => location.id === 'st-peters')!;
    if (this.stage === 'return-to-jack' || this.stage === 'available') {
      return {
        x: church.world.x,
        z: church.world.z + 10,
        label: gameVariables.characters.john.displayName
      };
    }
    return null;
  }

  get currentMission() {
    return this.missionsForActiveLevel.find((mission) => !this.completedMissionIds.has(mission.id)) ?? null;
  }

  acceptFirstMission() {
    if (this.stage === 'available') this.stage = 'to-shop';
  }

  findInstrument() {
    if (this.stage === 'to-shop') this.stage = 'return-to-jack';
  }

  completeFirstMission() {
    if (this.stage !== 'return-to-jack') return;
    const mission = this.currentMission;
    if (mission) {
      this.completedMissionIds.add(mission.id);
      this.cash += mission.rewardCash;
      this.reputation += mission.rewardReputation;
    }
    this.stage = this.currentMission ? 'available' : 'completed';
  }
}
