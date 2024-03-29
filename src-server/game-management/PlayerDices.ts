import { getRootFolder } from "../Configuration";
import Logger from "../Logger";
import * as fs from "fs";

interface DiceChoice {
    [key:string]:string
}

interface DiceStats {
    [key:string]:number
}

interface DiceStatsPerUser {
    [key:string]:DiceStats
}

const getDiceNames = function():string[]
{
    const folder = getRootFolder() + "/public/media/personalisation/dice";
    try
    {
        if (!fs.existsSync(folder))
        {
            Logger.info("No custom dices available at ./public/media/personalisation/dice");
            return [];
        }
        
        const list:string[] = [];
        const files = fs.readdirSync(folder);
        if (files)
            files.forEach(file => list.push(file));

        if (files.length === 0)
            Logger.info("No custom dices available");
        else
            Logger.info(files.length + " custom dice(s) avilable");
        
        return list;
    }
    catch(err)
    {
        Logger.warn("Could not read file list of directory " + folder);
        Logger.error(err);
    }

    return [];
}

/**
 * Manage players dice types and dice rolls
 */
export default class PlayerDices {
    
    #dices:DiceChoice = { };
    #stats:DiceStatsPerUser = { };

    static #diceList = getDiceNames();

    /**
     * Random number [1-nMax]
     */
    #getRandom(nMax:number)
    {
        if (nMax === undefined || nMax < 1)
            nMax = 6;

        return Math.floor(Math.random() * nMax) + 1;
    }

    /**
      * Obtain dice roll
      * @returns Number between [1-6]
      */
    roll()
    {
        const nTimes = this.#getRandom(10);
            
        let _res = 6;
        for (let i = 0; i < nTimes; i++)
            _res = this.#getRandom(6);

        return _res;
    }

    getStats()
    {
        return this.#stats;
    }

    saveRoll(userid:string, nValue:number)
    {
        if (nValue < 1 || nValue > 12 || userid === "")
            return false;

        if (this.#stats[userid] === undefined)
        {
            const data:any = { };
            for (let i = 1; i < 13; i++)
                data["" + i] = 0;

            this.#stats[userid] = data;
        }

        this.#stats[userid]["" + nValue] += 1;
        return true;
    }

    /**
     * Get all dice types
     * @returns Array
     */
    getAvailableDices()
    {
        return [...PlayerDices.#diceList];
    }

    /**
     * Get all player's dice type
     * @returns JSON
     */
    getDices():DiceChoice
    {
        let res:DiceChoice = {};
        for (let key in this.#dices)
            res[key] = this.#dices[key];

        return res;
    }

    /**
     * Get player's dice type
     * @param {String} userid 
     * @returns Dice
     */
    getDice(userid:string)
    {
        return userid === undefined || userid === "" || this.#dices[userid] === undefined ? "" : this.#dices[userid]; 
    }

    /**
     * Set a player's dice type
     * 
     * @param {String} userid 
     * @param {String} dice 
     * @returns 
     */
    setDice(userid:string, dice:string)
    {
        if (userid === undefined || userid === "" || dice === undefined || dice === "")
            return false;

        if (PlayerDices.#diceList.includes(dice))
        {
            this.#dices[userid] = dice;
            return true;
        }
        else
            return false;
    }
}

