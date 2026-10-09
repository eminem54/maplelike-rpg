import { KNIGHT_PIXEL_SCALE, KNIGHT_PALETTE, KNIGHT_ROWS, KNIGHT_TEXTURE } from '../art/knightArt';
import type { NpcLook } from '../entities/Npc';
import type { Equipment } from '../systems/Equipment';
import type { Inventory } from '../systems/Inventory';
import type { Progress } from '../systems/Progress';
import type { SkillBook } from '../systems/SkillBook';
import type { DialogBox } from '../ui/DialogBox';
import { KNIGHT_NAME, talkToKnight } from './knight';

/** 대화에서 쓸 수 있는 게임 상태 */
export type TalkContext = {
  dialog: DialogBox;
  inventory: Inventory;
  equipment: Equipment;
  progress: Progress;
  skills: SkillBook;
};

export type NpcData = { name: string; look: NpcLook; talk: (ctx: TalkContext) => void };

/** 모든 NPC. 맵에는 npcId로 배치한다. */
export const NPCS = {
  knight: {
    name: KNIGHT_NAME,
    look: { texture: KNIGHT_TEXTURE, rows: KNIGHT_ROWS, palette: KNIGHT_PALETTE, scale: KNIGHT_PIXEL_SCALE },
    talk: talkToKnight,
  },
} satisfies Record<string, NpcData>;

export type NpcId = keyof typeof NPCS;
