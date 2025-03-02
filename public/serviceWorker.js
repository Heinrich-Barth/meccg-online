/**
 * This code is heavily influenced by 
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 */
const CACHE_NAME = "v4";
const CACHE_CARDS = "v4Images";

/**
 * List of urls to cache
 */
const assets = [
    "/data/samplerooms",
    "/data/backside",
    "/data/list/map",
    "/data/list/underdeeps",
    "/data/list/cards",
    "/data/list/avatars",
    "/data/list/gamedata",
    "/data/list/sites",
    "/data/list/images",
]

const STRATEGY_CACHEFIRST_IMAGE = 1;
const STRATEGY_CACHEFIRST_LOCAL = 2;
const STRATEGY_NETWORKFIRST = 3;
const STRATEGY_IGNORE = 4;
const STRATEGY_CLEAR = -5;

const getUri = function(url)
{
    let pos = url.indexOf("//");
    if (pos !== -1)
        pos = url.indexOf("/", pos + 3); // http://w

    if (pos === -1)
        return "";

    return url.substring(pos);
}

const uriStartsWith = function(uri, paths)
{
    for (let path of paths)
    {
        if (uri.startsWith(path))
            return true;
    }

    return false;
}

const URIS_IMAGE_LOCAL = [
    "/media/maps", 
    "/media/assets/js",
    "/media/assets/fonts",
    "/media/personalisation/dice",
    "/media/personalisation/backgrounds",
    "/media/personalisation/sounds",
    "/data/samplerooms",
    "/data/backside",
    "/data/card-not-found-",
    "/data/list/map",
    "/data/list/underdeeps",
    "/data/list/cards",
    "/data/list/avatars",
    "/data/list/gamedata",
    "/data/list/sites",
    "/data/list/images",
];

const URIS_NETWORK_FIRST = [
    "/static/frontend",
    "/static/media",
]

const identifyCacheStrategy = function(event)
{
    /*
        This would be awesome, but the cache is limited so we cannot cache all images.
        Hence, do not cache at all, because there is no benefit...
        if (event.request.url.startsWith("https://raw.githubusercontent.com") && event.request.url.endsWith(".jpg"))
            return STRATEGY_CACHEFIRST_IMAGE;
    */
    
    const uri = getUri(event.request.url);
    /*
        This would be awesome, but the cache is limited so we cannot cache all images.
        Hence, do not cache at all, because there is no benefit...
        if (uri.startsWith("/cards"))
            return STRATEGY_CACHEFIRST_IMAGE;
    */
    if (uri === "/data/clearcache")
        return STRATEGY_CLEAR;

    if (uriStartsWith(uri, URIS_IMAGE_LOCAL))
        return STRATEGY_CACHEFIRST_LOCAL;

    if (uriStartsWith(uri, URIS_NETWORK_FIRST))
        return STRATEGY_NETWORKFIRST;

    return STRATEGY_IGNORE
}

const requestImage = async function(request)
{
    if (!request.url.startsWith("https://raw.git"))
        return fetch(request.clone());
    
    const networkResponse = await fetch(request.clone(), { mode: "no-cors" });
    if ( networkResponse.type !== "opaque" && networkResponse.ok === false ) 
        throw new Error("Cannot fetch image");   

    return networkResponse;
}

