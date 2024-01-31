import * as crypto from "crypto";

interface ICSPInfo {
    "default-src": string,
    "font-src": string,
    "script-src": string,
    "connect-src": string,
    "style-src": string,
    "img-src": string,
    "report-uri": string,
    [key:string]:string
}

const g_sUUIDLength = crypto.randomUUID().length;

export function generateUuid() : string
{
    return crypto.randomUUID().toString();
};

export function generateFlatUuid():string
{
    return generateUuid().replaceAll("-", "_");
};

/**
 * Check if the input is valid and alphanumeric
 * 
 * @param {String} sInput 
 * @returns 
 */
export function isAlphaNumeric(sInput:string):boolean
{
    return sInput !== undefined && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
};

/**
 * Create a unique secret 
 * @returns hashed SHA256 salt as HEX
 */
export function createSecret()  : string
{
    const salt1 = generateUuid() + Math.floor(Math.random() * Math.floor(1000)) + 1;
    const salt2 = generateUuid() + Math.floor(Math.random() * Math.floor(1000)) + 1;
    const x = salt1 + salt2 + generateUuid() + "0";
    return crypto.createHash('sha256').update(x, 'utf8').digest('hex');
};


const joinMap = function(jEntries:ICSPInfo) : string
{
    const sVal:string[] = [];
    for (let key in jEntries) 
    {
        if (jEntries[key] !== "")
            sVal.push(key + " " + jEntries[key]);
    }
    
    return sVal.join("; ");
};

export function uuidLength() 
{ 
    return g_sUUIDLength; 
}

/**
 * Create a unique user id
 * @returns UUID String
 */
export function createContentSecurityPolicyMegaAdditionals(csp_image_domain:string):string
{
    if (csp_image_domain === undefined)
        csp_image_domain = "";

    const jEntries:ICSPInfo = {
        "default-src" : "'none'",
        "style-src": "'self'",
        "connect-src": "'self' " + csp_image_domain,
        "font-src": "'self'",
        "script-src": "'self' 'nonce-START'",
        "frame-src": "'self'",
        "img-src": "'self' " + csp_image_domain,
        "report-uri": "/csp-violation"
    };
    
    return joinMap(jEntries);
};

/**
 * Create a unique user id
 * @returns String
 */
 export function createContentSecurityPolicySelfOnly():string
 {
    const jEntries:ICSPInfo = {
        "default-src": "'none'",
        "font-src": "'self'",
        "script-src": "'self'",
        "connect-src": "'self'",
        "style-src": "'self'",
        "img-src": "'self'",
        "report-uri": "/csp-violation"
    };
 
    return joinMap(jEntries);
 };