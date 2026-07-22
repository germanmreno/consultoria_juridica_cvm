const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const { PDFDocument, StandardFonts, rgb, PageSizes } = require('pdf-lib');
const prisma = require('../prisma');
const { verifyJWT } = require('../middleware/auth');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const router = Router();

function computeEstado(evaluationRow, countByType, documentTypeId) {
  if (evaluationRow?.estadoOverride) return evaluationRow.estadoOverride;
  return (countByType[documentTypeId] || 0) > 0 ? 'SI' : 'NO';
}

function computePonderacion(estado, valor, evalPonderacion) {
  if (estado === 'N/A') return null;
  if (estado === 'NO') return 0;
  return evalPonderacion != null ? evalPonderacion : valor;
}

router.get('/:allianceId', verifyJWT, async (req, res) => {
  const { allianceId } = req.params;

  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) return res.status(404).json({ error: 'Alianza no encontrada' });

  const documentTypes = await prisma.documentType.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });

  const evaluationRows = await prisma.evaluation.findMany({ where: { allianceId } });
  const evalMap = {};
  for (const row of evaluationRows) evalMap[row.documentTypeId] = row;

  const indexes = await prisma.documentIndex.findMany({
    where: { file: { allianceId } },
    select: { documentTypeId: true },
  });
  const countByType = {};
  for (const idx of indexes) countByType[idx.documentTypeId] = (countByType[idx.documentTypeId] || 0) + 1;

  const items = documentTypes.map((dt) => {
    const row = evalMap[dt.id];
    const estado = computeEstado(row, countByType, dt.id);
    const ponderacion = computePonderacion(estado, dt.valor, row?.ponderacion);
    return {
      documentTypeId: dt.id,
      code: dt.code,
      nombre: dt.nombre,
      orden: dt.orden,
      estado,
      valor: dt.valor,
      ponderacion,
      observaciones: row?.observaciones || '',
    };
  });

  res.json({ alliance, items });
});

router.put('/:allianceId', verifyJWT, async (req, res) => {
  const { allianceId } = req.params;
  const { items } = req.body;

  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) return res.status(404).json({ error: 'Alianza no encontrada' });

  for (const item of items) {
    const { documentTypeId, estadoOverride, ponderacion, observaciones } = item;
    await prisma.evaluation.upsert({
      where: { allianceId_documentTypeId: { allianceId, documentTypeId } },
      update: { estadoOverride, ponderacion, observaciones },
      create: { allianceId, documentTypeId, estadoOverride, ponderacion, observaciones },
    });
  }

  res.json({ ok: true });
});

