const { Router } = require('express');
const prisma = require('../prisma');
const { verifyJWT, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/', verifyJWT, async (req, res) => {
  const soloActivos = req.query.soloActivos === 'true';
  const where = soloActivos ? { activo: true } : (req.userRol === 'ADMIN' ? {} : { activo: true });
  const types = await prisma.documentType.findMany({
    where,
    orderBy: { orden: 'asc' },
  });
  res.json(types);
});

router.post('/', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  const { code, nombre, descripcion, obligatorio, orden, valor } = req.body;
  if (!code || !nombre) return res.status(400).json({ error: 'Código y nombre requeridos' });

  const existente = await prisma.documentType.findUnique({ where: { code } });
  if (existente) return res.status(409).json({ error: 'Ya existe un tipo con ese código' });

  const type = await prisma.documentType.create({
    data: { code, nombre, descripcion, obligatorio: obligatorio ?? true, orden: orden || 99, valor: valor ?? 0 },
  });
  res.status(201).json(type);
});

router.put('/:id', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  const { code, nombre, descripcion, obligatorio, orden, activo, valor } = req.body;
  const data = {};
  if (code) data.code = code;
  if (nombre) data.nombre = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;
  if (obligatorio !== undefined) data.obligatorio = obligatorio;
  if (orden) data.orden = orden;
  if (activo !== undefined) data.activo = activo;
  if (valor !== undefined) data.valor = valor;

  const type = await prisma.documentType.update({ where: { id: req.params.id }, data });
  res.json(type);
});

router.delete('/:id', verifyJWT, requireRole('ADMIN'), async (req, res) => {
  await prisma.documentType.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).end();
});

module.exports = router;
