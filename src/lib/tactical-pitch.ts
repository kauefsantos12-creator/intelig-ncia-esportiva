import type { MyGameLineup, MyGamePlayer } from "./my-games";

export type PitchLine = { players: MyGamePlayer[]; goalkeeper: boolean };
export type PitchLayout = { lines: PitchLine[]; reason: string | null };
export function formationLines(value: string | null): number[] | null {
  if (!value) return null;
  const clean = value.replace(/[–—]/g, "-").replace(/\s/g, "");
  if (!/^\d(?:-\d){1,4}$/.test(clean)) return null;
  let numbers = clean.split("-").map(Number);
  if (numbers[0] === 1 && numbers.reduce((a, b) => a + b, 0) === 11) numbers = numbers.slice(1);
  return numbers.every((n) => n >= 1 && n <= 5) && numbers.reduce((a, b) => a + b, 0) === 10
    ? numbers
    : null;
}
function position(player: MyGamePlayer) {
  return (player.position ?? "").toUpperCase();
}
function keeper(player: MyGamePlayer) {
  return ["G", "GOL", "GK"].includes(position(player));
}
function depth(player: MyGamePlayer, threeBack: boolean): number {
  const p = position(player);
  if (["ZAD", "ZAE", "ZAG", "CB", "D"].includes(p)) return 1;
  if (["LAD", "LAE", "LD", "LE", "LB", "RB", "LWB", "RWB"].includes(p)) return threeBack ? 1.5 : 1;
  if (["VOL", "DM", "CDM"].includes(p)) return 2;
  if (["M", "MEC", "MEI", "MC", "CM", "AM", "CAM", "LM", "RM"].includes(p)) return 3;
  if (["F", "A", "ATA", "ST", "CF", "LW", "RW"].includes(p)) return 4;
  return 3;
}
function side(player: MyGamePlayer): number {
  const p = position(player);
  if (["LAE", "LE", "LB", "LWB", "LW", "LM"].includes(p)) return -2;
  if (p === "ZAE") return -1;
  if (p === "ZAD") return 1;
  if (["LAD", "LD", "RB", "RWB", "RW", "RM"].includes(p)) return 2;
  return 0;
}
// A schematic from the reported formation; not observed tracking coordinates.
export function buildPitch(team: MyGameLineup["teams"][number]): PitchLayout {
  const counts = formationLines(team.formation);
  const starters = team.players.filter((p) => p.role === "starter");
  const goalkeepers = starters.filter(keeper);
  if (!counts || starters.length !== 11 || goalkeepers.length !== 1)
    return {
      lines: [],
      reason:
        "O desenho precisa de uma formação válida, 11 titulares e um goleiro identificado. Os relacionados continuam disponíveis abaixo.",
    };
  const outfield = starters
    .filter((p) => !keeper(p))
    .sort(
      (a, b) =>
        depth(a, counts[0] === 3) - depth(b, counts[0] === 3) ||
        a.name.localeCompare(b.name, "pt-BR") ||
        a.id.localeCompare(b.id),
    );
  let offset = 0;
  const lines = counts.map((count) => {
    const players = outfield
      .slice(offset, offset + count)
      .sort((a, b) => side(a) - side(b) || a.name.localeCompare(b.name, "pt-BR"));
    offset += count;
    return { players, goalkeeper: false };
  });
  return { lines: [...lines.reverse(), { players: goalkeepers, goalkeeper: true }], reason: null };
}
