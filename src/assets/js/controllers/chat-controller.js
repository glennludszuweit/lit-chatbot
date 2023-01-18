/**
 * @description Handles generating and interacting with the chat window
 */
class ChatController {
  constructor() {
    this.activeForm = {};
    this.dateCounter = 1;
    this.datePicker = null;
    this.dateClass = '';

    this.context = null;
    this.processor = null;
    this.input = null;

    this.sttClient = null;
    this.ttsClient = null;

    this.SESSION_ENUM = {
      DETECTED_LANGUAGE: 'detectedLanguage',
    };
  }

  init() {
    this.masterBotId = window.chatSettings.masterBotID;

    // workout the stt and tts endpoint
    if (window.location.hostname === 'localhost') {
      this.sttEndpoint = 'ws://localhost:8082';
      this.ttsEndpoint = 'ws://localhost:8083';
    } else {
      this.sttEndpoint = `wss://${window.location.hostname}/backend-stt`;
      this.ttsEndpoint = `wss://${window.location.hostname}/backend-tts`;
    }

    // reconnects socket and persists chat messages
    window.addEventListener('focus', () => {
      // reconnect to the web socket server
      socketController.resetConversation({
        resetButtonClicked: false,
        keepChatMsgs: true,
      });
    });
  }

  /**
   * @description - Scrolls to the bottom of the chat window
   */
  scrollToBottom() {
    const lastMessage =
      this.shadowRootDoc.querySelector('#chat-messages').lastChild;
    if (lastMessage) {
      const isSafari =
        navigator.vendor &&
        navigator.vendor.indexOf('Apple') > -1 &&
        navigator.userAgent &&
        navigator.userAgent.indexOf('CriOS') == -1 &&
        navigator.userAgent.indexOf('FxiOS') == -1;

      if (isSafari) {
        lastMessage.parentNode.scrollTop = lastMessage.offsetTop - 50;
      } else {
        lastMessage.scrollIntoView({behavior: 'smooth'});
      }
      lastMessage.scrollIntoView({behavior: 'smooth'});
    }
  }

  /**
   * @description toggles the typing indicator to appear
   */
  showTypingIndicator() {
    const chatMessageWindow =
      this.shadowRootDoc.querySelector('#chat-messages');
    chatMessageWindow.appendChild(this.typingIndicator);
    this.scrollToBottom();
  }

  /**
   * @description hides the typing indicator
   */
  hideTypingIndicator() {
    const typingIndicator =
      this.shadowRootDoc.querySelector('#typing-indicator');
    if (typingIndicator) {
      const chatMessageWindow =
        this.shadowRootDoc.querySelector('#chat-messages');
      chatMessageWindow.removeChild(typingIndicator);
    }
  }

  /**
   * @description formatting date according to tale.dateTime package
   * @param {Object} date - Date() value
   */

  formatDate(date, range) {
    date = date.split('-');
    if (range) {
      date = date[1] + ' ' + date[0] + ', ' + date[2] + ' 00:00:00';
      return date;
    } else {
      const chart = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        June: 5,
        July: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      date = [chart[date[1]], parseInt(date[2])];
      return date;
    }
  }

  /**
   * @description Set date picker options
   * @param {Object} data - response config datepicker data
   */

  setDateOptions(data) {
    let dateOptions = {};
    let options = {
      startOpen: true,
      stayOpen: true,
      timeFormat: false,
      dateBlacklist: false,
      closeButton: false,
      dateFormat: 'dd/mm/YYYY',
      classNames: 'tail-date-container',
      locale: 'de',
    };

    var range = {};
    var pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    var futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    // apply response settings to the datepicker

    if (data.allowFutureDates && !data.allowPastDates) {
      range.start = futureDate;
      range.end = new Date(8640000000000000);
      dateOptions.dateType = 'future';
    } else if (data.allowPastDates && !data.allowFutureDates) {
      range.start = new Date('1000,1,1');
      range.end = pastDate;
      dateOptions.dateType = 'past';
    } else if (data.minDate && data.maxDate) {
      range.start = new Date(this.formatDate(data.minDate, true));
      range.end = new Date(this.formatDate(data.maxDate, true));
      dateOptions.dateType = 'range';
      dateOptions.maxDate = data.maxDate;
    } else {
      range.start = new Date('1000,1,1');
      range.end = new Date(8640000000000000);
    }

    var dateRange = [range];
    options.dateRanges = dateRange;
    dateOptions.options = options;
    return dateOptions;
  }

  /**
   * @description Creates an HTML element
   * @param {Object} type - HTML element type, defaults to div
   * @param {Object} params - HTML element parameters
   */
  createElement(type, params) {
    const elem = document.createElement(type || 'div');
    if (params) {
      if (params.className) elem.className = params.className;
      if (params.id) elem.id = params.id;
      if (params.innerText) elem.innerText = params.innerText;
      if (params.innerHTML) elem.innerHTML = params.innerHTML;
      if (params.onclick && typeof params.onclick === 'string')
        elem.setAttribute('onclick', params.onclick);
      else if (params.onclick) elem.onclick = params.onclick;
      if (params.onsubmit && typeof params.onsubmit === 'string')
        elem.setAttribute('onsubmit', params.onsubmit);
      else if (params.onsubmit) elem.onsubmit = params.onsubmit;
      if (params.oninput && typeof params.oninput === 'string')
        elem.setAttribute('oninput', params.oninput);
      else if (params.oninput) elem.oninput = params.oninput;
      if (params.rel) elem.setAttribute('rel', params.rel);
      if (params.href) elem.setAttribute('href', params.href);
      if (params.src) elem.setAttribute('src', params.src);
      if (params.type) elem.setAttribute('type', params.type);
      if (params.autocomplete)
        elem.setAttribute('autocomplete', params.autocomplete);
      if (params['data-value'])
        elem.setAttribute('data-value', params['data-value']);
      if (params.onchange) elem.onchange = params.onchange;
    }
    return elem;
  }

