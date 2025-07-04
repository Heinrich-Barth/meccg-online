import { Deck, DeckPart, Deckentry } from "../application/Types";
import { GetCardByCode } from "./CustomDeckInput";

export type DreamCardsLegalInfo = {
    total: number;
    standard: number;
    dreamcards: number;
}

export type DreamCardsDetailsSection = {
    characters: DreamCardsLegalInfo;
    hazards: DreamCardsLegalInfo;
    resources: DreamCardsLegalInfo;
    total: DreamCardsLegalInfo;
}
export type DreamCardsDetails = {
    details: {
        pool: DreamCardsDetailsSection;
        playdeck: DreamCardsDetailsSection;
        sideboard: DreamCardsDetailsSection;
        total: DreamCardsLegalInfo;
    };

    dreamcards: {
        percResources: number;
        percHazards: number;
        percTotal: number;

    },

    avatars: {
        count: number;
        maximum: number;
    },
    sidebaord: {
        allowed: number;
    }
}

const getCardCode = function(code:string)
{
    const pos = code.lastIndexOf("(");
    const end = code.lastIndexOf(")");
    if (pos === -1 || end < pos)
        return "";

    return code.substring(pos+1, end).trim();
}

const isStandardSet = function(set:string)
{
    switch(set.toLowerCase())
    {
        case "tw": 
        case "le": 
        case "ba": 
        case "as": 
        case "wh": 
        case "td": 
        case "dm": 
            return true;
        default:
                return false;
    }
}

const calculateDreamcardsSectionList = function(list:Deckentry[])
{
    const res:DreamCardsLegalInfo = {
        total: 0,
        dreamcards: 0,
        standard: 0
    };

    for (let card of list)
    {
        if (isStandardSet(getCardCode(card.code)))
            res.standard += card.count;
        else
            res.dreamcards += card.count;

        if (card.count > 0)
            res.total += card.count;
    }

    return res;
}

const coundAvatarsInSection = function(list:Deckentry[])
{
    let found = 0;
    for (let card of list)
    {
        if (card.type === "Avatar")
            found += card.count;
    }
    return found;
}

const countAvatars = function(deck:Deck)
{
    return coundAvatarsInSection(deck.pool.characters)
            + coundAvatarsInSection(deck.playdeck.characters)
}

const calculateDreamcardsSection = function(characters:Deckentry[], hazards:Deckentry[], resources:Deckentry[])
{
    const data:DreamCardsDetailsSection = {
        characters: calculateDreamcardsSectionList(characters),
        hazards: calculateDreamcardsSectionList(hazards),
        resources: calculateDreamcardsSectionList(resources),
        total: {
            total: 0,
            standard: 0,
            dreamcards: 0
        }
    } 
    
    data.total.total += data.characters.total;
    data.total.standard += data.characters.standard;
    data.total.dreamcards += data.characters.dreamcards
    
    data.total.total += data.hazards.total;
    data.total.standard += data.hazards.standard;
    data.total.dreamcards += data.hazards.dreamcards
    
    data.total.total += data.resources.total;
    data.total.standard += data.resources.standard;
    data.total.dreamcards += data.resources.dreamcards

    return data;
}

const calculateDCPercentage = function(data:DreamCardsLegalInfo)
{
    if (data.total === 0)
        return 0;

    const perc = Math.round((data.dreamcards / data.total) * 100);
    return perc;
}

const countDCInDeck = function(...data:DreamCardsLegalInfo[])
{
    const total:DreamCardsLegalInfo = {
        total: 0,
        standard: 0,
        dreamcards: 0
    }

    for (let elem of data)
    {
        total.total += elem.total;
        total.standard += elem.standard;
        total.dreamcards += elem.dreamcards
    }

    return total;
}
type CharacterAgents = {
        characters: Deckentry[];
        agents: Deckentry[];
}

function removeAgentsFromList(part:Deckentry[], agentsAsHazards = false)
{
    const result:CharacterAgents = {
        characters: part,
        agents: []
    }

    if (!agentsAsHazards)
        return result;

    result.characters = [];
    for (const card of part)
    {
        
        const candidate = GetCardByCode(card.code);
        if (candidate?.Secondary === "Agent")
            result.agents.push(card);
        else
            result.characters.push(card);
    }

    return result;
}

export default function calculateDreamcards(deck: Deck, agentsAsHazards = false):DreamCardsDetails {
    
    const characters = removeAgentsFromList(deck.playdeck.characters, agentsAsHazards);
    const hazards = [...characters.agents, ...deck.playdeck.hazards];

    const play = calculateDreamcardsSection(characters.characters, hazards, deck.playdeck.resources)
    const sb = calculateDreamcardsSection(deck.sideboard.characters, deck.sideboard.hazards, deck.sideboard.hazards);
    const pool = calculateDreamcardsSection(deck.pool.characters, deck.pool.hazards, deck.pool.resources);
    const avatars = countAvatars(deck);
    const total = countDCInDeck(play.total, pool.total, sb.total);

    const result:DreamCardsDetails = {
        details: {
            pool: pool,
            playdeck: play,
            sideboard: sb,
            total: total
        },
        avatars: {
            count: avatars,
            maximum: 3
        },
        dreamcards: {
            percResources: calculateDCPercentage(play.resources),
            percHazards: calculateDCPercentage(play.hazards),
            percTotal: calculateDCPercentage(total)
        },
        sidebaord: {
            allowed: Math.floor(play.total.total / 2)
        }
    }

    /**
     * You may include 1 avatar copy in play deck and pool combined for every 20 cards in your play deck.
     * Characters straight in deck (i.e. not coming from your pool) count towards play deck size.
     */
    const cardsSemAvatar = result.details.playdeck.total.total + result.details.pool.total.total;
    const avMax = Math.floor(cardsSemAvatar / 20);
    if (avMax > 3)
        result.avatars.maximum = avMax;
    
    return result;
}
