'use strict';

(function() {
  /**
   * Массив соотсветствий рейтинга отеля DOM-классу элементам
   * со звездами.
   * @type {Array.<string>}
   */
  var starsClassName = [
    'hotel-stars',
    'hotel-stars-two',
    'hotel-stars-three',
    'hotel-stars-four',
    'hotel-stars-five'
  ];

  /**
   * Соответствие округленного вниз рейтинга классу
   * для блока с рейтингом.
   * @type {Object.<string, string>}
   */
  var ratingClassName = {
    'undefined': 'hotel-rating-none',
    '4': 'hotel-rating-four',
    '5': 'hotel-rating-five',
    '6': 'hotel-rating-six',
    '7': 'hotel-rating-seven',
    '8': 'hotel-rating-eight',
    '9': 'hotel-rating-none'
  };

  /**
   * Соответствие id дополнительных удобств
   * классам блоков с удобствами.
   * @type {Object.<string, string>}
   */
  var amenityClassName = {
    'breakfast': 'hotel-amenity-breakfast',
    'parking': 'hotel-amenity-parking',
    'wifi': 'hotel-amenity-wifi'
  };

  /**
   * Соответствие id дополнительных удобств
   * названиям удобств в разметке.
   * @type {Object.<string, string>}
   */
  var amenityName = {
    'breakfast': 'Завтрак',
    'parking': 'Парковка',
    'wifi': 'WiFi'
  };

  var container = document.querySelector('.hotels-list');

  downloadHotels(function(hotels) {
    hotels.forEach(function(hotel) {
      var element = getElementFromTemplate(hotel);
      container.appendChild(element);
    });
  });

  /**
   * @param {Object} data
   * @return {Element}
   */
  function getElementFromTemplate(data) {
    var template = document.querySelector('#hotel-template');
    var hotelRating = data.rating || '6.0';
    var element;

    // Свойство content у шаблона не работает в IE,
    // поскольку он не поддерживает template. Поэтому для
    // IE нужно писать альтернативный вариант.

    // 'content' in template вернет true если template
    // является объектом DocumentFragment, в противном
    // случае — нет и мы будем знать что это IE.
    if ('content' in template) {
      element = template.content.children[0].cloneNode(true);
    } else {
      element = template.children[0].cloneNode(true);
    }

    element.querySelector('.hotel-stars').classList.add(starsClassName[data.stars]);
    element.querySelector('.hotel-rating').classList.add(ratingClassName[Math.floor(hotelRating)]);

    element.querySelector('.hotel-name').textContent = data.name;
    element.querySelector('.hotel-rating').textContent = hotelRating;
    element.querySelector('.hotel-price-value').textContent = data.price;

    var amenitiesContainer = element.querySelector('.hotel-amenities');

    data.amenities.forEach(function(amenity) {
      var amenityElement = document.createElement('li');
      amenityElement.classList.add('hotel-amenity', amenityClassName[amenity]);
      amenityElement.innerHTML = amenityName[amenity];
      amenitiesContainer.appendChild(amenityElement);
    });

    /**
     * @type {Image}
     */
    var backgroundImage = new Image();

    // Изображения отличаются от обычных DOM-элементов тем, что
    // у после задания src они загружаются с сервера. Для проверки
    // загрузилось изображение или нет, существует событие load.
    backgroundImage.onload = function() {
      clearTimeout(imageLoadTimeout);
      element.style.backgroundImage = 'url(\'' + backgroundImage.src + '\')';
    };

    // Если изображение не загрузилось (404 ошибка, ошибка сервера),
    // показываем сообщение, что у отеля нет фотографий.
    backgroundImage.onerror = function() {
      element.classList.add('hotel-nophoto');
    };

    /**
     * @const
     * @type {number}
     */
    var IMAGE_TIMEOUT = 10000;

    // Установка таймаута на загрузку изображения. Таймер ожидает 10 секунд
    // после которых он уберет src у изображения и добавит класс hotel-nophoto,
    // который показывает, что у отеля нет фотографий.
    var imageLoadTimeout = setTimeout(function() {
      backgroundImage.src = ''; // Прекращаем загрузку
      element.classList.add('hotel-nophoto'); // Показываем ошибку
    }, IMAGE_TIMEOUT);

    // Изменение src у изображения начинает загрузку.
    backgroundImage.src = '/' + data.preview;

    return element;
  }

  function downloadHotels(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/hotels.json');

    xhr.onload = function(evt) {
      console.log(arguments);
      callback(JSON.parse(evt.srcElement.response));
    };

    xhr.send();
  }
})();
