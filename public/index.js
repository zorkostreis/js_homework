const URL = 'http://localhost:4321';

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

class AppModel {
  static async getSessions() {
    const sessionsRes = await fetch(`${URL}/sessions`);
    return await sessionsRes.json();
  }

  static async addSession(movieTitle, time, seatsAmount) {
    const result = await fetch(
      `${URL}/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movieTitle, time, seatsAmount })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async addBooking({
    sessionId,
    bookingName
  }) {
    const result = await fetch(
      `${URL}/sessions/${sessionId}/bookings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async editBooking({
    sessionId,
    bookingId,
    newbookingName
  }) {
    const result = await fetch(
      `${URL}/sessions/${sessionId}/bookings/${bookingId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newbookingName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async deleteBooking({
    sessionId,
    bookingId
  }) {
    const result = await fetch(
      `${URL}/sessions/${sessionId}/bookings/${bookingId}`,
      {
        method: 'DELETE'
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }
}

class App {
  constructor() {
    this.sessions = [];
  }

  addSession = async () => {
    const titleInput = document.getElementById('add-title-input');
    const timeInput = document.getElementById('add-time-input');
    const seatsAmountInput = document.getElementById('add-seats-amount-input');

    const title = titleInput.value;
    const time = timeInput.value;
    const seatsAmount = seatsAmountInput.value;

    titleInput.value = '';
    timeInput.value = '';
    seatsAmountInput.value = '';

    await AppModel.addSession(title, time, seatsAmount);

    this.sessions.push(
      new Session({
        movieTitle: title,
        time: time,
        seatsAmount: seatsAmount,
        msID: `MS${this.sessions.length}`,
      })
    );

    this.sessions[this.sessions.length - 1].render();
  }

  async init() {
    const sessions = await AppModel.getSessions();
    sessions.forEach(({ movieTitle, time, seatsAmount, bookings }) => {
      const newSession = new Session({
        movieTitle: movieTitle,
        time: time,
        seatsAmount: seatsAmount,
        msID: `MS${this.sessions.length}`,
      });
      bookings.forEach(booking => newSession.bookings.push(booking));
      
      this.sessions.push(newSession);
      newSession.render();
      newSession.rerenderBookings();
    });

    document.getElementById('add-session')
      .addEventListener(
        'click',
        (event) => {
          this.addSession();
        }
      );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.querySelector('.toggle-switch input')
      .addEventListener(
        'change',
        ({ target: { checked } }) => {
          checked
            ? document.body.classList.add('dark-theme')
            : document.body.classList.remove('dark-theme');
        }
      );
  }
}

class Session {
  constructor({
    movieTitle,
    time,
    seatsAmount,
    msID,
  }) {
    this.movieTitle = movieTitle;
    this.time = time;
    this.seatsAmount = seatsAmount;
    this.msID = msID;
    this.bookings = [];
  }

  onAddbookingButtonClick = async () => {
    const newbookingName = prompt('Введите Вашу фамилию:');

    if (!newbookingName) return;

    const sessionId = Number(this.msID.split('MS')[1]);
    try {
      await AppModel.addBooking({
        sessionId,
        bookingName: newbookingName
      });
      this.addBooking(newbookingName);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  addBooking = (bookingName) => {
    document.querySelector(`#${this.msID} ul`)
      .appendChild(
        this.renderBooking({
          bookingID: `${this.msID}-T${this.bookings.length}`,
          bookingName
        })
      );

    this.bookings.push(bookingName);
    this.rerenderSeatsAmount();
  };

  onEditbooking = async (bookingID) => {
    const bookingIndex = Number(bookingID.split('-T')[1]);
    const oldbookingName = this.bookings[bookingIndex];

    const newbookingName = prompt('Введите Вашу фамилию', oldbookingName);

    if (!newbookingName || newbookingName === oldbookingName) {
      return;
    }

    const sessionId = Number(this.msID.split('MS')[1]);
    try {
      await AppModel.editBooking({
        sessionId,
        bookingId: bookingIndex,
        newbookingName
      });

      this.bookings[bookingIndex] = newbookingName;
      document.querySelector(`#${bookingID} span`)
        .innerHTML = newbookingName;
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  onDeleteBookingButtonClick = async (bookingID) => {
    const bookingIndex = Number(bookingID.split('-T')[1]);
    const bookingName = this.bookings[bookingIndex];

    if (!confirm(`Задача '${bookingName}' будет удалена. Продолжить?`)) return;

    const sessionId = Number(this.msID.split('MS')[1]);
    try {
      await AppModel.deleteBooking({
        sessionId,
        bookingId: bookingIndex
      });

      this.deleteBooking(bookingIndex);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  deleteBooking = (bookingIndex) => {
    this.bookings.splice(bookingIndex, 1);
    this.rerenderBookings();
    this.rerenderSeatsAmount();
  };

  rerenderBookings = () => {
    const session = document.querySelector(`#${this.msID} ul`);
    session.innerHTML = '';
    
    this.bookings.forEach((bookingName, bookingIndex) => {
      session.appendChild(
        this.renderBooking({
          bookingID: `${this.msID}-T${bookingIndex}`,
          bookingName
        })
      );
    });
  };

  renderBooking = ({ bookingID, bookingName }) => {
    const booking = document.createElement('li');
    booking.classList.add('session-booking');
    booking.id = bookingID;

    const span = document.createElement('span');
    span.classList.add('session-booking-text');
    span.innerHTML = bookingName;
    booking.appendChild(span);

    const controls = document.createElement('div');
    controls.classList.add('session-booking-controls');

    const row = document.createElement('div');
    row.classList.add('session-booking-controls-row');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.classList.add(
      'session-booking-controls-button',
      'edit-icon'
    );
    editButton.addEventListener('click', () => this.onEditBooking(bookingID));
    row.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add(
      'session-booking-controls-button',
      'delete-icon'
    );
    deleteButton.addEventListener('click', () => this.onDeleteBookingButtonClick(bookingID));
    row.appendChild(deleteButton);

    controls.appendChild(row);

    booking.appendChild(controls);

    return booking;
  };

  render() {
    const session = document.createElement('div');
    session.classList.add('session');
    session.id = this.msID;

    const header = document.createElement('header');
    header.classList.add('session-header');
    header.innerHTML = this.movieTitle;
    session.appendChild(header);

    const time = document.createElement('div');
    time.innerHTML = `Время: ${this.time}`;
    session.appendChild(time);

    const seatsAmount = document.createElement('div');
    seatsAmount.classList.add('seats-available');
    seatsAmount.innerHTML = `Мест: ${this.seatsAvailable()}`;
    session.appendChild(seatsAmount);

    const list = document.createElement('ul');
    list.classList.add('session-bookings');
    session.appendChild(list);

    const footer = document.createElement('footer');
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('session-add-booking');
    button.innerHTML = 'Забронировать';
    button.addEventListener('click', this.onAddbookingButtonClick);
    
    if (this.seatsAvailable() <= 0) {
      button.style.display = 'none';
    }
    
    footer.appendChild(button);
    session.appendChild(footer);

    const container = document.querySelector('main');
    container.insertBefore(session, container.lastElementChild);
  }

  rerenderSeatsAmount() {
    const session = document.getElementById(this.msID);
    const seatsAmount = session.querySelector('.seats-available');
    seatsAmount.innerHTML = `Мест: ${this.seatsAvailable()}`;

    const button = session.querySelector('.session-add-booking');
    button.style.display = (this.seatsAvailable() <= 0) ? 'none' : 'inherit'
  }

  seatsAvailable() {
    return this.seatsAmount - this.bookings.length;
  }
}
