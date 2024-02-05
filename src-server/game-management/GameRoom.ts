import { Server } from 'socket.io';

import * as UTILS from "../meccg-utils";
import Player from "./Player";
import Visitor from "./Visitor";
import PlayboardManager from "./PlayboardManager";
import PlayboardManagerArda from "./PlayboardManagerArda";
import Chat from "./Chat";
import GameAPI from "./GameAPI";

import GameStandard from "./GameStandard";
import GameArda from "./GameArda";

import Logger from "../Logger";

import { DeckValidate, DeckValidateArda} from '../plugins/Types';

export class GameRoom 
{
    #name:string;
    #fnEndGame:Function;

    #gameInstance : GameStandard|GameArda;
    #reconnectionCounts:{[id:string]:number} = {};
    #socialMedia = false;
    #allowAccessPlayer = true;
    #allowAccessVisitor = true;
    #useDCEbyDefault = true;
    #jitsi = false;
    #uid = UTILS.generateUuid();

    #secret = UTILS.createSecret();
    #lobbyToken = UTILS.createSecret();

    #api:GameAPI;
    #chat:Chat;

    #players:{[id:string]:Player}
    #visitors:{[id:string]:Visitor}

    constructor(api:GameAPI, chat:Chat, instance:GameStandard|GameArda, room:string, fnEndGame:Function)
    {
        this.#api = api;
        this.#chat = chat;
        this.#players = {};
        this.#visitors = {};

        this.#name = room;
        this.#fnEndGame = fnEndGame;
        this.#gameInstance = instance;
    }


    static createGame(io:Server, room:string, fnEndGame:Function, isArda:boolean, isSinglePlayer:boolean, adminUser:string)
    {       
        let pPlayboardManager;
        let gameInstance;
        const api = new GameAPI(io, room);
        const chat = new Chat(api, "/game/chat/message", room, -1);
        if (isArda || isSinglePlayer)
        {
            pPlayboardManager = new PlayboardManagerArda();
            gameInstance = new GameArda(api, chat, pPlayboardManager);
        }
        else
        {
            pPlayboardManager = new PlayboardManager();
            gameInstance = new GameStandard(api, chat, pPlayboardManager);
            
        }
        
        const pGame = new GameRoom(api, chat, gameInstance, room, fnEndGame);
        if (isSinglePlayer)
        {
            gameInstance.setSinglePlayer(true);
            pGame.#allowVisitor(false);
        }

        pPlayboardManager.triggerEventSetupNewGame();
        
        gameInstance.setCallbackOnRestoreError(fnEndGame.bind(pGame));
        gameInstance.init();
        gameInstance.onAfterInit();
        gameInstance.setGameAdminUser(adminUser);

        return pGame;
    }

    getGameUid()
    {
        return this.#uid;
    }

    setUseDCE(bUse:boolean)
    {
        this.#useDCEbyDefault = bUse === true;
    }

    setUseJitsi(bUse:boolean)
    {
        this.#jitsi = bUse;
    }

    useJitsi()
    {
        return this.#jitsi;
    }

    useDCE()
    {
        return this.#useDCEbyDefault === true;
    }

    getGameLog()
    {
        return this.#chat.hasLogData() ? this.#chat.getGameLogFile() : "";
    }

    #allowVisitor(b:boolean)
    {
        this.#allowAccessVisitor = b;
    }

    updateAccess(type:string, allow:boolean)
    {
        if (type === "visitor")
            this.#allowAccessVisitor = allow === true;
        else if (type === "player")
            this.#allowAccessPlayer = allow === true;
    }

    canJoinPlayer()
    {
        return this.#allowAccessPlayer;
    }

    canJoinVisitor()
    {
        return this.#allowAccessVisitor;
    }

    grantAccess(isPlayer:boolean)
    {
        return isPlayer ? this.#allowAccessPlayer : this.#allowAccessVisitor;
    }

    getAllowSocialMedia()
    {
        return this.#socialMedia;
    }

    setAllowSocialMedia(bAllow:boolean)
    {
        this.#socialMedia = bAllow === true;
    }

