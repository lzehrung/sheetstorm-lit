const { createTransformer } = require('typescript-transform-paths');

const transformer = createTransformer({
  extensions: ['.js'],
});

module.exports = {
  before: [transformer.before],
  afterDeclarations: [transformer.afterDeclarations],
};