  /**
   * @description Create message elements
   * @param {HTMLElement} messageContainer - container to add new elements to
   * @param {Array<String>} messages - array of messages to add
   * @param {Object} content - response content
   */
  addMessages(messageContainer, messages, content) {
    let regex2 = /<DB>/;

    if (regex2.test(messages)) {
      if (this.prevElement != null) {
        const carouselContainer = this.prevElement.children[0].children[0];
        const carouselElem = this.createElement('div', {
          className: 'carousel-option',
        });
        const carouselTextDiv = this.createElement('div', {
          className: 'carouselTitleDiv',
        });
        const carouselText = this.createElement('span', {
          innerHTML: messages[0],
          className: 'carouselTitle',
        });
        carouselElem.appendChild(carouselTextDiv);
        carouselTextDiv.appendChild(carouselText);
        carouselContainer.appendChild(carouselElem);
      } else {
        const carouselContainer = this.createElement('div', {
          className: 'carousel-container',
        });
        const scrollContainer = this.createElement('div', {
          className: 'scroll-container',
        });
        const carouselElem = this.createElement('div', {
          className: 'carousel-option',
        });
        const carouselTextDiv = this.createElement('div', {
          className: 'carouselTitleDiv',
        });
        const carouselText = this.createElement('span', {
          innerHTML: messages[0],
          className: 'carouselTitle',
        });
        carouselElem.appendChild(carouselTextDiv);
        carouselTextDiv.appendChild(carouselText);
        carouselContainer.appendChild(carouselElem);
        scrollContainer.appendChild(carouselContainer);
        messageContainer.appendChild(scrollContainer);
        this.prevElement = messageContainer;
      }
    } else {
      this.prevElement = null;
      for (let i = 0; i < messages.length; i++) {
        const messageElem = this.createElement('div', {
          className: 'message',
          innerHTML: messages[i],
        });
        messageContainer.appendChild(messageElem);

        // added timestamp
        chatController.addTimeStamp(messageElem);
      }
    }

    messageContainer.setAttribute('data-ssml', content.responseSsml);
  }

  /**
   * @description Create button elements
   * @param {HTMLElement} messageContainer - container to add new elements to
   * @param {Array<String>} buttons - array of buttons to add
   */
  addButtons(messageContainer, buttons) {
    const buttonContainer = this.createElement('div', {
      className: 'button-container',
    });

    for (let b = 0; b < buttons.length; b++) {
      if (
        buttons[b]['name'] &&
        (!buttons[b]['value'] || buttons[b]['value'] === '')
      ) {
        buttons[b]['value'] = buttons[b]['name'];
      }

      // if buttons contain a link, create element for open link button
      if (buttons[b] && buttons[b]['link']) {
        const buttonElem = this.createElement('button', {
          className: 'convButton',
          innerText: buttons[b].name,
          onclick:
            'chatController.openButtonLink(' +
            JSON.stringify(buttons[b].link) +
            ')',
        });
        const openLinkElem = this.createElement('div', {
          className: 'openLinkButton',
        });

        buttonElem.appendChild(openLinkElem);
        buttonContainer.appendChild(buttonElem);
      } else {
        const buttonElem = this.createElement('button', {
          className: 'convButton',
          innerText: buttons[b].name,
          onclick:
            'chatController.sendQuickReply(this, ' +
            JSON.stringify(buttons[b].name) +
            ')',
        });

        buttonContainer.appendChild(buttonElem);
      }
    }
    messageContainer.appendChild(buttonContainer);

    // added timestamp
    chatController.addTimeStamp(buttonContainer);
  }

  /**
   * @description Create carousel elements
   * @param {HTMLElement} messageContainer - container to add new elements to
   * @param {Array<String>} carousel - array of carousel items to add
   * @param {boolean} displayUnselectedOptions - whether carousel slides should be displayed also after selection
   * @param {boolean} hideButtons - is true if carousel response is not the last message in a chat flow
   */
  addCarousel(
    messageContainer,
    carousel,
    displayUnselectedOptions,
    hideButtons
  ) {
    // do not create already used carousel slides if they shouldn't been displayed
    if (hideButtons && !displayUnselectedOptions) return;

    const carouselContainer = this.createElement('div', {
      className: 'carousel-container',
    });
    const scrollContainer = this.createElement('div', {
      className: 'scroll-container',
    });
    for (let x = 0; x < carousel.length; x++) {
      const carouselElem = this.createElement('div', {
        className: 'carousel-option' + (hideButtons ? ' disabled' : ''),
        onclick: () => {
          // don't bind onclick event to already used slides
          if (hideButtons) return null;
          // if unselected slides should be visible, then delete onclick logic when any slide is clicked and change cursor to the default one
          if (displayUnselectedOptions) {
            carouselContainer
              .querySelectorAll('.carousel-option')
              .forEach((item) => {
                item.onclick = null;
                item.classList.add('disabled');
              });
            this.sendQuickReply(null, carousel[x].title);
          } else {
            this.sendQuickReply(carouselContainer, carousel[x].title);
          }
        },
      });
      const carouselImg = this.createElement('img', {
        src: carousel[x].url,
      });
      const carouselTextDiv = this.createElement('div', {
        className: 'carouselTitleDiv',
      });
      const carouselText = this.createElement('span', {
        innerText: carousel[x].title,
        className: 'carouselTitle',
      });
      const carouselSubTitleDiv = this.createElement('div', {
        className: 'carouselSubTitleDiv',
      });
      const carouselSubTitle = this.createElement('span', {
        innerText: carousel[x].subTitle,
        className: 'carouselSubTitle',
      });
      const carouselImageContainer = this.createElement('div', {
        className: 'carousel-image-container',
      });
      carouselImageContainer.appendChild(carouselImg);
      carouselElem.appendChild(carouselImageContainer);
      carouselElem.appendChild(carouselTextDiv);
      carouselTextDiv.appendChild(carouselText);
      carouselElem.appendChild(carouselSubTitleDiv);
      carouselSubTitleDiv.appendChild(carouselSubTitle);
      carouselContainer.appendChild(carouselElem);
    }
    scrollContainer.appendChild(carouselContainer);
    messageContainer.appendChild(scrollContainer);

    // added timestamp
    chatController.addTimeStamp(scrollContainer);
  }

