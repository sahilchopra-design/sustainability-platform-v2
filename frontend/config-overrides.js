module.exports = function override(config) {
  // Disable ModuleConcatenationPlugin (scope hoisting) to prevent
  // "Cannot access 'XXX' before initialization" TDZ errors in the
  // minified bundle caused by module execution order issues.
  if (config.optimization) {
    config.optimization.concatenateModules = false;
    // Also disable Terser minification to avoid TDZ in minified output
    config.optimization.minimize = false;
  }
  return config;
};
