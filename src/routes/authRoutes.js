const express = require('express');
const router  = express.Router();
const {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  getForgotPassword,
  forgotPassword,
  getResetPassword,
  resetPassword,
} = require('../controllers/authController');

router.get('/login',    getLogin);
router.post('/login',   postLogin);
router.get('/register', getRegister);
router.post('/register', postRegister);
router.post('/logout',  logout);

// Forgot / Reset password
router.get('/forgot-password',        getForgotPassword);
router.post('/forgot-password',       forgotPassword);
router.get('/reset-password/:token',  getResetPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
