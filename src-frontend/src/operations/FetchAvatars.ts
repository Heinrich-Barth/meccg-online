
import PROXY_URL from "./Proxy";

export async function FetchAvatars()
{
    try {
        const response = await fetch(PROXY_URL+"/data/list/avatars");
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
