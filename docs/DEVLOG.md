# 개발기록

## 1. 프로젝트 개요
- **컨셉**: 메이플스토리 같은 횡스크롤 2D 액션 RPG에 액션 콤보(던파/할로우나이트)와 수집/파밍(디아블로) 요소를 섞는다. 싱글 플레이, 그래픽은 코드로 그린 픽셀아트/도형.
- **기술 스택**: Phaser 3.90 + TypeScript + Vite 5 (Node 18), 테스트는 Vitest 2.
- **실행 방법**
  - `npm install`
  - `npm run dev` → http://localhost:5173
  - `npm test` (Vitest)
  - `npx tsc` (타입 검사)
  - `npm run build` (tsc + vite build)
- **현재 검증 결과**: `npx tsc` 통과, 테스트 5개 파일 40개 통과 (stats 17, terrain 9, equipment 6, inventory 4, save 4).

## 2. 조작키
| 키 | 동작 |
|---|---|
| ← → | 이동 |
| C | 점프 (밧줄 위에서는 ←/→ + C로 뛰어내리기) |
| X | 공격 |
| Space | NPC 대화, 대화 넘기기 |
| ↑ ↓ | 밧줄·사다리 오르내리기, ↑로 빛 기둥 사용(지금은 "준비 중") |
| I | 인벤토리 + 장비창 열기/닫기 |
| S | 상태창 열기/닫기 |
| Esc | 창 닫기 |
| 마우스 | 아이템 더블클릭/우클릭으로 장착·해제, 상태창 + 버튼 |
| DEV 메뉴 | 화면 오른쪽 위에 마우스를 올리면 나오는 드롭다운: 레벨 업/다운/1로 초기화/모든 데이터 초기화 |

키 배치는 `src/data/keymap.ts`에서 바꾼다.

## 3. 폴더 구조와 주요 파일
```
src/
  main.ts            Phaser 설정 (1280x720, Arcade 중력 1400, 키보드 플러그인 끔, 우클릭 메뉴 끔)
  scenes/
    GameScene.ts     맵, 플레이어, 몬스터, NPC 구성과 매 프레임 갱신. 저장 불러오기·자동 저장 연결
    UIScene.ts       HUD, 창, 대화, DEV 메뉴 등 UI (GameScene이 띄움)
  entities/
    Player.ts        이동·점프·밧줄·공격·피격(1초 무적, 깜빡임)
    HeldItems.ts     손에 든 검·방패 겹쳐 그리기, 검 휘두르기 궤적
    Duck.ts          아기 오리 AI (비선공, 맞으면 화남)
    Sandbag.ts       샌드백
    Hittable.ts      공격 대상 공통 인터페이스
    Npc.ts, Portal.ts  황금기사 NPC, 빛 기둥
  systems/
    KeyInput.ts      window capture 단계 키 입력 (e.code 기준)
    Stats.ts         기본/전투 능력치, 레벨·경험치, 장비 보너스
    Inventory.ts     96칸 인벤토리
    Equipment.ts     13칸 장비 장착/해제
    SaveGame.ts      localStorage 저장/불러오기, AutoSaver
    Terrain.ts       꺾은선 경사 지형 충돌
    MonsterSpawner.ts  주기적 몬스터 채우기
    Progress.ts      스토리 진행(초보자 장비 수령 여부)
  ui/
    UIWindow.ts(창 공통), InventoryWindow.ts, EquipmentWindow.ts, StatusWindow.ts,
    Hud.ts(HP/MP 구슬, 경험치바), DialogBox.ts, DevMenu.ts, ItemTooltip.ts, slotInput.ts
  data/
    maps.ts(FIELD_1), items.ts, equipment.ts(13칸 배치), monsters.ts, keymap.ts, units.ts, player.ts
  art/               playerArt, duckArt, knightArt, heldItemArt, pixelArt (문자열 도트 → 텍스처)
  effects/damageText.ts   데미지 숫자
  story/knight.ts    황금기사 대화 스크립트와 선택지
tests/               stats, terrain, equipment, inventory, save
docs/                PLAN.md(계획), CONVERSATION_LOG.md(대화기록), DEVLOG.md(이 문서)
```
로직(능력치, 인벤토리, 장비, 저장, 지형)은 Phaser 의존을 최소화해 단위 테스트가 가능하다.

