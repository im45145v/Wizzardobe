const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(1).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(1),
  profile: Joi.object({
    gender: Joi.string(),
    bodyType: Joi.string(),
    skinTone: Joi.string(),
    stylePreference: Joi.string().valid('streetwear', 'minimalist', 'formal', 'casual'),
    occasions: Joi.array().items(Joi.string()),
    location: Joi.string(),
    profileImageUrl: Joi.string().allow(''),
  }),
  settings: Joi.object({
    cooldownDays: Joi.number().integer().min(0),
    wearBeforeDirty: Joi.object({
      top: Joi.number().integer().min(1),
      bottom: Joi.number().integer().min(1),
      innerwear: Joi.number().integer().min(1),
      shoes: Joi.number().integer().min(1),
      outerwear: Joi.number().integer().min(1),
    }),
    laundryAlertDays: Joi.number().integer().min(1),
  }),
});

const onboardingSchema = Joi.object({
  gender: Joi.string(),
  bodyType: Joi.string(),
  skinTone: Joi.string(),
  stylePreference: Joi.string().valid('streetwear', 'minimalist', 'formal', 'casual'),
  occasions: Joi.array().items(Joi.string()),
  location: Joi.string(),
  profileImageUrl: Joi.string().allow(''),
});

const addClothSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().valid('top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear').required(),
  color: Joi.string(),
  fabric: Joi.string(),
  brand: Joi.string(),
  occasionTags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  season: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  condition: Joi.string().valid('new', 'good', 'worn', 'retire'),
  purchasePrice: Joi.number().min(0),
  purchaseDate: Joi.date(),
});

const suggestSchema = Joi.object({
  mode: Joi.string().valid('safe', 'surprise', 'formal', 'comfy').default('safe'),
  occasion: Joi.string(),
  weather: Joi.object(),
});

module.exports = { registerSchema, loginSchema, updateProfileSchema, onboardingSchema, addClothSchema, suggestSchema };
