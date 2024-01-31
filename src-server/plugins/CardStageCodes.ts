import * as fs from "fs";
import { ICard } from "./Types";
import { getRootFolder } from "../Configuration";

const loadList = function():string[]
{
    try
    {
        const data = fs.readFileSync(getRootFolder() + "/data-local/stage-codes.json", "utf-8").toLowerCase();
        const val = JSON.parse(data);
        if (Array.isArray(val))
            return val;
    }
    catch (ex:any)
    {
        console.warn(ex.message);
    }

    return [];
}

const addKeyword = function(card:ICard)
{
    const sWord = "stage resource";
    if (card.keywords === null || card.keywords === undefined)
    {
        card.keywords = [sWord];
    }
    else if (Array.isArray(card.keywords))
    {
        card.keywords.push(sWord)
        card.keywords.sort((a,b) => a.localeCompare(b));
    }
}

export default function addStageCodes(cards:ICard[])
{
    const stages = loadList();
    if (stages.length === 0 || cards.length === 0)
        return 0;

    let count = 0;
    for (let card of cards)
    {
        if (stages.includes(card.code.toLowerCase()))
        {
            addKeyword(card);
            count++;
        }
    }

    return count;
}