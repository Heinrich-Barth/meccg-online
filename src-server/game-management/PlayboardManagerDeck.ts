import PlayboardManagerBase from "./PlayboardManagerBase";
import DeckManagerDefault from "./DeckManagerDefault";
import Logger from "../Logger";
import { TDeckCard } from "./DeckCommons";
import { PlaydeckStandard } from "../plugins/Types";
import DeckDefault, { IRegisterGameCard } from "./DeckDefault";

export default class PlayboardManagerDeck extends PlayboardManagerBase 
{
    #decks:DeckManagerDefault;
    
    constructor(pDeckManager:DeckManagerDefault|null = null)
    {
        super();

        this.#decks = pDeckManager ?? new DeckManagerDefault();
    }

    getDecks()
    {
        return this.#decks;
    }
    
    reset()
    {
        super.reset();
        
        if (this.#decks !== null)
            this.#decks.reset();
    }

    UpdateOwnership(playerId:string, pCard:TDeckCard):TDeckCard
    {
        if (pCard !== null && playerId !== undefined && playerId !== "")
            pCard.owner = playerId;

        return pCard;
    }
    /**
     * Get the top X cards
     * @param {String} playerId
     * @param {Integer} nCount
     * @returns {Array} List or empty list
     */
    GetTopCards(playerId:string, nCount:number)
    {
        const res:TDeckCard[] = [];

        let _card;
        const list = this.getDecks().getCards().hand(playerId);
        for (let i = 0; i < list.length && i < nCount; i++)
        {
            _card = this.getDecks().getFullPlayerCard(list[i]);
            if (_card !== null)
                res.push(this.#toPlayCard(this.UpdateOwnership(playerId, _card)));
        }

        return res;
    }

    _drawCard(playerId:string, bOnlyGetTopCard:boolean)
    {
        let _uuid = "";
        if (bOnlyGetTopCard)
        {
            const list = this.getDecks().getCards().hand(playerId);
            if (list.length > 0)
                _uuid = list[0];
        }
        else
        {
            const pDeck = this.getPlayerDeck(playerId);
            if (pDeck !== null)
            {
                if (pDeck.isEmptyPlaydeck())
                    this.getDecks().clearPlayerSites(playerId);

                _uuid = pDeck.draw();
            }
        }

        return _uuid;
    }

    #toPlayCard(_card:TDeckCard):TDeckCard
    {
        return {
            uuid: _card.uuid, 
            code: _card.code, 
            type: _card.type, 
            status: _card.status, 
            owner: _card.owner,
            state: _card.state,
            revealed: _card.revealed,
            agent: _card.agent,
            turn: _card.turn,
            stage: _card.stage,
            secondary: _card.secondary,
            unique: _card.unique,
            hoard: _card.hoard
        }
    }
    
    DrawCard(playerId:string, bOnlyGetTopCard:boolean):TDeckCard|null
    {
        const uuid = this._drawCard(playerId, bOnlyGetTopCard);
        const _card = uuid === "" ? null : this.getDecks().getFullPlayerCard(uuid);
        if (_card === null)
            return null;
        
        _card.owner = playerId;
        return this.#toPlayCard(_card);
    }


    /**
     * Add a player deck to the game 
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Boolean}
     */
    AddDeck(playerId:string, jsonDeck:PlaydeckStandard)
    {
        this.getDecks().addDeck(playerId, jsonDeck);
        return true;
    }

    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        let data:any = super.Save();
        data.decks = this.getDecks().save();
        return data;
    }
 
    Restore(playboard:any)
    {
        super.Restore(playboard);
        this.getDecks().restore(playboard.decks);
     }

    readyCard(uuid:string)
    {
        if (this.getDecks().isStateTapped(uuid))
            this.getDecks().readyCard(uuid);
    }

    FlipCard(uuid:string)
    {
        return this.getDecks().flipCard(uuid);
    }
    
    SetSiteState(playerId:string, code:string, nState: number)
    {
        if (nState === 0)
            this.getDecks().readySite(playerId, code);
        else if (nState === 90)
            this.getDecks().tapSite(playerId, code);
    }
    
    IsSiteTapped(playerId:string, code:string)
    {
        return this.getDecks().siteIsTapped(playerId, code);
    }

    GetTappedSites(playerId:string)
    {
        return this.getDecks().getTappedSites(playerId);
    }
    
    SetCardState(uuid:string, nState:number)
    {
        if (nState === 0)
            this.getDecks().readyCard(uuid);
        else if (nState === 90)
            this.getDecks().tapCard(uuid);
        else if (nState === 91)
            this.getDecks().tapCardFixed(uuid);
        else if (nState === 180)
            this.getDecks().woundCard(uuid);
        else if (nState === 270)
            this.getDecks().triceTapCard(uuid);
    }

    GetCharacterCodes(playerid:string)
    {
        return this.getDecks().getCharacters(playerid);
    }

    Size(playerId:string)
    {
        return this.getDecks().size(playerId);
    }

    DumpDeck()
    {
        /** deprecated */
    }

    ShufflePlaydeck(playerId:string)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shuffle();
    }

