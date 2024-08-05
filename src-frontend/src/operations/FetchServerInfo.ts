import PROXY_URL from "./Proxy";

export type SampleRoom = {
    "name": string;
    "image": string;
}

type ServerInfo = {
    autoRestart:boolean;
    games:number;
    startup:string;
    uptime:number
}

let DATA:ServerInfo|null = null;

export default async function FetchServerInfo()
{
    if (DATA !== null)
        return DATA.uptime;

    try
    {
        const response = await fetch(PROXY_URL+"/data/health");
        if (response.status !== 200)
            return [];
        
        const res:ServerInfo = await response.json();
        DATA = res;
        return res.uptime;
    }
    catch(err)
    {
        console.error(err);
    }

    return -1;
}