  /**
   * @description Create button elements
   * @param {HTMLElement} messageContainer - container to add new elements to
   * @param {Array<String>} feedbackTiles - array of feedback tiles to add
   */
  addFeedbackTiles(messageContainer, feedbackTiles) {
    const tileContainer = this.createElement('div', {
      className: 'feedback-button-container',
    });
    for (let t = 0; t < feedbackTiles.length; t++) {
      const tileElem = this.createElement('button', {
        className: 'convButton',
        innerHTML:
          '<img style="float:left"  src="' +
          feedbackTiles[t].image +
          '"/><span style="vertical-align: -webkit-baseline-middle;">' +
          feedbackTiles[t].name +
          '</span>',
        onclick:
          "chatController.sendQuickReply(this, '" +
          feedbackTiles[t].name +
          "')",
      });

      tileContainer.appendChild(tileElem);
    }

    messageContainer.appendChild(tileContainer);

    // added timestamp
    chatController.addTimeStamp(tileContainer);
  }

  /**
   * @description Create datepicker element
   * @param {HTMLElement} messageContainer - container to add new elements to
   * @param {Object} data - data of datepicker to add
   */
  addDatepicker(messageContainer, data) {
    chatController.dateClass = 'datepicker-' + chatController.dateCounter;
    // create necessary HTML elements
    const datepickerContainer = this.createElement('div', {
      className: chatController.dateClass,
    });
    const datepickerElemContainer = this.createElement('div', {
      className: 'datepicker-element-container',
    });
    datepickerContainer.appendChild(datepickerElemContainer);
    // add the HTML elements to the message container
    messageContainer.appendChild(datepickerContainer);
    const dateOptions = this.setDateOptions(data);
    var monthRange = null;
    if (dateOptions.dateType === 'range') {
      monthRange = this.formatDate(dateOptions.maxDate, false);
    }
    setTimeout(function () {
      chatController.datePicker = new tail.DateTime(
        '.' + chatController.dateClass,
        dateOptions.options
      );
      if (dateOptions.dateType === 'range') {
        chatController.datePicker.switchMonth(monthRange[0], monthRange[1]);
      }
      if (chatController.datePicker.length > 1) {
        chatController.datePicker.forEach(() => {
          chatController.dateCounter += 1;
        });
      } else {
        chatController.datePicker.on('change', function () {
          var data = document.getElementsByClassName(
            chatController.dateClass
          )[0].value;
          // chatController.datePicker.close();
          document.getElementById('user-input').value = data;
          document.getElementById('user-input').focus();
        });
        datepickerElemContainer.appendChild(
          document.getElementById('tail-datetime-' + chatController.dateCounter)
        );
        chatController.scrollToBottom();
        chatController.dateCounter += 1;
      }
    }, 0);

    // added timestamp
    chatController.addTimeStamp(datepickerContainer);
  }

  /**
   * @description Updates form value
   * @param  fieldName - field name
   * @param  value - new value
   * @param  elem - field element
   */
  updateFormValue(fieldName, value, elem) {
    this.activeForm[fieldName] = value;
    elem.classList.remove('error');
    const errorField = elem.querySelector('#field-error');
    if (errorField) errorField.classList.remove('show');
  }

