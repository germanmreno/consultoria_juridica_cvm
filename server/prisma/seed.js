const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const documentTypes = [
  { code: 'CV',       nombre: 'Curriculum Vitae', descripcion: 'Agregar número telefónico y correo electrónico de cada uno de los accionistas y/o Representantes legales de la empresa.', orden: 1 },
  { code: 'DJOR',     nombre: 'Declaración Jurada de Origen de Recursos', descripcion: 'De cada uno de los accionistas y/o Representantes legales de la empresa.', orden: 2 },
  { code: 'ISLR',     nombre: 'Últimas 3 Declaraciones de Impuesto Sobre la Renta (I.S.L.R.)', descripcion: 'De la empresa y de cada uno de los accionistas y/o Representantes legales de la empresa.', orden: 3 },
  { code: 'BG',       nombre: 'Balance General de la empresa', descripcion: '', orden: 4 },
  { code: 'EF',       nombre: 'Últimos 3 Estados Financieros de la empresa', descripcion: 'Visado por un Contador.', orden: 5 },
  { code: 'AP',       nombre: 'Antecedentes Penales', descripcion: 'De cada uno de los accionistas y/o Representantes legales de la empresa.', orden: 6 },
  { code: 'PME',      nombre: 'Proyecto Minero Ecológico a Ejecutar', descripcion: 'Según lo establecido en la Ley Orgánica de Minas.', orden: 7 },
  { code: 'CEA',      nombre: 'Cronograma de Ejecución de Actividades', descripcion: '', orden: 8 },
  { code: 'LME',      nombre: 'Listado de Maquinarias y Equipos', descripcion: '', orden: 9 },
  { code: 'CI',       nombre: 'Cronograma de Inversión', descripcion: '', orden: 10 },
  { code: 'PRS',      nombre: 'Programa de Responsabilidad Social', descripcion: '', orden: 11 },
  { code: 'AMEE',     nombre: 'Área de Mina para Exploración y Explotación', descripcion: '', orden: 12 },
  { code: 'PCM',      nombre: 'Plan de Cierre de Minas', descripcion: 'Según Corresponda.', orden: 13 },
  { code: 'ATEIAS',   nombre: 'Acreditación Técnica del Estudio de Impacto Ambiental y Sociocultural', descripcion: '', orden: 14 },
  { code: 'PSA',      nombre: 'Plan de Supervisión Ambiental', descripcion: '', orden: 15 },
  { code: 'PRL',      nombre: 'Plan de Riesgo Laboral', descripcion: '', orden: 16 },
  { code: 'PCVRP',    nombre: 'Programa de Construcción de Viveros Comunitarios y Reforestación Progresiva', descripcion: 'Del área de influencia del Proyecto.', orden: 17 },
  { code: 'IT',       nombre: 'Informes Trimestrales', descripcion: '', orden: 18 },
  { code: 'PMP',      nombre: 'Plan de Mantenimiento Preventivo', descripcion: '', orden: 19 },
  { code: 'PV',       nombre: 'Plan de Voladuras', descripcion: '', orden: 20 },
  { code: 'PEE',      nombre: 'Plan de Explotación en Ejecución', descripcion: '', orden: 21 },
  { code: 'CP',       nombre: 'Capacidad de Procesamiento', descripcion: '', orden: 22 },
  { code: 'IFG',      nombre: 'Informe Final de Geología', descripcion: '', orden: 23 },
  { code: 'APAR',     nombre: 'Aporte de Participación (6 meses)', descripcion: '', orden: 24 },
  { code: 'ECVM',     nombre: 'Escrito dirigido al Presidente de la CVM', descripcion: 'Manifestando la intención de suscribir Contrato de Operaciones Mineras, con teléfonos, correo electrónico y coordenadas del área.', orden: 25 },
  { code: 'RUM',      nombre: 'Inscripción en el Registro Único Minero (RUM)', descripcion: '', orden: 26 },
  { code: 'CCRIF',    nombre: 'Copia de Cédula de Identidad y RIF', descripcion: 'De cada uno de los accionistas y/o Representantes legales de la empresa.', orden: 27 },
  { code: 'ACE',      nombre: 'Acta Constitutiva Estatutaria', descripcion: 'Según su forma asociativa.', orden: 28 },
  { code: 'AEA',      nombre: 'Asamblea Extraordinaria de Accionistas', descripcion: 'Según sea la forma asociativa.', orden: 29 },
  { code: 'RIFFA',    nombre: 'Registro Único de Información Fiscal (RIF) de la Forma Asociativa', descripcion: '', orden: 30 },
  { code: 'FFC',      nombre: 'Fianza de Fiel Cumplimiento', descripcion: '', orden: 31 },
  { code: 'PTRI',     nombre: 'Póliza de Todo Riesgo Industrial', descripcion: '', orden: 32 },
  { code: 'PEND',     nombre: 'Pendrive con toda la información solicitada en formato PDF', descripcion: '', orden: 33 },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cvm.gob.ve';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { nombre: 'Administrador', email: adminEmail, passwordHash: hash, rol: 'ADMIN' },
  });
  console.log(`  ✓ Usuario admin: ${adminEmail}`);

  for (const dt of documentTypes) {
    await prisma.documentType.upsert({
      where: { code: dt.code },
      update: dt,
      create: dt,
    });
  }
  console.log(`  ✓ ${documentTypes.length} tipos de documento`);

  console.log('Seed completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
