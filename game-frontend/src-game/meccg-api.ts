import Dictionary from "./utils/dictionary";
import { PageRefreshInfo } from "./question/PageRefreshInfo";
import Question from "./question/question";

declare const g_sDisplayName:string;
declare const g_lTimeJoined:number;
declare const g_sRoom:string;
declare const g_sUserId:string;
declare const g_sApiKey:string;
declare const g_sLobbyToken:string;
declare const io:Function;

class MeccgPlayers {

    static myId:string = g_sUserId ?? "";

    static room = "";
    static _interval:any = null;
    static usermap:any = null;
    static avatarmap:any = null;
    static _isMyTurn = true;
    static playerSequenceList:any = [];

    static getUserMap()
    {
        return MeccgPlayers.usermap;
    }

    static findPrevPlayer(currentId:string, listIds:string[])
    {
        if (listIds.length < 2)
            return "";

        let prevId = listIds[listIds.length-1];
        for (let id of listIds)
        {
            if (id === currentId)
                break;

            prevId = id;
        }

        return prevId;
    }

    static getHazardPlayer(currentPlayer:string)
    {
        const id = MeccgPlayers.findPrevPlayer(currentPlayer, MeccgPlayers.playerSequenceList);
        return {
            id: id, 
            isMe: MeccgPlayers.isChallenger(id)
        };
    }

    static getAvatarMap()
    {
        return MeccgPlayers.avatarmap;
    }

    static isChallenger(sid:string)
    {
        return MeccgPlayers.myId === sid;
    }

    static getChallengerId()
    {
        return MeccgPlayers.myId;
    }

    static setMyTurn(bIsMyTurn:boolean)
    {
        MeccgPlayers._isMyTurn = bIsMyTurn;
    }

    static isMyTurn()
    {
        return MeccgPlayers._isMyTurn === true;
    }

    static visitorAddNameToOpponent(e:any)
    {
        const id = e.detail.id;
        const player = e.detail.player;

        if (id === "" || id === undefined || player === "" || player === undefined || MeccgPlayers.usermap[player] === undefined)
            return;

        const elem = document.getElementById(id);
        if (elem !== null)
            elem.setAttribute("title", MeccgPlayers.usermap[player]);
    }

    /**
     * Set the user map
     * 
     * @param {Boolean} _bIsMe 
     * @param {Map} jMap 
     */
    static  setPlayerNames(_bIsMe:boolean, jMap:any)
    {
        if (MeccgPlayers.usermap === null)
        {
            MeccgPlayers.usermap = jMap.names;
            MeccgPlayers.avatarmap = jMap.avatars;
            
            if (Array.isArray(jMap.listOrder))
                MeccgPlayers.playerSequenceList = jMap.listOrder;

            MeccgPlayers.onPlayerListReceived();
        }
    }

    static getPlayers()
    {
        return MeccgPlayers.usermap;
    }

    static getPlayerDisplayName(sId:string)
    {
        if (sId === null || typeof sId === "undefined" || sId === "" || typeof MeccgPlayers.usermap[sId] === "undefined")
            return "(unknown)";
        else if (sId === "Game")
            return "Game";
        else
            return MeccgPlayers.usermap[sId];
    }

    /**
     * Add a player once the game has already started
     * 
     * @param {JSON} jData 
     * @returns 
     */
    static addPlayer(_bIsMe:boolean, jData:any)
    {
        if (MeccgPlayers.usermap !== null && MeccgPlayers.usermap[jData.userid] === undefined)
        {            
            MeccgPlayers.usermap[jData.userid] = jData.name;
            MeccgPlayers.avatarmap[jData.userid] = jData.avatar;

            if (!MeccgPlayers.playerSequenceList.includes(jData.userid))
                MeccgPlayers.playerSequenceList.push(jData.userid);

            MeccgPlayers.onPlayerListReceived();
        }
    }

    static rearrangePlayers(_bIsMe:boolean, jData:any)
    {
        const list = jData.list;
        if (Array.isArray(list) && list.length > 0)
            document.body.dispatchEvent(new CustomEvent("meccg-players-reorder", { "detail": list}));
    }

    static onPlayerListReceived()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-players-updated", { "detail": {
            challengerId : MeccgPlayers.getChallengerId(),
            map : MeccgPlayers.usermap,
            avatars: MeccgPlayers.avatarmap,
            order: MeccgPlayers.playerSequenceList
        }}));
    }

    static onChatMessage(bIsMe:boolean, jData:any)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
            name : MeccgPlayers.getPlayerDisplayName(jData.userid),
            message : jData.message,
            id: jData.id,
            usertext: jData.usertext ?? "",
            isMe: bIsMe
        }}));
    }

    static onDocumentReady()
    {
        MeccgApi.addListener("/game/set-player-names", MeccgPlayers.setPlayerNames.bind(MeccgPlayers));
        MeccgApi.addListener("/game/player/add", MeccgPlayers.addPlayer.bind(MeccgPlayers));
        MeccgApi.addListener("/game/chat/message", MeccgPlayers.onChatMessage.bind(MeccgPlayers));
        MeccgApi.addListener("/game/players/reorder", MeccgPlayers.rearrangePlayers.bind(MeccgPlayers));
    }

    static isMyCard(owner:string)
    {
        return owner && MeccgPlayers.myId === owner;
    }
};