  /**
   * @description Create form element
   * @param {HTMLElement} messageContainer - container to add new element to
   * @param {Array<String>} carousel - array of carousel items to add
   */
  addForm(messageContainer, form, buttons) {
    this.activeForm = {};
    const formContainer = this.createElement('div', {
      className: 'form-container',
    });

    for (let x = 0; x < form.data.length; x++) {
      const fieldData = form.data[x];
      const fieldContainer = this.createElement('div', {
        className: 'field-container ' + fieldData.type,
        'data-value': fieldData.title,
      });
      if (fieldData.type !== 'checkbox') {
        const fieldLabel = this.createElement('div', {
          className: 'field-label',
          innerText: fieldData.title + (fieldData.required ? '*' : ''),
        });
        fieldContainer.appendChild(fieldLabel);
      }

      if (fieldData.type === 'text') {
        const fieldInput = this.createElement('input', {
          className: 'field-input text',
          type: 'text',
          oninput:
            "chatController.updateFormValue('" +
            fieldData.title +
            "', this.value, this.parentNode)",
        });
        fieldContainer.appendChild(fieldInput);
      }

      if (fieldData.type === 'textarea') {
        const fieldInput = this.createElement('textarea', {
          className: 'field-input textarea',
          oninput:
            "chatController.updateFormValue('" +
            fieldData.title +
            "', this.value, this.parentNode)",
        });
        fieldContainer.appendChild(fieldInput);
      }

      if (fieldData.type === 'password') {
        const fieldInput = this.createElement('input', {
          className: 'field-input password',
          type: 'password',
          autocomplete: 'new-password',
          oninput:
            "chatController.updateFormValue('" +
            fieldData.title +
            "', this.value, this.parentNode)",
        });
        fieldContainer.appendChild(fieldInput);
      }

      if (
        fieldData.type === 'text' ||
        fieldData.type === 'textarea' ||
        fieldData.type === 'password'
      ) {
        const fieldError = this.createElement('div', {
          id: 'field-error',
          innerText: fieldData.errorMessage,
        });
        fieldContainer.appendChild(fieldError);
      }

      if (fieldData.type === 'dropdown' && fieldData.dropdownValues) {
        const dropdown = this.createElement('div', {
          className: 'dropdown-input placeholder',
          onclick: (e) => {
            if (
              e.target.classList.contains('dropdown-input') ||
              e.target.classList.contains('dropdown-label')
            ) {
              const dropdownElem = e.target.classList.contains('dropdown-input')
                ? e.target
                : e.target.parentNode;
              dropdownElem
                .querySelector('.dropdown-values-container')
                .classList.toggle('hidden');
            }
          },
        });
        const dropdownLabel = this.createElement('span', {
          className: 'dropdown-label',
          innerText: 'Select option',
        });
        dropdown.appendChild(dropdownLabel);

        const dropdownContainer = this.createElement('div', {
          className: 'dropdown-values-container hidden',
        });

        for (let i = 0; i < fieldData.dropdownValues.length; i++) {
          const option = this.createElement('div', {
            className: 'dropdown-value',
            'data-value':
              fieldData.dropdownValues[i].value ||
              fieldData.dropdownValues[i][fieldData.variableValue],
            innerText:
              fieldData.dropdownValues[i].value ||
              fieldData.dropdownValues[i][fieldData.variableName],
            onclick: (e) => {
              e.target.parentNode.parentNode.querySelector('span').innerText =
                e.target.innerText;
              e.target.parentNode.parentNode.classList.remove('placeholder');
              e.target.parentNode.classList.add('hidden');
              chatController.updateFormValue(
                fieldData.title,
                e.target.dataset.value,
                e.target.parentNode.parentNode.parentNode
              );
            },
          });
          dropdownContainer.appendChild(option);
        }
        dropdown.appendChild(dropdownContainer);
        fieldContainer.appendChild(dropdown);
      }

      if (fieldData.type === 'radioButtons') {
        const buttonsContainer = this.createElement('div', {
          className: 'form-buttons-container',
        });

        for (let i = 0; i < fieldData.radioValues.length; i++) {
          const button = this.createElement('div', {
            className: 'form-button',
            innerText: fieldData.radioValues[i].value,
            'data-value': fieldData.radioValues[i].key,
            onclick: (e) => {
              if (fieldData.allowMultiple) {
                e.target.classList.toggle('active');
              } else {
                e.target.classList.toggle('active');

                e.target.parentNode
                  .querySelectorAll('.form-button')
                  .forEach((item) => {
                    if (e.target.classList !== item.classList) {
                      item.classList.remove('active');
                    }
                  });
              }
              const values = [];
              e.target.parentNode
                .querySelectorAll('.active')
                .forEach((item) => values.push(item.dataset.value));

              chatController.updateFormValue(
                fieldData.title,
                values,
                e.target.parentNode.parentNode
              );
            },
          });
          buttonsContainer.appendChild(button);
        }
        fieldContainer.appendChild(buttonsContainer);
      }

      if (fieldData.type === 'checkbox') {
        const checkboxContainer = this.createElement('div', {
          className: 'checkbox-container',
        });

        const checkbox = this.createElement('input', {
          type: 'checkbox',
          onchange: (e) => {
            const value = e.target.checked;
            if (value) {
              e.target.parentNode.classList.add('checked');
            } else {
              e.target.parentNode.classList.remove('checked');
            }
            chatController.updateFormValue(
              fieldData.title,
              value,
              e.target.parentNode.parentNode.parentNode
            );
          },
        });
        const label = this.createElement('label');
        label.appendChild(checkbox);
        checkboxContainer.appendChild(label);

        const span = this.createElement('span', {
          className: 'field-label',
          innerHTML: fieldData.title,
        });
        checkboxContainer.appendChild(span);
        fieldContainer.appendChild(checkboxContainer);
      }

      formContainer.appendChild(fieldContainer);
    }

    const responseButtonsContainer = this.createElement('div', {
      className: 'form-response-buttons-container',
    });

    for (let b = 0; b < buttons.length; b++) {
      let clickAction;
      if (buttons[b].name) {
        clickAction = (e) => {
          const errorFields = form.data
            .filter((item) => {
              Array.isArray(this.activeForm[item.title])
                ? this.activeForm[item.title].length <= 0
                  ? (this.activeForm[item.title] = undefined)
                  : this.activeForm[item.title]
                : this.activeForm[item.title];
              return item.required && !this.activeForm[item.title];
            })
            .map((item) => item.title);

          const invalidFields = form.data
            .filter(
              (item) =>
                item.validation &&
                this.activeForm[item.title] &&
                new RegExp(item.regexpPattern, item.regexpFlags.join('')).test(
                  this.activeForm[item.title]
                ) === false
            )
            .map((item) => item.title);

          if (errorFields.length > 0) {
            e.target.parentNode.parentNode
              .querySelectorAll('.field-container')
              .forEach((item) => {
                if (errorFields.indexOf(item.dataset.value) !== -1)
                  item.classList.add('error');
              });
          }

          if (invalidFields.length > 0) {
            e.target.parentNode.parentNode
              .querySelectorAll('.field-container')
              .forEach((item) => {
                if (invalidFields.indexOf(item.dataset.value) !== -1) {
                  item.classList.add('error');
                  item.querySelector('#field-error').classList.add('show');
                }
              });
          }

          if (errorFields.length === 0 && invalidFields.length === 0) {
            this.sendFormReply(
              e.target.parentNode.parentNode,
              buttons[b].name,
              form.id
            );
          }
        };
      } else {
        clickAction =
          "chatController.sendQuickReply(this.parentNode, '" +
          buttons[b].name +
          "')";
      }

      const buttonElem = this.createElement('button', {
        className: 'convButton',
        innerText: buttons[b].name,
        onclick: clickAction,
      });
      responseButtonsContainer.appendChild(buttonElem);
    }

    formContainer.appendChild(responseButtonsContainer);
    messageContainer.appendChild(formContainer);

    // added timestamp
    chatController.addTimeStamp(formContainer);
  }

