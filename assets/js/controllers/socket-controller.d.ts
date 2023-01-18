/**
 * @description Handles actions interacting with the socket connection and session. Holds session-related values
 */
declare class SocketController {
    SESSION_ENUM: {
        MESSAGES: string;
        CONVERSE_SESSION: string;
        DETECTED_LANGUAGE: string;
    };
    delayFlag: BooleanConstructor;
    /**
     * @description Initialises a socket connection between converse and the browser.
     * Also contains logic as to what should happen on socket events
     * @param event (optional) - if passed, then start a proactive conversation based on the event
     */
    initSocket(event: any, resetChat?: boolean): Promise<void>;
    endpoint: any;
    path: any;
    masterBotID: any;
    storageType: any;
    socket: any;
    socketResetting: boolean | undefined;
    /**
     * Sends message to server
     * @param {Object} message
     */
    sendMessageToServer(message: Object): void;
    /**
     * Sends the users input to the chat server
     * @param {String} text
     * @param form submitted form data
     */
    sendUserMessageToServer(text: string, form: any): void;
    /**
     * @description responsible for resetting the socket connection
     * @param data (optional) - contains optional parameters to initiate new socket connection
     */
    resetConversation(data?: {}): Promise<void>;
    sessionToken: any;
    isResettingConversion: boolean | undefined;
    /**
     * @description responsible for adding time to session for bot message timestamp
     * @param time - contains parameter to handle session time
     */
    addTimeToSession(time: any): void;
}
declare const socketController: SocketController;
//# sourceMappingURL=socket-controller.d.ts.map