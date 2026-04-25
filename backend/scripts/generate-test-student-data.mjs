import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '../data');
const dbPath = join(dataDir, 'db.json');
const accountsCsvPath = join(dataDir, 'test-student-accounts.csv');

const TOTAL_STUDENTS = 1000;
const ACCOUNT_COUNT = TOTAL_STUDENTS;
const PASSWORD = 'Student@123';

const firstNames = [
  'Ava', 'Mia', 'Liam', 'Noah', 'Emma', 'Sophia', 'Lucas', 'Ethan', 'Olivia', 'Isabella',
  'Mason', 'Logan', 'Amara', 'Elijah', 'Aria', 'Nora', 'Henry', 'Leo', 'Zoe', 'Ivy',
  'Riley', 'Aiden', 'Layla', 'Julian', 'Grace', 'Chloe', 'Ezra', 'Carter', 'Stella', 'Hazel',
  'Bella', 'Kai', 'Mila', 'Asher', 'Luna', 'Eli', 'Jade', 'Owen', 'Violet', 'Maya',
  'Wyatt', 'Sara', 'Jaxon', 'Reese', 'Nathan', 'Piper', 'Cole', 'Ruby', 'Finn', 'Clara'
];

const lastNames = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Flores', 'Bautista', 'Ramos', 'Torres', 'Dela Cruz',
  'Villanueva', 'Fernandez', 'Morales', 'Rivera', 'Castillo', 'Pascual', 'Navarro', 'Domingo', 'Velasco', 'Salazar',
  'Padilla', 'Aquino', 'Ferrer', 'Luna', 'Sison', 'Mercado', 'Gonzales', 'Marquez', 'Soriano', 'Valdez',
  'Torralba', 'Moral', 'Jimenez', 'Benedicto', 'Del Rosario', 'Bacalso', 'Carino', 'Tolentino', 'Alvarez', 'Mabini',
  'Moreno', 'Sanchez', 'Perez', 'Cordero', 'Hernandez', 'Uy', 'Chua', 'Tan', 'Lim', 'Co'
];

const domains = ['students.local', 'testmail.local'];
const organizations = ['sites', 'acss', 'ccs'];
const skillsPool = ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'UI Design', 'Communication'];
const departments = [
  { program: 'BSCS', label: 'Computer Science', prefix: 'CS' },
  { program: 'Computer Science', label: 'Computer Science', prefix: 'CS' },
  { program: 'BSIT', label: 'Information Technology', prefix: 'IT' },
  { program: 'Information Technology', label: 'Information Technology', prefix: 'IT' },
];
const yearLabels = ['1st', '2nd', '3rd', '4th'];
const sectionSuffixes = ['A', 'B', 'C', 'D', 'E'];

const pad = (value, size = 4) => String(value).padStart(size, '0');
const nowIso = () => new Date().toISOString();

const pickName = (index) => {
  const firstName = firstNames[(index - 1) % firstNames.length];
  const lastName = lastNames[Math.floor((index - 1) / firstNames.length) % lastNames.length];
  return `${firstName} ${lastName}`;
};

const makeSkills = (index) => {
  const base = index % 2 === 0 ? ['JavaScript', 'React'] : ['Python', 'SQL'];
  const extra = skillsPool[(index - 1) % skillsPool.length];
  return Array.from(new Set([...base, extra])).join(', ');
};

const makeOrganizations = (index) => {
  const primary = organizations[(index - 1) % organizations.length];
  const secondary = organizations[index % organizations.length];
  return index % 5 === 0 ? `${primary}, ${secondary}` : primary;
};

const readDb = async () => {
  const raw = await readFile(dbPath, 'utf8');
  return JSON.parse(raw);
};

const writeCsv = async (rows) => {
  await writeFile(accountsCsvPath, `${rows.join('\n')}\n`, 'utf8');
};

const createStudentRecord = (index) => {
  const name = pickName(index);
  const department = departments[(index - 1) % departments.length];
  const year = yearLabels[(index - 1) % yearLabels.length];
  const section = `${year[0]}${department.prefix}-${sectionSuffixes[(index - 1) % sectionSuffixes.length]}`;
  const emailDomain = domains[(index - 1) % domains.length];
  const timestamp = nowIso();

  return {
    id: randomUUID(),
    name,
    email: `student${pad(index)}@${emailDomain}`,
    idNumber: `2026${pad(index)}`,
    section,
    year,
    program: department.program,
    status: index % 10 === 0 ? 'Irregular' : 'Regular',
    phone: `09${pad(910000000 + index, 9)}`,
    address: `Block ${((index - 1) % 50) + 1}, Student Village`,
    dateOfBirth: `200${(index % 5) + 1}-${pad((index % 12) + 1, 2)}-${pad((index % 28) + 1, 2)}`,
    skills: makeSkills(index),
    organizations: makeOrganizations(index),
    role: 'student',
    createdAt: timestamp,
    updatedAt: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    enrolled_classes: [],
    enrolledClasses: [],
    registered_events: [],
    registeredEvents: [],
  };
};

const main = async () => {
  const db = await readDb();
  const existingUsers = Array.isArray(db.users) ? db.users.filter((user) => String(user.role).toLowerCase() !== 'student') : [];
  const students = [];
  const studentUsers = [];
  const csvRows = ['index,name,email,password,uid,idNumber,program,year,section'];

  for (let index = 1; index <= TOTAL_STUDENTS; index += 1) {
    const student = createStudentRecord(index);
    students.push(student);

    if (index <= ACCOUNT_COUNT) {
      const account = {
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'student',
        studentId: student.id,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        created_at: student.created_at,
        updated_at: student.updated_at,
      };
      studentUsers.push(account);
      csvRows.push([
        index,
        JSON.stringify(student.name),
        student.email,
        PASSWORD,
        student.id,
        student.idNumber,
        student.program,
        student.year,
        student.section,
      ].join(','));
    }
  }

  const nextDb = {
    ...db,
    students,
    users: [...existingUsers, ...studentUsers],
  };

  await writeFile(dbPath, `${JSON.stringify(nextDb, null, 2)}\n`, 'utf8');
  await writeCsv(csvRows);

  console.log(`[seed] Wrote ${students.length} students to backend/data/db.json`);
  console.log(`[seed] Wrote ${studentUsers.length} student account entries to backend/data/test-student-accounts.csv`);
  console.log(`[seed] Student password for generated accounts: ${PASSWORD}`);
};

main().catch((error) => {
  console.error('[seed] Failed to generate test student data');
  console.error(error);
  process.exit(1);
});