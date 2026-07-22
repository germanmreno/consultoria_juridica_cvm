const jwt = require('jsonwebtoken');

function verifyJWT(req, res, next) {
  const header = req.headers.authorization;
  const token = (header && header.startsWith('Bearer ') ? header.split(' ')[1] : null) || req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.userRol = payload.rol;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

module.exports = { verifyJWT, requireRole };
