import Logger from "../Logger";
import DeckManager from "./DeckManager";
import DeckManagerArda from "./DeckManagerArda";

export default class HandManager 
{
    #DECKS:DeckManager|DeckManagerArda;

    constructor(pDecks:DeckManager|DeckManagerArda)
    {
        this.#DECKS = pDecks;
    }

    getPlayerDeck(playerId:string)
    {
        return this.#DECKS.getPlayerDeck(playerId);
    }

    getCardPils(playerId:string, type:string):string[]
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck === null)
        {
            Logger.info("Cannod find deck type " + type + " of player #" + playerId + " - probably a watcher.");
            return [];
        }

        const val = deck.GetDeckListPile(type);
        if (val === null)
        {
            Logger.warn("Cannod find " + type + " pile of player #" + playerId);
            return [];
        }
        else
            return val;
    }

    size(playerId:string)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck === null)
            return null;
        else
            return deck.size();
    }

    sites(playerId:string)
    {
        return this.getCardPils(playerId, "sites");
    }

    hand(playerId:string)
    {
        return this.getCardPils(playerId, "handCards");
    }

    sideboard(playerId:string)
    {
        return this.getCardPils(playerId, "sideboard");
    }

    discardpile(playerId:string)
    {
        return this.getCardPils(playerId, "discardPile");
    }

    playdeck(playerId:string)
    {
        return this.getCardPils(playerId, "playdeck");
    }

    handMarshallingPoints(_playerId:string): string[]
    {
        return [];
    }

    victory(playerId:string)
    {
        return this.getCardPils(playerId, "victory");
    }

    getShared(type:string, ignorePlayId:string):string[]
    {
        let list:string[] = [];
        for (let id of Object.keys(this.#DECKS.getDecks()))
        {
            if (id !== ignorePlayId)
                list = list.concat(this.getCardPils(id, type));
        }            

        return list;
    }

    sharedVicory(playerId:string)
    {
        return this.getShared("victory", playerId);
    }

    outofplay()
    {
        return this.getShared("outofplay", "");
    }
}


