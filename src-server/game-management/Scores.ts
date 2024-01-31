import { getRootFolder } from "../Configuration";
import Logger from "../Logger";
import * as fs from "fs";

interface ScoreEntry 
{
    id:string
    value:string,
    label:string
    default:boolean,
    extended:boolean,
    ignorecount:boolean,
    icon:string
}

interface PlayerScore {
    [category:string]:number
}

interface PlayerScores {
    [id:string]:ScorintSheetSave
}



/**
 * Read the score json object
 * 
 * @param {Boolean} isExtended 
 * @returns Array of ids
 */
const createNewScoreSheet = function(isExtended:boolean) : PlayerScore
{
    const res:PlayerScore = {};
    
    for (let category of g_pScores)
    {
        if (!category.extended || (isExtended && category.extended))
            res[category.value] = 0;
    }

    return res;
};


const loadScoreStats = function() : ScoreEntry[]
{
    try
    {
        const data = JSON.parse(fs.readFileSync(getRootFolder() + "/data-local/scores.json", "utf-8"));
        return data.categories;
    }
    catch (err)
    {
        Logger.warn("Could not load score stats");
        Logger.error(err);
    }

    return [];
};

const g_pScores:ScoreEntry[] = loadScoreStats();

type ScorintSheetSave = {
    scores:PlayerScore,
    total: number
};

class ScorintSheet {

    #total = 0;
    #sheet:PlayerScore;

    constructor(isExtended:boolean)
    {
        this.#sheet = createNewScoreSheet(isExtended);
    }

    updateCategory(type:string, nPoints:number)
    {
        if (type !== "" && typeof this.#sheet[type] !== "undefined")
            this.#sheet[type] += nPoints;

        return this.#calculate();
    }

    setCategory(type:string, nPoints:number)
    {
        if (type !== "" && typeof this.#sheet[type] !== "undefined")
            this.#sheet[type] = nPoints;

        return this.#calculate();
    }

    /**
     * Update sheet and calculate points
     * @param {json} jData 
     */
    update(jData:PlayerScore)
    {
        for (let key in this.#sheet)
        {
            if (typeof jData[key] !== "undefined")
                this.#sheet[key] = jData[key];
        }

        return this.#calculate();
    }

    getTotal()
    {
        return this.#total;
    }

    getSheet()
    {
        const _res:PlayerScore = { };
        for (let key in this.#sheet)
            _res[key] = this.#sheet[key];

        return _res;
    }

    /**
     * Calculate total
     */
    #calculate()
    {
        let _tot = 0;

        for (let key in this.#sheet)
        {
            if (key !== "stage")
                _tot += this.#sheet[key];
        }

        this.#total = _tot;
        return _tot;
    }
    
    save() : ScorintSheetSave
    {
        return {
            scores: this.#sheet,
            total: this.#total
        };
    }

    restore(scores:any)
    {
        if (scores === null || scores === undefined)
            return;

        this.#total = 0;
        for (let key of Object.keys(this.#sheet))
        {
            this.#sheet[key] = scores[key] === undefined ? 0 : parseInt(scores[key]);
            this.#total += this.#sheet[key];
        }
    }
}

export default class Scores {
    
    #sheets:{[id:string]:ScorintSheet} = { };
    #isExtended:boolean;

    constructor(isExtended:boolean)
    {
        this.#isExtended = isExtended;
    }

    reset()
    {
        this.#sheets = { };
    }

    save()
    {
        let data:PlayerScores = {};
        let keys = Object.keys(this.#sheets);
        for (let key of keys)
            data[key] = this.#sheets[key].save();

        return data;
    }

    restore(scores:any)
    {
        this.reset();

        let keys = Object.keys(scores);
        for (let sPlayerId of keys)
        {  
            this.add(sPlayerId);
            this.#sheets[sPlayerId].restore(scores[sPlayerId].scores);
        }

        return true;
    }

    /**
     * Create new score sheet
     * 
     * @param {String} sPlayerId 
     */
    add(sPlayerId:string)
    {
        if (typeof this.#sheets[sPlayerId] === "undefined")
            this.#sheets[sPlayerId] = new ScorintSheet(this.#isExtended);
    }

    update(userid:string, type:string, nPoints:number)
    {
        if (typeof this.#sheets[userid] === "undefined" || nPoints === 0)
            return -1;
        else
            return this.#sheets[userid].updateCategory(type, nPoints);
    }

    getScoreSheets() 
    {
        const sheets:{[id:string]:PlayerScore} = { };
        
        for (let key in this.#sheets)
            sheets[key] = this.#sheets[key].getSheet();
        
        return sheets;
    }

    getScoreSheet(userid:string)
    {
        if (typeof this.#sheets[userid] === "undefined")
            return { };
        else
            return this.#sheets[userid].getSheet();
    }

    getPlayerScore(sPlayerId:string)
    {
        if (typeof this.#sheets[sPlayerId] === "undefined")
            return -1;
        else
            return this.#sheets[sPlayerId].getTotal();
    }

    updateScore(sPlayerId:string, jData:PlayerScore)
    {
        if (typeof this.#sheets[sPlayerId] !== "undefined")
            return this.#sheets[sPlayerId].update(jData);
        else
            return -1;
    }

    setCategory(sPlayerId:string, type:string, nPoints:number)
    {
        if (typeof this.#sheets[sPlayerId] !== "undefined")
            return this.#sheets[sPlayerId].setCategory(type, nPoints);
        else
            return -1;
    }
}
