import type { EquipSlotId } from '../data/equipment';
import { ITEMS } from '../data/items';
import { SKILLS } from '../data/skills';
import type { Equipment } from '../systems/Equipment';
import type { TalkContext } from './npcs';

export const KNIGHT_NAME = '황금기사 레온하르트';

/** 이 네 가지를 모두 입고 말을 걸면 칼 던지기를 가르쳐 준다 */
const STARTER_SET: Partial<Record<EquipSlotId, string>> = {
  weapon: ITEMS.starterSword.id,
  shield: ITEMS.starterShield.id,
  top: ITEMS.starterShirt.id,
  bottom: ITEMS.starterPants.id,
};

export function wearsStarterSet(equipment: Equipment) {
  return Object.entries(STARTER_SET).every(([slot, id]) => equipment.get(slot as EquipSlotId)?.itemId === id);
}

/** 황금기사에게 말을 걸었을 때 */
export function talkToKnight({ dialog, inventory, equipment, progress, skills }: TalkContext) {
  const say = (lines: string[], then?: () => void) => dialog.say(KNIGHT_NAME, lines, then);
  const skill = SKILLS.throwSword;

  // 이미 스킬을 배웠으면 짧게 끝낸다
  if (skills.has(skill.id)) {
    say([
      `${skill.name}는 손에 좀 익었나? 던진 검이 알아서 손으로 돌아오다니, 편리한 세상이군.`,
      '빛 기둥은 저쪽, 오른쪽 끝이다. 몸조심해라.',
    ]);
    return;
  }

  // 초보자 장비를 모두 갖춰 입고 오면 스킬을 가르쳐 준다
  if (progress.starterGear !== 'none' && wearsStarterSet(equipment)) {
    say(
      [
        '(투구 너머로 위아래를 훑어본다)\n...호오. 검에 방패, 옷까지 제대로 갖춰 입었군.',
        '이제 좀 볼만하군. 어디까지 버틸지는 모르겠지만, 왕국에 도움이 되길 바란다.',
        '여행에 도움이 될 만한 기술을 하나 가르쳐 주지.',
      ],
      () => {
        skills.learn(skill.id);
        say([
          '잘 봐라. 검을 쥔 손목에 힘을 싣고... 앞으로 던진다!',
          `이것이 [${skill.name}]다. 한손검을 들고 있을 때만 쓸 수 있지.`,
          'K를 눌러 스킬창을 열고, 아래쪽 단축키 칸(QWERT, ASDFG)에 끌어다 놓고 써 봐라.',
        ]);
      },
    );
    return;
  }

  // 이미 장비를 받았으면 짧게 끝낸다
  if (progress.starterGear !== 'none') {
    say([
      '아직도 안 갔나? 빛 기둥은 저쪽, 오른쪽 끝이다.',
      '그리고... 제발 옷 좀 입어라. 근위기사의 눈이 썩는다.',
    ]);
    return;
  }

  const give = (choice: 'took' | 'refused') => {
    progress.starterGear = choice;
    inventory.add({ itemId: ITEMS.starterSword.id, count: 1 });
    if (choice === 'refused') inventory.add({ itemId: ITEMS.starterShield.id, count: 1 });
  };

  const directions = [
    '이 길을 따라 오른쪽 끝까지 가면 바닥에서 빛 기둥이 솟아 있을 거다.',
    '그 위에서 위쪽 방향키를 누르면 마을로 갈 수 있다.',
    '마을에 가거든 옷부터 사 입어라. 보는 내가 다 민망하니까.',
  ];

  say(
    [
      '...응? 웬 꼬마가 팬티 한 장만 걸치고 이런 곳까지 기어 왔지?',
      '(투구 너머로 위아래를 훑어본다)\n쯧쯧. 아기 오리한테 쪼이다가 옷이라도 다 뜯긴 건가?',
      '나는 왕국 근위기사단의 레온하르트. 마을로 가는 이 길목을 지키고 있지.',
      '너 같은 하찮은 녀석이 맨주먹으로 저 너머까지 가면, 사흘도 못 버틸 거다.',
    ],
    () =>
      dialog.ask(
        KNIGHT_NAME,
        '옛다, 이거나 가져라. 내가 신참 시절에 쓰던 초보자용 검이다.\n지금 내겐 장난감이지만, 너한테는 과분한 물건이지.',
        [
          {
            label: '받기',
            run: () => {
              give('took');
              say(
                [
                  '크하하! 주자마자 냉큼 받는군. 거지가 따로 없구나!',
                  '뭐, 맨주먹으로 오리를 패는 것보단 낫겠지.\n손잡이를 잡는 거다. 날 쪽을 잡고 울지나 마라.',
                  ...directions,
                ],
              );
            },
          },
          {
            label: '받지 않기',
            run: () => {
              give('refused');
              say(
                [
                  '...호오? 팬티 한 장 걸친 주제에 자존심은 있다 이거냐.',
                  '마음에 들었다. 그 배짱이라면 길바닥에서 굶어 죽진 않겠군.',
                  '검은 그냥 가져가라. 거절은 안 받는다.\n덤으로 이 초보자용 방패도 주지. 오리 부리 정도는 막아 줄 거다.',
                  ...directions,
                ],
              );
            },
          },
        ],
      ),
  );
}
