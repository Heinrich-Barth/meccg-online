import Logger from "./Logger";

interface IEvent {
    [key:string] : Function
}

class EventManager
{
    #events:IEvent = {};

    addEvent(id:string, callback:Function) 
    {
        this.#events[id] = callback;
    }

    dump()
    {
        const keys = Object.keys(this.#events);
        keys.sort();
        if (keys.length > 0)
            Logger.info(keys.length + " event(s) registered\n\t- " + keys.join("\n\t- "));
    }

    trigger(...params:any)
    {
        try
        {
            const id = params[0];
            if (typeof id !== "string")
                return;
            
            const args = Array.prototype.slice.call(params, 1);
            if (this.#events[id] !== undefined)
                this.#events[id].apply(this, args);
            else
                Logger.warn("Event not found: " + id);
        }
        catch (e)
        {
            Logger.warn("Event error");
            Logger.error(e);
        }
    }
}

const g_pEvents = new EventManager();

export function addEvent(id:string, callback:Function) 
{
    g_pEvents.addEvent(id, callback)
};

export function trigger(...args:any) 
{
    g_pEvents.trigger(args);
};

export function dump()
{
    g_pEvents.dump();
} 
