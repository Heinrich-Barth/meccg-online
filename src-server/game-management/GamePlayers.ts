import Logger from "../Logger";
import Scores from "./Scores";
import PlayerDices from "./PlayerDices";
import * as ResultToken from "./ResultToken";
import { CardDataProvider } from "../plugins/CardDataProvider";
import GameBase from "./GameBase";
import PlayboardManagerArda from "./PlayboardManagerArda";
import PlayboardManager from "./PlayboardManager";
import { KeyValuesString } from "../plugins/Types";
import GameAPI from "./GameAPI";
import Chat from "./Chat";
import Player from "./Player";
import * as crypto from "crypto";

type TPlayers = {
    this_player_name: string,
    this_player: string,
    ids: string[],
    names: KeyValuesString,
    avatars: KeyValuesString,
    checksums: string[],
    current: number,
    turn: number,
}

export default class GamePlayers extends GameBase
{
    #avatarImages:KeyValuesString = { };
    #avatarImageList:string[] = []
    #playerDices = new PlayerDices();
    #allowTransfers:any;
    #scoring;

    #players:TPlayers;
    
    constructor(pMeccgApi:GameAPI, pChat:Chat, pPlayboardManager:PlayboardManagerArda|PlayboardManager)
    {
        super(pMeccgApi, pChat, pPlayboardManager)        

        this.#players = {

            this_player_name: "",
            this_player: "",
            ids: [],
            names: {},
            avatars: {},
            checksums: [],
            current: 0,
            turn: 1,
        };

        this.#allowTransfers = { }

