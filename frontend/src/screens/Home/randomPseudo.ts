// Short words so that noun + adjective + two digits always fits 16 characters
// (longest: 6 + 6 + 2). ASCII only: accents are not allowed in nicknames.
const NOUNS = ['Canard', 'Bug', 'Pixel', 'Octet', 'Robot', 'Geek', 'Ninja', 'Hibou', 'Renard', 'Lynx']
const ADJECTIVES = ['Agile', 'Rapide', 'Malin', 'Fute', 'Zen', 'Vif', 'Cosmo', 'Turbo', 'Sage', 'Hardi']

function pick(list: string[], random: () => number): string {
  return list[Math.floor(random() * list.length)]
}

export function randomPseudo(random: () => number = Math.random): string {
  const digits = String(Math.floor(random() * 100)).padStart(2, '0')
  return `${pick(NOUNS, random)}${pick(ADJECTIVES, random)}${digits}`
}
