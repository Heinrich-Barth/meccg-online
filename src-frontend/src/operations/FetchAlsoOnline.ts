import PROXY_URL from "./Proxy";

export type AlsoOnlineInfo = {
    name:string;
    avatar:string;
}

export default async function FetchAlsoOnline()
{
    try
    {
        const response = await fetch(PROXY_URL+"/data/online");
        if (response.status === 200)
        {
            const list:AlsoOnlineInfo[] = await response.json();
            return list;
        }
    }
    catch(err)
    {
        console.error(err);
    }

    return [];
}
