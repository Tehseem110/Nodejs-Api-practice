const Tour = require('./../models/tourModel');
const APIFeatures = require('./utils/apiFeatures');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,rating,summary,difficulty';
  next();
};

// to get all tour
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Execute Query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // Send Response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

// to get a tour
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// to create a tour
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

// to update an existing tour
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

// to delete a tour
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { rating: { $gte: 3.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$rating' },
        avrPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    {
      $match: { _id: { $ne: 'eas' } },
    },
  ]);
  console.log();
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numToursStarts: { $sum: 1 },
          tours: {
            $push: '$name',
          },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numToursStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
});
