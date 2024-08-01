
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
    "keywords": string[]|null
}

export default async function FetchCards() {

    try {
        const response = await fetch(PROXY_URL+"/data/list/cards");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const cards:CardData[] = await response.json();
        return cards;
    }
    catch (err) {
        console.error(err);
    }

    return [];
}
