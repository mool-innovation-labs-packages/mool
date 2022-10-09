module.exports = {
  success: function (message = null, data = null, code = undefined) {
    return { success: true, message, data, code, timestamp: Date.now() };
  },
  error: function (message = null, data = null, code = undefined, type = null) {
    return {
      success: false,
      message,
      code,
      type,
      data,
      timestamp: Date.now(),
    };
  },
};
