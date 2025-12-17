const { User } = require('../models');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Usuario desactivado. Contacta al administrador.'
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    // Crear sesión
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = String(user.role).trim().toLowerCase(); // Normalizar el rol
    
    // Marcar la sesión como modificada para forzar guardado
    req.session.touch();
    
    console.log('DEBUG login - Sesión configurada:', {
      sessionId: req.sessionID,
      userId: req.session.userId,
      username: req.session.username,
      role: req.session.role,
      roleFromDB: user.role
    });

    // Guardar la sesión explícitamente y luego responder
    req.session.save((err) => {
      if (err) {
        console.error('DEBUG login - Error al guardar sesión:', err);
      }
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      sessionId: req.sessionID // Para debug
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Error al cerrar sesión'
      });
    }
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  });
};

const getCurrentUser = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'username', 'role', 'is_active']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser
};

