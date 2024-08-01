import PROXY_URL from "./Proxy";

export type SampleRoom = {
    "name": string;
    "image": string;
}

let LIST:SampleRoom[]|null = null;

export default async function FetchSampleRooms()
{
    if (LIST !== null)
        return LIST;

    try
    {
        const response = await fetch(PROXY_URL+"/data/samplerooms");
        if (response.status !== 200)
            return [];
        
        const res:SampleRoom[] = await response.json();
        LIST = res;
        return LIST;
    }
    catch(err)
    {
        console.error(err);
    }

    return [];
}
