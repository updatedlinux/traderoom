const { User } = require('../models');
const bcrypt = require('bcrypt');

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'is_active', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, role = 'trader' } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    if (role !== 'admin' && role !== 'trader') {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Debe ser admin o trader'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }

    const user = await User.create({
      username,
      password_hash: password, // El hook del modelo lo hasheará
      role,
      is_active: true
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Actualizar campos permitidos
    if (is_active !== undefined) {
      user.is_active = is_active;
    }

    if (password) {
      user.password_hash = password; // El hook del modelo lo hasheará
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser
};