const networkFirst = async (request, preloadResponsePromise) => 
{
    const cache = await caches.open(CACHE_NAME);

    try
    {
        const responseFromNetwork = await fetch(request.clone(), { mode: 'cors' });
        if (responseFromNetwork.ok) 
        {
            await updateCache(cache, request, responseFromNetwork);
            return responseFromNetwork;
        }
    }
    catch (err)
    {
        console.error(err.message);
    }

    if (preloadResponsePromise)
    {
        try
        {
            /* Try to use and cache the preloaded response, if it's there */
            const preloadResponse = await preloadResponsePromise;
            if (preloadResponse) 
            {
                await updateCache(cache, request, preloadResponse);
                return preloadResponse;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }    
    }

    return await cache.match(request);
}

const cacheCardImageFirst = async ({ request, preloadResponsePromise, _fallbackUrl }) => 
{
    const cache = await caches.open(CACHE_CARDS);
    const responseFromCache = await cache.match(request);
    if (responseFromCache)
        return responseFromCache;

    if (preloadResponsePromise)
    {
        try
        {
            /* Try to use and cache the preloaded response, if it's there */
            const preloadResponse = await preloadResponsePromise;
            if (preloadResponse) 
            {
                await updateCache(cache, request, preloadResponse);
                return preloadResponse;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }    
    }

    try
    {
        const networkResponse = await requestImage(request);
        await updateCache(cache, request, networkResponse);
        return networkResponse;    
    }
    catch(err)
    {
        console.warn(err.message);
    }
    
    return fetch("/data/card-not-found-generic");
}

const updateCache = async function(cache, request, networkResponse)
{
    try
    {
        await cache.put(request, networkResponse.clone());
    }
    catch (err)
    {
        console.warn(err.message);
    }
}

/**
 * Try to obtain object from cache first. If it does not exist, fetch and cache it
 * @param {Objects} param0 
 * @returns Response
 */
const cacheFirst = async ({ request, preloadResponsePromise }) => 
{
    /* Check cache first */
    const cache = await caches.open(CACHE_NAME);
    const responseFromCache = await cache.match(request);
    if (responseFromCache)
        return responseFromCache;

    /* Try to use and cache the preloaded response, if it's there */
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) 
    {
        await updateCache(cache, request, preloadResponse);
        return preloadResponse;
    }

    /* Try to fetch the element */
    try 
    {
        const responseFromNetwork = await fetch(request.clone(), { mode: 'cors' });
        if (responseFromNetwork.ok) 
        {
            /* response may be used only once we need to save clone to put one copy in cache and serve second one*/
            await updateCache(cache, request, responseFromNetwork);
            return responseFromNetwork;
        }
    }
    catch (error) 
    {
        console.warn(error.message);
    }

    /* generic error. we cannot do anything */
    return new Response("Network error happened", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
    });
};

/**
 * Fetch Handler
 * @param {Event} event 
 */
const fetchListener = function (event) 
{
    const strategy = identifyCacheStrategy(event);
    if (strategy === STRATEGY_CACHEFIRST_LOCAL)
    {
        event.respondWith(
            cacheFirst({
                request: event.request,
                preloadResponsePromise: event.preloadResponse,
                fallbackUrl: "",
            })
        );
    }
    else if (strategy === STRATEGY_CACHEFIRST_IMAGE)
    {
        event.respondWith(
            cacheCardImageFirst({
                request: event.request,
                preloadResponsePromise: event.preloadResponse,
            })
        );
    }
    else if (strategy === STRATEGY_NETWORKFIRST)
    {
        event.respondWith(
            networkFirst(event.request, event.preloadResponse)
        );
    }
    else if (strategy === STRATEGY_CLEAR)
    {
        event.respondWith(clearAllCaches());
    }
}

const isValidCache = function(name)
{
    return name === CACHE_CARDS || name === CACHE_NAME;
}

async function clearAllCaches()
{
    const keys = await caches.keys();
    for (let key of keys)
    {
        try
        {
            await caches.delete(key);
            console.info("Cleared chache " + key);
        }
        catch (err)
        {
            console.error(err.message);
        }
    }

    return new Response(null, { status: 204 });
}

/**
 * Invalidate records matchinf actual version
 *
 * @param {Cache} caches
 * @returns {Promise}
 */
async function clearObsoleteCaches( caches ) 
{
    let removed = 0;
    const keys = await caches.keys();
    for (let key of keys)
    {
        if (!isValidCache(key))
        {
            console.info("Clearing obsolete cache", key);
            await caches.delete(key);
            removed++;
        }
    }

    console.info(removed + " obsolete chaches");
}

const prepareCaches = async function(caches)
{
    const regularCache = await caches.open(CACHE_NAME);
    const cardCache = await caches.open(CACHE_CARDS);

    if (assets.length > 0)
    {
        console.info("Caching assets");
        await regularCache.addAll(assets);
    }
}
/**
 * Register listeners
 */
self.addEventListener("install", installEvent => {
    installEvent.waitUntil(prepareCaches(caches).catch(console.warn));
});

/** remove old caches */
self.addEventListener( "activate", (event) => {
    event.waitUntil(clearObsoleteCaches(caches));
});

self.addEventListener("fetch", fetchListener);


