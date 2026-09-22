'use strict';

const galleryModel = require('../models/galleryModel');
const { validate, required, isString, isInteger } = require('../lib/validate');

const MAX_IMAGE_DATA_LENGTH = 4_200_000;
const DATA_URL_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,/;

const gallerySchema = {
  caption: [isString({ max: 150 })],
  sort_order: [isInteger()],
};

function isValidImageData(value) {
  return typeof value === 'string' && DATA_URL_REGEX.test(value) && value.length <= MAX_IMAGE_DATA_LENGTH;
}

function list(req, res) {
  const images = galleryModel.findAll();
  res.json({ images });
}

function create(req, res) {
  const errors = validate(req.body, gallerySchema);
  if (!isValidImageData(req.body.image_data)) {
    errors.push({
      field: 'image_data',
      message: 'Slika nije validna ili je prevelika (maks. ~3 MB, format JPG/PNG/WEBP/GIF).',
    });
  }
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci.', errors });

  const image = galleryModel.create({
    image_data: req.body.image_data,
    caption: req.body.caption ? String(req.body.caption).trim() : null,
    sort_order: req.body.sort_order != null ? Number(req.body.sort_order) : 0,
  });
  res.status(201).json({ message: 'Fotografija je uspješno dodata.', image });
}

function remove(req, res) {
  const existing = galleryModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fotografija nije pronađena.' });
  galleryModel.remove(req.params.id);
  res.json({ message: 'Fotografija je obrisana.' });
}

module.exports = { list, create, remove };
