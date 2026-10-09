import Phaser from 'phaser';

// 키보드는 Phaser 키 객체 대신 브라우저 이벤트를 capture 단계에서 직접 받는다.
// Phaser는 다른 리스너(확장 프로그램 등)가 이미 preventDefault 한 이벤트를 무시하기 때문에
// 키가 눌린 채 고정되거나 입력이 끊기는 문제가 생긴다. 키 판정은 e.code 기준이라 한글 입력 모드에서도 동작한다.
export class KeyInput {
  private held = new Set<string>();
  private pressed = new Set<string>();

  /** @param captureCodes 브라우저 기본 동작(스크롤, Alt 메뉴 등)을 막을 키 코드 */
  constructor(scene: Phaser.Scene, captureCodes: string[]) {
    const capture = new Set(captureCodes);

    const onDown = (e: KeyboardEvent) => {
      if (capture.has(e.code)) e.preventDefault();
      if (!e.repeat && !this.held.has(e.code)) this.pressed.add(e.code);
      this.held.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      if (capture.has(e.code)) e.preventDefault();
      this.held.delete(e.code);
    };
    const onBlur = () => {
      this.held.clear();
      this.pressed.clear();
    };
    // 탭이 가려질 때만 초기화한다 (다시 보일 때 초기화하면 그 사이 눌린 키가 사라진다)
    const onVisibility = () => {
      if (document.hidden) onBlur();
    };
    // 이번 프레임에 새로 눌린 키는 update가 끝나면 비운다
    const endFrame = () => this.pressed.clear();

    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup', onUp, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, endFrame);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup', onUp, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, endFrame);
    });
  }

  /** 지금 눌려 있는 키가 하나라도 있는가 */
  isDown(codes: string[]) {
    return codes.some((c) => this.held.has(c));
  }

  /** 이번 프레임에 새로 눌린 키가 하나라도 있는가 */
  justPressed(codes: string[]) {
    return codes.some((c) => this.pressed.has(c));
  }
}
