import { START_MAP_ID } from '../data/maps';

/** 스토리 진행 상황 */
export class Progress {
  /** 황금기사에게 초보자 장비를 받았는가: 받기(took) / 받지 않기(refused, 방패까지 받음) */
  starterGear: 'none' | 'took' | 'refused' = 'none';
  /** 마지막으로 있던 맵. 불러오면 이 맵에서 시작한다. */
  mapId: string = START_MAP_ID;

  reset() {
    this.starterGear = 'none';
    this.mapId = START_MAP_ID;
  }
}
