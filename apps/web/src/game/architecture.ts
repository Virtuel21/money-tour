/** Regional silhouettes follow the destination even when streets are shuffled. */
export const architectureFamilies = [
  'mediterranean',
  'mansard',
  'gable',
  'pagoda',
  'artdeco',
] as const;
export type ArchitectureFamily = (typeof architectureFamilies)[number];
export const architectureLabels: Record<ArchitectureFamily, string> = {
  mediterranean: 'Façades méditerranéennes',
  mansard: 'Toits mansardés',
  gable: 'Maisons à pignons',
  pagoda: 'Toits japonais',
  artdeco: 'Tours Art déco',
};
export function architectureForCity(name: string): ArchitectureFamily {
  if (/Tokyo|Kyoto/i.test(name)) return 'pagoda';
  if (/New York|Boston/i.test(name)) return 'artdeco';
  if (/Paris|Lyon/i.test(name)) return 'mansard';
  if (/Berlin|Munich|Hambourg|Londres|Édimbourg/i.test(name)) return 'gable';
  return 'mediterranean';
}
export function architectureAsset(name: string, hotel: boolean) {
  return `${import.meta.env.BASE_URL}textures/architecture-${architectureForCity(name)}-${hotel ? 'hotel' : 'house'}.svg`;
}
