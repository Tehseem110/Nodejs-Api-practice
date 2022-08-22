const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('./utils/catchAsync');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const appError = require('./utils/appError');
const AppError = require('./utils/appError');
const { json } = require('express');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password is exist
  if (!email || !password) {
    next(new AppError('Please provide email and password', 400));
    return;
  }
  //2) check if user exists && password id correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) if everything ok, send token to client

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! please log in to get access,', 401)
    );
  }
  // 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3) check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this user does no longer exist', 401)
    );
  }

  // 4)Check if user changed password after the token was issued
  freshUser.changedPasswordAfter(decoded.iat);

  next();
});