router.get('/:allianceId/pdf', verifyJWT, async (req, res) => {
  const { allianceId } = req.params;

  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
  if (!alliance) return res.status(404).json({ error: 'Alianza no encontrada' });

  const documentTypes = await prisma.documentType.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });

  const evaluationRows = await prisma.evaluation.findMany({ where: { allianceId } });
  const evalMap = {};
  for (const row of evaluationRows) evalMap[row.documentTypeId] = row;

  const indexes = await prisma.documentIndex.findMany({
    where: { file: { allianceId } },
    select: { documentTypeId: true },
  });
  const countByType = {};
  for (const idx of indexes) countByType[idx.documentTypeId] = (countByType[idx.documentTypeId] || 0) + 1;

  const items = documentTypes.map((dt) => {
    const row = evalMap[dt.id];
    const estado = computeEstado(row, countByType, dt.id);
    const ponderacion = computePonderacion(estado, dt.valor, row?.ponderacion);
    return {
      code: dt.code,
      nombre: dt.nombre,
      estado,
      valor: dt.valor,
      ponderacion,
      observaciones: row?.observaciones || '',
    };
  });

  const totalPonderacion = items.reduce((s, i) => s + (i.ponderacion || 0), 0);

  const LOGO_CVM = path.resolve(__dirname, '../../../client/public/logo-cvm.png');
  const LOGO_BOLIVIA = path.resolve(__dirname, '../../../client/public/logo-bolivia.png');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const logoCvmBytes = fs.readFileSync(LOGO_CVM);
  const logoBoliviaBytes = fs.readFileSync(LOGO_BOLIVIA);
  const logoCvmImg = await pdfDoc.embedPng(logoCvmBytes);
  const logoBoliviaImg = await pdfDoc.embedPng(logoBoliviaBytes);

  function makePage() {
    const p = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = p.getSize();
    const margin = 40;

    const cvmLogoH = 26;
    const cvmLogoW = cvmLogoH * (2560 / 452);
    const bolLogoH = 36;
    const bolLogoW = bolLogoH * (589 / 414);

    const yTop = height - margin;
    p.drawImage(logoCvmImg, { x: margin, y: yTop - cvmLogoH, width: cvmLogoW, height: cvmLogoH });
    p.drawImage(logoBoliviaImg, { x: width - margin - bolLogoW, y: yTop - bolLogoH, width: bolLogoW, height: bolLogoH });

    const tx = margin + cvmLogoW + 12;
    const ty = yTop - 8;
    p.setFont(fontBold);
    p.setFontColor(rgb(0.12, 0.23, 0.43));
    p.drawText('REPÚBLICA BOLIVARIANA DE VENEZUELA', { x: tx, y: ty + 6, size: 8 });
    p.setFont(font);
    p.setFontSize(7);
    p.drawText('MINISTERIO DEL PODER POPULAR DE DESARROLLO MINERO Y ECOLÓGICO', { x: tx, y: ty, size: 6.5 });
    p.setFont(fontBold);
    p.setFontColor(rgb(0.48, 0.70, 0.09));
    p.drawText('CORPORACIÓN VENEZOLANA DE MINERÍA, S.A. (CVM)', { x: tx, y: ty - 8, size: 6.5 });

    return { p, width, height, margin, y: ty - 34 };
  }

  let { p: page, width, height, margin, y } = makePage();

  page.setFontColor(rgb(0.12, 0.23, 0.43));
  page.setFontSize(12);
  page.setFont(fontBold);
  page.drawText('FICHA TÉCNICA DE EVALUACIÓN DE LEY DE MINAS 2026', { x: margin, y });
  y -= 16;

  page.setFont(font);
  page.setFontSize(7);
  page.setFontColor(rgb(0.2, 0.2, 0.2));
  const infoLines = [
    `Denominación Social: ${alliance.denominacionSocial}`,
    `RIF: ${alliance.rif}  |  Representante Legal: ${alliance.representanteLegal}`,
    `Cédula: ${alliance.cedulaRepresentante}  |  Teléfono: ${alliance.telefono}  |  Email: ${alliance.email}`,
    `Sector: ${alliance.sector}  |  Área: ${alliance.area}  |  Mineral: ${alliance.mineral}`,
    `Fecha: ${new Date(alliance.fecha).toLocaleDateString('es-VE')}`,
  ];
  for (const line of infoLines) {
    page.drawText(line, { x: margin, y });
    y -= 8;
  }
  y -= 8;

  const colW = [20, 170, 22, 22, 22, 30, 42, width - 2 * margin - 328];
  const colX = [margin];
  for (let j = 1; j < colW.length; j++) colX[j] = colX[j - 1] + colW[j - 1];
  const headers = ['N°', 'REQUISITOS EXIGIDOS', 'SÍ', 'NO', 'N/A', 'VALOR %', 'SUB-TOTAL', 'OBSERVACIONES'];
  const rowH = 12;

  function drawHeaderRow(pg, yy) {
    pg.setFont(fontBold);
    pg.setFontSize(6);
    pg.setFontColor(rgb(1, 1, 1));
    pg.drawRectangle({ x: margin, y: yy - rowH, width: width - 2 * margin, height: rowH, color: rgb(0.12, 0.23, 0.43) });
    for (let j = 0; j < headers.length; j++) {
      pg.drawText(headers[j], { x: colX[j] + 2, y: yy - rowH + 3, size: 6 });
    }
  }

  function drawRow(pg, yy, num, nombre, estado, valor, sub, obs, isEven) {
    if (isEven) {
      pg.drawRectangle({ x: margin, y: yy - rowH, width: width - 2 * margin, height: rowH, color: rgb(0.95, 0.95, 0.95) });
    }
    pg.setFont(font);
    pg.setFontSize(6);
    pg.setFontColor(rgb(0, 0, 0));
    pg.drawText(String(num), { x: colX[0] + 2, y: yy - rowH + 3, size: 5.5 });
    pg.drawText(nombre, { x: colX[1] + 2, y: yy - rowH + 3, size: 5.5, maxWidth: colW[1] - 4 });
    pg.drawText(estado === 'SI' ? 'SI' : '', { x: colX[2] + 4, y: yy - rowH + 3, size: 5.5 });
    pg.drawText(estado === 'NO' ? 'NO' : '', { x: colX[3] + 4, y: yy - rowH + 3, size: 5.5 });
    pg.drawText(estado === 'N/A' ? 'N/A' : '', { x: colX[4] + 4, y: yy - rowH + 3, size: 5.5 });
    pg.drawText(valor > 0 ? `${valor}%` : '0%', { x: colX[5] + 2, y: yy - rowH + 3, size: 5.5 });
    pg.drawText(sub != null ? `${sub.toFixed(1)}%` : '', { x: colX[6] + 2, y: yy - rowH + 3, size: 5.5 });
    pg.drawText((obs || '').slice(0, 30), { x: colX[7] + 2, y: yy - rowH + 3, size: 5, maxWidth: colW[7] - 4 });
  }

  drawHeaderRow(page, y);
  y -= rowH;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    drawRow(page, y, i + 1, item.nombre, item.estado, item.valor, item.ponderacion, item.observaciones, i % 2 === 0);
    y -= rowH;
    if (y < 55) {
      ({ p: page, y } = makePage());
      drawHeaderRow(page, y);
      y -= rowH;
    }
  }

  page.drawLine({ start: { x: margin, y: y }, end: { x: width - margin, y: y }, color: rgb(0.12, 0.23, 0.43), thickness: 1 });
  y -= 12;
  page.setFont(fontBold);
  page.setFontSize(8);
  page.drawText(`TOTAL PONDERACIÓN: ${totalPonderacion.toFixed(1)}%`, { x: margin + 300, y });

  y -= 16;
  page.setFont(font);
  page.setFontSize(6);
  page.setFontColor(rgb(0.4, 0.4, 0.4));
  const now = new Date();
  page.drawText(
    `Documento generado el ${now.toLocaleDateString('es-VE')} a las ${now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}`,
    { x: margin, y },
  );

  const pdfBytes = await pdfDoc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ficha_tecnica_${alliance.denominacionSocial.replace(/\s+/g, '_')}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});

module.exports = router;
