// Demo bugs for the mock client: one per level and track, plus one per view
// drawn as lines (terminal, e-mail, settings, firewall). Full versions, with
// the answer, as the server stores them. Real content lives in data/bugs/.

import type { FullBug, FullDiagramBug, FullLineBug } from './types'

const devBugs: FullLineBug[] = [
  {
    id: 'mock-dev-0', track: 'dev', difficulty: 0, points: 100,
    title: 'Le panier compte mal',
    hint: 'Que doit faire un total avec chaque prix ?',
    code: ['function getTotal(price, shipping) {', '  return price - shipping;', '}'],
    bugLine: 1,
    choices: ['return price + shipping;', 'return price * shipping;', 'return shipping - price;'],
    answer: 0,
    explanation: 'Le prix total additionne les frais de port.',
  },
  {
    id: 'mock-dev-1', track: 'dev', difficulty: 1, points: 200,
    title: 'Les 18 ans sont refusés',
    hint: 'À 18 ans pile, on a le droit de voter ?',
    code: ['function canVote(age) {', '  return age > 18;', '}'],
    bugLine: 1,
    choices: ['return age >= 18;', 'return age < 18;', 'return age > 17.9;'],
    answer: 0,
    explanation: 'Avec > on exclut 18 ans ; >= veut dire « au moins 18 ».',
  },
  {
    id: 'mock-dev-2', track: 'dev', difficulty: 2, points: 300,
    title: 'Le compteur reste à zéro',
    hint: 'Une ligne calcule un résultat… mais le garde-t-elle quelque part ?',
    code: ['let count = 0;', 'for (const item of cart) {', '  count + 1;', '}'],
    bugLine: 2,
    choices: ['count = 1;', 'count = count + 1;', 'count - 1;'],
    answer: 1,
    explanation: 'count + 1 calcule une valeur mais ne la range nulle part.',
  },
  {
    id: 'mock-dev-3', track: 'dev', difficulty: 3, points: 400,
    title: 'Le dernier élève est oublié',
    hint: 'Compte combien de tours fait la boucle.',
    code: ['const names = ["Léa", "Tom", "Sam"];', 'for (let i = 0; i < names.length - 1; i++) {', '  show(names[i]);', '}'],
    bugLine: 1,
    choices: ['for (let i = 1; i < names.length; i++) {', 'for (let i = 0; i < names.length; i++) {', 'for (let i = 0; i <= names.length; i++) {'],
    answer: 1,
    explanation: 'La boucle doit aller jusqu’au dernier indice, length - 1 inclus.',
  },
  {
    id: 'mock-dev-4', track: 'dev', difficulty: 4, points: 500,
    title: 'La remise ne s’applique jamais',
    hint: 'Lis dans l’ordre : chaque valeur existe-t-elle déjà quand on s’en sert ?',
    code: ['let price = 50;', 'const total = price * (1 - discount);', 'const discount = 0.2;'],
    bugLine: 1,
    choices: ['const total = price * discount;', 'Déplacer cette ligne après discount', 'const total = price - 1;'],
    answer: 1,
    explanation: 'discount est utilisée avant d’être définie : il faut la définir d’abord.',
  },
]

