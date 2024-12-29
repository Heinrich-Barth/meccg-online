
import PROXY_URL from "./Proxy";

export type CardData = {
    "title": string;
    "text": string;
    "set_code": string;
    "full_set": string;
    "Secondary": string;
    "alignment": string;
    "type": string;
    "code": string;
    "uniqueness": boolean;
    "skills": string[]|null,
    "keywords": string[]|null,
    "Site"?: string;
    "Region"?: string;
}

export type CardImageMap = {
    fliped: {
        [code:string]:string;
    },
    images: {
        [code:string]: {
            image: string;
        };
    }
}

export async function FetchCardImages()
{
    try {
        const response = await fetch(PROXY_URL+"/data/list/images");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const images:CardImageMap = await response.json();
        return images;
    }
    catch (err) {
        console.error(err);
    }

    return {
        fliped: {},
        images: {}
    };
}
export type CardFilters = {
    secondaries: string[];
    alignment: string[];
    type: string[];
    hazards: string[];
    resources: string[];
}

export async function FetchFilters()
{
    try
    {
        const response = await fetch(PROXY_URL+"/data/list/filters");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const json:CardFilters = await response.json();
        return json;
        
    }
    catch(err)
    {
        console.error(err);
    }

    return { 
        secondaries: [],
        alignment: [],
        type: [],
        hazards: [],
        resources: []
    }
}

export default async function FetchCards() {

    try {
        const response = await fetch(PROXY_URL+"/data/list/cards");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const map:any = {}
        const cards:CardData[] = await response.json();
        for (let card of cards)
        {
            if (!map[card.code])
                map[card.code] = card;
        }

        const res:CardData[] = [];
        Object.keys(map).sort().forEach(code => res.push(map[code]));
        return res;
    }
    catch (err) {
        console.error(err);
    }

    return [];
}
