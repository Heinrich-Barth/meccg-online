import { DeckCardsEntry, DeckData, DeckCards } from "../application/Types";
import { verifyCardCode } from "../components/CustomDeckInput";

const getDeckSection = function(text:string, part:string)
{
    text = text.replaceAll("\r\n", "\n");

    const line = "##\n" + part + "\n##";
    let pos = text.indexOf(line);
    if (pos === -1)
    {
        console.warn("Could not find section " + part);
        return "";
    }

    pos = text.indexOf("\n\n", pos);
    if (pos === -1)
    {
        console.log("Cannot find end of section")
        return "";
    }

    let end = text.indexOf("\n##", pos)
    if (end === undefined || end < pos)
        return text.substring(pos).trim();
    else 
        return text.substring(pos, end).trim();
}

const explodeCode = function(line:string)
{
    const result:any = {
        code: "",
        count: 0
    };

    if (line.length < 3)
        return result;

    let val = line.substring(0, 2);
    const n1 = parseInt(val[0])
    const n2 = parseInt(val[1]);

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

    result.code = verifyCardCode(result.code);
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

        card.code = verifyCardCode(card.code);
        if (card.code === "")
        {
            console.warn("Could not find card by code " + line);
            continue;
        }
        else if (result[card.code])
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

function createCountMapFromPart(map:any, data:DeckCardsEntry)
{
    for (let code in data)
    {
        const val = data[code];
        if (val > 0)
        {
            if (map[code])
                map[code] += val;
            else
                map[code] = val;
        }
    }
}

export function CreateCountMap(data:DeckCards)
{
    const map:any = { };
    createCountMapFromPart(map, data.deck);
    createCountMapFromPart(map, data.pool);
    createCountMapFromPart(map, data.sideboard);
    createCountMapFromPart(map, data.sites);
    return map;
}