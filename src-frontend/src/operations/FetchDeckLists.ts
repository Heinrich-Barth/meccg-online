import { DeckEntry, DeckData } from "../application/Types";
import PROXY_URL from "./Proxy";

export default async function FetchDeckList()
{
    try {
        const response = await fetch(PROXY_URL+"/data/decks");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const list:DeckEntry[] = await response.json();
        return list;
    }
    catch (err) {
        console.error(err);
    }

    return [];
}

export async function FetchDeckById(id:string)
{
    try {
        if (id === "")
            throw new Error("Invalid id");

        const response = await fetch(PROXY_URL + "/data/decks/" + id);
        if (response.status === 404)
            throw new Error("Could not find deck by its id.");
        else if (response.status !== 200)
            throw new Error("Invalid response");

        const deck:DeckData = await response.json();
        if (deck && typeof deck.deck === "string")
            return deck;
    }
    catch (err) {
        console.error(err);
    }

    return { deck: "", images:{ }}
}