class MeccgApi
{
    static _routes:any = {};
    static _socket:any = null;
    static _reconnecting:any = false;
    static _ignoreDisconnection:any = false;
    static room:string = "";
    static _interval:any = null;
    static usermap:any = null;
    static isConnected = false;
    static _disconnectInfo = new PageRefreshInfo();
    
    static isMe(sid:string)
    {
        return MeccgPlayers.isChallenger(sid);
    }
    
    static getTimeJoined()
    {
        return g_lTimeJoined;
    }

    static socketIsConnected()
    {
        return MeccgApi._socket !== null && MeccgApi._socket.connected;
    }

    static send(path:string, message:any = "")
    {
        if (path === "")
            return false;

        if (typeof message === "undefined")
            message = "";

        try
        {
            if (MeccgApi.socketIsConnected() && MeccgApi._socket)
                MeccgApi._socket.emit(path, message);
            
            return true;
        }
        catch (error)
        {
            console.error(error);
        }

        return false;
    }

    static expectDisconnect()
    {
        MeccgApi._ignoreDisconnection = true;
    }
    
    static expectShutdown()
    {
        MeccgApi.expectDisconnect();
    }
    
    static onQuitGame()
    {
        MeccgApi.expectDisconnect();
        MeccgApi._socket.close();
        MeccgApi._socket = null;
    }
    
    static disconnect()
    {       
        MeccgApi.expectDisconnect();
        setTimeout(() => MeccgApi._socket.emit("/game/quit", {}), 1000);
        setTimeout(MeccgApi.onQuitGame, 5000);
    }
    
    static _paths:any = {
        
    }

    static addListener(path:string, callbackFunction:Function)
    {
        if (path !== "")
            MeccgApi._paths[path] = callbackFunction;
    }

    static initSocketPaths()
    {
        for (let path in MeccgApi._paths)
            MeccgApi.initSocketPath(path);
    }

    static initSocketPath(path:string)
    {
        MeccgApi._socket.on(path, (data:any) =>
        {
            const bIsMe = typeof data.target !== "undefined" && MeccgPlayers.isChallenger(data.target)
            const payload = typeof data.target === "undefined" ? {} : data.payload;

            try
            {
                MeccgApi._paths[path](bIsMe, payload);
            }
            catch(e)
            {
                console.error(path);
                console.error(e);
            }
        });
    }
    
    static getOneTimeAccessToken()
    {
        const lToken = parseInt(document.getElementById("interface")?.getAttribute("data-time") ?? "0");
        document.getElementById("interface")?.setAttribute("data-time", "0");
        return lToken;
    }
    
