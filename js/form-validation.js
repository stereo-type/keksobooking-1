/* global docCookies: true */

'use strict';

(function() {
  // Валидация формы:
  // 1. ограничения на минимальное/максимальное значение

  // Форма и поля ввода
  var formElement = document.forms['searchform'];

  var guests = formElement['searchform-guests-number'];
  var rooms = formElement['searchform-guests-rooms'];
  var dateFrom = formElement['date-from'];
  var dateTo = formElement['date-to'];

  // Минимальное количество гостей — 1, максимальное — 6
  guests.min = 1;
  guests.max = 6;

  // Самая ранняя возможная дата — сегодняшний день
  dateFrom.min = new Date().toGMTString().substring();

  // Минимальное и максимальное количество комнат зависит
  // от числа гостей
  var MAX_GUESTS_PER_ROOM = 3;

  // Минимальная разница между датой заезда и выезда
  // из отеля — сутки.
  var MIN_DATE_DIFFERENCE = 24 * 60 * 60 * 1000;

  // установка начальных значений

  // Чтобы получить начальное значение гостей и комнат, нужно
  // получить значение, записанное в cookies. Это неудобно делать
  // стандартными средствами (нужно использовать RegExp), поэтому
  // воспользуемся библиотекой cookie.

  guests.value = docCookies.getItem('guests') || 2;
  setMinAndMaxRooms(rooms, guests.value);
  rooms.value = docCookies.getItem('rooms') || rooms.min;

  dateFrom.value = getFormattedDate(new Date());
  setMinDateTo(dateTo, dateFrom.value);
  dateTo.value = dateTo.min;

  // 2. реакция на изменение

  // При изменении количества гостей должны автоматически
  // пересчитаться граничные значения для количества комнат
  guests.onchange = function() {
    setMinAndMaxRooms(rooms, guests.value);
  };

  dateFrom.onchange = function() {
    setMinDateTo(dateTo, dateFrom.value);
  };

  // При отправке формы, сохраним последние валидные данные
  // в cookies
  formElement.onsubmit = function(evt) {
    // Объект evt представляет собой объект для работы
    // с произошедшим событием. Метод preventDefault
    // отменяет действие по умолчанию. В данном случае —
    // отправку формы.
    evt.preventDefault();

    // Date.now() возвращает не объект Date, а количество милисекунд, прошедшее
    // с начала эпохи UNIX. Переменная dateToExpire равна количеству милисекунд
    // с эпохи UNIX до даты истечения cookie.
    var dateToExpire = +Date.now() + 3 * 24 * 60 * 60 * 1000;

    docCookies.setItem('guests', guests.value, dateToExpire);
    docCookies.setItem('rooms', rooms.value, dateToExpire);

    formElement.submit();
  };

  /**
   * Функция, которая ограничивает минимальное и максимальное
   * значение комнат в зависимости от числа гостей.
   * @param {Element} roomsElement
   * @param {number} guestsNumber
   */
  function setMinAndMaxRooms(roomsElement, guestsNumber) {
    // Минимальное количество комнат — если в каждой комнате
    // будет жить максимальное количество человек (3).
    roomsElement.min = Math.ceil(guestsNumber / MAX_GUESTS_PER_ROOM);

    // Максимальное количество комнат — если в каждой комнате
    // будет жить по одному человеку.
    roomsElement.max = guestsNumber;
  }

  /**
   * Ограничение минимального значения даты выезда — самая ранняя
   * дата выезда — сутки после въезда.
   * @param {HTMLInputElement} dateToElement
   * @param {string} dateFromValue Значение поля date-to
   */
  function setMinDateTo(dateToElement, dateFromValue) {
    var from = new Date(dateFromValue);
    var minDateTo = new Date(+from + MIN_DATE_DIFFERENCE);
    dateToElement.min = getFormattedDate(minDateTo);
  }

  /**
   * Принимает на вход объект Date и возвращает его значение
   * в формате yyyy-mm-dd, с которым работает объект
   * input type=date.
   * @param {Date} date
   * @return {string}
   */
  function getFormattedDate(date) {
    return date.toISOString().substring(0, 10);
  }
})();
