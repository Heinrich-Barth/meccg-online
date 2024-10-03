import PlayboardManagerCompanies from "./PlayboardManagerCompanies";
import Logger from "../Logger";
import { PlaydeckStandard } from "../plugins/Types";
import { TDeckCard } from "./DeckCommons";

export type TFullCompanyCharacter = {
    companyId : string
    parent : string,
    character : TDeckCard,
    attached : TDeckCard[]
    influenced : []
}

export default class PlayboardManager extends PlayboardManagerCompanies
{
    reset()
    {
        super.reset();
        super.triggerEventSetupNewGame();
    }

    /**
     * Save current game state
     * @returns Object
     */
    Save()
    {
        return super.Save();
    }


    Restore(playboard:any)
    {
        super.Restore(playboard);
        return true;
    }

    /**
     * Add a player deck to the game 
     * @param {String} playerId
     * @param {String} jsonDeck
     * @returns {Boolean}
     */
    AddDeck(playerId:string, jsonDeck:PlaydeckStandard)
    {
        super.AddDeck(playerId, jsonDeck);
        this.getEventManager().trigger("on-deck-added", playerId, jsonDeck, this.getDecks())
        return true;
    }
     
    /**
     * Remove a card from the hand/deck or onboard company
     * 
     * @param {String} playerId
     * @param {String} uuid
     * @returns {Boolean}
     */
    removeCardFromDeckOrCompany(playerId:string, uuid:string)
    {
        if (super.removeCardFromDeckOrCompany(playerId, uuid))
            return true;
        else
            return this.PopOnGuardCard(uuid); /* at last, it might be an onguard card */
    }

    getParent(uuid:string)
    {
        const pCard = this.GetCardByUuid(uuid);
        return pCard === null ? "" : pCard.code;
    }  

     /**
      * Move a single card from anywhere to ...
      * 
      * @param {String} uuid
      * @param {String} playerId
      * @param {String} target "sideboard, discardpile, playdeck, hand"&&
      * @returns {Boolean}
      */
    MoveCardTo(uuid:string, playerId:string, target:string)
    {
        const jCard = this.GetCardByUuid(uuid);
        if (jCard === null)
            return false;

        const pDeck = super.getPlayerDeck(playerId);
        if (pDeck === null)
            return false;

        if (!this.removeCardFromDeckOrCompany(jCard.owner, uuid))
        {
            Logger.info("Could not remove card " + uuid + " from deck of company/staging area nor from location on guard lists");
            return false
        } 
        else
        {
            jCard.owner = playerId;
            return super.moveCardToDeckPile(uuid, pDeck, target);
        }
    }
}

