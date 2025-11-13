// Validaciones y utilidades
// archivo: utils/validations.js

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  // Permite números, espacios, guiones y paréntesis
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.length >= 7;
};

const isValidPassword = (password) => {
  return password.length >= 6;
};

// Validar fecha (formato YYYY-MM-DD)
const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Validar hora (formato HH:MM)
const isValidTime = (time) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidDate,
  isValidTime
};