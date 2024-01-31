import CalculateChecksum from "./DeckChecksum";
import Logger from "../Logger";
import { DeckValidate, DeckValidateArda } from "../plugins/Types";

export default class Player
{
    #waiting = false;
    #joined = false;
    #socket: any = null;
    #visitor = false;
    #player_access_token_once = Date.now();
    #avatar = "";

    #deckChecksum: string;
    #admin: boolean;
    #name: string;
    #deck: DeckValidate|DeckValidateArda|null;
    #timestamp: number;
    
    constructor(displayname:string, jDeck:DeckValidate|DeckValidateArda, isAdmin:boolean, timeAdded:number)
    {
        this.#name = displayname;
        this.#deck = jDeck;
        this.#deckChecksum = CalculateChecksum(jDeck);
        this.#admin = isAdmin;
        this.#timestamp = timeAdded;
    }

    getAvatar()
    {
        return this.#avatar;
    }

    setAvatar(sAva:any)
    {
        if (typeof sAva === "string" && sAva !== "")
            this.#avatar = sAva;
    }

    isConnected()
    {
        return this.#socket !== null && this.#socket.connected === true;
    }

    onJoin()
    {
        this.#joined = true;
        this.#deck = null; /** the deck is only needed once */
    }

    setAccessToken(lToken:number)
    {
        this.#player_access_token_once = lToken;
    }

    disconnect()
    {
        try
        {
            if (this.#socket !== null)
                this.#socket.leave(this.#socket.room);

            if (this.isConnected())
            {
                this.#socket.disconnect(true);
                this.#socket = null;
            }
        }
        catch (err)
        {
            Logger.error(err);
        }

    }

    reconnect(socket:any, room:string)
    {
        this.disconnect();
        
        this.#socket = socket;
        this.#socket.join(room);
    }

    getName()
    {
        return this.#name;
    }

    getDeck()
    {
        return this.#deck;
    }

    isAdmin()
    {
        return this.#admin;
    }

    isWaiting()
    {
        return this.#waiting;
    }

    setWaiting(b:boolean)
    {
        this.#waiting = b;
    }

    getTimestamp()
    {
        return this.#timestamp;
    }

    setTimestamp(lTime:number)
    {
        this.#timestamp = lTime;
    }

    hasJoined()
    {
        return this.#joined;
    }

    getSocket()
    {
        return this.#socket;
    }

    isVisitor()
    {
        return this.#visitor;
    }

    getAccessToken()
    {
        return this.#player_access_token_once;
    }

    getDeckChecksum()
    {
        return this.#deckChecksum;
    }
}

