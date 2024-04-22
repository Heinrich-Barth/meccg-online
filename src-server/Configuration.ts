import * as fs from 'fs';
import { join } from "path";

const ROOT_DIRECTORY = join(__dirname + "/..");

export function getRootFolder()
{
    return ROOT_DIRECTORY;
}

class Configuration 
{
    #csp_header:string;
    #csp_self:string;
    #isProd:boolean;
    #maxRooms:number;
    #mapPositions;
    #port;
    #maxPlayersPerRoom;    
    #hasLocaLImages:boolean;
    #imageUrl;
    #hasLocaLCards;
    #cardsUrl;

    constructor()
    {
        this.#csp_header = "";
        this.#csp_self = "";
        this.#isProd = process.env.NODE_ENV === "production";
        this.#maxRooms = parseInt(Configuration.assertString(process.env.ROOMS, "10"));
        this.#mapPositions = Configuration.#obtainMapPositionFile();
        this.#port = Configuration.assertString(process.env.PORT, "8080");
        this.#maxPlayersPerRoom = parseInt(Configuration.assertString(process.env.PLAYER, "10"));

        if(Configuration.#checkHasLocalImages())
        {
            this.#hasLocaLImages = true;
            this.#imageUrl = "/data-images";
        }
        else
        {
            this.#hasLocaLImages = false;
            this.#imageUrl = Configuration.#assertUrlOrDirectory(process.env.IMAGE_PATH);
        }
        
        this.#hasLocaLCards = true;
        this.#cardsUrl = getRootFolder() + "/data-local/cards.json";
    }

    getRequestTimeout():number
    {
        try
        {
            const sTimeout = process.env.REQ_TIMEOUT ?? "";
            const seconds = sTimeout === "" ? 0 : parseInt(sTimeout);
            if (seconds > 0)
                return seconds;   
        }
        catch(error)
        {
            console.error(error);
        }

        return 20;
    }
    
    static #obtainMapPositionFile():string
    {
        try
        {
            if (fs.existsSync(getRootFolder() + "/data/map-positions.json"))
                return getRootFolder() + "/data/map-positions.json";
            else if (fs.existsSync(getRootFolder() + "/data-local/map-positions.json"))
                return getRootFolder() + "/data-local/map-positions.json";
            else
                return "";
        }
        catch (err)
        {
            console.warn(err);
        }

        return "";
    }

    static assertString(input:any, def:string = "")
    {
        if (typeof input !== "string" || input === "")
            return def;
        else
            return input;
    }

    static #assertUrlOrDirectory(input:any)
    {
        let val = Configuration.assertString(input, "");
        if (val === "" || val.indexOf("..") !== -1)
            return "";
        else if (val.indexOf("//") > -1)
            return val;
        else if (val.startsWith("/"))
            return getRootFolder() + val;
        else 
            return getRootFolder() + "/" + val;
    }

    isValid(input:string)
    {
        return typeof input === "string" && input !== "";
    }

    loadFromJson(json:any)
    {
        if (json === null)
            return;

        if (this.isValid(json.image_path))
            this.#imageUrl = json.image_path;

        if (this.isValid(json.cardsUrl) && !this.#hasLocaLCards)
            this.#cardsUrl = json.cardsUrl;
    }

    readJson(sFile:string)
    {
        try
        {
            return JSON.parse(fs.readFileSync(sFile, 'utf8'));
        }
        catch (err:any)
        {
            console.warn(err.message);
        }

        return null;
    }

    mapPositionsFile():string
    {
        return this.#mapPositions;
    }

    port():string
    {
        return this.#port;
    }

    maxRooms():number
    {
        return this.#maxRooms;
    }

    maxPlayersPerRoom():number
    {
        return this.#maxPlayersPerRoom;
    }
    
    isProduction():boolean
    {
        return this.#isProd;
    }

    hasLocalImages():boolean
    {
        return this.#imageUrl !== "" && this.#imageUrl.indexOf("//") === -1;
    }

    imageFolder():string
    {
        return this.#imageUrl.indexOf("//") !== -1 ? "" : this.#imageUrl;
    }

    imageUrl():string
    {
        return this.#imageUrl.indexOf("//") !== -1 ? this.#imageUrl : "/data/images";
    }

    extractDomain(sInput:string):string
    {
        if (sInput === undefined || sInput === null || sInput.trim() === "")
            return "";

        let pos = sInput.indexOf("://");
        if (pos === -1)
            return "";
        else
            pos += 4;

        pos = sInput.indexOf("/", pos);
        if (pos === -1)
            return sInput;
        else
            return sInput.substring(0, pos).trim();        
    }

    imageDomain():string
    {
        return this.extractDomain(this.#imageUrl);
    }

    /**
     * URL to load cards JSON 
     * @returns String
     */
    cardUrl():string
    {
        return this.#cardsUrl;
    }

    joinMap(jEntries:any):string
    {
        let sVal = "";
        for (let key in jEntries) 
        {
            if (jEntries[key] !== "")
                sVal += key + " " + jEntries[key] + "; ";
        }
        
        return sVal.trim();
    }

    getCspImageValue():string
    {
        const val = this.readJson(getRootFolder() + "/data-local/csp-data.json");
        if (val === null || val.image == undefined || val.image == null || val.image.indexOf("\"") !== -1)
            return "";
        else
            return val.image;
    }

    createContentSecurityPolicyMegaAdditionals():string
    {
        if (this.#csp_header === "")
        {
            const jEntries = {
                "default-src" : "'none'",
                "style-src": "'self'",
                "connect-src": "'self'",
                "font-src": "'self'",
                "media-src": "'self'",
                "script-src": "'self' 'nonce-START'",
                "frame-src": "'self'",
                "manifest-src": "'self'",
                "img-src": "'self' data: " + this.imageDomain(),
                "report-uri": "/csp-violation"
            };

            jEntries["img-src"] += " " + this.getCspImageValue();
            jEntries["img-src"] = jEntries["img-src"].trim();

            jEntries["connect-src"] += " " + this.getCspImageValue();
            jEntries["connect-src"] = jEntries["connect-src"].trim();

            this.#csp_header = this.joinMap(jEntries);                
        }

        return this.#csp_header;
    }

    createContentSecurityPolicySelfOnly():string
    {
        if (this.#csp_self === "")
        {
            const jEntries = {
                "default-src": "'none'",
                "font-src": "'self'",
                "script-src": "'self'",
                "connect-src": "'self'",
                "media-src": "'self'",
                "style-src": "'self'",
                "img-src": "'self'",
                "manifest-src": "'self'",
                "report-uri": "/csp-violation"
            };
            
            this.#csp_self = this.joinMap(jEntries);
        }

        return this.#csp_self;
    }

    static #checkHasLocalImages():boolean
    {
        return fs.existsSync(getRootFolder() + "/data-local") && fs.existsSync(getRootFolder() + "/data-local/images");
    }

    useLocalImages():boolean
    {
        return this.#hasLocaLImages;
    }

    getRootFolder()
    {
        return ROOT_DIRECTORY;
    }
}

const ConfigurationInstance = new Configuration();

export default ConfigurationInstance;
