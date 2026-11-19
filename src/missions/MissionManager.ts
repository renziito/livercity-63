import { gameVariables } from '../data/variables';

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
    if (this.stage === 'to-shop') {
      const targets: Record<string,{x:number;z:number;label:string}> = {
        recordshop:{x:8,z:-11,label:gameVariables.places.recordShop.displayName},
        cavern:{x:-26,z:-14.2,label:gameVariables.places.cavernClub.displayName},
        'penny-lane':{x:40,z:13.8,label:gameVariables.places.pennyLane.displayName},
        casbah:{x:45,z:-56.2,label:gameVariables.places.casbahCoffeeClub.displayName},
        'st-peters':{x:85,z:28.8,label:gameVariables.places.stPetersChurch.displayName}
      };
      return targets[this.currentMission?.targetId ?? 'recordshop'] ?? targets.recordshop;
    }
    if (this.stage === 'return-to-jack') return { x: 85, z: 18.5, label: gameVariables.characters.john.displayName };
    if (this.stage === 'available') return { x: 85, z: 18.5, label: gameVariables.characters.john.displayName };
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
