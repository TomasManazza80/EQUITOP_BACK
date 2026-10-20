const Joi = require("joi");

const createUser = Joi.object().keys({
  name: Joi.string().trim().min(2).max(100).required(),
  number: Joi.string().trim().min(8).max(30).pattern(/^[0-9+\s()-]+$/).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required(),
  password: Joi.string().min(8).max(128).required()
}).options({ stripUnknown: true });

const fetchUser = Joi.object().keys({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required(),
  password: Joi.string().min(1).max(128).required(),
}).options({ stripUnknown: true });

const updateUser = Joi.object().keys({
  name: Joi.string().trim().min(2).max(100).required(),
  number: Joi.string().trim().min(8).max(30).pattern(/^[0-9+\s()-]+$/).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(150).required(),
  password: Joi.string().min(8).max(128).optional().allow(''),
  role: Joi.string().valid('admin', 'user', 'guest', 'tecnico', 'vendedor', 'deniger').optional()
}).options({ stripUnknown: true });

const updateUserRole = Joi.object().keys({
  role: Joi.string().valid('admin', 'user', 'guest', 'tecnico', 'vendedor', 'deniger').required()
}).options({ stripUnknown: true });

const createProduct = Joi.object().keys({
  nombre: Joi.string().required(),
  precio: Joi.number().required(),
  marca: Joi.string().required(),
  categoria: Joi.string().required(),
  cantidad: Joi.number().required(),
  talle: Joi.string().required(),
  imagenes: Joi.array().optional(),
  ProductName: Joi.string().optional(),
  ProductDes: Joi.string().optional(),
  ProductPrice: Joi.number().optional(),
});

const validateProduct = async (data) => {
  const result = createProduct.validate(data);
  return { error: result.error };
};

module.exports = { createUser, fetchUser, updateUser, validateProduct, updateUserRole };