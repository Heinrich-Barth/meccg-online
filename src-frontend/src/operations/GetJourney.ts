import PROXY_URL from "./Proxy";

export type JourneyStation = {
    day: number;
    text: string;
    cards: string[];
}

export default async function GetJourney()
{
    const stations:JourneyStation[] = [];

    try 
    {
        const res = await fetch(PROXY_URL+"/media/journey.txt");
        if (!res.ok)
            throw new Error("Could not fetch stations");

        const text = await res.text();
        for (const entry of text.split("\n"))
        {
            const parts = entry.split(";");
            const data:JourneyStation = {
                day: parseInt(parts[0]),
                text: parts[1].trim(),
                cards: []
            }

            for (let i = 2; i < parts.length; i++)
                data.cards.push(parts[i]);

            stations.push(data);
        }
        
    }
    catch(e:any)
    {
        console.warn(e.message ?? e);
    }
    
    return stations;
}