import express from 'express';
import { resolve } from 'path';
import { __dirname } from './globals.js';
import { readData, writeData } from './fileUtils.js';

const app = express();

const hostname = 'localhost';
const port = 4321;

const sessions = [];

// Middleware для формирования ответа в формате JSON
app.use(express.json());

// Middleware для логирования запросов
app.use((request, response, next) => {
  console.log(
    (new Date()).toISOString(),
    request.ip,
    request.method,
    request.originalUrl
  );

  next();
});

// Middleware для раздачи статики
app.use('/', express.static(
  resolve(__dirname, '..', 'public')
));

//---------------------------------------------------
// Роуты приложения

app.get('/sessions', (request, response) => {
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json(sessions);
});

app.post('/sessions', async (request, response) => {
  console.log(request);
  const { movieTitle, time, seatsAmount } = request.body;
  sessions.push({
    movieTitle,
    time,
    seatsAmount,
    bookings: []
  });
  await writeData(sessions);

  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `Session for movie '${movieTitle}' was successfully created`
    });
});

app.post('/sessions/:sessionId/bookings', async (request, response) => {
  const { bookingName } = request.body;
  const sessionId = Number(request.params.sessionId);

  if (sessionId < 0 || sessionId >= sessions.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no session with id = ${sessionId}`
      });
    return;
  }

  sessions[sessionId].bookings.push(bookingName);
  await writeData(sessions);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `Booking for '${bookingName}' was successfully added in session '${sessions[sessionId].movieTitle}'`
    });
});

app.put('/sessions/:sessionId/bookings/:bookingId', async (request, response) => {
  const { newbookingName } = request.body;
  const sessionId = Number(request.params.sessionId);
  const bookingId = Number(request.params.bookingId);

  if (sessionId < 0 || sessionId >= sessions.length
    || bookingId < 0 || bookingId >= sessions[sessionId].bookings.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no session with id = ${
          sessionId} or booking with id = ${bookingId}`
      });
    return;
  }

  sessions[sessionId].bookings[bookingId] = newbookingName;
  await writeData(sessions);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `booking №${bookingId} was successfully edited in session '${sessions[sessionId].movieTitle}'`
    });
});

app.delete('/sessions/:sessionId/bookings/:bookingId', async (request, response) => {
  const sessionId = Number(request.params.sessionId);
  const bookingId = Number(request.params.bookingId);

  if (sessionId < 0 || sessionId >= sessions.length
    || bookingId < 0 || bookingId >= sessions[sessionId].bookings.length) {
    response
      .setHeader('Content-Type', 'application/json')
      .status(404)
      .json({
        info: `There is no session with id = ${
          sessionId} or booking with id = ${bookingId}`
      });
    return;
  }

  const deletedbookingName = sessions[sessionId].bookings[bookingId];
  sessions[sessionId].bookings.splice(bookingId, 1);
  await writeData(sessions);
  response
    .setHeader('Content-Type', 'application/json')
    .status(200)
    .json({
      info: `booking '${deletedbookingName}' was successfully deleted from session '${sessions[sessionId].movieTitle}'`
    });
});

//---------------------------------------------------

// Запуск сервера
app.listen(port, hostname, async (err) => {
  if (err) {
    console.error('Error: ', err);
    return;
  }

  console.log(`Out server started at http://${hostname}:${port}`);

  const sessionsFromFile = await readData();
  sessionsFromFile.forEach(({ movieTitle, time, seatsAmount, bookings }) => {
    sessions.push({
      movieTitle,
      time,
      seatsAmount,
      bookings: [...bookings]
    });
  });
});
