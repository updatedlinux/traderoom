// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'No autenticado. Por favor inicia sesión.' 
    });
  }
  next();
};

// Middleware de autorización por rol
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'No autenticado.' 
      });
    }
    
    if (!req.session.role || !roles.includes(req.session.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para acceder a este recurso.' 
      });
    }
    
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};

