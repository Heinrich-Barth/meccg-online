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
