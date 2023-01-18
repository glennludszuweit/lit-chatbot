"use strict";
/**
 * @description Handles actions interacting with the socket connection and session. Holds session-related values
 */
class SocketController {
    constructor() {
        this.SESSION_ENUM = {
            MESSAGES: "converseMessages",
            CONVERSE_SESSION: "converseSession",
            DETECTED_LANGUAGE: "detectedLanguage",
        };
        this.delayFlag = Boolean;
    }
    /**
     * @description Initialises a socket connection between converse and the browser.
     * Also contains logic as to what should happen on socket events
     * @param event (optional) - if passed, then start a proactive conversation based on the event
     */
    async initSocket(event, resetChat = false) {
        chatController.init();
        if (window && window.chatSettings && window.chatSettings.endpoint) {
            this.endpoint = window.chatSettings.endpoint;
        }
        if (window && window.chatSettings && window.chatSettings.path) {
            this.path = window.chatSettings.path;
        }
        if (window && window.chatSettings && window.chatSettings.masterBotID) {
            this.masterBotID = window.chatSettings.masterBotID;
        }
        if (window && window.chatSettings && window.chatSettings.storageType) {
            this.storageType = window.chatSettings.storageType;
        }
        // make call to handleSession endpoint to set up session id in httpOnly cookies.
        // don't make the call if session id is provided in query params
        // flag to check if the greeting message has been sent to the user on web socket connection
        let getGreetings = true;
        this.socket = io(this.endpoint, {
            path: this.path,
            transports: ["websocket"],
        });
        // init socket connection
        // will set a session
        this.socket.on("connect", () => {
            chatController.hideErrorMessage();
            console.log("websocket connected");
            // socket connected
            const params = {
                input: "welcome",
                masterBotId: this.masterBotID,
                token: this.token,
                sessionToken: this.sessionToken,
                messageFromClient: resetChat,
            };
            if (event) {
                // start proactive conversation if event has been passed
                params.input = event;
                params.proactive = true;
            }
            /**
             * if the greeting has not yet been sent to the client then send the welcome message when
             * socket is connected
             */
            if (getGreetings) {
                getGreetings = false;
                this.sendMessageToServer(JSON.stringify(params));
            }
        });
        this.socket.on("disconnect", () => {
            console.log("websocket disconnected");
            if (this.socketResetting) {
                this.socketResetting = false;
            }
            else {
                chatController.showErrorMessage("Internet connectivity issue, reconnecting to the server");
            }
        });
        this.socket.on("connect_error", (err) => {
            console.error("websocket connection failed", err);
        });
        // listen for incoming messages
        this.socket.on("webOut", (message) => {
            /**
             * If an incoming message is received then set the flag used for recording if greeting
             * is needed to false - useful in case of any connection issues
             * with the web socket to determine if the greeting is to be sent again
             */
            getGreetings = false;
            chatController.handleIncomingMessage(message);
            if (event) {
                // open chat window if event has been passed
                chatController.openChatWindow();
            }
        });
        // listen for conversation history
        this.socket.on("fetchConversationHistory", (conversationHistory) => {
            try {
                if (conversationHistory) {
                    for (let m = 0; m < conversationHistory.length; m++) {
                        if (conversationHistory[m].userMessage ||
                            conversationHistory[m].botResponse) {
                            conversationHistory[m]["isAgentMsg"] = conversationHistory[m]
                                .userMessage
                                ? false
                                : true;
                            conversationHistory[m]["content"] = conversationHistory[m]
                                .userMessage
                                ? conversationHistory[m].userMessage
                                : { response: [conversationHistory[m].botResponse] };
                            chatController.displayMessageOnChat(conversationHistory[m].isAgentMsg, conversationHistory[m].content);
                            chatController.scrollToBottom();
                        }
                    }
                }
            }
            catch (err) { }
        });
        this.socket.on("updateSessionToken", (sessionDetailsIn) => {
            try {
                // update session cookie
                const sessionTokenDetails = {
                    sessionToken: sessionDetailsIn,
                };
                if (this.storageType && this.storageType === "sessionStorage") {
                    sessionStorage.setItem(this.SESSION_ENUM.CONVERSE_SESSION, JSON.stringify(sessionTokenDetails));
                }
                else {
                    localStorage.setItem(this.SESSION_ENUM.CONVERSE_SESSION, JSON.stringify(sessionTokenDetails));
                }
            }
            catch (err) { }
        });
        const input = document.querySelector("#user-input");
        input.addEventListener("keyup", (e) => {
            if (e.currentTarget.value.trim().length === 0) {
                document.getElementById("chat-input-send").disabled = true;
            }
            else {
                document.getElementById("chat-input-send").disabled = false;
            }
        });
    }
    /**
     * Sends message to server
     * @param {Object} message
     */
    sendMessageToServer(message) {
        this.delayFlag = false;
        this.socket.emit("webIn", {
            message: message,
            sourceField: window.location.href,
        });
        // scroll to bottom whenever sending a message
        chatController.scrollToBottom();
    }
    /**
     * Sends the users input to the chat server
     * @param {String} text
     * @param form submitted form data
     */
    sendUserMessageToServer(text, form) {
        let userMsg;
        let converseSession;
        if (!text) {
            userMsg = chatController.shadowRootDoc.querySelector("#user-input").value;
            chatController.shadowRootDoc.querySelector("#user-input").value = "";
        }
        else {
            userMsg = text;
        }
        console.log(userMsg);
        if (userMsg) {
            // if user message was added by datepicker, then remove it from messages container
            const datepicker = chatController.shadowRootDoc.querySelector("#datepicker");
            if (datepicker)
                datepicker.parentNode.removeChild(datepicker);
            chatController.displayMessageOnChat(false, userMsg.name || userMsg);
            chatController.showTypingIndicator();
            const params = {
                input: userMsg.value || userMsg,
                masterBotId: this.masterBotID,
                token: this.token,
                sessionToken: this.sessionToken,
                messageFromClient: true,
            };
            try {
                if (this.storageType && this.storageType === "sessionStorage") {
                    converseSession = sessionStorage.getItem(this.SESSION_ENUM.CONVERSE_SESSION);
                }
                else {
                    converseSession = localStorage.getItem(this.SESSION_ENUM.CONVERSE_SESSION);
                }
            }
            catch (err) { }
            if (converseSession) {
                converseSession = JSON.parse(converseSession);
                params.sessionToken = converseSession.sessionToken;
            }
            if (form)
                params.form = form;
            this.sendMessageToServer(JSON.stringify(params));
        }
    }
    /**
     * @description responsible for resetting the socket connection
     * @param data (optional) - contains optional parameters to initiate new socket connection
     */
    async resetConversation(data = {}) {
        if (this.storageType && this.storageType === "sessionStorage") {
            sessionStorage.removeItem(this.SESSION_ENUM.CONVERSE_SESSION);
            sessionStorage.removeItem(this.SESSION_ENUM.MESSAGES);
        }
        else {
            localStorage.removeItem(this.SESSION_ENUM.CONVERSE_SESSION);
            localStorage.removeItem(this.SESSION_ENUM.MESSAGES);
        }
        this.sessionToken = undefined;
        if (!this.isResettingConversion) {
            this.isResettingConversion = true;
            if (data.resetChat === undefined)
                data.resetChat = true;
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("sessionToken") && !data.resetButtonClicked) {
                data.resetChat = false;
            }
            this.socketResetting = true;
            if (!data.keepChatMsgs)
                chatController.clearMessages();
            if (this.socket)
                await this.socket.disconnect();
            await this.initSocket(data.event, data.resetChat);
            // persist chat history
            this.isResettingConversion = false;
        }
    }
    /**
     * @description responsible for adding time to session for bot message timestamp
     * @param time - contains parameter to handle session time
     */
    addTimeToSession(time) {
        let sessionMessages;
        try {
            if (this.storageType && this.storageType === "sessionStorage") {
                sessionMessages = JSON.parse(sessionStorage.getItem(this.SESSION_ENUM.MESSAGES));
            }
            else {
                sessionMessages = JSON.parse(localStorage.getItem(this.SESSION_ENUM.MESSAGES));
            }
        }
        catch (err) { }
        try {
            if (sessionMessages) {
                for (var i = 0; i < sessionMessages.length; i++) {
                    if (sessionMessages[i].isAgentMsg === true) {
                        if (sessionMessages[i].hasOwnProperty("time")) {
                            //do nothing
                        }
                        else {
                            if (sessionMessages[i].content.response[0] ===
                                "Was your experience today helpful?") {
                                //do nothing
                            }
                            else {
                                sessionMessages[i].time = time;
                            }
                        }
                    }
                }
                // update session
                if (this.storageType && this.storageType === "sessionStorage") {
                    sessionStorage.setItem(this.SESSION_ENUM.MESSAGES, JSON.stringify(sessionMessages));
                }
                else {
                    localStorage.setItem(this.SESSION_ENUM.MESSAGES, JSON.stringify(sessionMessages));
                }
            }
            else {
                // first message when session has been created
                // create new array of converseMessages in the session
                if (this.storageType && this.storageType === "sessionStorage") {
                    sessionStorage.setItem(this.SESSION_ENUM.MESSAGES, JSON.stringify([message]));
                }
                else {
                    localStorage.setItem(this.SESSION_ENUM.MESSAGES, JSON.stringify([message]));
                }
            }
        }
        catch (err) { }
    }
}
const socketController = new SocketController();
/**
 * Browser Shims
 */
URL = window.URL || window.webkitURL;
chatController.initChatWindow();
chatController.openConverse();
chatController.maximizeChat();
//# sourceMappingURL=socket-controller.js.map