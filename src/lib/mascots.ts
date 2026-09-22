export const MASCOTS = [
  {
    id: 'mascot:leo',
    name: 'Leo',
    fallback: '🦁',
    image: '/mascots/leo.png',
    themeColor: '#F59E0B',
    heroClass: 'from-amber-100 via-amber-200 to-amber-300',
  },
  {
    id: 'mascot:bunny',
    name: 'Bunny',
    fallback: '🐰',
    image: '/mascots/bunny.png',
    themeColor: '#10B981',
    heroClass: 'from-emerald-50 via-emerald-100 to-emerald-200',
  },
  {
    id: 'mascot:panda',
    name: 'Panda',
    fallback: '🐼',
    image: '/mascots/panda.png',
    themeColor: '#64748B',
    heroClass: 'from-slate-50 via-slate-100 to-slate-200',
  },
  {
    id: 'mascot:fox',
    name: 'Fox',
    fallback: '🦊',
    image: '/mascots/fox.png',
    themeColor: '#F97316',
    heroClass: 'from-orange-50 via-orange-100 to-orange-200',
  },
  {
    id: 'mascot:turtle',
    name: 'Turtle',
    fallback: '🐢',
    image: '/mascots/turtle.png',
    themeColor: '#06B6D4',
    heroClass: 'from-cyan-50 via-cyan-100 to-cyan-200',
  },
  {
    id: 'mascot:bee',
    name: 'Bee',
    fallback: '🐝',
    image: '/mascots/bee.png',
    themeColor: '#EAB308',
    heroClass: 'from-yellow-50 via-yellow-100 to-yellow-200',
  },
] as const;

export type MascotId = (typeof MASCOTS)[number]['id'];

export function getMascot(avatar: string) {
  return MASCOTS.find((mascot) => mascot.id === avatar || mascot.fallback === avatar);
}

export function getMascotLabel(avatar: string): string {
  const mascot = getMascot(avatar);
  return mascot ? `${mascot.name} ${mascot.fallback}` : avatar;
}