        this.#scoring = new Scores(this.isArda());
    }

    allowTransferBrowser(id:string)
    {
        const uuid = crypto.randomUUID().toString().toLocaleLowerCase();
        this.#allowTransfers[uuid] = id;
        return uuid;
    }

    allowSessionTransfer(uid:string)
    {
        if (!uid || !this.#allowTransfers[uid])
            return null;
        
        const id = this.#allowTransfers[uid];
        delete this.#allowTransfers[uid];

        const name = this.#players.names[id] ?? uid;
        return {
            id: id,
            name: name
        }
    }

    getPlayers()
    {
        return this.#players;
    }

    #reloadAvatarMap()
    {
        if (this.#avatarImageList.length > 0)
            this.#avatarImageList.splice(0, this.#avatarImageList.length);

        for (let id of Object.keys(this.#avatarImages))
        {
            const img = this.#avatarImages[id];
            if (img !== "")
                this.#avatarImageList.push(img);
        }
    }

    getPlayerAvatarsList()
    {
        return this.#avatarImageList;
    }

    getPlayerDices()
    {
        return this.#playerDices;
    }

    updateDices(userid:string, dice:string)
    {
        this.getPlayerDices().setDice(userid, dice);
    }

    joinGame(pPlayer:Player, playerId:string)
    {
        const playerName = pPlayer.getName();
        const cards = pPlayer.getDeck();
        const checksum = pPlayer.getDeckChecksum();

        if (cards === null || playerName === "" || playerId === "" || !this.setupNewGame())
            return false;
        else
        {
            this.addOpponent(playerId, playerName, checksum, pPlayer.getAvatar());
            return this.getPlayboardManager().AddDeck(playerId, cards);
        }
    }

    save()
    {
        let data:any = super.save();

        data.meta.players = {
            ids: this.#players.ids,
            names: this.#players.names,
            current : this.#players.current,
            turn: this.#players.turn,
            checksums: this.#players.checksums
        }
        
        data.scoring = this.#scoring.save();
        return data;
    }

    restorePlayerPhase(phase:string, turn:any, current:any)
    {
        super.restorePlayerPhase(phase, turn, current);

        this.#players.turn = typeof turn === "number" ? turn : parseInt(turn);
        this.#players.current = typeof current === "number" ? current : parseInt(current);
    }

    getPlayerScore(player:string)
    {
        return this.#scoring.getPlayerScore(player)
    }

    registerThisPlayer(sId:string, sName:string)
    {
        this.#players.this_player = sId;
        this.#players.this_player_name = sName;
        this.addOpponent(sId, sName, "");
    }

    addOpponent(sId:string, sName:string, checksum:string, avatar:string = "")
    {
        this.#players.ids.push(sId);
        this.#players.names[sId] = sName;

        this.setAvatar(sId, avatar);            

        if (checksum !== "")
            this.#players.checksums.push(checksum);
        this.#scoring.add(sId);
    }

    setAvatar(sId:string, avatar:string)
    {
        if (sId !== undefined && this.#players.ids.includes(sId) && avatar !== undefined && avatar !== "")
        {
            this.#players.avatars[sId] = avatar;
            this.#avatarImages[sId] = CardDataProvider.getImageByCode(avatar);

            this.#reloadAvatarMap();
            return true;
        }
        else
            return false;
    }

    getCurrentPlayerId()
    {
        return this.#players.ids[this.#players.current];
    }

    getCurrentPlayerName()
    {
        return this.#players.names[this.getCurrentPlayerId()];
    }

    moveNext()
    {
        this.#players.current++;
        if (this.#players.current >= this.#players.ids.length)
        {
            this.#players.turn++;
            this.#players.current = 0;
        }

        return this.getCurrentPlayerId();
    }

    changePlayerOrder(listIds:string[])
    {
        if (listIds.length !== this.#players.ids.length)
        {
            Logger.warn("Invalid length of new player array.");
            return false;
        }

        for (let id of this.#players.ids)
        {
            if (!listIds.includes(id))
            {
                Logger.warn("Cannot find player id in list of players... Will not change order");
                return false;
            }
        }

        const currentPlayerId = this.#players.ids[this.#players.current];

        this.#players.ids.splice(0, this.#players.ids.length);
        const len = listIds.length;
        for (let i = 0; i < len; i++)
        {
            const _id = listIds[i];
            this.#players.ids.push(_id);

            if (_id === currentPlayerId)
                this.#players.current = i;
        }

        return true;
    }

    reset()
    {
        super.reset();
        this.#players.this_player = "";
        this.#players.ids = [];
        this.#players.checksums = [];
        this.#players.current = 0;
        this.#players.turn = 1;
        this.#players.avatars = {};
        this.#avatarImages = {};
        this.#avatarImageList = [];
        this.#scoring.reset();
    }

    restoreChecksums(meta:any)
    {
        this.#players.checksums = [];

        if (typeof meta.players.checksums !== "undefined" && Array.isArray(meta.players.checksums))
        {
            for (let elem of meta.players.checksums)
            {
                if (elem !== "")
                    this.#players.checksums.push(elem);
            }
        }
    }
    restore(playboard:any, score:any, meta:any)
    {
        this.restoreChecksums(meta);
        return super.restore(playboard, score, meta) && this.#scoring.restore(score);
    }
    currentIsMe ()
    {
        return this.getCurrentPlayerId() === this.#players.this_player;
    }

    getPlayerIds()
    {
        return this.#players.ids;
    }

    getCount()
    {
        return this.#players.ids.length
    }

    getNameMap ()
    {
        return this.#players.names;
    }

    getAvatarMap()
    {
        return this.#players.avatars;
    }

    isMyTurn()
    {
        return this.currentIsMe();
    }

    nextPlayersTurn()
    {
        return this.moveNext();
    }

    removePlayer(userId:string)
    {
        const nSize = this.#players.ids.length;
        if (nSize <= 1)
            return false;

        let _ids = [];
        let players = this.#players.ids;
        let _posDel = -1;

        /** create a new array of players and exclude the player to be removed */
        const sizePlayers = players.length;
        for (let i = 0; i < sizePlayers; i++)
        {
            if (players[i] === userId)
                _posDel = i;
            else
                _ids.push(players[i]);
        }

        /** check if the player has been in the list at all */
        if (_posDel < 1)
            return false;

        /** update player id array and remove player from map */
        this.#players.ids = _ids;
        if (this.#players.names[userId] !== undefined)
            delete this.#players.names[userId];

        if (this.#players.avatars[userId] !== undefined)
            delete this.#players.avatars[userId];

        if (this.#avatarImages[userId] !== undefined)
            delete this.#avatarImages[userId];

        /** it might be that the removed player had its turn already. hence, the current player moved on place to the left */
        if (this.#players.current !== 0 && this.#players.current >= _posDel)
            this.#players.current--;

        /** all done. the player has left the game and we can now send the update */
        Logger.info("Player kicked from index list: " + userId)
        this.publishToPlayers("/game/player/remove", "", { userid: userId });
        return true;
    }

    getCurrentTurn()
    {
        return this.#players.turn;
    }

    getScoring()
    {
        return this.#scoring;
    }

    getFinalScore()
    {
        const data:any = {
            score: this.#scoring.getScoreSheets(),
            stats: this.#playerDices.getStats(),
            duration: this.getGameDuration(),
            turns: this.#players.turn,
            checksums: this.#players.checksums,
            players: this.#players.names,
            date: Date.now(),
        }

        const token = ResultToken.create(data);
        data.token = token;
        return data;
    }

    sendPlayerList()
    {
        const userid = this.getCurrentPlayerId();
        const data = {
            names: this.getNameMap(),
            avatars: this.getAvatarMap(),
            listOrder: this.getPlayerIds()
        };
        
        this.publishToPlayers("/game/set-player-names", userid, data);
        this.publishToPlayers("/game/time", userid, { time : this.getGameOnline() });
    }
}
