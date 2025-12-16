const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

// Todas las rutas requieren autenticación y rol admin
router.use(requireAuth);
router.use(requireRole('admin'));

// Validación para crear usuario
const validateCreateUser = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Usuario debe tener entre 3 y 50 caracteres'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('role').optional().isIn(['admin', 'trader']).withMessage('Rol debe ser admin o trader')
];

// Validación para actualizar usuario
const validateUpdateUser = [
  body('is_active').optional().isBoolean().withMessage('is_active debe ser booleano'),
  body('password').optional().isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }
  next();
};

router.get('/users', adminController.getUsers);
router.post('/users', validateCreateUser, handleValidationErrors, adminController.createUser);
router.patch('/users/:id', validateUpdateUser, handleValidationErrors, adminController.updateUser);

module.exports = router;