    getConnectionCount(userid:string)
    {
        if (userid === undefined || userid === "")
            return 0;
        
        if (this.#reconnectionCounts[userid] === undefined)
        {
            this.#reconnectionCounts[userid] = 0;
            return 0;
        }
        else
            return  ++this.#reconnectionCounts[userid];
    }

    getCreated()
    {
        return this.#gameInstance ===  null ? Date.now() : this.#gameInstance.getGameCreated();
    }

    getLobbyToken()
    {
        return this.#lobbyToken;
    }

    getSecret()
    {
        return this.#secret;
    }

    hasPlayer(userId:string)
    {
        return this.#players[userId] !== undefined;
    }

    getPlayers()
    {
        return this.#players;
    }

    getVisitors()
    {
        return this.#visitors;
    }

    hasVisitor(userId:string)
    {
        return this.#visitors[userId] !== undefined;
    }

    getVisitor(userId:string):Visitor|null
    {
        const val = this.#visitors[userId];
        return val === undefined ? null : val;
    }

    getPlayerCount()
    {
        return Object.keys(this.#players).length;
    }

    getVisitorCount()
    {
        return Object.keys(this.#visitors).length;
    }

    getVisitorNames():string[]
    {
        const list = [];

        for (let id of Object.keys(this.#visitors))
            list.push(this.#visitors[id].getName());

        return list;
    }

    isActive()
    {
        for (let id in this.#players)
        {
            if (this.#players[id].isConnected())
                return true;
        }

        return false;
    }

    isEmpty()
    {
        return this.getPlayerCount() === 0 || !this.isActive();
    }

    updateDice(userid:string, dice:string)
    {
        const player = this.getPlayer(userid);
        if (player !== null && this.#gameInstance !== null)
            this.#gameInstance.updateDices(userid, dice);
    }
    
    updateEntryTime(userId:string)
    {
        const lNow = Date.now();
        if (this.#players[userId] !== undefined) 
        {            
            this.#players[userId].setTimestamp(lNow);
            return lNow;
        }
        else if (this.#visitors[userId] !== undefined) 
        {
            this.#visitors[userId].setTimestamp(lNow);
            return lNow;
        }
        else
            return 0;
    }

    removePlayer(userid:string)
    {
        if (typeof userid === "string" && this.#players[userid] !== undefined)
            delete this.#players[userid];
    }

    getPlayer(userid:string)
    {
        if (userid === undefined || userid === "" || this.#players[userid] === undefined)
            return null;
        else
            return this.#players[userid];
    }

    destroy(finalScores:any)
    {   
        for (let id in this.#players)
            this.#players[id].disconnect();

        for (let id of Object.keys(this.#visitors))
            this.#visitors[id].disconnect();

        this.#chat.appendLogFinalScore(finalScores);
        this.#chat.saveGameLog();

        this.#players = {};
        this.#visitors = {};
    }

    sendMessage(userid:string, message:string)
    {
        this.#chat.sendMessage(userid, message.trim(), false)
    }

    reply(sPath:string, socket:any, data:any)
    {
        this.#api.reply(sPath, socket, data);
    }

    publish(sPath:string, player:string, data:any)
    {
        this.#api.publish(sPath, player, data);
    }

    isAccepted(userId:string) 
    {
        if (userId === undefined || userId === "")
            return null;
        else if (this.#players[userId] !== undefined || this.#visitors[userId] !== undefined)
            return true;
        else
            return null;
    }

    removeVisitor(userid:string)
    {
        const elem = this.#visitors[userid];
        if (elem !== undefined)
        {
            elem.disconnect();
            delete this.#visitors[userid];
            return true;
        }
        else
            return false;
    }

    addPlayer(userid:string, displayname:string, jDeck:DeckValidate|DeckValidateArda, isAdmin:boolean, timeAdded:number, avatar:string)
    {
        const pPlayer = new Player(displayname, jDeck, isAdmin, timeAdded);
        pPlayer.setAvatar(avatar);
        
        this.#players[userid] = pPlayer;
        this.#chat.addPlayer(userid, displayname);
    }

    addSpectator(userid:string, displayname:string, timeAdded:number)
    {
        this.#visitors[userid] = new Visitor(displayname, timeAdded);
    }

    static disconnectPlayer(socket:any)
    {
        if (socket === null || socket == undefined || socket.room === undefined || socket.room === "")
            return;
    
        try
        {
            socket.leave(socket.room);
            socket.disconnect(true);
        }
        catch (err)
        {
            console.error(err);
            Logger.error(err);
        }
    }

    forceDisconnect(_list:any)
    {
        if (_list === undefined || _list === null)
            return;

        for (let _id of Object.keys(_list))
        {
            let _player = _list[_id];
            if (_player.socket !== null)
            {
                GameRoom.disconnectPlayer(_player.socket);
                _player.socket = null;
            }
        }
    }

    getFinalGameScore()
    {
        const finalScore:any = {
            score : this.#gameInstance.getFinalScore().score,
            players : { }
        };

        for (let userid in this.#players)
            finalScore.players[userid] = this.#players[userid].getName();

        return finalScore;
    }

    endGame()
    {
        let _list = this.#players;
        this.#players = {};
        this.forceDisconnect(_list);
        
        _list = this.#visitors;
        this.#visitors = {};
        this.forceDisconnect(_list);

        try
        {
            if (typeof this.#fnEndGame === "function")
                this.#fnEndGame(this.#name);
        }
        catch(err)
        {
            console.error(err);
            Logger.error(err);
        }
    }

    getPlayerAvatarsList()
    {
        if (this.#gameInstance === null)
            return [];
        else
            return this.#gameInstance.getPlayerAvatarsList();
    }
    sendSaveOnShutdown()
    {
        let _player;
        for (let userid in this.#players)
        {
            _player = this.#players[userid];
            if (_player.isAdmin())
            {
                this.#gameInstance.publishToPlayers("/game/score/final-only", userid, this.#gameInstance.getFinalScore());
                this.#gameInstance.publishToPlayers("/disconnect/shutdown", userid, {});
                this.#gameInstance.globalSaveGame(userid, _player.getSocket());
                break;
            }
        }
    }

    getGame()
    {
        return this.#gameInstance;
    }

    initGameEndpoint(socket:any)
    {
        this.#api.initGameEndpoint(socket);
    }

}

export default function newGame(io:Server, room:string, isArda:boolean, isSinglePlayer:boolean, fnEndGame:Function, adminUser:string)
{
    if (isSinglePlayer)
        Logger.info("Setting up single player game " + room);
    else if (isArda)
        Logger.info("Setting up arda game " + room);
    else
        Logger.info("Setting up game " + room);

    return GameRoom.createGame(io, room, fnEndGame, isArda, isSinglePlayer, adminUser);
}