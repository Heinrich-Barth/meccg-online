
import PROXY_URL from "./Proxy";

export interface ISetInformation {
    name: string;
    ice: boolean;
    code: string;
    dc: boolean;
    released: boolean;
    order: number;
}

export interface ISetList {
    [code:string]:ISetInformation
}
export async function FetchSets()
{
    try {
        const response = await fetch(PROXY_URL+"/data/list/sets");
        if (!response.ok)
            throw new Error("Invalid response");

        const map:ISetList = await response.json();
        return map;
    }
    catch (err) {
        console.error(err);
    }

    return { };
}