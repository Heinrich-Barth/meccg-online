import PROXY_URL from "./Proxy";

export type SampleRoom = {
    "name": string;
    "image": string;
}

export type ServerInfo = {
    autoRestart:boolean;
    games:number;
    startup:string;
    uptime:number;
    uptimeHrs:number;
}

let DATA:ServerInfo|null = null;

export default async function FetchServerInfo()
{
    try
    {
        const response = await fetch(PROXY_URL+"/data/health");
        if (response.status === 200)
            return (await response.json()) as ServerInfo;
    }
    catch(err)
    {
        console.error(err);
    }

    return null;
}
