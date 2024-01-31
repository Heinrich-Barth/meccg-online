import express, { Request, Response } from "express";
import { validate as ValidateResultToken } from "../game-management/ResultToken";
import { Caching, ServerInstance } from "../Server";
import { getRootFolder } from "../Configuration";

const validateToken = function(req:Request, res:Response)
{
    const isValid = req.body && typeof req.body.token === "string" && ValidateResultToken(req.body.token);
    if (isValid)
        res.status(204).send("");
    else
        res.status(500).send("");
}

export default function InitRoutingTournament()
{
    const pageDir = getRootFolder() + "/pages";
    ServerInstance.getServerInstance().use("/tournament", express.static(pageDir + "/tournament.html", Caching.headerData.generic));
    ServerInstance.getServerInstance().post("/tournament/validate", validateToken);
}