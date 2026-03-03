function validationMiddleware(schema, source = 'body') {
  return function validate(req, _res, next) {
    try {
      const payload = req[source] || {};
      const parsed = schema.parse(payload);
      req[source] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = validationMiddleware;
