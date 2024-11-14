import DeckDefault, { IRegisterGameCard } from "./DeckDefault";
import Logger from "../Logger";
import DeckArda from "./DeckArda";
import { TDeckCard, TDeckCardMap } from "./DeckCommons";
import { PlaydeckStandard } from "../plugins/Types";
import HandManager from "./HandManager";
import HandManagerArda from "./HandManagerArda";

interface ICardState {
    value: number
}
const CARD_STATE = {
    ready: 0,
    tapped: 90,
    tapped_fixed: 91,
    wounded: 180,
    rot270: 270
 };

export interface IDecks {
    [id:string]: DeckDefault|DeckArda
}

interface ISiteTappeds {
    [player:string]: {
        [code:string]:boolean
    }
}

export default class DeckManager {

    #uuid_count = 0;
    #cardMap:TDeckCardMap = { };
    #siteMap:ISiteTappeds = { };
    #deck:IDecks = { };
    #handManager:HandManager|null = null;
    #firstPlayerId = "";

    getAdminDeck():DeckArda|null
    {
        return null;
    }

    getDecks()
    {
        return this.#deck;
    }

    save()
    {
        const jData:any = 
        {
            admin : this.#firstPlayerId,
            uuid_count : this.#uuid_count,
            cardMap : this.#cardMap,
            siteMap : this.#siteMap,
            deck : { } // => DeckDefault|DeckArda
        };

       
        for (let key in this.#deck) 
            jData.deck[key] = this.#deck[key].save(this.#firstPlayerId === key);

        return jData;
    }

    size(playerid:string)
    {
        if (playerid == undefined || this.#deck[playerid] === undefined)
            return null;
        else
            return this.#deck[playerid].size();
    }

    restoreCardMap(data:TDeckCardMap)
    {
        if (data === null || data === undefined)
            return;

        this.#cardMap = { };
        
        let countError = 0;
        for (let key of Object.keys(data))
        {
            const _card = DeckDefault.cloneCardEntry(data[key]);
            if (_card !== null)
                this.#cardMap[key] = _card;
            else
                countError++;
        }

        if (countError > 0)
            throw new Error("Cannot duplicate " + countError + " card(s).");
    }

    restoreSiteMap(data:any)
    {
        this.#siteMap = { };

        if (data === null || data === undefined)
            return;

        for (let key of Object.keys(data))
        {
            this.#siteMap[key] = {};

            let _site = data[key];
            for (let site of Object.keys(_site))
                this.#siteMap[key][site] = _site[site] === true;
        }
    }

    restoreDeck(decks:any, requireAdmin:boolean)
    {
        for (let key of Object.keys(decks.deck))
        {
            if (decks.deck[key].ishost === requireAdmin)
            {
                let deck = this.newDeckInstance(key);
                deck.restore(decks.deck[key]);
                this.#deck[key] = deck;
            }
        }
    }

    preprocessRestore(decks:any)
    {
        for (let key of Object.keys(decks.deck))
        {
            if (decks.deck[key].ishost === undefined)
                decks.deck[key].ishost = false;
        }
    }

    restore(decks:any)
    {
        this.reset();
        this.restoreCardMap(decks.cardMap);
        this.restoreSiteMap(decks.siteMap);

        this.preprocessRestore(decks);

        Logger.info("restore HOST deck");
        this.restoreDeck(decks, true);

        Logger.info("restore GUEST deck(s)");
        this.restoreDeck(decks, false);

        this.#uuid_count = Date.now();
        return true;
    }

    creatHandManager() : HandManager|HandManagerArda
    {
        throw new Error("please overwrite!");
    }

    isArda()
    {
        return false;
    }
    
    isSinglePlayer()
    {
        return false;
    }

    reset()
    {
        this.#uuid_count = 0;
        this.#cardMap = { };
        this.#deck = { };
    }
    
    getPlayers()
    {
        return Object.keys(this.#deck);
    }
    
    newDeckInstance(_playerId:string) : DeckDefault|DeckArda
    {
        throw new Error("Overwrite newDeckInstance");
    }

    addDeck(playerId:string, jsonDeck:PlaydeckStandard):DeckDefault|DeckArda
    {
        const deck = this.newDeckInstance(playerId)
        deck.addDeck(jsonDeck, this.#cardMap);
        deck.shuffle();
        this.#deck[playerId] = deck;

        if (this.#firstPlayerId === "")
            this.#firstPlayerId = playerId;

        return deck;
    }

    getFirstPlayerId()
    {
        return this.#firstPlayerId;
    }

    deckCount()
    {
        return Object.keys(this.#deck).length;
    }
    
    addCardsToSideboardDuringGame(playerId:string, jsonDeck:IRegisterGameCard[])
    {
        if (typeof this.#deck[playerId] === "undefined")
            Logger.info("Could not find deck " + playerId);

        return typeof this.#deck[playerId] === "undefined" ? -1 : this.#deck[playerId].registerCardsToSideboard(jsonDeck, this.#cardMap);
    }

    importCardsToHand(playerId:string, code:string, bAsCharacter:boolean)
    {
        if (typeof this.#deck[playerId] === "undefined")
        {
            Logger.info("Could not find deck " + playerId);
            return false;
        }
        else if (code === "")
        {
            Logger.info("Invalid code provded.");
            return false;
        }
        else
            return this.#deck[playerId].importCardsToHand(code, bAsCharacter, this.#cardMap);

    }

    importCardsToGame(playerId:string, code:string, bAsCharacter:boolean)
    {
        if (typeof this.#deck[playerId] === "undefined" || code === "")
            return "";
        else
            return this.#deck[playerId].importCardsToDeck(code, bAsCharacter, this.#cardMap);
    }

    updateCardType(uuid:string)
    {
        const entry = this.#cardMap[uuid];
        if (entry === undefined)
            return null;

        if (entry.type === "character" && !entry.tmpType)
            return entry; 
        
        if (entry.type !== "character")
        {
            entry.tmpType = entry.type;
            entry.tmpSecondary = entry.secondary;

            entry.type = "character";
            entry.secondary = "character";
        }
        else if (entry.tmpSecondary && entry.tmpType)
        {
            entry.tmpType = entry.type;
            entry.tmpSecondary = entry.secondary;

            entry.type = entry.tmpType;
            entry.secondary = entry.tmpSecondary;

            delete entry.tmpType;
            delete entry.tmpSecondary;
        }

        return entry;
    }

    getCards() 
    {
        if (this.#handManager === null)
            this.#handManager = this.creatHandManager();
        
        return this.#handManager;
    }

    getPlayerDeck(playerId:string):DeckDefault|DeckArda|null
    {
        if (typeof this.#deck[playerId] === "undefined")
        {
            Logger.warn("Cannot find deck of player " + playerId);
            return null;
        }
        else
            return this.#deck[playerId];
    }

    flipCard(uuid:string)
    {
        if (typeof this.#cardMap[uuid] === "undefined")
            return false;

        if (this.#cardMap[uuid].revealed === undefined)
            this.#cardMap[uuid].revealed = true;
        else
            this.#cardMap[uuid].revealed = !this.#cardMap[uuid].revealed;
        
        return this.#cardMap[uuid].revealed;
    }

    #clearSitesTappedByPlaer(playerId:string)
    {
        if (typeof playerId !== "undefined" && typeof this.#siteMap[playerId] !== "undefined")
        {
            this.#siteMap[playerId] = {};
            Logger.info("cleared tapped sites.")
        }
    }
    
    #tapSiteState(playerId:string, code:string, bTapped:boolean)
    {
        if (typeof this.#siteMap[playerId] === "undefined")
            this.#siteMap[playerId] = {};
        
        if (bTapped && typeof this.#siteMap[playerId][code] === "undefined")
            this.#siteMap[playerId][code] = true;
        else if (!bTapped && typeof this.#siteMap[playerId][code] !== "undefined")
            delete this.#siteMap[playerId][code];
    }
    
    #siteIsTapped(playerId:string, code:string)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof code === "undefined" || code === "")
            return false;
        else
            return typeof this.#siteMap[playerId] !== "undefined" && typeof this.#siteMap[playerId][code] !== "undefined";
    }

    #getTappedSites(playerId:string)
    {
        if (typeof playerId === "undefined" || playerId === "" || typeof this.#siteMap[playerId] === "undefined")
            return { };
        else
            return  this.#siteMap[playerId];
    }

    #setCardState(uuid:string, nState:number)
    {
        if (typeof this.#cardMap[uuid] === "undefined")
            return -1;
        else
        {
            this.#cardMap[uuid].state = nState;
            return nState;
        }
    }

    #isCardState(uuid:string, nState:number)
    {
        if (typeof this.#cardMap[uuid] === "undefined")
            return false;
        else
            return this.#cardMap[uuid].state === nState;
    }

    getCharacters(playerid:string):string[]
    {
        if (playerid === undefined || playerid === "")
            return [];
        
        const codes:string[] = [];
        Object.keys(this.#cardMap).forEach(uuid => 
        {
            const card = this.#cardMap[uuid];
            if (card.owner === playerid && (card.type === "character" || card.type === "avatar") && !codes.includes(card.code))
                codes.push(card.code);
        })

        return codes;
    }

    tapCard(uuid:string)
    {
        return this.#setCardState(uuid, CARD_STATE.tapped);
    }

    woundCard(uuid:string)
    {
        return this.#setCardState(uuid, CARD_STATE.wounded);
    }

    tapCardFixed(uuid:string)
    {
        return this.#setCardState(uuid, CARD_STATE.tapped_fixed);
    }

    readySite(playerId:string, code:string)
    {
        return this.#tapSiteState(playerId, code, false);
    }
    
    clearPlayerSites(playerId:string)
    {
        return this.#clearSitesTappedByPlaer(playerId);
    }
    
    tapSite(playerId:string, code:string)
    {
        return this.#tapSiteState(playerId, code, true);
    }
    
    siteIsTapped(playerId:string, code:string)
    {
        return this.#siteIsTapped(playerId, code);
    }

    getTappedSites(playerId:string)
    {
        return this.#getTappedSites(playerId);
    }
    
    readyCard(uuid:string)
    {
        return this.#setCardState(uuid, CARD_STATE.ready);
    }
    triceTapCard(uuid:string)
    {
        return this.#setCardState(uuid, CARD_STATE.rot270);
    }

    isStateWounded (uuid:string)
    {
        return this.#isCardState(uuid, CARD_STATE.wounded);
    }

    isStateTapped(uuid:string)
    {
        return this.#isCardState(uuid, CARD_STATE.tapped);
    }

    getFullPlayerCard(uuid:string):TDeckCard|null
    {
        if (uuid === "" || typeof this.#cardMap[uuid] === "undefined")
        {
            if (uuid !== "_site")
                Logger.warn("Cannot find card by uuid " + uuid);
                
            return null;
        }
        else
            return this.#cardMap[uuid];
    }
    updateTokenMP(uuid:string, bAdd:boolean)
    {
        const card = this.getFullPlayerCard(uuid);
        if (card === null)
            return -1;

        if (card.tokenMP === undefined)
            card.tokenMP = 0;

        if (bAdd)
            card.tokenMP++;
        else if (card.tokenMP > 0)
            card.tokenMP--;

        return card.tokenMP;
    
    }
    updateToken(uuid:string, bAdd:boolean)
    {
        const card = this.getFullPlayerCard(uuid);
        if (card === null)
            return -1;

        if (card.token === undefined)
            card.token = 0;

        if (bAdd)
            card.token++;
        else if (card.token > 0)
            card.token--;

        return card.token;
    }

    dumpCards(_playerId:string)
    {
        /** deprecated */
    }
}

