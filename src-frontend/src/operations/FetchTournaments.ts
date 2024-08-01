import PROXY_URL from "./Proxy";

export type Tournament = {
    id: string;
    title: string;
}

let tournaments:Tournament[] = [];


export default async function FetchTournaments() {

    try {
        const response = await fetch(PROXY_URL+"/data/tournaments");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const filtered:Tournament [] = await response.json();
        if (filtered)
            tournaments = filtered;
    }
    catch (err) {
        console.error(err);
    }

    return tournaments;
}

export async function FetchTournament(id:string) {

    try {
        const response = await fetch(PROXY_URL+"/data/tournaments/" + id);
        if (response.status !== 200)
            throw new Error("Invalid response");

        const filtered = await response.json();
        if (filtered)
            return filtered;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}