    ShufflePlaydeckCount(playerId:string, num:number)
    {
        if (num < 2)
            return;
        
        const deck = this.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shufflePlaydeckTop(num);
    }

    ShuffleDiscardpileIntoPlaydeck(playerId:string)
    {
        const deck = this.getPlayerDeck(playerId);
        return deck !== null && deck.shuffleDiscardpileIntoPlaydeck();
    }

    ShuffleHandIntoPlaydeck(playerId:string)
    {
        const deck = this.getPlayerDeck(playerId);
        return deck !== null && deck.shuffleHandIntoPlaydeck();
    }

    ShuffleDiscardpile(playerId:string)
    {
        const deck = this.getPlayerDeck(playerId);
        if (deck !== null)
            deck.shuffleDiscardpile();
    }

    GetCardsInSideboard(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().sideboard(playerId));
    }

    GetCardsInDiscardpile(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().discardpile(playerId));
    }

    GetCardsInPlaydeck(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().playdeck(playerId));
    }
    GetCardsInVictory(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().victory(playerId));
    }

    GetCardsInHand(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().hand(playerId));
    }

    GetCardsSites(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().sites(playerId));
    }

    GetCardsInHandMarshallingPoints(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().handMarshallingPoints(playerId));
    }

    ReorderCardsInDeck(playerId:string, deckType:string, cards:string[])
    {
        if (deckType !== "playdeck" || cards.length === 0)
            return false;

        const deck = this.getPlayerDeck(playerId);
        if (deck === null)
            return false;

        let moved = 0;
        cards.reverse();
        for (let _cardUuid of cards)
        {
            if (deck.pop().fromPlaydeck(_cardUuid))
            {
                deck.push().toPlaydeck(_cardUuid)
                moved++;
            }
        }

        return moved > 0;
    }

    SendToBottomOfDeck(playerId:string, deckType:string, cards:string[])
    {
        if (deckType !== "playdeck" || cards.length === 0)
            return false;

        const deck = this.getPlayerDeck(playerId);
        if (deck === null)
            return false;

        let moved = 0;
        cards.reverse();
        for (let _cardUuid of cards)
        {
            if (deck.pop().fromPlaydeck(_cardUuid))
            {
                deck.push().toPlaydeck(_cardUuid, true)
                moved++;
            }
        }

        return moved > 0;
    }

    GetTopCardsInPile(playerId:string, sPile:string, nNumber:number)
    {
        if (nNumber < 1)
            return [];

        const list = sPile !== "playdeck" ? [] : this.getCardList(this.getDecks().getCards().playdeck(playerId));
        const listSize = list.length;
        if (listSize > nNumber)
        {
            const result = [];
            for (let i = 0; i < nNumber; i++)
                result.push(list[i]);

            return result;
        }
        else
            return list;
    }

    GetCardsInVictoryShared(playerId:string)
    {
        return this.getCardList(this.getDecks().getCards().sharedVicory(playerId));
    }

    GetCardsInOutOfPlay()
    {
        return this.getCardList(this.getDecks().getCards().outofplay());
    }
    /**
     * Get full card detais of a card by its uuid
     * 
     * @param {String} uuid Card UUID
     * @returns {Object} JSON or NULL
     */
    GetCardByUuid(uuid:string)
    {
        return this.getDecks().getFullPlayerCard(uuid);
    }


    getCardList(vsList:string[]) : TDeckCard[]
    {
        if (vsList === null || vsList === undefined)
            return [];
            
        const _newList = [];
        for (let _uuid  of vsList)
        {
            const _card = this.getDecks().getFullPlayerCard(_uuid);
            if (_card !== null && _card.code !== "")
                _newList.push(this.#toPlayCard(_card));
        }

        return _newList;
    }

    /**
     * Get Player deck
     * @param {String} playerId 
     * @returns 
     */
    getPlayerDeck(playerId:string):DeckDefault|null
    {
        const pDeck = this.getDecks().getPlayerDeck(playerId);
        if (pDeck === null)
            Logger.warn("Cannot get player deck " + playerId);

        return pDeck;
    }

    /**
     * Check if there is a deck available
     * @param {String} playerId
     * @return {Boolean}
     */
    HasDeck(playerId:string)
    {
        return this.getPlayerDeck(playerId) !== null;
    }

    getCardCode(uuid:string, sDefault:string)
    {
        const card = this.GetCardByUuid(uuid);
        return card !== null ? card.code : sDefault;
    }

    AddToPile(uuid:string, owner:string, type:string)
    {
        const pDeck = this.getPlayerDeck(owner);
        if (pDeck === null)
            return false;

        if (type === "victory")
            return pDeck.push().toVictory(uuid);
        else if (type === "discard")
            return pDeck.push().toDiscardpile(uuid);
        else
            return false;
    }

    toCardList(listUuids:string[]):TDeckCard[]
    {
        if (typeof listUuids === "undefined")
            return [];

        let res = [];
        for (let uuid of listUuids)
        {
            const _card = this.GetCardByUuid(uuid);
            if (_card !== null)
                res.push(_card);
        }

        return res;
    }

    /**
      * Move a single card from anywhere to ...
      * 
      * @param {String} uuid
      * @param {String} pDeck
      * @param {String} target "sideboard, discardpile, playdeck, hand"&&
      * @returns {Boolean}
      */
     moveCardToDeckPile(uuid:string, pDeck:DeckDefault, target:string)
     {
        switch(target)
        {
            case "victory":
                return pDeck.push().toVictory(uuid);

            case "sideboard":
                return pDeck.push().toSideboard(uuid);

            case "discardpile":
            case "discard":
                return pDeck.push().toDiscardpile(uuid);

            case "playdeck":
                return pDeck.push().toPlaydeck(uuid);

            case "outofplay":
                return pDeck.push().toOutOfPlay(uuid);

            case "hand":
                {
                    const _card = this.GetCardByUuid(uuid);
                    if (_card !== null)
                    {
                        if (_card.agent === true)
                            _card.revealed = false;
                    }
                }
                
                return pDeck.push().toHand(uuid);

            default:
                Logger.warn("Unknown target pile " + target);
                break;
        }

        return false;
    }

    moveCard(cardUuid:string, target:string)
    {
        const jCard = this.GetCardByUuid(cardUuid);
        if (jCard === null)
            return false;

        const pDeck = this.getPlayerDeck(jCard.owner);
        if (pDeck === null)
            return false;
        
        /* a tapped nazgul event shoud not be tapped if re-played again */
        this.getDecks().readyCard(cardUuid);
        
        switch(target)
        {
            case "victory":
                return pDeck.push().toVictory(cardUuid);

            case "sideboard":
                return pDeck.push().toSideboard(cardUuid);

            case "discardpile":
            case "discard":
                return pDeck.push().toDiscardpile(cardUuid);

            case "playdeck":
                return pDeck.push().toPlaydeck(cardUuid);

            case "hand":
                return pDeck.push().toHand(cardUuid);

            case "outofplay":
                return pDeck.push().toOutOfPlay(cardUuid);

            default:
                Logger.warn("Unknown target hand list " + target);
                break;
        }

        return false;
    }

    /**
     * Remove a card from the hand/deck or onboard company
     * 
     * @param {String} playerId
     * @param {String} uuid
     * @returns {Boolean}
     */
    removeCardFromDeckOrCompany(playerId:string, uuid:string) : boolean
    {
        const pDeck = this.getPlayerDeck(playerId);
        return pDeck !== null && pDeck.pop().fromAnywhere(uuid); // remove chard from deck 
    }
 
     
    /**
     * Add cards to the sideboard of a given player DURING the game!
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Number} Number of cards added or -1
     */
    AddDeckCardsToSideboard(playerId:string, jsonDeck:IRegisterGameCard[])
    {
        return this.getDecks().addCardsToSideboardDuringGame(playerId, jsonDeck);
    }

    /**
     * Add a card to the hand of a given player DURING the game!
     * 
     * @param {String} playerId Target player
     * @param {String} code Card Code
     * @param {Boolean} bAsCharacter Consider this card as a character OR a ressource
     * @returns {Number} Number of cards added or -1
     */
    ImportCardsToHand(playerId:string, code:string, bAsCharacter:boolean)
    {
        return this.getDecks().importCardsToHand(playerId, code, bAsCharacter);
    }

    /**
     * Add a card DURING the game!
     * 
     * @param {String} playerId Target player
     * @param {String} code Card Code
     * @param {Boolean} bAsCharacter Consider this card as a character OR a ressource
     * @returns {Number} Number of cards added or -1
     */
    ImportCardsToGame(playerId:string, code:string, bAsCharacter:boolean)
    {
        return this.getDecks().importCardsToGame(playerId, code, bAsCharacter);
    }

    ImportCardToStored(playerId:string, code:string)
    {
        return this.getDecks().ImportCardToStored(playerId, code);
    }
    
    UpdateCardType(uuid:string)
    {
        return this.getDecks().updateCardType(uuid);
    }
    
    isValidTarget(target:string)
    {
        switch(target)
        {
            case "victory":
            case "sideboard":
            case "discardpile":
            case "discard":
            case "playdeck":
            case "hand":
            case "outofplay":
                return true;

            default:
                Logger.warn("Invalid target " + target);
                break;
        }

        return false;
    }

    /**
      * Remove a card form owners hand
      * 
      * @param {String} _uuid
      * @return {card}
      */
    PopCardFromHand(_uuid:string)
    {
        const card = this.GetCardByUuid(_uuid);
        if (card === null)
            return null;

        const pDeck = this.getPlayerDeck(card.owner);
        if (pDeck === null)
            return null;

        if (pDeck.pop().fromAnywhere(_uuid) ||  this.removeCardFromDeckOrCompany(card.owner, _uuid))
            return card;
        else
            return null;
    }
}

