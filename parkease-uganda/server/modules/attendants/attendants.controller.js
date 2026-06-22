const attendantsService = require('./attendants.service');
const { successResponse } = require('../../utils/apiResponse');

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const analytics = await attendantsService.getDashboardAnalytics(req.user.id);
    res.status(200).json(successResponse(analytics));
  } catch (error) {
    next(error);
  }
};
