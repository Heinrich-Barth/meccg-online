class UptimeNotification {

    static #instance = new UptimeNotification();
    #minsHrs24 = 60 * 24;
    #notice30 = false;
    #notice15 = false;
    #notice05 = false;

    #calcRemainingMins(uptime)
    {
        const uptimeMins = uptime / 1000 / 60;
        if (uptimeMins <= 0 || uptimeMins >= this.#minsHrs24)
            return -1;
        else
            return Math.floor(this.#minsHrs24 - uptimeMins);
    }

    #decideOnNotification(remain)
    {
        if (remain <= 0)
            return;

        if (remain <= 5)
            this.#notice05 = this.#doNotify(5, this.#notice05);
        else if (remain <= 15)
            this.#notice15 = this.#doNotify(15, this.#notice15);
        else if (remain <= 30)
            this.#notice30 = this.#doNotify(30, this.#notice30);
    }

    #getMessage(time)
    {
        switch(time)
        {
            case 5:
                return "The server will restart in less than 5mins. Save your game.";
            case 15:
                return "The server will restart in about 15mins. Save your game";
            case 30:
            default:
                return "The server will restart in about 30mins. Please be aware of this.";
        }
    }

    #doNotify(time, ignore)
    {
        if (ignore)
            return true;

        const message = this.#getMessage(time);
        new Question("fa-sign-out", false).show(
            "Save your game",
            message, 
            Dictionary.get("close", "Close")
        );

        return true;
    }
    
    static OnServerHealthUpdate(jsData)
    {
        if (typeof jsData?.uptime !== "number")
        {
            console.warn("Invalid input");
            return;
        }
  
        const remain = UptimeNotification.#instance.#calcRemainingMins(jsData.uptime)
        UptimeNotification.#instance.#decideOnNotification(remain);
    }
}

(function() {
    if (g_sLobbyToken === "")
        return;

    setInterval(() => {
        fetch("/data/health")
        .then(res => res.json())
        .then(UptimeNotification.OnServerHealthUpdate)
        .catch(console.error);
    }, 1000 * 60 * 5);

})()

    