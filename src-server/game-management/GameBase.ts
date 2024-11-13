import Logger from "../Logger";
import * as EventManager from "../EventManager"
import GameAPI from "./GameAPI";
import Chat from "./Chat";
import { IRegisterGameCard } from "./DeckDefault";
import { TDeckCard } from "./DeckCommons";
import PlayboardManagerArda from "./PlayboardManagerArda";
import PlayboardManager from "./PlayboardManager";

type GameApis = {
    chat: Chat,
    meccgApi: GameAPI
};

export default class GameBase {

    #playboardManager:PlayboardManagerArda|PlayboardManager;

    #adminUser = "";
    #player_phase =  "start";
    #created = Date.now();
    #bSingle = false;
    #started = -1;

    #apis:GameApis;

    constructor(pMeccgApi:GameAPI, pChat:Chat, pPlayboardManager:PlayboardManagerArda|PlayboardManager)
    {
        this.#apis = {
            chat : pChat,
            meccgApi : pMeccgApi
        };

        this.#playboardManager = pPlayboardManager;
    }

    globalRestoreGame(_userid:string, _socket:any, data:any)
    {
        if (typeof data.game.meta.gameduration === "undefined" || isNaN(data.game.meta.gameduration))
            return;

        try
        {
            this.#created -= parseInt(data.game.meta.gameduration);
        }
        catch (err)
        {
            Logger.error(err);
        }
    }            

    getGameCreated()
    {
        return this.#created;
    }

    getGameDuration()
    {
        return Date.now() - this.#created;
    }

    restorePlayerPhase(phase:string, _turn:string|number, _current:string)
    {
        this.#player_phase = phase;
    }

    getMeccgApi()
    {
        return this.#apis.meccgApi;
    }

    getPlayboardManager()
    {
        return this.#playboardManager;
    }

    save()
    {
        let data:any = {};

        data.meta = {
            phase : this.#player_phase,
            admin : this.#adminUser,
            arda : this.isArda(),
            gameduration: this.getGameDuration(),
            players : null
        };
        
        data.playboard = this.getPlayboardManager().Save();
        return data;
    }

    getCardCode(uuid:string, sDefault:string)
    {
        const card = this.getPlayboardManager().GetCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    getCharacterCode(uuid:string, sDefault:string)
    {
        const card = this.getPlayboardManager().GetCharacterCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    getPlayboardDataObject()
    {
        return this.#playboardManager.GetData();
    }

    getFirstCompanyCharacterCode(uuid:string, sDefault:string)
    {
        const card = this.getPlayboardManager().GetFirstCompanyCharacterCardByCompanyId(uuid);
        return card !== null ? card.code : sDefault;
    }

    setGameAdminUser(id:string)
    {
        if (id !== undefined && id !== "" && this.#adminUser === "")
            this.#adminUser = id;
    }

    reset()
    {
        if (this.getPlayboardManager() !== null)
            this.getPlayboardManager().reset();

        this.#player_phase = "start";
        this.#started = 0;
    }

    setupNewGame()
    {
        return true;
    }

    restore(playboard:any, _score:any, _meta:any)
    {
        return this.getPlayboardManager().Restore(playboard);
    }
    
    getPhase ()
    {
        return this.#player_phase;
    }

    getTappedSites(userid:string)
    {
        return this.getPlayboardManager().GetTappedSites(userid);
    }

    getGameOnline()
    {
        if (this.#started < 0)
        {
            this.#started = Date.now();
            return 0;
        }
        else
            return Date.now() - this.#started;
    }

    setPhase(sVal:string)
    {
        this.#player_phase = sVal;
    }

    dumpDeck()
    {
        /** deprecated */
    }

    getHost()
    {
        return this.#adminUser;
    }

    isSinglePlayer()
    {
        return this.#bSingle;
    }

    setSinglePlayer(bSingle:boolean)
    {
        this.#bSingle = bSingle;
    }

    isArda()
    {
        return false;
    }

    replyToPlayer(path:string, socket:any, obj:any)
    {
        this.#apis.meccgApi.reply(path, socket, obj);
    }

    publishGameLogNextPlayer(message:string)
    {
        this.#apis.chat.gameLogNextPlayer(message);
    }

    publishChat(userid:string, message:string, saveGameLog = false)
    {
        if (message !== "")
            this.#apis.chat.sendMessage(userid, message, saveGameLog);
    }

    publishToPlayers(route:string, userid:string, obj:any)
    {
        this.#apis.meccgApi.publish(route, userid, obj);
    }

    addCardsToGameDuringGame(playerId:string, cards:IRegisterGameCard[])
    {
        return this.getPlayboardManager().AddDeckCardsToSideboard(playerId, cards);
    }

    importCardDuringGame(playerId:string, code:string, bAsCharacter:boolean)
    {
        return this.getPlayboardManager().ImportCardsToHand(playerId, code, bAsCharacter);
    }

    importCardsToGame(playerId:string, code:string, bAsCharacter:boolean)
    {
        return this.getPlayboardManager().ImportCardsToGame(playerId, code, bAsCharacter);
    }

    updateCardType(uuid:string)
    {
        return this.getPlayboardManager().UpdateCardType(uuid);
    }
    
    getDeckManager()
    {
        return this.getPlayboardManager().getDecks();
    }

    getCardList(list:string[])
    {
        if (list === null || list === undefined || list.length === 0)
            return [];
        else
            return this.getPlayboardManager().getCardList(list)
    }

    updateCardOwnership(userid:string, card:TDeckCard)
    {
        if (card !== null && userid !== "")
            this.getPlayboardManager().UpdateOwnership(userid, card);
    }

    /**
     * Init game routes
     */
    init()
    {
        this.setPhase("start")
    }

    onAfterInit()
    {
        EventManager.trigger("register-game-endpoints", this.getMeccgApi());
    }

}
