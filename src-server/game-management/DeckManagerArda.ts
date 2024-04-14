import DeckManager from "./DeckManager";
import HandManagerArda from "./HandManagerArda";
import DeckArda, { DeckSingleplayer } from "./DeckArda";
import HandManager from "./HandManager";
import { PlaydeckStandard } from "../plugins/Types";
import DeckDefault from "./DeckDefault";

export default class DeckManagerArda extends DeckManager 
{

    #adminUserId = "";
    #poolGame:{ [uuid:string] : number} = { };

    getAdminDeck():DeckArda|null
    {
        return super.getPlayerDeck(this.#adminUserId) as DeckArda;
    }

    newDeckInstance(playerId:string)
    {
        return new DeckArda(playerId);
    }

    creatHandManager():HandManager
    {
        return new HandManagerArda(this);
    }

    isArda()
    {
        return true;
    }

    restore(decks:any)
    {
        super.restore(decks);

        for (let key of Object.keys(decks.deck))
        {
            if (decks.deck[key].ishost === false)
                this.updateDeckData(key, this.#adminUserId)
        }

        return true;
    }

    addDeck(playerId:string, jsonDeck:PlaydeckStandard):DeckDefault|DeckArda
    {
        if (super.deckCount() === 0)
        {
            for (let _key in jsonDeck["pool"])
                this.#poolGame[_key] = jsonDeck["pool"][_key];
        }
        else
        {
            jsonDeck["pool"] = { };
            for (let _key in this.#poolGame)
                jsonDeck["pool"][_key] = this.#poolGame[_key];
        }

        const pDeck = super.addDeck(playerId, jsonDeck);
        if (super.deckCount() === 1)
        {
            this.#adminUserId = playerId;

            /** all players share the same minor item hand */
            if (!this.isSinglePlayer())
                this.drawMinorItems(playerId, 4);

            pDeck.shuffleCommons();
        }
        else
        {
            this.updateDeckData(playerId, this.#adminUserId);
        }

        /** every player draws their own MP hand */
        if (!this.isSinglePlayer())    
        {
            this.#drawMarshallingPoints(playerId, 5)
            this.drawStage(playerId, 5)
        }

        return pDeck;
    }

    drawMinorItems(playerId:string, nCount:number)
    {
        const deckSource = this.getPlayerDeck(playerId) as DeckArda;
        if (deckSource !== null)
        {
            for (let i = 0; i < nCount; i++)
                deckSource.drawCardMinorItems();
        }
    }

    #drawMarshallingPoints(playerId:string, nCount:number)
    {
        const deckSource = this.getPlayerDeck(playerId) as DeckArda;
        if (deckSource !== null)
        {
            for (let i = 0; i < nCount; i++)
                deckSource.drawCardMarshallingPoints();
        }
    }

    drawStage(playerId:string, nCount:number)
    {
        const deckSource = this.getPlayerDeck(playerId) as DeckArda;
        if (deckSource !== null)
        {
            for (let i = 0; i < nCount; i++)
                deckSource.drawCardStage();
        }
    }

    updateDeckData(playerId:string, adminId:string)
    {
        const _deckPlayer = this.getPlayerDeck(playerId) as DeckArda;
        if (_deckPlayer !== null)
            _deckPlayer.updateListReferences(this.getPlayerDeck(adminId) as DeckArda);
    }
}

export class DeckManagerSinglePlayer extends DeckManagerArda 
{
    newDeckInstance(playerId:string)
    {
        return new DeckSingleplayer(playerId);
    }

    isSinglePlayer()
    {
        return true;
    }
}
