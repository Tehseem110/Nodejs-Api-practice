const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/usersRoutes');
const appError = require('./controllers/utils/appError');
const AppError = require('./controllers/utils/appError');
const globalError = require('./controllers/errorController');

const app = express();

// 1) Middle wares
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.json());

app.use(express.static('./public'));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// 2) Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalError);

module.exports = app;
