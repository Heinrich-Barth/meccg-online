import PROXY_URL from "./Proxy";

export type ActivePlayer = {
    name: string;
    score: number
}
export type ActiveGame = {
        "room": string;
        "arda": boolean,
        "single": boolean,
        "created": string;
        "time": number;
        "visitors": boolean;
        "accessible": boolean,
        "duration": number,
        "players": ActivePlayer[],
        "avatars": string[]
}

export default async function FetchActiveGames()
{
    try
    {
        const response = await fetch(PROXY_URL + "/data/games");
        if (response.status !== 200)
            return [];
        
        const res:ActiveGame[] = await response.json();
        return res;
    }
    catch(err)
    {
        console.error(err);
    }

    return [];
}
