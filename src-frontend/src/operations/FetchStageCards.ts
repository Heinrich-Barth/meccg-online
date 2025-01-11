import PROXY_URL from "./Proxy";

export async function FetchStageCards()
{
    try {
        const response = await fetch(PROXY_URL+"/data/list/stages");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const images:string[] = await response.json();
        return images;
    }
    catch (err) {
        console.error(err);
    }

    return []
}
