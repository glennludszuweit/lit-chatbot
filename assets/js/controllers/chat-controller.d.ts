/**
 * @description Handles generating and interacting with the chat window
 */
declare class ChatController {
    activeForm: {};
    dateCounter: number;
    datePicker: any;
    dateClass: string;
    context: any;
    processor: any;
    input: any;
    sttClient: any;
    ttsClient: any;
    SESSION_ENUM: {
        DETECTED_LANGUAGE: string;
    };
    init(): void;
    masterBotId: any;
    sttEndpoint: string | undefined;
    ttsEndpoint: string | undefined;
    /**
     * @description - Scrolls to the bottom of the chat window
     */
    scrollToBottom(): void;
    /**
     * @description toggles the typing indicator to appear
     */
    showTypingIndicator(): void;
    /**
     * @description hides the typing indicator
     */
    hideTypingIndicator(): void;
    /**
     * @description formatting date according to tale.dateTime package
     * @param {Object} date - Date() value
     */
    formatDate(date: Object, range: any): Object;
    /**
     * @description Set date picker options
     * @param {Object} data - response config datepicker data
     */
    setDateOptions(data: Object): {
        dateType: string;
        maxDate: any;
        options: {
            startOpen: boolean;
            stayOpen: boolean;
            timeFormat: boolean;
            dateBlacklist: boolean;
            closeButton: boolean;
            dateFormat: string;
            classNames: string;
            locale: string;
        };
    };
    /**
     * @description Creates an HTML element
     * @param {Object} type - HTML element type, defaults to div
     * @param {Object} params - HTML element parameters
     */
    createElement(type: Object, params: Object): HTMLElement | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | HTMLAnchorElement | HTMLScriptElement | HTMLEmbedElement | HTMLFormElement | HTMLHeadElement | HTMLAreaElement | HTMLObjectElement | HTMLLinkElement | HTMLMapElement | HTMLInputElement | HTMLDataElement | HTMLProgressElement | HTMLTrackElement | HTMLSourceElement | HTMLButtonElement | HTMLFontElement | HTMLAudioElement | HTMLBaseElement | HTMLQuoteElement | HTMLBodyElement | HTMLBRElement | HTMLTableCaptionElement | HTMLTableColElement | HTMLDataListElement | HTMLModElement | HTMLDetailsElement | HTMLDialogElement | HTMLDirectoryElement | HTMLDivElement | HTMLDListElement | HTMLFieldSetElement | HTMLFrameElement | HTMLFrameSetElement | HTMLHeadingElement | HTMLHRElement | HTMLHtmlElement | HTMLIFrameElement | HTMLLabelElement | HTMLLegendElement | HTMLLIElement | HTMLMarqueeElement | HTMLMenuElement | HTMLMetaElement | HTMLMeterElement | HTMLOListElement | HTMLOptGroupElement | HTMLOptionElement | HTMLOutputElement | HTMLParagraphElement | HTMLParamElement | HTMLPictureElement | HTMLPreElement | HTMLSelectElement | HTMLSlotElement | HTMLSpanElement | HTMLStyleElement | HTMLTableElement | HTMLTableSectionElement | HTMLTableCellElement | HTMLTemplateElement | HTMLTextAreaElement | HTMLTimeElement | HTMLTitleElement | HTMLTableRowElement | HTMLUListElement;
    /**
     * @description Create message elements
     * @param {HTMLElement} messageContainer - container to add new elements to
     * @param {Array<String>} messages - array of messages to add
     * @param {Object} content - response content
     */
    addMessages(messageContainer: HTMLElement, messages: Array<string>, content: Object): void;
    prevElement: HTMLElement | null | undefined;
    /**
     * @description Create button elements
     * @param {HTMLElement} messageContainer - container to add new elements to
     * @param {Array<String>} buttons - array of buttons to add
     */
    addButtons(messageContainer: HTMLElement, buttons: Array<string>): void;
    /**
     * @description Create carousel elements
     * @param {HTMLElement} messageContainer - container to add new elements to
     * @param {Array<String>} carousel - array of carousel items to add
     * @param {boolean} displayUnselectedOptions - whether carousel slides should be displayed also after selection
     * @param {boolean} hideButtons - is true if carousel response is not the last message in a chat flow
     */
    addCarousel(messageContainer: HTMLElement, carousel: Array<string>, displayUnselectedOptions: boolean, hideButtons: boolean): void;
    /**
     * @description Create button elements
     * @param {HTMLElement} messageContainer - container to add new elements to
     * @param {Array<String>} feedbackTiles - array of feedback tiles to add
     */
    addFeedbackTiles(messageContainer: HTMLElement, feedbackTiles: Array<string>): void;
    /**
     * @description Create datepicker element
     * @param {HTMLElement} messageContainer - container to add new elements to
     * @param {Object} data - data of datepicker to add
     */
    addDatepicker(messageContainer: HTMLElement, data: Object): void;
    /**
     * @description Updates form value
     * @param  fieldName - field name
     * @param  value - new value
     * @param  elem - field element
     */
    updateFormValue(fieldName: any, value: any, elem: any): void;
    /**
     * @description Create form element
     * @param {HTMLElement} messageContainer - container to add new element to
     * @param {Array<String>} carousel - array of carousel items to add
     */
    addForm(messageContainer: HTMLElement, form: any, buttons: any): void;
    /**
     * @description Create custom form  element
     * @param {HTMLElement} messageContainer - container to add new elements to
     * @param {Object} data - data of form to add
     */
    addCustomForm(messageContainer: HTMLElement, data: Object): void;
    /**
     * @description clears unnecessary values from the response config
     * @param {Object} config the responseConfig object returned from webOut
     */
    sanitizeResponseConfig(config: Object): {};
    /**
     * @description Display Message on chat
     * @param {Boolean} isAgentMsg
     * @param {Object} content - recieved from the server
     * @param {Boolean} hideButtons - whether buttons should be hidden for this message or not. Only shown if it is the latest message
     */
    displayMessageOnChat(isAgentMsg: boolean, content: Object, hideButtons: boolean): Promise<void>;
    /**
     * @description takes the value from a clicked button or carousel and sends message to server, as if user has typed it. After, all of the buttons are blocked
     * @param {HTMLElement} data - the html element that has been clicked
     */
    sendQuickReply(node: any, text: any): void;
    /**
     * @description takes the value from a clicked button url
     * @param { String } url - the button url value to be opened in a new tab
     */
    openButtonLink(url: string): void;
    /**
     * @description removes the form component and sends form response
     * @param {HTMLElement} node - the form element
     * @param text - response message
     */
    sendFormReply(node: HTMLElement, text: any, key: any): void;
    /**
     * @description Clears the chat window of messages
     */
    clearMessages(): void;
    fetchChatbotName(): any;
    /**
     * @description hides the button responsible for opening chat window and shows the chat window
     */
    openChatWindow(): void;
    /**
     * @description responsible for opening the chat window and initialising a new socket connection/chat session if one does not already exist
     */
    openConverse(): void;
    shadowRootDoc: HTMLElement | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | HTMLAnchorElement | HTMLScriptElement | HTMLEmbedElement | HTMLFormElement | HTMLHeadElement | HTMLAreaElement | HTMLObjectElement | HTMLLinkElement | HTMLMapElement | HTMLInputElement | HTMLDataElement | HTMLProgressElement | HTMLTrackElement | HTMLSourceElement | HTMLButtonElement | HTMLFontElement | HTMLAudioElement | HTMLBaseElement | HTMLQuoteElement | HTMLBodyElement | HTMLBRElement | HTMLTableCaptionElement | HTMLTableColElement | HTMLDataListElement | HTMLModElement | HTMLDetailsElement | HTMLDialogElement | HTMLDirectoryElement | HTMLDivElement | HTMLDListElement | HTMLFieldSetElement | HTMLFrameElement | HTMLFrameSetElement | HTMLHeadingElement | HTMLHRElement | HTMLHtmlElement | HTMLIFrameElement | HTMLLabelElement | HTMLLegendElement | HTMLLIElement | HTMLMarqueeElement | HTMLMenuElement | HTMLMetaElement | HTMLMeterElement | HTMLOListElement | HTMLOptGroupElement | HTMLOptionElement | HTMLOutputElement | HTMLParagraphElement | HTMLParamElement | HTMLPictureElement | HTMLPreElement | HTMLSelectElement | HTMLSlotElement | HTMLSpanElement | HTMLStyleElement | HTMLTableElement | HTMLTableSectionElement | HTMLTableCellElement | HTMLTemplateElement | HTMLTextAreaElement | HTMLTimeElement | HTMLTitleElement | HTMLTableRowElement | HTMLUListElement | null | undefined;
    /**
     * @description responsible for maximising the chat window
     */
    maximizeChat(): void;
    /**
     * @description responsible for creating the html for the chat window - this uses the Shadow DOM approach
     */
    initChatWindow(): void;
    typingIndicator: HTMLElement | HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | HTMLAnchorElement | HTMLScriptElement | HTMLEmbedElement | HTMLFormElement | HTMLHeadElement | HTMLAreaElement | HTMLObjectElement | HTMLLinkElement | HTMLMapElement | HTMLInputElement | HTMLDataElement | HTMLProgressElement | HTMLTrackElement | HTMLSourceElement | HTMLButtonElement | HTMLFontElement | HTMLAudioElement | HTMLBaseElement | HTMLQuoteElement | HTMLBodyElement | HTMLBRElement | HTMLTableCaptionElement | HTMLTableColElement | HTMLDataListElement | HTMLModElement | HTMLDetailsElement | HTMLDialogElement | HTMLDirectoryElement | HTMLDivElement | HTMLDListElement | HTMLFieldSetElement | HTMLFrameElement | HTMLFrameSetElement | HTMLHeadingElement | HTMLHRElement | HTMLHtmlElement | HTMLIFrameElement | HTMLLabelElement | HTMLLegendElement | HTMLLIElement | HTMLMarqueeElement | HTMLMenuElement | HTMLMetaElement | HTMLMeterElement | HTMLOListElement | HTMLOptGroupElement | HTMLOptionElement | HTMLOutputElement | HTMLParagraphElement | HTMLParamElement | HTMLPictureElement | HTMLPreElement | HTMLSelectElement | HTMLSlotElement | HTMLSpanElement | HTMLStyleElement | HTMLTableElement | HTMLTableSectionElement | HTMLTableCellElement | HTMLTemplateElement | HTMLTextAreaElement | HTMLTimeElement | HTMLTitleElement | HTMLTableRowElement | HTMLUListElement | undefined;
    /**
     * @description displays error message
     */
    showErrorMessage(message: any): void;
    /**
     * @description adds text as the user input
     * @param text - input message
     */
    setInput(text: any): void;
    /**
     * @description removes error message
     */
    hideErrorMessage(): void;
    handleIncomingMessage(message: any): void;
    agentAvailable: any;
    agentName: any;
    /**
     * @description added timestamp function responsible for showing the timestamp on the bot-messages
     * @param messageContainer - container to add new elements to
     * @param sessionTime - used in the condition for adding timestamp
     */
    addTimeStamp(messageContainer: any, sessionTime: any): void;
    getLastResponse(): string;
    changeLivePerson(): void;
}
declare const chatController: ChatController;
//# sourceMappingURL=chat-controller.d.ts.map