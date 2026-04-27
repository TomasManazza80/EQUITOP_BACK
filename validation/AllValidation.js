const Joi = require("joi");

const createUser = Joi.object().keys({
  id: Joi.number().optional(),
  name: Joi.string().required(),
  number: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  recaptchaToken: Joi.string().required()
});

const fatchUser = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateUser = Joi.object().keys({
  id: Joi.number().optional(), // Este campo será opcional ya que se pasará como parámetro en la ruta
  name: Joi.string().required(),
  number: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('admin', 'user', 'guest', 'tecnico', 'vendedor').required()
});

const updateUserRole = Joi.object().keys({
  role: Joi.string().valid('admin', 'user', 'guest', 'tecnico', 'vendedor').required()
});

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

module.exports = { createUser, fatchUser, updateUser, validateProduct, updateUserRole };