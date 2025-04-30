const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).
  catch((err) => next(err));
};

export { asyncHandler };

// const asyncHandler = (func) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 400).json({
//       status: "Failed",
//       message: "Listening failed",
//     });
//   }
// };
