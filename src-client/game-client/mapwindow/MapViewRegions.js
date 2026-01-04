

/**
 * Add region marker and add site layers per region.
 * If a region is clied, the sites in it will be shown in a list
 * and if a site is clicked, it will be added to the movement
 */
class MapViewRegions extends MapView {

    constructor(jMap)
    {
        super("regions");

        this.MARKER = {
            region : null,
            free : null,
            border : null,
            dark : null,
            ruins : null,
            shadow : null,
            any : null,
            darkhaven : null,
            elfhold : null,
            haven : null,
            lordhaven : null,
            wizardhaven : null,
            pos_start : null,
            pos_end : null,
            regions: {

            }
        };

        this.jMap = jMap.map === undefined ? {} : jMap.map;
        this.jMapSiteRegion = jMap.mapregions === undefined ? {} : jMap.mapregions;

        this.jMarkerRegions = {};
        this.jMarkerSites = {};
        this.jMarkerUnderdeeps = {};

        this.activeRegion = "";
        this.vsVisibleSites = [];
        this.vsVisibleUnderdeeps = [];
    }
    
    getMapData()
    {
        return this.jMap;
    }

    #fireRegionClick(sRegionTitle)
    {
        if (sRegionTitle !== "" && typeof this.jMarkerRegions[sRegionTitle] !== "undefined")
            this.jMarkerRegions[sRegionTitle].fire('click');
    }

    getStartupLat()
    {
        return 77.29788306692042;
    }

    getStartLon()
    {
        return -107.138671875;
    }

    createInstance()
    {
        const LeafIconPosition = L.Icon.extend(
        {
            options: 
            {
                shadowUrl: "/media/maps/marker/leaf-shadow.png",
                iconSize:     [38, 95],
                shadowSize:   [50, 64],
                iconAnchor:   [22, 94],
                shadowAnchor: [4, 62],
                popupAnchor:  [-3, -76]
            }
        });
        
        this.MARKER.pos_start = new LeafIconPosition({iconUrl: '/media/maps/marker/leaf-green.png'});
        this.MARKER.pos_end = new LeafIconPosition({iconUrl: '/media/maps/marker/leaf-red.png'});

        let LeafIcon = L.Icon.extend(
        {
            options: 
            {
                iconUrl: "",
                shadowUrl: '/media/maps/marker/marker-shadow.png',
                iconSize:     [25, 41], // size of the icon
                shadowSize:   [41, 41], // size of the shadow
                iconAnchor:   [24, 41], // point of the icon which will correspond to marker's location
                shadowAnchor: [24, 24],  // the same for the shadow
                popupAnchor:  [-3, -41] // point from which the popup should open relative to the iconAnchor
            }
        });
        
        this.MARKER.region = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon-red.png"});
        this.MARKER.free = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon-free.png"});
        this.MARKER.border = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon-border.png"});
        this.MARKER.dark = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon-dark.png"});
        this.MARKER.ruins = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon-ruins.png"});
        this.MARKER.shadow = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon-shadow.png"});
        this.MARKER.haven = new LeafIcon({iconUrl: "/media/maps/marker/marker-icon.png"});
        LeafIcon = L.Icon.extend({
                options: 
                {
                    iconUrl: "",
                    className: 'map-region-icon',
                    shadowUrl: '/media/maps/marker/marker-shadow.png',
                    iconSize:     [27, 42], // size of the icon
                    shadowSize:   [41, 41], // size of the shadow
                    iconAnchor:   [24, 41], // point of the icon which will correspond to marker's location
                    shadowAnchor: [24, 24],  // the same for the shadow
                    popupAnchor:  [-3, -41] // point from which the popup should open relative to the iconAnchor
                }
        });

        this.MARKER.regions.bl = new LeafIcon({iconUrl: "/media/maps/marker/region-border.png"});
        this.MARKER.regions.cs = new LeafIcon({iconUrl: "/media/maps/marker/region-coast.png"});
        this.MARKER.regions.cscs = new LeafIcon({iconUrl: "/media/maps/marker/region-coast-coast.png"});
        this.MARKER.regions.cscscs = new LeafIcon({iconUrl: "/media/maps/marker/region-coast-coast-coast.png"});
        this.MARKER.regions.dd = new LeafIcon({iconUrl: "/media/maps/marker/region-dark.png"});
        this.MARKER.regions.de = new LeafIcon({iconUrl: "/media/maps/marker/region-sunland.png"});
        this.MARKER.regions.wi = new LeafIcon({iconUrl: "/media/maps/marker/region-wilder.png"});
        this.MARKER.regions.wiwi = new LeafIcon({iconUrl: "/media/maps/marker/region-wilder-wilder.png"});
        this.MARKER.regions.fd = new LeafIcon({iconUrl: "/media/maps/marker/region-free.png"});
        this.MARKER.regions.ju = new LeafIcon({iconUrl: "/media/maps/marker/region-sunland.png"});
        this.MARKER.regions.sl = new LeafIcon({iconUrl: "/media/maps/marker/region-shadow.png"});

        if (!super.createInstance())
            return false;
    
        this.#loadExistingMarker(this.jMap);
        this.#showRegionMarker();

        document.body.addEventListener("meccg-map-search", this.onSearch.bind(this), false);
        return true;
    }

