import { GetCardByCode } from "../components/CustomDeckInput";
import { DeckCardsEntry } from "./ExploreDeckData";
import { CardData } from "./FetchCards";

type MapSettings = {
    hero:boolean;
    minion:boolean;
    fallenwizard:boolean;
    balrog:boolean;
    dreamcards:boolean;
    lord:boolean;
    fallenlord:boolean;
    elf:boolean;
    dwarf:boolean;
    dragon:boolean;
}

const addCodesFromSection = function(map:any, deck: DeckCardsEntry)
{
    for (let key of Object.keys(deck))
        map[key] = true;
}

const getCodes = function(deck: DeckCardsEntry, pool: DeckCardsEntry)
{
    const map:any = {};
    addCodesFromSection(map, deck);
    addCodesFromSection(map, pool);
    return Object.keys(map);
}

function updateAlignmentByCard(settings: MapSettings, card:CardData)
{
    const alignment = card.alignment.toLowerCase();
    switch(alignment)
    {
        case "hero":
            settings.hero = true;
            break;
        case "minion":
            settings.minion = true;
            break;
    }
}

function updateAlignment(settings: MapSettings, codes: string[]) 
{
    for (let code of codes)
    {
        const card = GetCardByCode(code);
        if (card !== null)
            updateAlignmentByCard(settings, card);
    }
}

export default function identifyMapSettings(deck: DeckCardsEntry, pool: DeckCardsEntry) {
 
    const settings:MapSettings = {
        hero: true,
        minion: true,
        fallenwizard: true,
        balrog: true,
        dreamcards: true,
        lord: true,
        fallenlord: true,
        elf: true,
        dwarf: true,
        dragon: true
    }

    const codes:string[] = getCodes(deck, pool);
    if (codes.length > 0)
        updateAlignment(settings, codes);



    localStorage.setItem("meccg_map_settings", JSON.stringify(settings));
}

