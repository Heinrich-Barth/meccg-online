import express from "express";

/**
 * Error endpoint.
 * This also deletes all available cookies
 */
import * as ClearCookies from "./ClearCookies";
import getServerInstance, { Caching } from "../Server";
import { join } from "path";
import { getRootFolder } from "../Configuration";

export default function InitRoutingErrorPages()
{
    const rootDir = join(getRootFolder(), "/pages");

    getServerInstance().use("/error", ClearCookies.clearCookiesCallback, express.static(rootDir + "/error.html", Caching.headerData.generic));
    getServerInstance().use("/error/https-required", ClearCookies.clearCookiesCallback, express.static(rootDir + "/error-https-required.html", Caching.headerData.generic));
    getServerInstance().use("/error/denied", ClearCookies.clearCookiesCallback, express.static(rootDir + "/error-access-denied.html", Caching.headerData.generic));
    getServerInstance().use("/error/login", ClearCookies.clearCookiesCallback, express.static(rootDir + "/error-login.html",Caching.headerData.generic));   
    getServerInstance().use("/error/nosuchroom", ClearCookies.clearCookiesCallback, express.static(rootDir + "/error-nosuchroom.html",Caching.headerData.generic));   
}
