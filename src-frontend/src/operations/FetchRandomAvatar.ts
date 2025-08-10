import PROXY_URL from "./Proxy";

export type IRandomAvatarData = {
    code: string;
    image: string;
}

export default async function FetchRandomAvatar()
{
    try {
        const response = await fetch(PROXY_URL+"/data/randomcharacter");
        if (!response.ok)
            throw new Error("Invalid response");

        const json:IRandomAvatarData = await response.json();
        return json;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}