  /**
   * @description Create custom form  element
   * @param {HTMLElement} messageContainer - container to add new elements to
   * @param {Object} data - data of form to add
   */
  addCustomForm(messageContainer, data) {
    var formId = data.values.replace('${', '').replace('}', '').split('.')[0];
    var headers = data.headers;

    const formContainer = this.createElement('form', {
      className: 'form-container',
      id: formId,
    });

    for (let x = 0; x < headers.length; x++) {
      const inputElem = this.createElement('div', {
        class: 'form-input-box-cls',
      });

      const inputLable = this.createElement('span', {
        class: 'form-lable-cls',
        innerText: headers[x].title,
      });

      const inputTxt = this.createElement('input', {
        class: 'form-input-cls',
        type: headers[x].type,
        id: headers[x].name,
      });

      inputElem.appendChild(inputLable);
      inputElem.appendChild(inputTxt);
      formContainer.appendChild(inputElem);
    }

    const formConfirmBtn = this.createElement('button', {
      className: 'form-confirm-btn',
      innerText: 'Submit',
      onclick: () => {
        var formEls = this.shadowRootDoc.getElementById(formId).childNodes;
        var jsonObj = {
          formid: formId,
        };
        for (let y = 0; y < formEls.length - 1; y++) {
          var value = formEls[y].childNodes[1].value;
          jsonObj[formEls[y].childNodes[1].id] = value;
        }
        socketController.sendUserMessageToServer(
          JSON.stringify(jsonObj),
          false
        );
      },
    });
    formContainer.appendChild(formConfirmBtn);
    messageContainer.appendChild(formContainer);

    // added timestamp
    chatController.addTimeStamp(formContainer);
  }

  /**
   * @description clears unnecessary values from the response config
   * @param {Object} config the responseConfig object returned from webOut
   */
  sanitizeResponseConfig(config) {
    const cleanResConfig = {};
    const invalidObjects = [
      '[]',
      '{}',
      `{"data":[]}`,
      `{"values":[],"staticbuttons":[]}`,
    ];

    Object.keys(config).forEach((property) => {
      try {
        if (
          config[property] &&
          invalidObjects.indexOf(JSON.stringify(config[property])) === -1
        ) {
          cleanResConfig[property] = config[property];
        }
      } catch {}
    });

    return cleanResConfig;
  }

