import Logger from "../Logger";
import { DeckValidateSection } from "./Types";
import * as fs from "fs";
import * as path from "path";

const FOLDER = path.join(__dirname, "../../data-local/hazard-decks");

// # Hazard (30)


const deckFiles:string[] = [];

function getRandomDeckFile():string
{
    if (deckFiles.length === 0)
        return "";

    const nMax = deckFiles.length;
    const i = Math.floor(Math.random() * nMax);
    return deckFiles[i];
}

function ReadRandomHazardDecks()
{
    if (deckFiles.length > 0)
        return;

    try
    {
        const files = fs.readdirSync(FOLDER);
        if (files)
            files.forEach(file => deckFiles.push(FOLDER + "/" + file));
    }
    catch(err)
    {
        Logger.warn("Could not read file list of directory " + FOLDER);
    }
}

const ReadDeckFile = function(sUri:string):string 
{
    try
    {
        const data = sUri === "" ? "" : fs.readFileSync(sUri, "utf-8");
        if (data)
            return data;
    }
    catch(err)
    {
        Logger.warn(err);
    }

    Logger.warn("Cannot load random hazard deck");
    return "";
}

const AssignRandomDeck = function():DeckValidateSection
{
    const file = getRandomDeckFile();
    return ExtractCards(ReadDeckFile(file));
}

export default function getRandomHazardDeck():DeckValidateSection
{
    ReadRandomHazardDecks();
    return AssignRandomDeck();
}

function getCandidate(line:string)
{
    const val = {
        count: 0,
        code: ""
    };

    if (line === "" || line.startsWith("#") || line.length < 3)
        return val;

    const first = line.substring(0, 1).trim();
    const code = line.substring(1).trim();

    const count = parseInt(first);
    if (!isNaN(count))
    {
        val.count = count;
        val.code = code.toLowerCase();
    }
    
    return val;
}

function ExtractCards(data: string): DeckValidateSection 
{
    const deck:DeckValidateSection = {}
    if (data === "")
        return deck;

    for (let line of data.split("\n"))
    {
        const card = getCandidate(line);
        if (card.code === "" || card.count < 1)
            continue;

        if (deck[card.code] === undefined)
            deck[card.code] = card.count;
        else
            deck[card.code] += card.count;
    }

    return deck;
}
 