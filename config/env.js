const dotenv = require('dotenv');

dotenv.config();

function toBool(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return String(value).toLowerCase() === 'true' || value === '1';
}

module.exports = {
  env: process.env,
  toBool,
};