  /**
   * @description Display Message on chat
   * @param {Boolean} isAgentMsg
   * @param {Object} content - recieved from the server
   * @param {Boolean} hideButtons - whether buttons should be hidden for this message or not. Only shown if it is the latest message
   */
  async displayMessageOnChat(isAgentMsg, content, hideButtons) {
    const chatMessageWindow =
      this.shadowRootDoc.querySelector('#chat-messages');
    let doNotDisplay = false;

    const messageContainer = this.createElement('div', {
      className: isAgentMsg ? 'message-wrapper bot' : 'message-wrapper user',
      id: 'chat-message-wrapper',
    });

    if (isAgentMsg) {
      const messages = content.response ? content.response : null;

      try {
        if (messages && messages.length >= 0) {
          document.getElementById('user-input').disabled = false;
          document.getElementById('chat-input-send').disabled = false;
          messages.forEach(function (txt, idx, messages) {
            var tokens = messages[idx].match(
              /\b(?:http:\/\/|https:\/\/)(\S+)\b/g
            ); // extract all url's

            if (tokens) {
              tokens.forEach(function (token, cnt, tokens) {
                //Commenting below line of code for ticket "LSLCUSEN-605"
                // don't wrap link in <a> tag if it is already wrapped in it
                const messageBeforeUrl = messages[idx].substring(
                  0,
                  messages[idx].indexOf(token)
                );
                if (!messageBeforeUrl.endsWith('href="')) {
                  messages[idx] = messages[idx].replace(
                    token,
                    '<a class="linkstyle" href="' +
                      token +
                      '" target="_blank" rel="noopener noreferrer">' +
                      token +
                      '</a>'
                  ); // replace each with anchor tag
                }
              });
            }
          });
        }
      } catch (error) {
        console.log(error);
      }

      content.responseConfig = this.sanitizeResponseConfig(
        content.responseConfig || {}
      );

      const customForm =
        content.responseConfig &&
        content.responseConfig.customResponse &&
        content.responseConfig.customResponse.data
          ? JSON.parse(content.responseConfig.customResponse.data)
          : null;

      // render text message
      if (messages) {
        document.getElementById('user-input').disabled = false;
        document.getElementById('chat-input-send').disabled = false;
        this.addMessages(messageContainer, messages, content);
      }

      try {
        if (content.responseConfig.feedbackReqMsg) {
          this.addMessages(messageContainer, [
            content.responseConfig.feedbackReqMsg,
          ]);
        }
      } catch (e) {
        console.log(e);
      }

      // render feedback tiles
      if (content.responseConfig.feedbackTiles) {
        this.addFeedbackTiles(
          messageContainer,
          content.responseConfig.feedbackTiles
        );
      }

      // add carousel
      if (content.responseConfig.carousel) {
        document.getElementById('user-input').disabled = false;
        document.getElementById('chat-input-send').disabled = false;
        this.addCarousel(
          messageContainer,
          content.responseConfig.carousel,
          content.responseConfig.displayUnselectedOptions,
          hideButtons
        );
      }

      // add datepicker
      if (content.responseConfig.datepicker && !hideButtons) {
        this.addDatepicker(messageContainer, content.responseConfig.datepicker);
      }

      // add form
      if (content.responseConfig.form && !hideButtons) {
        document.getElementById('user-input').disabled = false;
        document.getElementById('chat-input-send').disabled = false;
        this.addForm(
          messageContainer,
          content.responseConfig.form,
          content.responseConfig.buttons
        );
      }

      // add custom form
      /*if (customForm && !hideButtons) {
              this.addCustomForm(messageContainer, customForm);
            }*/

      // add buttons
      if (
        content.responseConfig.buttons &&
        !content.responseConfig.form &&
        !hideButtons
      ) {
        document.getElementById('user-input').disabled = false;
        document.getElementById('chat-input-send').disabled = false;
        this.addButtons(messageContainer, content.responseConfig.buttons);
      }

      // write logic if messages is empty, buttons is empty etc.
      if (!messages && !content.responseConfig.buttons) {
        doNotDisplay = true;
      }
    } else {
      const messageElem = this.createElement('div', {
        className: 'message',
        innerText: content,
      });
      messageContainer.appendChild(messageElem);

      // added timestamp
      chatController.addTimeStamp(messageElem);
    }

    if (!doNotDisplay) {
      chatMessageWindow.appendChild(messageContainer);
    }
  }

  /**
   * @description takes the value from a clicked button or carousel and sends message to server, as if user has typed it. After, all of the buttons are blocked
   * @param {HTMLElement} data - the html element that has been clicked
   */
  sendQuickReply(node, text) {
    // block buttons or carousel once clicked
    if (node.classList.contains('carousel-container')) {
      node.classList.add('not-active');
    } else {
      const buttonContainer = node.parentNode.childNodes;
      buttonContainer.forEach(function (element) {
        if (element.classList.contains('convButton')) {
          element.disabled = true;
        }
      });
    }
    socketController.sendUserMessageToServer(text, null);
  }

  /**
   * @description takes the value from a clicked button url
   * @param { String } url - the button url value to be opened in a new tab
   */
  openButtonLink(url) {
    window.open(url, '_blank');
  }

  /**
   * @description removes the form component and sends form response
   * @param {HTMLElement} node - the form element
   * @param text - response message
   */
  sendFormReply(node, text, key) {
    node.parentNode.removeChild(node);
    socketController.sendUserMessageToServer(text, {
      data: this.activeForm,
      key: key,
    });
    this.activeForm = {};
  }

  /**
   * @description Clears the chat window of messages
   */
  clearMessages() {
    const chatMessageWindow =
      this.shadowRootDoc.querySelector('#chat-messages');
    chatMessageWindow.innerHTML = '';
  }

  fetchChatbotName() {
    if (window && window.chatSettings && window.chatSettings.chatbotName) {
      return window.chatSettings.chatbotName;
    } else {
      return 'Edwin';
    }
  }

  /**
   * @description hides the button responsible for opening chat window and shows the chat window
   */
  openChatWindow() {
    this.shadowRootDoc.querySelector('#open-converse').className = 'hide';
    this.shadowRootDoc.querySelector('#chat-window').className = 'show';
  }

  /**
   * @description responsible for opening the chat window and initialising a new socket connection/chat session if one does not already exist
   */
  openConverse() {
    this.shadowRootDoc = document.getElementById('chat-bot'); // change to element.shadowRoot to actually use shadow DOM
    // initialise socket connection if it hasnt already been done
    if (!socketController.socket) {
      socketController.initSocket();
    }
    this.openChatWindow();
  }

  /**
   * @description responsible for maximising the chat window
   */
  maximizeChat() {
    const chatState =
      this.shadowRootDoc.querySelector('#chat-window').className;
    if (chatState === 'maximize') {
      this.shadowRootDoc.querySelector('#chat-window').className = 'show';
      this.shadowRootDoc.querySelector('#chat-resize-btn').className =
        'chat-header-btn  maximize_chat_window';
      this.shadowRootDoc.querySelector('#chat-messages').className = 'minimize';
      this.shadowRootDoc.querySelector(
        '.user-interaction-bar-maximize'
      ).className = 'user-interaction-bar';
    } else {
      this.shadowRootDoc.querySelector('#chat-window').className = 'maximize';
      this.shadowRootDoc.querySelector('#chat-messages').className = 'maximize';
      this.shadowRootDoc.querySelector('.user-interaction-bar').className =
        'user-interaction-bar-maximize';
      this.shadowRootDoc.querySelector(
        '.user-interaction-bar-maximize'
      ).style.width = '97%';
      this.shadowRootDoc.querySelector(
        '.user-interaction-bar-maximize'
      ).style.margin = '10px auto';
      this.shadowRootDoc.querySelector(
        '.user-interaction-bar-maximize'
      ).style.height = '50px';
    }
  }

