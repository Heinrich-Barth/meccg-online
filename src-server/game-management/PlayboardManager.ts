import PlayboardManagerCompanies from "./PlayboardManagerCompanies";
import Logger from "../Logger";
import { PlaydeckStandard } from "../plugins/Types";
import { TDeckCard } from "./DeckCommons";

export type TFullCompanyCharacter = {
    companyId : string
    parent : string,
    character : TDeckCard,
    resources : TDeckCard[],
    hazards : TDeckCard[]
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

    GetFullCompanyCharacter(companyId:string, uuid:string) : TFullCompanyCharacter|null
    {
        if (companyId === "" || !this.companyExists(companyId))
        {
            Logger.warn("Cannot find company by its id " + companyId + " (GetFullCompanyCharacter)");
            return null;
        }

        const pCharacter = this.getCharacterByUuid(uuid);
        if (pCharacter === null)
        {
            Logger.warn("Character " + uuid + " does not exist.");
            return null;
        }

        const pCard = this.GetCardByUuid(uuid);
        if (pCard === null)
            return null;

        return {
            companyId : pCharacter.companyId,
            parent : this.getParent(pCharacter.parentUuid),
            character : pCard,
            resources : this.toCardList(pCharacter.resources),
            hazards : this.toCardList(pCharacter.hazards),
            influenced : []
        };
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

