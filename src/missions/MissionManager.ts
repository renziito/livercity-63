import { gameVariables } from '../data/variables';
import * as THREE from 'three';
export class MissionManager {
  title=gameVariables.openingMission.title; copy=gameVariables.openingMission.description; progress=0; cash=0; reputation=0; completed=false; private started=false;
  update(position:THREE.Vector3){if(this.completed||this.started)return;const d=position.distanceTo(new THREE.Vector3(-1.5,0,-13.7));if(d<3.2){this.progress=1;}}
  completeFirstMission(){if(this.completed)return;this.completed=true;this.started=true;this.title='THE FIRST ENCOUNTER';this.copy=`${gameVariables.characters.john.displayName} has a plan. Your story in ${gameVariables.places.liverpool.displayName} is just beginning.`;this.cash=gameVariables.openingMission.rewardCash;this.reputation=gameVariables.openingMission.rewardReputation;this.progress=1;}
}
