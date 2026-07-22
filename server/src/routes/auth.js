const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { verifyJWT } = require('../middleware/auth');

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña requeridos' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { userId: user.id, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  const { passwordHash, ...userData } = user;
  res.json({ token, user: userData });
});

router.get('/me', verifyJWT, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

module.exports = router;
