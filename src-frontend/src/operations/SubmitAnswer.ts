import PROXY_URL from "./Proxy";

export async function CheckIfLoggedin()
{
    try{
        const res = await fetch(PROXY_URL+"/authentication", {
            cache: "no-cache",
            credentials: "include",
        });
        return res.ok;
    }
    catch(err)
    {
        console.error(err);
    }
    
    return false;
}

export default async function SubmitAnswer(answer:string)
{
    try
    {
        const response = await fetch(PROXY_URL+"/authentication", {
            method: "POST",
            cache: "no-cache",
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: answer.toLowerCase()
            })
        });
        
        if (response.status === 204)
            return true;
    }
    catch(err)
    {
        console.error(err);
    }

    return false;
}

export async function CacheRequestData(uri:string)
{
    try
    {
        await fetch(PROXY_URL + uri);
    }
    catch(err)
    {
        console.error(err);
    }

    return true;
}
