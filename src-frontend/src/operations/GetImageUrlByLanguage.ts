import PROXY_URL from "./Proxy";
let URL_LANGUAGE_FR = "";

export default function GetImageUri(uri:string)
{
    const lang = localStorage.getItem("meccg_cards");
    if (!lang || !uri.startsWith("https://"))
        return uri;

    const parts = uri.split("/en-remaster/");
    if (parts.length !== 2)
        return uri;

    if (lang === "cards-es")
        parts.join("/es-remaster/");

    if (lang === "cards-fr" && URL_LANGUAGE_FR !== "")
        return URL_LANGUAGE_FR + "/" + parts[1];

    return uri;
}


export async function FetchFrenchImageUrl()
{
    if (URL_LANGUAGE_FR !== "")
        return true;

    try
    {
        const response = await fetch(PROXY_URL+"/data/fr");
        if (response.status !== 200)
            return false;

        const json:any = await response.json();
        if (json.value)
            URL_LANGUAGE_FR = json.value;
    }
    catch(err)
    {
        /** ignor error */
    }

    return true;
}