import * as fs from "fs";
import { getRootFolder } from "./Configuration";
import Logger from "./Logger";

export default function CreateRobotsTxt()
{
    const file = getRootFolder() + "/public/robots.txt";
    if (!fs.existsSync(file))
    {
        fs.writeFileSync(file, "User-agent: *\nDisallow: /");
        Logger.info("Restrictive robots.txt created");
    }
}