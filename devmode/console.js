const util = require("util");

/**
 * Wrap a given object method with a higher-order function
 *
 * @param source An object that contains a method to be wrapped.
 * @param name A name of method to be wrapped.
 * @param replacement A function that should be used to wrap a given method.
 * @returns void
 */
const fill = (source, name, replacement) => {
  if (!(name in source) || source[name].__devmode__) {
    return;
  }
  const original = source[name];
  const wrapped = replacement(original);
  wrapped.__devmode__ = true;
  source[name] = wrapped;
};

/**
 * Wrapper function that'll be used for every console level
 */
function consoleWrapper(originalModule, handler) {
  return function(level) {
    if (!(level in originalModule)) {
      return;
    }

    fill(originalModule, level, function(originalConsoleLevel) {
      return function() {
        const message = util.format.apply(undefined, arguments);
        handler(`[${level}] ${message}`);
        originalConsoleLevel.apply(originalModule, arguments);
      };
    });
  };
}

/**
 * Wrapper function for internal _load calls within `require`
 */
const loadWrapper = function(nativeModule, handler) {
  return function(originalLoad) {
    return function(moduleId) {
      const originalModule = originalLoad.apply(nativeModule, arguments);

      if (moduleId !== "console" || originalModule.__devmode__) {
        return originalModule;
      }

      ["debug", "info", "warn", "error", "log"].forEach(
        consoleWrapper(originalModule, handler)
      );

      originalModule.__devmode__ = true;
      return originalModule;
    };
  };
};

module.exports = handler => {
  const nativeModule = require("module");
  fill(nativeModule, "_load", loadWrapper(nativeModule, handler));
  // special case: since console is built-in and app-level code won't require() it, do that here
  require("console");
};
