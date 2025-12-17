// Middleware de autenticación
const requireAuth = (req, res, next) => {
  console.log('DEBUG requireAuth - Session check:', {
    hasSession: !!req.session,
    sessionId: req.session?.id,
    userId: req.session?.userId,
    username: req.session?.username,
    role: req.session?.role,
    cookies: req.headers.cookie
  });
  
  if (!req.session || !req.session.userId) {
    console.log('DEBUG requireAuth - No autenticado');
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
      console.log('DEBUG requireRole - No hay sesión o userId');
      return res.status(401).json({ 
        success: false, 
        error: 'No autenticado.' 
      });
    }
    
    // Debug: Log completo de la sesión
    console.log('DEBUG requireRole - Session completa:', {
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      roleType: typeof req.session.role,
      requiredRoles: roles
    });
    
    // Normalizar el rol (trim y lowercase para comparación)
    const sessionRole = req.session.role ? String(req.session.role).trim().toLowerCase() : null;
    const normalizedRoles = roles.map(r => String(r).trim().toLowerCase());
    
    if (!sessionRole || !normalizedRoles.includes(sessionRole)) {
      console.log('DEBUG requireRole - Acceso denegado. Rol actual:', sessionRole, 'Roles requeridos:', normalizedRoles);
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para acceder a este recurso.',
        debug: {
          sessionRole: req.session.role,
          normalizedRole: sessionRole,
          requiredRoles: roles,
          normalizedRequired: normalizedRoles
        }
      });
    }
    
    console.log('DEBUG requireRole - Acceso permitido');
    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};

