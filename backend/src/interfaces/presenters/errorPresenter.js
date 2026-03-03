function formatError(error, fallbackCode = 'INTERNAL_SERVER_ERROR') {
  return {
    error: {
      code: error?.code || fallbackCode,
      message: error?.message || 'Unexpected server error',
      details: error?.details || null,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  formatError,
};
