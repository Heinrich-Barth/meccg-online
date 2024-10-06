import PlayboardManagerCharacters from "./PlayboardManagerCharacters";
import Logger from "../Logger";
import { PlaydeckStandard } from "../plugins/Types";

interface StagingAreas {
    [playerid:string]:PlayerStagingArea
}

type PlayerStagingArea = {
    resources : string[],
    hazards : string[]
}

export default class PlayboardManagerStagingArea extends PlayboardManagerCharacters
{
    #stagingareas:StagingAreas = { };

    reset()
    {
        super.reset();
        
        this.#stagingareas = { };
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

        this.#stagingareas[playerId] = {
            resources : [],
            hazards : []
        };

        return true;
    }

    /**
     * Save current game state
     * @returns Object
     */
     Save()
     {
         let data = super.Save();
         data.stagingarea = this.#stagingareas;
 
         return data;
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

        for (let i in this.#stagingareas)
        {
            if (super.removeFromList(uuid, this.#stagingareas[i].resources) || super.removeFromList(uuid, this.#stagingareas[i].hazards))
                return true;
        }
        
        /* at last, it might be an onguard card */
        return false;
    }
 
     
    /**
     * Move a card to the staging area from a players HAND
     * @param {String} uuid
     * @param {String} playerSourceId
     * @param {String} playerTagetId
     * @returns {boolean}
     */
     MoveCardToStagingArea(uuid:string, playerSourceId:string, playerTagetId:string)
     {
        const pCard = this.GetCardByUuid(uuid);
        if (pCard === null)
            return false;

        if (!this.removeCardFromDeckOrCompany(playerSourceId, uuid))
        {
            Logger.warn("Could not remove card " + uuid + " from deck of company/staging area");
            return false;
        }

        const pStagingArea = typeof this.#stagingareas[playerTagetId] === "undefined" ? null : this.#stagingareas[playerTagetId];
        if (pStagingArea === null)
            return false;

        if (pCard.type === "hazard")
            pStagingArea.hazards.push(uuid);
        else
            pStagingArea.resources.push(uuid);

        return true;
     }
 

    Restore(playboard:any)
    {
        super.Restore(playboard);

        this.#stagingareas = { };
        for (let uuid in playboard.stagingarea)
        {
            this.#stagingareas[uuid] = {
                resources : this.ArrayUUIDClone(playboard.stagingarea[uuid].resources),
                hazards : this.ArrayUUIDClone(playboard.stagingarea[uuid].hazards)
            };
        }
    }


    GetStagingCards(playerId:string, isResources:boolean)
    {
        if (this.#stagingareas[playerId] === undefined)
            return [];
        else if (isResources && this.#stagingareas[playerId].resources !== undefined)
            return this.#stagingareas[playerId].resources;
        else if (!isResources && this.#stagingareas[playerId].hazards !== undefined)
            return this.#stagingareas[playerId].hazards;
        else
            return [];        
    }

}

