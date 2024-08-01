import PROXY_URL from "./Proxy";

const randomNumber = function (max: number) {
    return max <= 1 ? 0 : Math.floor(Math.random() * max);
};

export default async function FetchSampleName() {

    try {
        const response = await fetch(PROXY_URL+"/data/samplenames");
        if (response.status !== 200)
            throw new Error("Invalid response");

        const filtered = await response.json();

        if (filtered.length > 0)
            return filtered[randomNumber(filtered.length)];
    }
    catch (err) {
        console.error(err);
    }

    return "";
}