## 4. 단계별 개발 기록
1. **계획**: 마일스톤 M0~M6을 `docs/PLAN.md`에 정리.
2. **M0 + 기초 이동**: 프로젝트 셋업, 바닥/발판, 네모 플레이어, 카메라 추적.
3. **키 입력 재작성**: 확장 프로그램 간섭 문제로 `KeyInput`을 도입.
4. **점프 키 정리 + 밧줄·사다리**: 점프는 C만.
5. **픽셀 캐릭터**: 2등신, 16x24 도트의 3배 확대.
6. **걷기 모션**: 4프레임, 먼 쪽 다리를 어둡게.
7. **밧줄 뒷모습 모션**.
8. **범위 단위 + X 기본 공격 + 샌드백**.
9. **0.5 범위 지원**, 기본 공격 범위 0.5, 시각 효과 정리.
10. **인벤토리**: 96칸(6x8 표시), 휠 스크롤.
11. **상태창 + 능력치 체계**, 점프력 약 120px.
12. **능력치 상한 999 + 아기 오리**.
13. **하단 HUD**: HP/MP 구슬.
14. **HUD 다듬기**: 카메라 뷰포트 분리.
15. **경험치/레벨 + 상태창 + 버튼**.
16. **오리 스포너**: 10마리 유지.
17. **DEV 메뉴**.
18. **맵 개편 + 경사 지형 + 황금기사 NPC + 초보자 장비 + 빛 기둥**.
19. **장비창**: 13칸, 장착 효과 반영, 툴팁.
20. **장비칸 배치 변경** (사용자 도안).
21. **자동 저장**.
22. **손에 든 장비 + 검 공격 모션**.
23. **문서화와 첫 커밋**.

### PLAN.md 마일스톤 대비 현황
| 마일스톤 | 상태 |
|---|---|
| M0 셋업 | 완료 |
| M1 이동 | 대부분 완료 (이동, 점프, 밧줄/사다리, 카메라). 더블 점프와 아래 점프 통과는 미구현 |
| M2 전투 기본 | 일부 (기본 공격, 데미지 숫자, 피격 무적, 몬스터 1종, 리젠). 3타 콤보, 대시, 히트스톱, 경직은 미구현 |
| M3 성장 | 일부 (경험치/레벨/능력치 포인트, HP/MP). 스킬, 핫키, MP 사용은 미구현 |
| M4 파밍 | 일부 (인벤토리, 장비창, 장착 반영, 툴팁). 드랍, 등급, 랜덤 옵션, 바닥 줍기는 미구현 |
| M5 월드와 보스 | 일부 (NPC, 저장). 마을, 포털 이동, 보스, 상점은 미구현 |
| M6 다듬기 | 일부 (픽셀아트 도입). 효과음, 밸런스 조정은 미구현 |

계획서에 없던 것이 앞서 들어간 부분도 있다: 6종 기본 능력치 체계, 경사 지형, 스토리 선택지(받기/받지 않기), DEV 메뉴.

## 5. 주요 설계 결정

### 범위 단위
플레이어 너비 = 범위 1 = 48px (`PLAYER_BODY_PIXELS x PLAYER_PIXEL_SCALE`, `src/data/units.ts`). 공격 범위 등은 이 단위로 정하고 `toPixels`로 바꾼다. 0.5 같은 소수도 허용한다. 기본 공격: 범위 0.5, 공격력 계수 1, 쿨다운 450ms, 동작 180ms.

### 능력치 공식 (`src/systems/Stats.ts`)
전투 능력치 = 시작값(BASE) + (기본 능력치 - 시작 기본 능력치) x 1포인트당 증가량(PER_POINT).

시작 기본 능력치(START_PRIMARY): STR/CON/DEX/INT/WIS/MEN 모두 5.

