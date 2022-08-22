const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT Excetion SHUTTING DOWN');
  console.log(err.name, err.message);

  process.exit(1);
});

// Mongoose database connect
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('DB connection succesfull');
  });

// server listening / running
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);

  console.log('UNHANDLED REJECTION SHUTTING DOWN');
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT Excetion SHUTTING DOWN');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
