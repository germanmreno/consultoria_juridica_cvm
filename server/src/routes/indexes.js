const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const prisma = require('../prisma');
const { verifyJWT } = require('../middleware/auth');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const router = Router();

router.delete('/:id', verifyJWT, async (req, res) => {
  const index = await prisma.documentIndex.findUnique({ where: { id: req.params.id } });
  if (!index) return res.status(404).json({ error: 'Índice no encontrado' });

  await prisma.documentIndex.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.get('/:id/export', verifyJWT, async (req, res) => {
  const index = await prisma.documentIndex.findUnique({
    where: { id: req.params.id },
    include: { file: true, documentType: true },
  });
  if (!index) return res.status(404).json({ error: 'Índice no encontrado' });

  const filePath = path.join(UPLOAD_DIR, index.file.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo PDF no encontrado en disco' });

  try {
    const pdfBytes = fs.readFileSync(filePath);
    const sourceDoc = await PDFDocument.load(pdfBytes);
    const destDoc = await PDFDocument.create();

    const pageIndices = [];
    for (let i = index.pageFrom - 1; i < index.pageTo; i++) {
      pageIndices.push(i);
    }

    const copiedPages = await destDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach(page => destDoc.addPage(page));

    const outBytes = await destDoc.save();

    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';
    const extName = `${index.documentType.code}_pag${index.pageFrom}-${index.pageTo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${extName}"`);
    res.send(Buffer.from(outBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el PDF recortado' });
  }
});

module.exports = router;