    onSearch(e)
    {
        const region = e.detail.region;
        if (region !== "")
            this.#fireRegionClick(region);
    }

    #destroyMarker(jMarkers)
    {
        const pMap = this.getMapInstance();
        if (pMap === null || jMarkers === undefined)
            return;

        for (let key in jMarkers)
        {
            if (pMap.hasLayer(jMarkers[key]))
                pMap.removeLayer(jMarkers[key]);

            delete jMarkers[key];
        }
    }

    destroy()
    {
        this.#destroyMarker(this.jMarkerRegions);
        this.#destroyMarker(this.jMarkerSites);
        this.#destroyMarker(this.jMarkerUnderdeeps);

        this.jMarkerRegions = {};
        this.jMarkerSites = {};
        this.jMarkerUnderdeeps = {};      
        
        super.destroy();
    }

    #showRegionMarker()
    {
        for (const key in this.jMarkerRegions)
            this.#showRegionMarkerElement(this.jMarkerRegions[key]);
    }

    #showRegionMarkerElement(pMarker)
    {
        pMarker.on("popupopen", this.#onClickRegionMarker.bind(this));
        pMarker.on("popupclose", this.#onClickRegionMarkerClose.bind(this));
        pMarker.addTo(this.getMapInstance());
    }

    #onClickRegionMarkerClose()
    {
        this.#hideVisibleSites();
        this.#showSitesInRegion("");
        document.body.dispatchEvent(new CustomEvent("meccg-map-hide-images", { "detail":  "" }));
    }

    /**
     * Load existing markers from the map json and create instances
     * to be shown on the map 
     * 
     * @param jMap Map
     */
    #loadExistingMarker(jMap)
    {
        let _region;
        for (let key in jMap)
        {
            _region = jMap[key];
            if (typeof _region.area === "undefined")
                continue;
                
            if (_region.area.length === 2)
                this.#createMarker(key, "", _region.area[0], _region.area[1], _region, false);
                
            for (let _site in jMap[key].sites)
            {
                _region = jMap[key].sites[_site];
                if (_region.area.length === 2)
                    this.#createMarker(key, _site, _region.area[0], _region.area[1], _region, true);
            }
        }
    }

    static #showSiteMarker()
    {
        return sessionStorage.getItem("show_sitemarker") === "true";
    }

    #showSitesInRegion(regionCode)
    {
        this.activeRegion = regionCode;

        const bShowSiteMarker = MapViewRegions.#showSiteMarker();
        this.vsVisibleSites = this.#showSiteMarkersInRegion(this.jMarkerSites[regionCode], bShowSiteMarker)
        this.vsVisibleUnderdeeps = this.#showSiteMarkersInRegion(this.jMarkerUnderdeeps[regionCode], bShowSiteMarker);
    }

    #showSiteMarkersInRegion(jSites, bShowSiteMarker)
    {
        if (jSites === undefined)
            return [];

        const vsList = [];
        for (let key in jSites)
        {
            if (bShowSiteMarker)
                jSites[key].addTo(this.getMapInstance());

            vsList.push(key);
        }

        return vsList;
    }

    #onRegionClick(regionCode)
    {
        if (regionCode === undefined || regionCode === "" || this.activeRegion === regionCode)
            return;
        
        this.#hideVisibleSites();
        this.#showSitesInRegion(regionCode);
    }

    #hideVisibleSites()
    {
        if ((this.vsVisibleUnderdeeps.length === 0 && this.vsVisibleSites.length === 0) || this.activeRegion === "")
            return;
        
        const regionCode = this.activeRegion;
        if (typeof this.jMarkerSites[regionCode] === "undefined")
            return;

        let list = this.vsVisibleSites;
        let jRegion = this.jMarkerSites[regionCode];
        for (const _elem of  list)
            jRegion[_elem].remove();
        
        list = this.vsVisibleUnderdeeps;
        jRegion = this.jMarkerUnderdeeps[regionCode];
        for (const _elem of list)
            jRegion[_elem].remove();

        this.vsVisibleSites = [];
        this.vsVisibleUnderdeeps = [];
    }

    #createMarkerElement(markerText, lat, lon, _marker, sSiteTitle)
    {
        let elem;
        if (_marker !== null)
            elem = L.marker([lat,lon], {icon: _marker});
        else
            elem = L.marker([lat,lon]);
        
        elem.bindPopup(markerText);

        if (sSiteTitle !== "")
            elem.on("click", this.#onSiteMarkerClick.bind(this));
        else
            elem.on("contextmenu", this.#onRegionContextClick.bind(this));

        return elem;
    }

    #onRegionContextClick(e)
    {
        this.#onRegionContextClickRegion(e.target.region);
    }

    #onRegionContextClickRegion(e)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-regioncontextclick", { "detail":  {
            region: e
        } }));
    }

    #onSiteMarkerClick(e)
    {
        this.flyTo(e);
        
        /** show site popup only if no site marker are to be shown - otherwise, it gets in the way of some markers */
        if (!MapViewRegions.#showSiteMarker())
            e.openPopup();

        this.#dispatchClickEvent(e.target.region, e.target.site, false);
    }

    #dispatchClickEvent(region, site, isRegion)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-map-show-images", { "detail":  {
            region: region,
            site : site,
            isRegion : isRegion
        } }));
    }

    #getTargetMakerJson(region, site, jSiteCard)
    {
        if (site === "" || jSiteCard === null)
            return this.jMarkerRegions;

        const isUnderdeep = jSiteCard === null || typeof jSiteCard["underdeep"] === "undefined" ? false : jSiteCard.underdeep;
        if (isUnderdeep)
        {
            if (typeof this.jMarkerUnderdeeps[region] === "undefined")
                this.jMarkerUnderdeeps[region] = {};
            
            return this.jMarkerUnderdeeps[region];
        }
        else
        {
            if (typeof this.jMarkerSites[region] === "undefined")
                this.jMarkerSites[region] = {};
            
            return this.jMarkerSites[region];
        }
    }
    
    #onClickRegionMarker(e)
    {        
        this.#onRegionClick(e.target.region);
        this.flyTo(e);
        this.#dispatchClickEvent(e.target.region, e.target.site, true);
    }

    #obtainRegionMarker(type)
    {
        if (type !== undefined && type !== "" && this.MARKER.regions[type] !== undefined)
            return this.MARKER.regions[type];
        else
            return this.MARKER.region;
    }

    #createMarker(region, site, lat, lon, jSiteCard, isSiteCard)
    {              
        const jMarkers = this.#getTargetMakerJson(region, site, jSiteCard);

        const id = site === "" ? region : site;
        if (typeof jMarkers[id] !== "undefined")
        {
            if (this.getMapInstance().hasLayer(jMarkers[id]))
            {
                this.getMapInstance().removeLayer(jMarkers[id]);
                delete jMarkers[id];
            }
        }
        
        let _marker = null;
        if (site === "")
        {
            _marker = this.#obtainRegionMarker(this.jMap[region].region_type);
            this.jMap[region].area = [lat,lon];
        }
        else
        {
            this.jMap[region].sites[site].area = [lat,lon];
            _marker = this.#getSiteHoldMarker(this.jMap[region].sites[site]);
        }

        const markerText = this.#getPlayableText(region, site, isSiteCard);
        const elem = this.#createMarkerElement(markerText, lat, lon, _marker, site, region)
        
        elem.region = region;
        if (site !== "")
            elem.site = site;

        jMarkers[id] = elem;
        return jMarkers[id];
    }

    #getPlayableText(regionTitle, siteTitle, isSiteCard)
    {
        const html = document.createElement("div");

        if (isSiteCard)
        {
            const title = document.createElement("b");
            title.innerText = siteTitle;
            html.appendChild(title);
        }
        else
        {
            const title = document.createElement("b");
            title.innerText = regionTitle;

            const span = document.createElement("span");
            span.classList.add("map-view-regionmarker-contextaction");
            span.innerText = "Add to site path [right click]";

            html.append(
                title,
                document.createElement("br"),
                span
            );
        }

        return html.innerHTML;
    }

    setStartingSite(sStartSiteCode)
    {
        const jRegion = this.getRegionBySiteCode(sStartSiteCode);
        const sRegionTitle = jRegion !== null ? jRegion.title : "";
        
        this.#fireRegionClick(sRegionTitle);
    }

    #getSiteHoldMarkerByHold(jSite)
    {
        let sCode = null;
        if (typeof jSite.hero !== "undefined")
            sCode = jSite.hero.hold;
        else if (typeof jSite.minion !== "undefined")
            sCode = jSite.minion.hold;
        else if (typeof jSite.balrog !== "undefined")
            sCode = jSite.balrog.hold;

        return sCode === null || typeof sCode === "undefined" ? null : sCode;
    }

    #getSiteHoldMarker(jSite)
    {
        const sCode = this.#getSiteHoldMarkerByHold(jSite);
        switch(sCode)
        {
            case "Border-hold":
                return this.MARKER.border;
                
            case "Dark-hold":
                return this.MARKER.dark;
                
            case "Free-hold": 
                return this.MARKER.free;
                
            case "Ruins & Lairs":
                return this.MARKER.ruins;
                
            case "Shadow-hold": 
                return this.MARKER.shadow;

            case "Darkhaven": 
            case "Elf-hold":
            case "Haven": 
            case "Lordhaven": 
            case "Wizardhaven":
            default:
                break;
        }
        
        return this.MARKER.haven;
    }

    preselectRegionSite(sSite)
    {
        const _region = this.getRegionBySiteCode(sSite);
        if (_region !== null)
            this.#fireRegionClick(_region.title);
    }

    /**
     * Get a reggion by its site code
     * @param {String} sCode Site code
     */
     getRegionBySiteCode(sCode)
     {
         if (sCode === ""  || typeof this.jMapSiteRegion[sCode] === "undefined")
             return null;
         else
         {
             const sRegionCode = this.jMapSiteRegion[sCode];
             return this.jMap[sRegionCode];
         }
     }
     
     /**
      * Get the Region json by given code
      * @param {String} sRegionCode
      * @return {json} json or null
      */
     getRegionByCode(sRegionCode)
     {
         let _region;
         for (let key in this.jMap)
         {
             _region = this.jMap[key];
             if (_region.code === sRegionCode)
                 return _region;
         }
         
         return null;
     }
}

