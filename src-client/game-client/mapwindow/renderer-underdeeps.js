let g_isInit = false;

const MapInstanceRendererUd = {

    _isMovementSelection: true,

    sendResultMovement: function (e) 
    {
        const sCodeStart = e.detail.start;
        const vsRegions = e.detail.regions;
        const sCodeTarget = e.detail.target;

        if (MapInstanceRendererUd._isMovementSelection && (sCodeStart === "" || sCodeTarget === "" || vsRegions.length === 0)) {
            MapInstanceRendererUd.cancel();
        }
        else if (!MapInstanceRendererUd._isMovementSelection && sCodeStart === "") {
            MapInstanceRendererUd.cancel();
        }
        else {
            parent.postMessage({
                type: "set",
                start: sCodeStart,
                regions: vsRegions,
                target: sCodeTarget,
            }, "*");
        }
    },

    cancel: function () 
    {
        parent.postMessage("cancel", {});
    },
    getIsShownOnly : function()
    {
        const query = window.location.search;
        return typeof query !== "undefined" && query.indexOf("only=true") !== -1;
    },
    getStartCode: function () {
        let query = window.location.search;
        let pos = typeof query === "undefined" ? -1 : query.indexOf("=");

        if (pos !== -1)
            return decodeURI(query.substring(pos + 1));
        else
            return "";
    },

    onInitDefault: function (data, tapped, tappedSiteCount) {
        const sCode = MapInstanceRendererUd.getStartCode();
        MapInstanceRendererUd._isMovementSelection = sCode !== "";

        const ignoreSelection = MapInstanceRendererUd.getIsShownOnly();
        if (ignoreSelection)
            document.body.classList.add("maps-app-mode");


        const pMap = new MapViewUnderdeeps(data, tapped, tappedSiteCount);
        pMap.createInstance(sCode);
        pMap.populateSites(sCode);

        document.body.addEventListener("meccg-map-search", pMap.onSearch.bind(pMap), false);


        new MapViewRegionsFilterable().createInstance(data.map);
        g_isInit = true;
    },

    onInit: function (data, tapped, tappedCounts) {

        MapInstanceRendererUd.onInitDefault(data, tapped, tappedCounts);
        g_isInit = true;
    }
};


const showErrorLoading = function (err) 
{
    let error = "Could not load map. Sorry.";
    if (err !== undefined)
    {
        console.err(err);
        if (err.message !== undefined)
            error = err.message;
    }

    document.getElementById("map_view_layer_loading").innerHTML = `<p>${error}</p>`;
};

const getCurrentDate = function()
{
    const sVal = new Date().toISOString();
    const nPos = sVal.indexOf("T");
    if (nPos === -1)
        return "" + Date.now();
    else
        return sVal.substring(0, nPos);
}


const fetchFromLocalStorage = function()
{
    if (localStorage.getItem("game_data"))
    {
        try
        {
            return JSON.parse(localStorage.getItem("game_data")).underdeeps;
        }
        catch(err)
        {
            console.error(err);
        }
    }

    return null;
}

const fetchMap = function (tappedSites, tappedSiteCount) 
{
    const localData = fetchFromLocalStorage();
    if (localData !== null)
    {
        MapInstanceRendererUd.onInit(localData, tappedSites, tappedSiteCount);
        return;
    }

    fetch("/data/list/underdeeps?t=" + getCurrentDate()).then((response) => {
        if (response.status === 200)
            response.json().then((map) => MapInstanceRendererUd.onInit(map, tappedSites, tappedSiteCount));
        else
            throw new Error("Could not load map");
    }).catch((err) => showErrorLoading(err));
};

const fetchTappedSites = function () 
{
    if (g_isInit)
        return;

    let sites = { };

    fetch("/data/list/sites-tapped", {
        cache: "no-store"
    })
    .then((response) => response.ok ? response.json() : Promise.resolve({}))
    .then(tapped => {
        sites = tapped;

        return fetch("/data/list/sites-tapped/count", {
            cache: "no-store"
        });
    })
    .then((r) => r.ok ? r.json() : Promise.resolve({}))
    .then((counts) => fetchMap(sites, counts))
    .catch((err) => showErrorLoading(err));
};


const onKeyUp = function(ev) 
{
    let code = "";
    if (ev.key !== undefined)
        code = ev.key;
    else if (ev.keyIdentifier !== undefined)
        code = ev.keyIdentifier;

    switch (code) {
        /* ESC */
        case "Escape":
            MapInstanceRendererUd.cancel();
            break;

        /* ENTER */
        case "Enter":
            const elem = document.getElementById("movement_accept");
            if (elem !== null)
                elem.dispatchEvent(new Event('click'));
            else
                MapInstanceRendererUd.cancel();
            break;

        default:
            break;
    }
};

document.body.addEventListener("keyup", onKeyUp, false);
document.body.addEventListener("meccg-map-selected-movement", MapInstanceRendererUd.sendResultMovement, false);
document.body.addEventListener("meccg-map-cancel", MapInstanceRendererUd.cancel, false);

(function () {
    fetchTappedSites();
})();