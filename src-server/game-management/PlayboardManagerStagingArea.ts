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
        return [];        
    }

}

