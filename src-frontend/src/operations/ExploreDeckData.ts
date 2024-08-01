import { DeckData, DeckImageMap } from "./FetchDeckLists";

export type DeckCardsEntry = {
    [key:string] : number
}


export type DeckCards = {
    deck: DeckCardsEntry;
    pool: DeckCardsEntry;
    sideboard: DeckCardsEntry;
    sites: DeckCardsEntry;
    images:DeckImageMap;
    notes: string;
}

const getDeckSection = function(text:string, part:string)
{
    const line = "##\n" + part + "\n##";
    let pos = text.indexOf(line);
    if (pos === -1)
        return "";

    pos = text.indexOf("\n\n", pos);
    if (pos === -1)
        return "";

    let end = text.indexOf("\n##", pos)
    if (end === undefined || end < pos)
        return text.substring(pos).trim();
    else 
        return text.substring(pos, end).trim();
}

const explodeCode = function(line:string)
{
    const result = {
        code: "",
        count: 0
    };

    if (line.length < 3)
        return result;

    let val = line.substring(0, 2);
    let n1 = parseInt(val[0])
    let n2 = parseInt(val[1]);

    if (isNaN(n1) && isNaN(n2))
    {
        result.code = line;
        result.count = 1;
    }
    else if (isNaN(n2) && !isNaN(n1))
    {
        result.code = line.substring(1).trim();
        result.count = n1;
    }
    else if (!isNaN(n2) && !isNaN(n1))
    {
        result.code = line.substring(2).trim();
        result.count = n1 * 10 + n2;
    }
    
    return result;
}

export function ConvertCardsStringMap(candidate:string)
{
    const result:DeckCardsEntry = { };
    if (candidate === "")
        return result;

    for (let line of candidate.split("\n"))
    {
        line = line.trim();
        if (line.startsWith("#") || line.length < 3)
            continue;

        const card = explodeCode(line)
        if (card.count < 1 || card.code === "")
            continue;

        if (result[card.code])
            result[card.code] += card.count;
        else
            result[card.code] = card.count;
    }

    return result;
}

const getCards = function(deck:string, part:string)
{
    const candidate = getDeckSection(deck, part);
    return ConvertCardsStringMap(candidate);
}

export default function ExploreDeckData(data:DeckData):DeckCards|null
{
    const result:DeckCards = {
        deck: getCards(data.deck, "Deck"),
        pool: getCards(data.deck, "Pool"),
        sideboard: getCards(data.deck, "Sideboard"),
        sites: getCards(data.deck, "Sites"),
        notes: getDeckSection(data.deck, "Notes"),
        images: data.images ?? { }
    }
    
    if (Object.keys(result.deck).length > 0 || Object.keys(result.sideboard).length > 0 || Object.keys(result.pool).length > 0)
        return result;
    else
        return null;
}