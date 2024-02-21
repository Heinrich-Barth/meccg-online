import * as fs from "fs";
import Logger from "../Logger";

export default function readAndCreateUniqueVersion(file:string)
{
    try
    {
        const data = fs.readFileSync(file, 'utf8');
        if (typeof data === "string")
            return data.replaceAll('version=version"', `version=${Date.now()}"`);
    }
    catch (err)
    {
        Logger.error(err);
    }

    Logger.warn("Could not read file " + file);
    return "";
}