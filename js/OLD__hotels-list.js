'use strict';

(function() {
  /**
   * Массив соотсветствий рейтинга отеля DOM-классу элементам
   * со звездами.
   * @type {Array.<string>}
   */
  var starsClassName = [
    'hotel-stars',
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
  var activeFilter = 'filter-all';
  var hotels = [];
  var filteredHotels = [];
  var currentPage = 0;
  var PAGE_SIZE = 9;

  // Чтобы добавить обработчики на клики, приходится пройти по всем
  // элементам и каждому из них добавить обработчик. Это трудоемкая
  // операция. Можно ли сделать так, чтобы добавлялся только один
  // обработчик сразу на все фильтры? Можно через делегирование.
  // Делегирование — прием основанный на всплытии событий.
  var filters = document.querySelector('.hotels-filters');

  // При делегировании обработчик события добавленный на один элемент
  // слушает события призошедшие на одном из дочерних элементов
  // этого элемента. На каком элементов произошло событие можно
  // проверить, обратившись к свойству target объекта Event.
  filters.addEventListener('click', function(evt) {
    var clickedElement = evt.target;
    if (clickedElement.classList.contains('hotel-filter')) {
      setActiveFilter(clickedElement.id);
    }
  });

  var scrollTimeout;

  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      // Как определить что скролл внизу страницы и пора показать
      // следующую порцию отелей?
      // Проверить — виден ли футер страницы.
      // Как проверить виден ли футер страницы?
      // 1. определить положение футера относительно экрана (вьюпорта)
      var footerCoordinates = document.querySelector('footer').getBoundingClientRect();

      // 2. определить высоту экрана
      var viewportSize = window.innerHeight;

      // 3. если смещение футера минус высота экрана меньше высоты футера,
      //    футер виден хотя бы частично
      if (footerCoordinates.bottom - viewportSize <= footerCoordinates.height) {
        if (currentPage < Math.ceil(filteredHotels.length / PAGE_SIZE)) {
          renderHotels(filteredHotels, ++currentPage);
        }
      }
    }, 100);
  });

  getHotels();

  /**
   * Отрисовка списка отелей.
   * @param {Array.<Object>} hotels
   * @param {number} pageNumber
   * @param {boolean=} replace
   */
  function renderHotels(hotelsToRender, pageNumber, replace) {
    if (replace) {
      container.innerHTML = '';
    }

    var fragment = document.createDocumentFragment();

    var from = pageNumber * PAGE_SIZE;
    var to = from + PAGE_SIZE;
    var pageHotels = hotelsToRender.slice(from, to);

    pageHotels.forEach(function(hotel) {
      var element = getElementFromTemplate(hotel);

      // Для каждого из 50 элементов вызывается отрисовка в DOM.
      // Потенциально, это замедляет производительность в старых браузерах,
      // потому что пересчет параметров страницы будет производиться после
      // каждой вставки элемента на страницу. Чтобы этого избежать, пользуются
      // фрагментами, нодами вида DocumentFragment, которые представляют
      // собой контейнеры для других элементов.
      fragment.appendChild(element);
    });

    container.appendChild(fragment);
  }

  /**
   * Установка выбранного фильтра
   * @param {string} id
   * @param {boolean=} force Флаг, при котором игнорируется проверка
   *     на повторное присвоение фильтра.
   */
  function setActiveFilter(id, force) {
    // Предотвращение повторной установки одного и того же фильтра.
    if (activeFilter === id && !force) {
      return;
    }

    // Алгоритм
    // Подсветить выбранный фильтр
    var selectedElement = document.querySelector('#' + activeFilter);
    if (selectedElement) {
      selectedElement.classList.remove('hotel-filter-selected');
    }

    document.querySelector('#' + id).classList.add('hotel-filter-selected');

    // Отсортировать и отфильтровать отели по выбранному параметру и вывести на страницу
    // hotels будет хранить _изначальный_ список отелей, чтобы можно было отменить
    // фильтр и вернуться к изначальному состоянию списка. Array.sort изменяет
    // исходный массив, поэтому сортировку и фильтрацию будем производить на копии.
    filteredHotels = hotels.slice(0); // Копирование массива

    switch (id) {
      case 'filter-expensive':
        // Для показа сначала дорогих отелей, список нужно отсортировать
        // по убыванию цены.
        filteredHotels = filteredHotels.sort(function(a, b) {
          return b.price - a.price;
        });
        break;

      case 'filter-cheap':
        filteredHotels = filteredHotels.sort(function(a, b) {
          return a.price - b.price;
        });
        break;

      case 'filter-2stars':
        // Формирование списка отелей минимум с двумя звездами производится
        // в два этапа: отсеивание отелей меньше чем с двумя звездами
        // и сортировка по возрастанию количества звезд.
        filteredHotels = filteredHotels.sort(function(a, b) {
          return a.stars - b.stars;
        }).filter(function(item) {
          return item.stars > 2;
        });

        break;

      case 'filter-6rating':
        filteredHotels = filteredHotels.sort(function(a, b) {
          return a.rating - b.rating;
        }).filter(function(item) {
          return item.rating >= 6;
        });
        break;
    }

    currentPage = 0;
    renderHotels(filteredHotels, currentPage, true);

    activeFilter = id;
  }

  /**
   * Загрузка списка отелей
   */
  function getHotels() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/hotels.json');
    xhr.onload = function(evt) {
      var rawData = evt.target.response;
      var loadedHotels = JSON.parse(rawData);
      updateLoadedHotels(loadedHotels);
    };

    xhr.send();
  }

  /**
   * Сохранение списка отелей в переменную hotels, обновление счетчика отелей
   * и вызов фильтрации и отрисовки.
   * @param {Array.<Object>} loadedHotels
   */
  function updateLoadedHotels(loadedHotels) {
    hotels = loadedHotels;
    document.querySelector('.hotels-title-count-number').innerText = hotels.length;

    // Обработка загруженных данных (например отрисовка)
    // NB! Важный момент не освещенный в лекции — после загрузки отрисовка
    // дожна производиться не вызовом renderHotels а setActiveFilter,
    // потому что теперь механизм отрисовки работает через фильтрацию.
    setActiveFilter(activeFilter, true);
  }

  /**
   * @param {Object} data
   * @return {Element}
   */
  function getElementFromTemplate(data) {
    var template = document.querySelector('#hotel-template');
    var hotelRating = data.rating || 6.0;
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
    element.querySelector('.hotel-rating').textContent = hotelRating.toFixed(1);
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
    backgroundImage.src = data.preview;

    return element;
  }
})();
