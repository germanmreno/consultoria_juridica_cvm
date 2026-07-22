const { Router } = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { verifyJWT, requireRole } = require('../middleware/auth');

const router = Router();

router.use(verifyJWT, requireRole('ADMIN'));

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.post('/', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) return res.status(409).json({ error: 'Ya existe un usuario con ese email' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nombre, email, passwordHash: hash, rol: rol || 'OPERADOR' },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  res.status(201).json(user);
});

router.put('/:id', async (req, res) => {
  const { nombre, email, password, rol, activo } = req.body;
  const data = {};
  if (nombre) data.nombre = nombre;
  if (email) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  if (rol) data.rol = rol;
  if (activo !== undefined) data.activo = activo;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  res.json(user);
});

router.delete('/:id', async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { activo: false } });
  res.status(204).end();
});

module.exports = router;