시작 전투 능력치(BASE): maxHp 100, maxMp 100, attack 10, spell 10, hit 10, mhit 10, defense 0, evasion 5, crit 5, spellCrit 5, attackSpeed 100, castSpeed 100, moveSpeed 100.

1포인트당 증가량(PER_POINT):
| 기본 능력치 | 효과 |
|---|---|
| STR | attack +1, defense +1 |
| CON | maxHp +10 |
| DEX | attackSpeed +1, hit +1, evasion +0.5, crit +0.5, moveSpeed +0.5 |
| INT | spell +1 |
| WIS | maxMp +10, castSpeed +1, mhit +1 |
| MEN | spellCrit +0.5 |

- 레벨업으로 올리는 기본 능력치 상한은 999 (`MAX_BASE_STAT`). 아이템 보너스(`bonus`)는 상한 없음이며 상태창에 "(+5)"로 표시한다.
- 명중/회피/크리티컬 등은 지금은 계산만 하고 전투에 적용하지 않았다.

### 경험치/레벨
- 최대 레벨 999, 레벨업마다 능력치 포인트 10 (`STAT_POINTS_PER_LEVEL`).
- 필요 경험치 = `round(20 x 레벨^1.5)`. 1→2는 20 (오리 경험치 2 x 10마리).
- 레벨업하면 HP/MP가 가득 찬다.
- `highestLevel`: 최고 도달 레벨을 기억한다. DEV 메뉴로 레벨을 내렸다 올려도 이 레벨을 넘을 때만 포인트를 준다.

### 장비 보너스 계산
- `GearBonus { attackMin, attackMax, defense, maxHp }`를 `Equipment`가 장착한 아이템 합으로 만들어 `CharacterStats.setGear`로 넘긴다.
- 공격력 = `baseDerived.attack + attackMin + floor(random x (attackMax - attackMin + 1))`. 즉 공격할 때마다 무기 범위에서 무작위.
- 방어력, 최대 HP는 전투 능력치에 더한다. 최대 HP가 줄면 현재 HP도 깎는다.
- 같은 종류 칸이 비어 있으면 거기에, 모두 차 있으면 첫 칸과 교체한다. 벗을 때 인벤토리가 가득 차 있으면 실패한다.
- 아이템: 초보자용 검(공격력 5~10), 초보자용 방패(방어력 1, 체력 10).

### 지형 충돌 (`Terrain.ts`)
- Phaser Arcade는 경사를 지원하지 않아, 바닥을 `[x, y]` 꺾은선으로 두고 직접 처리한다.
- 오르막 기울기가 `MAX_WALK_SLOPE`(1.5)를 넘으면 벽으로 취급한다. 걸어서 못 오르고 점프로 넘는다.
- 한 프레임에 많이 움직여도 벽을 뚫지 않도록 평균 기울기 대신 구간마다 검사한다.
- 내리막은 `SNAP_DOWN`(10px) 이내면 바닥에 붙여 통통 튀지 않게 한다.
- 점프 높이는 약 120px이라 점프 언덕은 70~80px로 만들었다.

### 장면 갱신 순서
Phaser는 장면을 역순(나중에 추가된 UIScene 먼저)으로 갱신한다. 그래서 대화를 닫는 Space 입력이 같은 프레임에 GameScene에서 대화를 다시 여는 일이 있었다. 이를 막도록 입력 소비 순서를 맞췄다. 키의 "이번 프레임에 눌림" 상태는 POST_UPDATE에서 비운다.

### 저장 형식 (`SaveGame.ts`)
- 키 `maplelike-rpg.save`, 버전 1. 버전이 다르거나 깨진 데이터는 무시한다.
- 내용: `stats`(base, bonus, hp, mp, level, exp, statPoints, highestLevel), `inventory`(96칸 배열), `equipment`(칸 id → 아이템), `progress.starterGear`.
- 위치와 몬스터는 저장하지 않는다.
- `AutoSaver`는 마지막으로 쓴 JSON과 같으면 쓰지 않는다. 1초마다 변경을 확인하고 페이지를 떠날 때도 저장한다. localStorage가 막혀 있으면 저장 없이 계속 진행한다.
- 불러올 때 장비를 먼저 끼운 뒤 HP/MP를 한도로 보정하고, 없어진 아이템은 버린다.

