
export default class AuthenticationManagement {

    static #userManager:any = null;

    static triggerAuthenticationProcess(socket:any)
    {
        if (socket && AuthenticationManagement.#userManager)
        {
            AuthenticationManagement.#addGenericRoutes(socket);
            socket.on("/authenticate", () => socket.emit("/authenticate/success", {}));
        }
    }

    static setUserManager(pUserManager:any) 
    {
        if (pUserManager !== null)
            AuthenticationManagement.#userManager = pUserManager;
    }
    
    /**
     * Add generic routes to a socket
     * @param {Object} socket
     * @return {void}
     */
    static #addGenericRoutes(socket:any)
    {
        // when the client emits 'new message', this listens and executes
        socket.on("/game/chat/message", (data:any) => AuthenticationManagement.#userManager.onNewMessage(socket, data));
        socket.on("/game/chat/text", (data:any) => AuthenticationManagement.#userManager.onNewMessageText(socket, data));
        socket.on("/game/chat/predefined", (data:any) => AuthenticationManagement.#userManager.onNewMessagePredef(socket, data));
        
        socket.on("/game/finalscore", () => AuthenticationManagement.#userManager.sendFinalScore(socket.room));
        
        socket.on("/game/quit", () => {
            AuthenticationManagement.#userManager.leaveGame(socket.userid, socket.room);
            AuthenticationManagement.#userManager.endGame(socket.room);
        });

        /**
         * Player enters the table and is ready to
         * receive the board
         */
        socket.on('/game/rejoin/immediately', (data:any) =>
        {
            if (!AuthenticationManagement.#userManager.rejoinAfterBreak(data.userid, data.room, socket))
            {
                socket.auth = false;
                socket.disconnect("cannot rejoin");
            }
        });

        socket.on("/game/rejoin/reconnected", (data:any) =>
        {
            /* make sure the socket userid exists after the reconnect */
            if (socket.userid === undefined && data.userid)
                socket.userid = data.userid;

            if (!AuthenticationManagement.#userManager.rejoinAfterReconnect(data.userid, data.room, socket))
            {
                socket.auth = false;
                socket.disconnect("cannot reconnect");
            }
        });

        /**
         * Player is now at their table
         */
        socket.on('/game/rejoin', () => { });
    }

}