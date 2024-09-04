import PROXY_URL from "./Proxy";

export type StoryData = {
    id: string;
    title: string;
    date: number;
    summary: string;
    description: string;
    releasenote:boolean;
}

export default async function FetchBlog() {

    try {
        const response = await fetch(PROXY_URL+"/data/blog");
        if (response.status !== 200)
            return [];

        const list:StoryData [] = await response.json();
        return list;
    }
    catch (err) {
        console.error(err);
    }

    return [];
}
