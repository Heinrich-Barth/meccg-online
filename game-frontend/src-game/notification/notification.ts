

class Notification {

    static count = 0;

    static _timeout = 5000;

    insertCss()
    {
        const styleSheet = document.createElement("link")
        styleSheet.setAttribute("rel", "stylesheet");
        styleSheet.setAttribute("href", "/dist-client/css/notification.css?version=" + Date.now());
        document.head.appendChild(styleSheet)
    }

    init()
    {
        if (document.getElementById("notifications") === null)
        {
            this.insertCss();

            const div = document.createElement("div");
            div.setAttribute("id", "notifications");
            div.setAttribute("class", "notifications");
            document.body.appendChild(div);
        }
    }

    static error(content:string)
    {
        new Notification().msg(content, "failure", "fa-exclamation-triangle");
    }

    static OnError(e:any)
    {
        Notification.error(e.detail);
    }

    static success(content:string)
    {
        new Notification().msg(content, "success", "fa-check-square-o");
    }

    static OnSuccess(e:any)
    {
        Notification.success(e.detail);
    }
    
    static info(content:string)
    {
        new Notification().msg(content, "info", "fa-bell");
    }

    static OnInfo(e:any)
    {
        Notification.info(e.detail);
    }

    _requestId()
    {
        if (Notification.count === 100)
        {
            Notification.count = 0;
            return 0;
        }
        else
            return ++Notification.count;
    }

    #getOldMessages()
    {
        const list:any[] = [];
        const elem:any = document.getElementById("notifications");
        if (elem === null)
            return list;

        for (let note of elem.querySelectorAll(".notification"))
        {
            if (this.#isExpired(note))
                list.push(note);   
        }

        return list;
    }

    #removeOldMessages()
    {
        const elem = document.getElementById("notifications");
        if (elem === null)
            return;

        for (let _e of this.#getOldMessages())
            elem.removeChild(_e);
    }

    #isExpired(elem:any)
    {
        try
        {
            const time = parseInt(elem.getAttribute("data-time"));
            return Date.now() - time > 4000;
        }
        catch (e)
        {
            /** ignore */
        }

        return false;
    }

    addMessage(content:string, sClass:string, sIcon:string)
    {
        const id = "notify_" + this._requestId();  

        const wrapper = document.createElement("div");
        wrapper.setAttribute("class", "notification " + sClass);
        wrapper.setAttribute("data-time", "" + Date.now());
        wrapper.setAttribute("id", id);

        const icon = document.createElement("div");
        icon.setAttribute("class", "notification-element notification-icon fa " + sIcon);
        icon.setAttribute("aria-hidden", "true");

        const text = document.createElement("div");
        text.setAttribute("class", "notification-element notification-text");

        const p = document.createElement("span");
        p.innerText = content;

        const line = document.createElement("div");
        line.setAttribute("class", "notification-line-countdown");

        text.append(p, line);

        wrapper.append(icon, text);

        document.getElementById("notifications")?.appendChild(wrapper);

        /** firefox does not like the animation and blocks the space, so remove it */
        this.addTimeout(id);
    }

    addTimeout(id:string)
    {
        setTimeout(() => Notification.removeMessage(id), Notification._timeout);
    }

    msg(content:string, sClass:string, sIcon:string)
    {
        this.addMessage(content, sClass, sIcon)
        this.#removeOldMessages();
    }

    static removeMessage(id:string)
    {
        const elem = document.getElementById(id);
        if (elem === null)
            return;

        while (elem.firstChild) 
            elem.removeChild(elem.firstChild);

        if (elem.parentNode)
            elem.parentNode.removeChild(elem);
    }
}

export function InitNotification()
{
    document.body.addEventListener("meccg-notify-success", Notification.OnSuccess, false);
    document.body.addEventListener("meccg-notify-info", Notification.OnInfo, false);
    document.body.addEventListener("meccg-notify-error", Notification.OnError, false);
    new Notification().init();
}

export default Notification;