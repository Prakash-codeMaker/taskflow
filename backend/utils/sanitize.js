const xss = require('xss');

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script'],
  });
};

module.exports = { sanitizeInput };
