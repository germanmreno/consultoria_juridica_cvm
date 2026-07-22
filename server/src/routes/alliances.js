const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const prisma = require('../prisma');
const { verifyJWT, requireRole } = require('../middleware/auth');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se aceptan archivos PDF'), false);
    }
    cb(null, true);
  },
});

const router = Router();

router.get('/', verifyJWT, async (req, res) => {
  const alliances = await prisma.alliance.findMany({
    include: {
      _count: { select: { files: true } },
      createdBy: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(alliances);
});

router.post('/', verifyJWT, async (req, res) => {
  const { denominacionSocial, rif, representanteLegal, cedulaRepresentante, telefono, email, sector, area, mineral, fecha } = req.body;

  if (!denominacionSocial || !rif || !representanteLegal || !cedulaRepresentante || !telefono || !email || !sector || !area || !fecha) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben estar llenos' });
  }

  const existente = await prisma.alliance.findUnique({ where: { rif } });
  if (existente) return res.status(409).json({ error: 'Ya existe una alianza con ese RIF' });

  const alliance = await prisma.alliance.create({
    data: {
      denominacionSocial,
      rif,
      representanteLegal,
      cedulaRepresentante,
      telefono,
      email,
      sector,
      area,
      mineral: mineral || 'ORO',
      fecha: new Date(fecha),
      createdById: req.userId,
    },
  });
  res.status(201).json(alliance);
});

router.post('/:allianceId/files', verifyJWT, upload.single('file'), async (req, res) => {
  const { allianceId } = req.params;

  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Alianza no encontrada' });
  }

  let pageCount = 0;
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    pageCount = pdfData.numpages;
  } catch {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'No se pudo leer el archivo PDF. Verifique que sea un PDF válido.' });
  }

  const fileRecord = await prisma.file.create({
    data: {
      allianceId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
      pageCount,
      uploadedById: req.userId,
    },
  });

  let index = null;
  const { documentTypeId, pageFrom, pageTo, notas } = req.body;
  if (documentTypeId && pageFrom && pageTo) {
    const from = Number(pageFrom);
    const to = Number(pageTo);
    if (Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to >= 1 && from <= to && to <= pageCount) {
      const docType = await prisma.documentType.findUnique({ where: { id: documentTypeId } });
      if (docType) {
        index = await prisma.documentIndex.create({
          data: { fileId: fileRecord.id, documentTypeId, pageFrom: from, pageTo: to, notas },
          include: { documentType: { select: { id: true, code: true, nombre: true } } },
        });
      }
    }
  }

  res.status(201).json({ ...fileRecord, index });
});

router.get('/:id', verifyJWT, async (req, res) => {
  const alliance = await prisma.alliance.findUnique({
    where: { id: req.params.id },
    include: {
      files: {
        include: {
          indexes: { include: { documentType: { select: { id: true, code: true, nombre: true } } } },
          uploadedBy: { select: { nombre: true } },
        },
        orderBy: { uploadedAt: 'desc' },
      },
      createdBy: { select: { nombre: true } },
    },
  });
  if (!alliance) return res.status(404).json({ error: 'Alianza no encontrada' });
  res.json(alliance);
});

router.put('/:id', verifyJWT, async (req, res) => {
  const { denominacionSocial, rif, representanteLegal, cedulaRepresentante, telefono, email, sector, area, mineral, fecha } = req.body;

  const data = {};
  if (denominacionSocial) data.denominacionSocial = denominacionSocial;
  if (rif) data.rif = rif;
  if (representanteLegal) data.representanteLegal = representanteLegal;
  if (cedulaRepresentante) data.cedulaRepresentante = cedulaRepresentante;
  if (telefono) data.telefono = telefono;
  if (email) data.email = email;
  if (sector) data.sector = sector;
  if (area) data.area = area;
  if (mineral) data.mineral = mineral;
  if (fecha) data.fecha = new Date(fecha);

  const alliance = await prisma.alliance.update({
    where: { id: req.params.id },
    data,
  });
  res.json(alliance);
});

router.delete('/:id', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  await prisma.alliance.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.get('/:id/requirements', verifyJWT, async (req, res) => {
  const alliance = await prisma.alliance.findUnique({ where: { id: req.params.id } });
  if (!alliance) return res.status(404).json({ error: 'Alianza no encontrada' });

  const documentTypes = await prisma.documentType.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });

  const indexes = await prisma.documentIndex.findMany({
    where: { file: { allianceId: req.params.id } },
    include: {
      file: { select: { id: true, originalName: true } },
    },
    orderBy: { pageFrom: 'asc' },
  });

  const indexedByType = {};
  for (const idx of indexes) {
    if (!indexedByType[idx.documentTypeId]) {
      indexedByType[idx.documentTypeId] = [];
    }
    indexedByType[idx.documentTypeId].push({
      indexId: idx.id,
      fileId: idx.file.id,
      fileName: idx.file.originalName,
      pageFrom: idx.pageFrom,
      pageTo: idx.pageTo,
    });
  }

  const result = documentTypes.map(dt => ({
    ...dt,
    status: indexedByType[dt.id] ? 'cargado' : 'pendiente',
    referencias: indexedByType[dt.id] || [],
  }));

  res.json(result);
});

module.exports = router;
