
import * as EventManager from "../EventManager";

export interface DataPlayboardBase {

    counter: number
}

export default class PlayboardManagerBase
{
    #data:any = { };
    #counter = 0;

    triggerEventSetupNewGame()
    {
        EventManager.trigger("setup-new-game", this.#data);
    }

    getEventManager()
    {
        return EventManager;
    }

    /**
     * Get the data object (see plugins)
     * 
     * @returns Object
     */
    GetData() : any
    {
        return this.#data;
    }

    /**
     * Save current game state
     * @returns Object
     */
     Save() : DataPlayboardBase
     {
         return {
             counter : this.#counter
         };
     }
 
 
     Restore(playboard:DataPlayboardBase)
     {
        const val = playboard.counter ?? 0;
        if (typeof val === "number")
            this.#counter = val;
        else if (typeof val === "string" && val !== "")
            this.#counter = parseInt(val);
        else
            this.#counter = 0;
     }
    
    /**
     * Create a new company id
     * 
     * @returns {String}
     */
    obtainUniqueCompanyId()
    {
        return "company_" + (++this.#counter);
    }
 
    reset()
    {
        this.#data = { };
        this.#counter = 0;
    }

    /**
     * JSON to String
     * @param {JSON} content
     * @returns {String} String value
     */
     toString(content:any)
     {
         try{
            return JSON.stringify(content, null, '\t');
         }
         catch (err)
         {

         }

         return "";         
     }
 
    ArrayUUIDClone(input:any[]) :string[]
    {
        if (input === null || input === undefined || input.length === 0)
            return [];

        const target:string[] = [];
        for (let inf of input)
        {
            let uuid = this.AssertString(inf);
            if (uuid !== "")
                target.push(uuid);
        }

        return target;
    }

    AssertString(input:string)
    {
        return typeof input === "string" ? input : "";
    }

    removeFromList(uuid:string, _list:string[])
    {
        if (typeof _list === "undefined")
            return false;

        for (let y = _list.length - 1; y >= 0; y--)
        {
            if (_list[y] === uuid)
            {
                _list.splice(y, 1);
                return true;
            }
        }

        return false;
    }
}

