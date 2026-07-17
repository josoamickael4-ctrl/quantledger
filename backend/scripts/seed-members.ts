import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

type MemberRole = 'admin' | 'member';

type Member = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  facebook?: string;
  accessCode: string;
  role: MemberRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

const dbFilePath = path.join(process.cwd(), 'members_db.json');

function generateAccessCode(): string {
  return crypto.randomUUID().toUpperCase();
}

function generatePhone(index: number): string {
  const suffix = String(10000000 + index).slice(-8);
  return `06${suffix}`;
}

function loadDatabase(): Member[] {
  if (!fs.existsSync(dbFilePath)) {
    return [];
  }

  const content = fs.readFileSync(dbFilePath, 'utf8');
  try {
    return JSON.parse(content) as Member[];
  } catch (error) {
    console.error('Impossible de lire members_db.json :', error);
    process.exit(1);
  }
}

function saveDatabase(members: Member[]) {
  fs.writeFileSync(dbFilePath, JSON.stringify(members, null, 2), 'utf8');
}

function findOrCreateAdmin(existingMembers: Member[]): Member {
  const admin = existingMembers.find(member => member.role === 'admin');
  if (admin) {
    return admin;
  }

  return {
    id: 'admin-member-1',
    fullName: 'Administrateur',
    role: 'admin',
    isActive: true,
    accessCode: generateAccessCode(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildTestMembers(admin: Member): Member[] {
  const now = new Date().toISOString();
  const members: Member[] = [admin];

  for (let i = 1; i <= 1000; i += 1) {
    const member: Member = {
      id: crypto.randomUUID(),
      fullName: `Membre Test ${i}`,
      email: `membre${i}@test.local`,
      phone: generatePhone(i),
      facebook: `membre${i}`,
      accessCode: generateAccessCode(),
      role: 'member',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    if (i % 10 === 0) {
      member.accessCode = generateAccessCode();
      member.updatedAt = new Date().toISOString();
    }

    if (i % 25 === 0) {
      member.isActive = false;
      member.updatedAt = new Date().toISOString();
    }

    members.push(member);
  }

  return members;
}

function run() {
  console.log('Chargement de members_db.json...');
  const existingMembers = loadDatabase();
  const admin = findOrCreateAdmin(existingMembers);

  console.log('Génération de 1000 membres de test...');
  const members = buildTestMembers(admin);

  console.log(`Enregistrement de ${members.length} membres dans ${dbFilePath}`);
  saveDatabase(members);

  console.log('Seed terminé. Voici quelques statistiques :');
  console.log(`- Membres totaux : ${members.length}`);
  console.log(`- Admins : ${members.filter(m => m.role === 'admin').length}`);
  console.log(`- Membres actifs : ${members.filter(m => m.role === 'member' && m.isActive).length}`);
  console.log(`- Membres inactifs : ${members.filter(m => m.role === 'member' && !m.isActive).length}`);
}

run();