  /**
   * @description responsible for creating the html for the chat window - this uses the Shadow DOM approach
   */
  initChatWindow() {
    const chatbot = this.createElement('div', {id: 'chat-bot'});
    chatbot.style.position = 'fixed';
    document.body.appendChild(chatbot);
    const shadowRoot = chatbot; // add .attachShadow({ mode: "open" }); to reapply shaddow DOM
    const chatWindow = this.createElement('div', {
      id: 'chat-window',
    });
    // Datepicker styling gives warning in the browser console
    const assetsCss = this.createElement('link', {
      rel: 'stylesheet',
      href: window.chatSettings.assetsBasePath
        ? window.chatSettings.assetsBasePath + 'dist/css/assets.css'
        : 'dist/css/assets.css',
    });
    const styleLink = this.createElement('link', {
      id: 'chatbotStyleLink',
      rel: 'stylesheet',
      href: window.chatSettings.assetsBasePath
        ? window.chatSettings.assetsBasePath +
          'dist/css/' +
          window.chatSettings.theme
        : 'dist/css/defaultChatbot.css',
    });
    const chatHeader = this.createElement('div', {
      className: 'chat-header',
    });
    const headerLabel = this.createElement('div', {
      className: 'chat-header-label bot',
      innerText: this.fetchChatbotName(),
      id: 'header-label',
    });

    const reloadBtn = this.createElement('div', {
      className: 'chat-header-btn reload',
      id: 'reload-btn',
      onclick:
        'socketController.resetConversation({ resetButtonClicked: true, keepChatMsgs: false })',
    });
    chatWindow.style.borderRadius = 0;
    chatHeader.style.borderRadius = 0;
    reloadBtn.style.right = '15px';
    chatHeader.appendChild(headerLabel);
    chatHeader.appendChild(reloadBtn);

    const chatMessageWindow = this.createElement('div', {
      id: 'chat-messages',
    });

    this.typingIndicator = this.createElement('div', {
      id: 'typing-indicator',
    });
    const dot1 = this.createElement('span');
    const dot2 = this.createElement('span');
    const dot3 = this.createElement('span');
    this.typingIndicator.appendChild(dot1);
    this.typingIndicator.appendChild(dot2);
    this.typingIndicator.appendChild(dot3);

    const userInteractionWrapper = this.createElement('form', {
      className: 'user-interaction-bar',
      onsubmit: (e) => {
        e.preventDefault();
        if (chatController.datePicker) {
          chatController.datePicker.close();
          var elements = document.querySelectorAll(
            '.' + chatController.dateClass
          );
          for (var element of elements) {
            element.remove(); // or // element.parentNode.removeChild(element);}
          }
        }
        socketController.sendUserMessageToServer('', null);
      },
    });
    const voiceBtn = this.createElement('div', {
      className: 'chat-input-btn voice voice-input-btn',
      id: 'voice-toggle',
      onclick: 'chatController.toggleVoice()',
    });
    voiceBtn.style.display = 'none';

    const userInputField = this.createElement('input', {
      className: 'user-input-textbox',
      id: 'user-input',
      autocomplete: 'off',
    });
    const submitUserMessageButton = this.createElement('button', {
      className: 'btn-chat-send',
      id: 'chat-input-send',
      innerHTML: 'Send',
    });
    submitUserMessageButton.style.border = 'none';
    userInputField.setAttribute('placeholder', 'Nachricht eingeben...');
    if (window && window.chatSettings && window.chatSettings.voiceEnabled) {
      userInteractionWrapper.appendChild(voiceBtn);
    }
    userInteractionWrapper.appendChild(userInputField);
    userInteractionWrapper.appendChild(submitUserMessageButton);
    const openConverseButton = this.createElement('div', {
      id: 'open-converse',
      onclick: 'chatController.openConverse()',
    });

    // finalise the chat window elements
    chatWindow.appendChild(chatHeader);
    chatWindow.appendChild(chatMessageWindow);
    chatWindow.appendChild(userInteractionWrapper);
    // add all elements to the shadow root
    shadowRoot.appendChild(openConverseButton);
    shadowRoot.appendChild(chatWindow);
    shadowRoot.appendChild(assetsCss);
    shadowRoot.appendChild(styleLink);

    // shadow root doc is used elsewhere in the code to query Shadow Root DOM
    this.shadowRootDoc = chatbot; // change to chatbot.shadowRoot to actually use shadow DOM
  }

  /**
   * @description displays error message
   */
  showErrorMessage(message) {
    const chatWindow = this.shadowRootDoc.querySelector('#chat-window');
    const existingError = this.shadowRootDoc.querySelector('#error-overlay');

    if (!existingError) {
      const errorOverlay = this.createElement('div', {
        className: 'error-overlay',
        id: 'error-overlay',
      });
      const errorMessage = this.createElement('div', {
        className: 'error-message',
        innerText: message,
        onclick: 'chatController.hideErrorMessage()',
      });
      errorOverlay.appendChild(errorMessage);
      chatWindow.appendChild(errorOverlay);
    }
  }