const networkBugs: FullDiagramBug[] = [
  {
    id: 'mock-net-0', track: 'network', difficulty: 0, points: 100,
    title: 'Le PC n’a pas Internet',
    hint: 'Par quelle porte le PC sort-il de son réseau ?',
    diagram: {
      devices: [
        { id: 'pc', label: 'PC', ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.254' },
        { id: 'box', label: 'Box', ip: '192.168.1.1', mask: '255.255.255.0' },
      ],
      links: [['pc', 'box']],
    },
    bugTarget: 'pc',
    choices: ['Passerelle 192.168.1.1', 'IP 192.168.1.1', 'Masque 255.0.0.0'],
    answer: 0,
    explanation: 'La passerelle doit être l’adresse de la box, la porte vers Internet.',
  },
  {
    id: 'mock-net-1', track: 'network', difficulty: 1, points: 200,
    title: 'Deux PC se disputent',
    hint: 'Deux appareils peuvent-ils porter la même adresse ?',
    diagram: {
      devices: [
        { id: 'pc1', label: 'PC 1', ip: '192.168.1.20', mask: '255.255.255.0' },
        { id: 'pc2', label: 'PC 2', ip: '192.168.1.20', mask: '255.255.255.0' },
        { id: 'switch', label: 'Switch' },
      ],
      links: [['pc1', 'switch'], ['pc2', 'switch']],
    },
    bugTarget: 'pc2',
    choices: ['Masque 255.255.0.0', 'IP 192.168.1.21', 'IP 10.0.0.20'],
    answer: 1,
    explanation: 'Deux appareils ne peuvent pas avoir la même adresse IP sur un réseau.',
  },
  {
    id: 'mock-net-2', track: 'network', difficulty: 2, points: 300,
    title: 'Le site ne répond pas par son nom',
    hint: 'Qui traduit le nom d’un site en adresse IP ?',
    diagram: {
      devices: [
        { id: 'pc', label: 'PC', ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1', dns: '192.168.1.99' },
        { id: 'box', label: 'Box', ip: '192.168.1.1', mask: '255.255.255.0' },
      ],
      links: [['pc', 'box']],
    },
    bugTarget: 'pc',
    choices: ['Passerelle 192.168.1.99', 'DNS 192.168.1.1', 'IP 192.168.1.99'],
    answer: 1,
    explanation: 'Le DNS traduit les noms en adresses ; ici il pointe vers une machine absente.',
  },
  {
    id: 'mock-net-3', track: 'network', difficulty: 3, points: 400,
    title: 'Le PC ne voit pas l’imprimante',
    hint: 'Compare le début des adresses : sont-elles dans le même réseau ?',
    diagram: {
      devices: [
        { id: 'pc', label: 'PC', ip: '192.168.1.10', mask: '255.255.255.0' },
        { id: 'printer', label: 'Imprimante', ip: '192.168.2.50', mask: '255.255.255.0' },
        { id: 'switch', label: 'Switch' },
      ],
      links: [['pc', 'switch'], ['printer', 'switch']],
    },
    bugTarget: 'printer',
    choices: ['IP 192.168.1.50', 'Masque 255.255.255.255', 'IP 192.168.2.10'],
    answer: 0,
    explanation: 'Avec un masque /24, les deux appareils doivent commencer par 192.168.1.',
  },
  {
    id: 'mock-net-4', track: 'network', difficulty: 4, points: 500,
    title: 'Le site web est injoignable',
    hint: 'Le chemin est bon jusqu’au serveur : regarde ce qu’il laisse entrer.',
    diagram: {
      devices: [
        { id: 'pc', label: 'PC', ip: '192.168.1.10', mask: '255.255.255.0', gateway: '192.168.1.1' },
        { id: 'router', label: 'Routeur', interfaces: [{ ip: '192.168.1.1', mask: '255.255.255.0' }, { ip: '10.0.0.1', mask: '255.255.255.0' }] },
        { id: 'server', label: 'Serveur web', ip: '10.0.0.80', mask: '255.255.255.0', gateway: '10.0.0.1', ports: [{ port: 22, open: true }, { port: 443, open: false }] },
      ],
      links: [['pc', 'router'], ['router', 'server']],
    },
    bugTarget: 'server',
    choices: ['Fermer le port 22', 'Ouvrir le port 443', 'Passerelle 192.168.1.1'],
    answer: 1,
    explanation: 'Un site web sécurisé répond sur le port 443, qui est fermé ici.',
  },
]

// One demo bug per line view, drawn as often as the bug of the same level.
const viewBugs: FullLineBug[] = [
  {
    id: 'mock-net-email', track: 'network', difficulty: 1, points: 200, view: 'email',
    title: 'Netflix te demande de payer',
    hint: 'Avant de cliquer, regarde où mène le lien.',
    code: [
      'De : Netflix <info@netflix.com>',
      'Objet : Ton paiement a échoué',
      '',
      'Bonjour,',
      'Ton abonnement sera suspendu ce soir.',
      'Mets ta carte à jour ici : http://netflix.connexion-securite.ru',
    ],
    bugLine: 5,
    choices: ['Aller sur netflix.com soi-même, sans cliquer', 'Cliquer vite avant la suspension', 'Répondre avec sa carte bancaire'],
    answer: 0,
    explanation: 'Le lien mène à connexion-securite.ru, pas à netflix.com : c’est du hameçonnage.',
  },
  {
    id: 'mock-net-terminal', track: 'network', difficulty: 2, points: 300, view: 'terminal',
    title: 'Internet marche, mais pas les sites',
    hint: 'Avec une adresse ça passe, avec un nom ça bloque : qui fait la traduction ?',
    context: 'Aucun site ne s’ouvre sur le PC.',
    language: 'bash',
    code: [
      '$ ping 192.168.1.1',
      '64 octets de 192.168.1.1 : temps=2 ms',
      '$ ping 8.8.8.8',
      '64 octets de 8.8.8.8 : temps=14 ms',
      '$ ping google.fr',
      'ping: google.fr : nom inconnu',
    ],
    bugLine: 5,
    choices: ['Corriger le DNS du PC', 'Changer le câble du PC', 'Redémarrer google.fr'],
    answer: 0,
    explanation: 'Le PC joint la box et Internet, mais ne traduit plus les noms en adresses : c’est le DNS.',
  },
  {
    id: 'mock-dev-config', track: 'dev', difficulty: 3, points: 400, view: 'config',
    title: 'Personne ne peut rejoindre le tournoi',
    hint: 'Le serveur répond bien : combien de joueurs accepte-t-il ?',
    language: 'Serveur de jeu',
    code: ['[serveur]', 'nom = Tournoi Coda', 'port = 25565', 'joueurs_max = 0', 'mode = survie'],
    bugLine: 3,
    choices: ['joueurs_max = 16', 'port = 0', 'mode = créatif'],
    answer: 0,
    explanation: 'Avec joueurs_max = 0, le serveur est plein avant même que quelqu’un arrive.',
  },
  {
    id: 'mock-net-rules', track: 'network', difficulty: 4, points: 500, view: 'rules',
    title: 'Le site de l’école est injoignable',
    hint: 'Le pare-feu lit les règles de haut en bas et s’arrête à la première qui correspond.',
    code: ['Bloquer tout depuis Internet', 'Autoriser le port 443 depuis Internet', 'Autoriser tout depuis le réseau de l’école'],
    bugLine: 0,
    choices: ['Mettre « Bloquer tout » en dernier', 'Supprimer la règle 2', 'Bloquer le port 443'],
    answer: 0,
    explanation: 'La règle 1 bloque tout avant que la règle 2 soit lue : « Bloquer tout » doit venir en dernier.',
  },
]

export const mockBugs: FullBug[] = [...devBugs, ...networkBugs, ...viewBugs]
