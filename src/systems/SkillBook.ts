import { SKILL_HOTKEYS } from '../data/keymap';
import { getSkill } from '../data/skills';

/** 배운 스킬과 하단 단축키 칸 배치 */
export class SkillBook {
  private readonly learned = new Set<string>();
  /** 단축키 코드('KeyQ' 등) → 스킬 id */
  private readonly hotkeys = new Map<string, string>();
  /** 내용이 바뀔 때마다 1씩 늘어난다 (화면이 다시 그릴지 판단할 때 쓴다) */
  version = 0;

  has(skillId: string) {
    return this.learned.has(skillId);
  }

  /** 배운 순서대로 */
  get learnedIds() {
    return [...this.learned];
  }

  learn(skillId: string) {
    if (!getSkill(skillId) || this.learned.has(skillId)) return false;
    this.learned.add(skillId);
    this.version += 1;
    return true;
  }

  /** 단축키 칸에 놓인 스킬 id */
  skillAt(code: string) {
    return this.hotkeys.get(code) ?? null;
  }

  /** 단축키 칸에 스킬을 놓는다. 같은 스킬이 다른 칸에 있었으면 그 칸은 비운다. */
  bind(code: string, skillId: string) {
    if (!this.learned.has(skillId) || !SKILL_HOTKEYS.some((h) => h.code === code)) return false;
    for (const [c, id] of this.hotkeys) if (id === skillId) this.hotkeys.delete(c);
    this.hotkeys.set(code, skillId);
    this.version += 1;
    return true;
  }

  /** 단축키 칸에서 다른 칸으로 옮긴다. 옮길 칸에 스킬이 있으면 서로 바꾼다. */
  move(from: string, to: string) {
    const skillId = this.hotkeys.get(from);
    if (!skillId || from === to || !SKILL_HOTKEYS.some((h) => h.code === to)) return false;
    const other = this.hotkeys.get(to);
    this.hotkeys.set(to, skillId);
    if (other) this.hotkeys.set(from, other);
    else this.hotkeys.delete(from);
    this.version += 1;
    return true;
  }

  unbind(code: string) {
    if (!this.hotkeys.delete(code)) return;
    this.version += 1;
  }

  clear() {
    this.learned.clear();
    this.hotkeys.clear();
    this.version += 1;
  }

  toJSON() {
    return { learned: this.learnedIds, hotkeys: Object.fromEntries(this.hotkeys) };
  }

  /** 저장 데이터를 불러온다. 없어진 스킬이나 칸은 버린다. */
  load(data: { learned: string[]; hotkeys: Record<string, string> }) {
    this.clear();
    for (const id of data.learned) this.learn(id);
    for (const [code, id] of Object.entries(data.hotkeys)) this.bind(code, id);
  }
}