### 몬스터
- 아기 오리: HP 50, 접촉 데미지 5, 걷기 40px/s, 추격 55px/s, 경험치 2. 비선공이며 맞으면 화난 얼굴로 쫓아온다.
- 스포너: 최대 10마리, 20초마다 모자란 수를 채움. 바닥과 발판에서 나오며 플레이어 160px 안쪽은 피한다.

## 6. 버그와 해결
| 문제 | 원인 | 해결 |
|---|---|---|
| 키를 누르면 다음 키가 안 먹고 클릭해야 함 | 크롬 확장 프로그램이 keydown을 가로채 preventDefault, Phaser가 그런 이벤트를 무시 (시크릿 모드에선 정상) | Phaser 키보드를 끄고 `KeyInput`으로 window capture 단계에서 `e.code` 기준 직접 처리 (paladog 프로젝트의 해법) |
| Alt 누르면 브라우저 메뉴로 포커스 이동 | 브라우저 기본 동작 | 이후 점프를 C로 정리, capture 키는 preventDefault |
| 탭 전환 후 키가 눌린 채 고정 | 포커스를 잃을 때 keyup이 안 옴 | blur와 visibilitychange(숨겨질 때만)에서 눌림 상태 초기화. 다시 보일 때 초기화하면 그 사이 눌린 키가 사라져서 숨겨질 때만 한다 |
| HP/MP 바 크기가 안 변함 | Phaser Rectangle은 `width`를 직접 바꿔도 그려지는 크기가 안 바뀜 | `setSize` 사용 (HUD, 상태창) |
| 가파른 언덕을 뚫고 지나감 | 프레임 드랍 시 한 프레임 이동량이 커서 평균 기울기로는 벽을 못 봄 | 구간별 판정 + `prevFrame` 사용 |
| 벽면에 붙어서 서 있음 | 벽 판정 후 속도/위치 처리 미흡 | 벽에서 막힐 때 위치를 정리하도록 수정 |
| 대화를 닫는 Space가 대화를 다시 엶 | Phaser의 장면 역순 갱신(UI 먼저) | 입력 소비 순서 조정, 대화창은 화면 위쪽으로 이동 |
| 툴팁이 창 뒤로 감 | `bringToTop`이 깊이 정렬을 깨뜨림 | 깊이 값으로 순서 관리 |
| 더블클릭 판정이 불안정 | 직접 만든 시간 비교 | `event.detail`(클릭 횟수) 사용 |
| 마우스 휠 스크롤이 터치패드에서 너무 빠름 | 이벤트가 잘게 많이 들어옴 | 이동량을 모아 한 줄씩 스크롤 |
| 테스트가 사용자 저장 데이터를 덮어쓸 위험 | 개발 서버 Chrome이 같은 localStorage 사용 | 테스트 전 백업, 후 복원 |

## 7. 남은 과제 / 다음 할 일
- 다음 맵(마을)과 포털 이동. 빛 기둥은 현재 "준비 중" 메시지만 띄운다.
- 명중률/회피 공식 적용 (hit, mhit, evasion은 계산만 되고 쓰이지 않음), 크리티컬, 공격속도 반영 확인.
- 스킬 시스템과 MP 사용, 핫키 (M3).
- 사망 처리 정책 (경험치 손실, 부활 위치 등).
- 검을 장착했을 때의 공격 범위 (지금은 기본 주먹 범위 기준).
- 인벤토리/장비 드래그 장착.
- 몬스터 종류 추가, 드랍 테이블, 등급과 랜덤 옵션 (M4).
- 3타 콤보, 대시, 히트스톱, 경직, 보스 (M2/M5).
- 더블 점프, 아래 점프로 발판 통과 (M1 잔여).
- 효과음과 밸런스 조정 (M6).