  /**
   * @description adds text as the user input
   * @param text - input message
   */
  setInput(text) {
    document.getElementById('user-input').value = text;
  }

  /**
   * @description removes error message
   */
  hideErrorMessage() {
    const chatWindow = this.shadowRootDoc.querySelector('#chat-window');
    const errorOverlay = this.shadowRootDoc.querySelector('#error-overlay');
    if (errorOverlay) {
      chatWindow.removeChild(errorOverlay);
    }
  }

  handleIncomingMessage(message) {
    // Prevent duplicate welcome message, we only get response if user ask
    const messages = document.querySelector('#chat-messages');
    if (
      messages &&
      messages.children.length > 0 &&
      messages.lastChild.classList.contains('bot')
    ) {
      return;
    }
    this.hideTypingIndicator();

    this.agentAvailable = message.agentAvailable;

    if (this.agentAvailable) {
      this.agentName = message.converseResponse.agentName
        ? message.converseResponse.agentName
        : this.fetchChatbotName();
      this.shadowRootDoc.querySelector('#header-label').innerText =
        this.agentName;
      this.shadowRootDoc.querySelector('#chat-sidebar-name').innerText =
        this.agentName;
    }

    this.displayMessageOnChat(true, message.converseResponse);
    // scroll to bottom whenever receiving a message
    this.scrollToBottom();

    if (this.voiceEnabled) {
      const isSSMLMsg = message.converseResponse.responseSsml;
      const botResponse = isSSMLMsg
        ? isSSMLMsg
        : message.converseResponse.response;
      chatController.sendTTSMessage(botResponse);
    }
  }

  /**
   * @description added timestamp function responsible for showing the timestamp on the bot-messages
   * @param messageContainer - container to add new elements to
   * @param sessionTime - used in the condition for adding timestamp
   */
  addTimeStamp(messageContainer, sessionTime) {
    let time = new Date();
    let seconds = time.getSeconds();
    let localTime = time.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    socketController.addTimeToSession(localTime);
    if (seconds >= 1 && seconds <= 59 && !sessionTime) {
      const timeStamp = this.createElement('div', {
        className: 'bot-timeStamp ' + localTime,
        id: 'bot-timeStamp-id',
        innerHTML: 'vor wenigen Sekunden',
      });
      messageContainer.appendChild(timeStamp);
    } else if (!sessionTime) {
      const timeStamp = this.createElement('div', {
        className: 'bot-timeStamp',
        id: 'bot-timeStamp-id',
        innerHTML: localTime,
      });
      messageContainer.appendChild(timeStamp);
    }
    setTimeout(function () {
      var botTimeStampClass = document.getElementsByClassName('bot-timeStamp');
      for (let i = 0; i < botTimeStampClass.length; i++) {
        if (botTimeStampClass[i].innerHTML === 'vor wenigen Sekunden') {
          var botClassName = botTimeStampClass[i].className.split(' ');
          botTimeStampClass[i].innerHTML = botClassName[1]; // + ' ' + botClassName[2];
        }
      }
    }, 1000 * 59);
  }

  getLastResponse() {
    const messages =
      this.shadowRootDoc.querySelector('#chat-messages').children;

    let manageResponses = [];
    if (messages.length > 0) {
      // Count backwards to look for last bot messages
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages.item(i).className === 'message-wrapper bot') {
          if (messages.item(i).getAttribute('data-ssml')) {
            manageResponses.unshift(messages.item(i).getAttribute('data-ssml'));
          } else {
            manageResponses.unshift(messages.item(i).innerText);
          }
        } else {
          // Return only last bot responses after last user message
          break;
        }
      }
    }

    const lastResponse = manageResponses.join(' ');
    const messageWithoutTimestamp = RemoveTimeStamp();
    return messageWithoutTimestamp;

    /**
     * @description function to remove the timestamp from the message
     * @param {Array<String>} lastResponse - string containing bot message
     */
    function RemoveTimeStamp() {
      const responseTime = lastResponse.replace(
        /((1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm]))/gi,
        ' '
      );
      const responseSeconds = responseTime.replace(
        /(vor wenigen Sekunden)/gi,
        ' '
      );
      return responseSeconds;
    }
  }

  changeLivePerson() {
    const label = this.agentAvailable
      ? this.agentName
      : this.fetchChatbotName();
    this.shadowRootDoc.querySelector('#header-label').innerText = label;
    if (this.agentAvailable) {
      this.shadowRootDoc.querySelector('#chat-sidebar').classList.remove('bot');
      this.shadowRootDoc.querySelector('#chat-sidebar').classList.add('lp');
      this.shadowRootDoc.querySelector('#chat-sidebar-name').innerText =
        'Live Person';

      this.shadowRootDoc
        .querySelector('#chat-sidebar-image')
        .classList.remove('bot');
      this.shadowRootDoc
        .querySelector('#chat-sidebar-image')
        .classList.add('lp');
    } else {
      this.shadowRootDoc.querySelector('#chat-sidebar').classList.remove('lp');
      this.shadowRootDoc.querySelector('#chat-sidebar').classList.add('bot');
      this.shadowRootDoc.querySelector('#chat-sidebar-name').innerText =
        this.fetchChatbotName();

      this.shadowRootDoc
        .querySelector('#chat-sidebar-image')
        .classList.remove('lp');
      this.shadowRootDoc
        .querySelector('#chat-sidebar-image')
        .classList.add('bot');
    }
  }
}

const chatController = new ChatController();
