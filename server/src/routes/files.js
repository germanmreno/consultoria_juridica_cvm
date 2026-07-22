const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma');
const { verifyJWT } = require('../middleware/auth');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const router = Router();

router.get('/:id/content', verifyJWT, async (req, res) => {
  const fileRecord = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!fileRecord) return res.status(404).json({ error: 'Archivo no encontrado' });

  const filePath = path.join(UPLOAD_DIR, fileRecord.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado en disco' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileRecord.originalName}"`);
  res.sendFile(filePath);
});

router.get('/:id/indexes', verifyJWT, async (req, res) => {
  const indexes = await prisma.documentIndex.findMany({
    where: { fileId: req.params.id },
    include: { documentType: { select: { id: true, code: true, nombre: true } } },
    orderBy: { pageFrom: 'asc' },
  });
  res.json(indexes);
});

router.post('/:fileId/indexes', verifyJWT, async (req, res) => {
  const { fileId } = req.params;
  const { documentTypeId, pageFrom, pageTo, notas } = req.body;

  if (!documentTypeId || !pageFrom || !pageTo) {
    return res.status(400).json({ error: 'documentTypeId, pageFrom y pageTo son requeridos' });
  }

  const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
  if (!fileRecord) return res.status(404).json({ error: 'Archivo no encontrado' });

  const from = Number(pageFrom);
  const to = Number(pageTo);

  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1) {
    return res.status(400).json({ error: 'Los números de página deben ser enteros positivos' });
  }

  if (from > to) {
    return res.status(400).json({ error: 'pageFrom debe ser menor o igual a pageTo' });
  }

  if (to > fileRecord.pageCount) {
    return res.status(400).json({ error: `El archivo solo tiene ${fileRecord.pageCount} páginas` });
  }

  const docType = await prisma.documentType.findUnique({ where: { id: documentTypeId } });
  if (!docType) return res.status(404).json({ error: 'Tipo de documento no encontrado' });

  const index = await prisma.documentIndex.create({
    data: { fileId, documentTypeId, pageFrom: from, pageTo: to, notas },
    include: { documentType: { select: { id: true, code: true, nombre: true } } },
  });

  res.status(201).json(index);
});

module.exports = router;
