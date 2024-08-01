import PROXY_URL from "./Proxy";

export interface GameData {
    exists: boolean;
    allowPlayers?: boolean;
    allowSpectator?: boolean;
    avatars?: string[];
    arda?: boolean;
}

export default async function GetGameData(room:string)
{
    try {
        const response = await fetch(PROXY_URL + "/data/games/" + room);
        if (response.status !== 200)
            throw new Error("Invalid response");

        const json:GameData = await response.json();
        if (json)
            return json;
    }
    catch (err) {
        console.error(err);
    }

    const empty:GameData = {
        exists: false
    };

    return empty;
}