    static onConnected()
    {
        if (!MeccgApi._ignoreDisconnection)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("api_reconnected", "Reconnected.") }));

        document.body.dispatchEvent(new CustomEvent("meccg-connected", { "detail": true }));
    }

    static onReconnected()
    {
        /** deprecated */
    }
    
    static onDisconnected()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-disconnected", { "detail": true }));
    }

    static onAuthenticationSuccess()
    {
        if (MeccgApi.isConnected)
            return;

        const sUser = g_sDisplayName;
        const sUserUUID = g_sUserId;
        const sRoom = g_sRoom;

        MeccgApi.isConnected = true;
        MeccgApi.send("/game/rejoin/immediately", { username: sUser, userid : sUserUUID, room: sRoom });

        document.body.dispatchEvent(new CustomEvent("meccg-api-ready", { "detail": true }));
    }

    static onReconnectionSuccess()
    {
        MeccgApi.send("/game/rejoin/reconnected", { userid : g_sUserId, room: g_sRoom });
    }

    static setupSocketConnection()
    {
        MeccgApi.isConnected = false;
        MeccgApi._socket = io(window.location.host, 
        {
            reconnection: false,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 4000,
            reconnectionAttempts: 5,
            timeout: 2000,
            auth: {
                authorization: g_sApiKey,
                room: g_sRoom,
                userId : g_sUserId,
                joined: g_lTimeJoined,
                username: g_sDisplayName,
                player_access_token_once: MeccgApi.getOneTimeAccessToken()
            }
        });

        MeccgApi.initSocketPaths();

        MeccgApi._socket.on("connect", () => {
            if (!MeccgApi._reconnecting)
                MeccgApi.onAuthenticationSuccess();
            else
                MeccgApi.onReconnectionSuccess();
        });

        MeccgApi._socket.on("/game/rejoin/reconnected/success", MeccgApi.onReconnectionCompleted);

        MeccgApi._socket.on("error", MeccgApi.onSocketError.bind(MeccgApi));
        MeccgApi._socket.on("connect_error", MeccgApi.onSocketError.bind(MeccgApi));

        MeccgApi._socket.on('/authenticate/success', MeccgApi.onAuthenticationSuccess.bind(MeccgApi));
        MeccgApi._socket.on('/disconnect/shutdown', MeccgApi.expectShutdown);
        MeccgApi._socket.on('disconnect', (reason:any) => 
        {
            MeccgApi.onDisconnected();

            if (MeccgApi._ignoreDisconnection || reason === "io server disconnect" || reason === "io client disconnect")
            {
                MeccgApi.disconnectSocket();
                return;
            }

            if (typeof reason === "undefined")
                reason = "";

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "notify" }));
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": Dictionary.get("api_connectionlost", "Connection to server lost -") + " " + reason + ". " + Dictionary.get("api_recon", "Reconnecting in 1 second") }));
        
            setTimeout(MeccgApi.triggerReconnection.bind(MeccgApi), 1000);
            setTimeout(MeccgApi.verifyReconnected.bind(MeccgApi), 1000 * 10)
        });
    }

    static onReconnectionCompleted()
    {
        MeccgApi.isConnected = true;
        MeccgApi._disconnectInfo.abort();

        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": Dictionary.get("api_reconnected", "Reconnected.") }));
    }

    static triggerReconnection()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": Dictionary.get("api_reconnecting", "Reconnecting...") }));
        MeccgApi._reconnecting = true;
        MeccgApi._socket.connect();
    }

    static verifyReconnected()
    {
        if (MeccgApi.socketIsConnected())
            MeccgApi._disconnectInfo.abort();
        else
            MeccgApi._disconnectInfo.show("");
    }

    static onSocketError(error:any)
    {
        console.error(error);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": error.name + ': ' + error.message }));
    }

    static onDocumentReady()
    {  
        if (g_sUserId === "" || g_sApiKey === "")
        {
            console.error("neither user nor token available");
            return;
        }

        setTimeout(MeccgApi.checkIfConnected.bind(MeccgApi), 5000);
      
        MeccgApi.setupSocketConnection();
   
        MeccgApi.emitRegisterToServer();

        if (MeccgApi.getConnectionCount() === 0)
            MeccgApi.clearLocalStorage();
    }

    static clearLocalStorage()
    {
        try
        {
            localStorage.removeItem("meccg_map_settings");
            
            if (sessionStorage.getItem("meccg_turn_stats"))
                sessionStorage.removeItem("meccg_turn_stats");

            if (sessionStorage.getItem("show_sitemarker"))
                sessionStorage.removeItem("show_sitemarker");
            
            if (sessionStorage.getItem("meccg_autosave"))
                sessionStorage.removeItem("meccg_autosave");
        }
        catch (errIgnore)
        {

        }
    }

    static getConnectionCount()
    {
        try
        {
            const val = document.body.getAttribute("data-connected-count");
            if (val !== null && val !== "")
                return parseInt(val);
        }
        catch (err)
        {
            console.error(err);            
        }

        return 0;
    }

    /**
     * Check if the connection was established and everything was successfully
     * setup.
     * 
     * If not, show "not connected" screen and offer refresh
     */
    static checkIfConnected()
    {
        if(!MeccgApi.isConnected || MeccgApi._socket.connected !== true)
            MeccgApi._disconnectInfo.show("");
    }

    static emitRegisterToServer()
    {
        /** so do the login */
        MeccgApi._socket.emit("/authenticate", { });
    }

    static forceEndGame()
    {
        MeccgApi.expectDisconnect();
        MeccgApi.send("/game/finalscore", {});
    }
    
    static queryEndGame()
    {
        new Question("fa-sign-out")
            .onOk(MeccgApi.forceEndGame)
            .show(
                Dictionary.get("api_endgame_q", "Do you want to end this game?"), 
                Dictionary.get("api_endgame_t", "Let's see the final scorings."), 
                Dictionary.get("api_endgame_a", "End this game")
            );
    }

    static  disconnectSocket()
    {
        try
        {
            MeccgApi._socket.disconnect();
        }
        catch (err)
        {
            console.error(err);
        }
    }
};

document.body.addEventListener("meccg-query-end-game", MeccgApi.queryEndGame.bind(MeccgApi), false);
document.body.addEventListener("meccg-foce-end-game", MeccgApi.forceEndGame.bind(MeccgApi), false);
document.body.addEventListener("meccg-api-init", () => {
    MeccgPlayers.onDocumentReady();
    MeccgApi.onDocumentReady();
}, false);

document.body.addEventListener("meccg-visitor-addname", MeccgPlayers.visitorAddNameToOpponent.bind(MeccgPlayers), false);

export { MeccgPlayers }
export default MeccgApi;

export function InitMeccgApi() {
    /** allow module import */
}