import { DeckCards, DeckCardsEntry } from "./ExploreDeckData";

export type MapSettings = {
    prefer: string;
    standardOnly: boolean;
    fallen: boolean;
    lords: boolean;
    allowDCErrata:boolean;
}

let hasOnlyStandard = false;
let hasFallen = false;
let hasLords = false;

const hasLordAvatar = function(deck:DeckCards, avatars:string[])
{
    for (let code of Object.keys(deck.pool))
    {
        if (avatars.includes(code) && (code.endsWith("(fb)") || code.endsWith("(df)")))
            return true;
    }
    
    for (let code of Object.keys(deck.deck))
    {
        if (avatars.includes(code) && (code.endsWith("(fb)") || code.endsWith("(df)")))
            return true;
    }
    return false;
}

const hasFallenWizard = function(deck:DeckCards, avatars:string[])
{
    for (let code of Object.keys(deck.pool))
    {
        if (avatars.includes(code) && code.endsWith("(wh)"))
            return true;
    }

    for (let code of Object.keys(deck.deck))
    {
        if (avatars.includes(code) && code.endsWith("(wh)"))
            return true;
    }
    
    return false;
}

const hasOnlyCardsOfSet = function(section:DeckCardsEntry, sets:string[])
{
    const codes = Object.keys(section);
    for (let code of codes)
    {
        const pos = code.lastIndexOf("(");
        if (pos === -1)
            continue;

        const set = code.substring(pos);
        if (!sets.includes(set))
            return false;
    }
    return true;
}

const hasNonStandardSites = function(deck:DeckCards)
{
    const sets = ["(tw)", "(td)", "(ba)", "(dm)", "(le)", "(as)", "(wh)"]
    return hasOnlyCardsOfSet(deck.pool, sets)
        && hasOnlyCardsOfSet(deck.deck, sets)
        && hasOnlyCardsOfSet(deck.sites, sets);
}

export function updateMapSettingsStorage(settings:MapSettings)
{
    const data:any = {
        fallenwizard: settings.fallen,
        lords: settings.lords,
        dreamcards: !settings.standardOnly
    }
    
    sessionStorage.setItem("meccg_map_settings", JSON.stringify(data));
    sessionStorage.setItem("site_order", settings.prefer);
}

export default function CalculateMapSettings(deck:DeckCards, avatars:string[], defaults:MapSettings):MapSettings
{
    if (hasLordAvatar(deck, avatars))
    {
        return {
            prefer:defaults.prefer,
            standardOnly: false,
            fallen: true,
            lords: true,
            allowDCErrata: true,
        }
    }

    const onlyStandard = hasNonStandardSites(deck);
    if (hasFallenWizard(deck, avatars))
    {
        return {
            prefer:defaults.prefer,
            standardOnly: onlyStandard,
            fallen: true,
            lords: !onlyStandard,
            allowDCErrata: true,
        }
    }

    return {
        prefer:defaults.prefer,
        standardOnly: onlyStandard,
        fallen: false,
        lords: false,
        allowDCErrata: true,
    }
}
