import * as pEventManager from "../EventManager";
import Discord from "./discord";

const g_pDiscord = new Discord();

let g_bIsIint = false;

export default function setupEvents() 
{
    if (g_bIsIint)
        return;

    g_pDiscord.registerEvents();
    pEventManager.dump();
} 