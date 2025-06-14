import BACKSIDE from '../_assets/backside.jpeg';

export enum MenuSelection {
    Preferences = 6,
    Login = 7
}

export { BACKSIDE as BACKSIDE_IMAGE };

export type Deckentry = {
    code: string;
    image: string;
    count: number;
    type: string;
}

export type DeckPart = {
    characters: Deckentry[];
    resources: Deckentry[];
    hazards: Deckentry[];
}

export type DeckCountMap = {
    [key: string]: number
};

export type Deck = {
    pool: DeckPart;
    playdeck: DeckPart;
    sideboard: DeckPart;
    sites: DeckPart;
    notes: string;
    counts: DeckCountMap;
}


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


export type DeckId = string;

export type DeckEntry = {
    name: string;
    decks: Map<string, DeckId> // name = uid
    meta: Map<DeckId, DeckEntryMeta>
}

export type DeckEntryMeta = {
    "avatar": string;
    "pool": number;
    "sideboard": number;
    "character": number;
    "resources": number;
    "hazards": number;
    "summary": string;
}

export type CardCode = string;
export type CardImage = string;

export type DeckImageMap = {
    [key:CardCode] : CardImage
}
export type DeckData = {
    deck: string;
    images: DeckImageMap;
}
