export const notFoundHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode ?? 500;

  res.status(statusCode).json({
    success: false,
    message: error.message ?? "Unexpected server error",
    details: error.details ?? null
  });
};
