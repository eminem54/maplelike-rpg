/** 스토리 진행 상황 */
export class Progress {
  /** 황금기사에게 초보자 장비를 받았는가: 받기(took) / 받지 않기(refused, 방패까지 받음) */
  starterGear: 'none' | 'took' | 'refused' = 'none';

  reset() {
    this.starterGear = 'none';
  }
}
