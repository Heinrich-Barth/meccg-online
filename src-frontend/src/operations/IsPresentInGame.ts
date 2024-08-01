import PROXY_URL from "./Proxy";

type ActionType = "player" | "watcher"

async function PlayerIsAlreadyDoing(room:string, type:ActionType)
{
    try
    {
        const response = await fetch(PROXY_URL + "/play/" + room + "/" + type, {
            credentials: "include",
        });
        return response.status === 204;
    }
    catch(err)
    {
        console.error(err);
    }

    return false;
}

export async function PlayerIsAlreadyPlaying(room:string)
{
    const res = await PlayerIsAlreadyDoing(room, "player");
    return res;
}

export async function PlayerIsAlreadyWatching(room:string)
{
    const res = await PlayerIsAlreadyDoing(room, "watcher");
    return res;
}
