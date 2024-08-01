import PROXY_URL from "../operations/Proxy";

type DictionaryEntry = {
    [key:string] : string;
}

let DictionaryData:DictionaryEntry = { };

const setLanguage = function(lang:string)
{
    if (lang === "es" || lang === "fr")
        localStorage.setItem("lang", lang);
    else if (localStorage.getItem("lang"))
        localStorage.removeItem("lang");
}

const getDefaultLanguage = function()
{
    const val = localStorage.getItem("lang");
    return typeof val === "string" ? val : "";
}

export async function LoadDictionary(lang:string)
{
    /** english may simply use the default texts, so no need to fetch anything */
    if (lang === "")
        lang = getDefaultLanguage();

    if (lang !== "es" && lang !== "fr")
    {
        DictionaryData = { };
        setLanguage(lang);
        return true;
    }

    const res = await fetch(PROXY_URL+"/data/dictionary.json?language=" + lang);
    if (res.status !== 200 && res.status !== 304)
        return false;

    DictionaryData = await res.json();
    setLanguage(lang);
    return true;
}

export default function Dictionary(key:string, def:string)
{
    const val = DictionaryData[key];
    if (typeof val === "string" && val !== "")
        return val;
    else
        return def;
}