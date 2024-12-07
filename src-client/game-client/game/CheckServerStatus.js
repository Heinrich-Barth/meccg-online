class UptimeNotification {

    static #instance = new UptimeNotification();
    #notice30 = false;
    #notice15 = false;
    #notice05 = false;

    #decideOnNotification(hrs)
    {
        const remain = 60 - ((hrs - 23) * 60);
        if (remain > 25 || remain <= 0)
            return;

        if (remain <= 5)
            this.#notice05 = this.#doNotify(5, this.#notice05);
        else if (remain <= 15)
            this.#notice15 = this.#doNotify(15, this.#notice15);
        else if (remain <= 25)
            this.#notice30 = this.#doNotify(30, this.#notice30);
    }

    #getMessage(time)
    {
        switch(time)
        {
            case 5:
                return "The server will restart in less than 5mins. Please save your game.";
            case 15:
                {
                    const msg = document.createDocumentFragment();
                    msg.append(
                        document.createTextNode("The server will restart in about 15mins."),
                        document.createElement("br"),
                        document.createElement("br"),
                        document.createTextNode("You will be notified at least 5mins before scheduled restart."),
                    )
                    return msg;
                }
            case 30:
            default:
                {
                    const msg = document.createDocumentFragment();
                    msg.append(
                        document.createTextNode("The server will restart in about 30mins."),
                        document.createElement("br"),
                        document.createElement("br"),
                        document.createTextNode("You will be notified in 15mins and about 5mins before restart."),
                    )
                    return msg;
                }
        }
    }

    #doNotify(time, ignore)
    {
        if (ignore)
            return true;

        const message = this.#getMessage(time);
        new Question("fa-exclamation-circle", false).show(
            "Save your game",
            message, 
            Dictionary.get("close", "Close")
        );

        return true;
    }
    
    static OnServerHealthUpdate(jsData)
    {
        if (typeof jsData?.uptimeHrs === "number")
            UptimeNotification.#instance.#decideOnNotification(jsData.uptimeHrs);
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
    }, 1000 * 60 * 0.1);

})()

    