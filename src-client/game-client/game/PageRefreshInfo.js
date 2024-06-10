class TimedNotificationInfo 
{
    constructor(iconCss, additionalCss)
    {
        this.visible = false;
        this.question = new Question(iconCss).addClass(additionalCss);
    }

    isVisible()
    {
        return this.question.isVisible();
    }

    show()
    {
        if (this.isVisible())
            return false;

        this.question.show(this.getTitle(), this.getText(), this.getButtonText());
        return true;
    }

    abort()
    {
        this.question.close();
    }

    getTitle()
    {
        return "";
    }

    getText()
    {
        return "";
    }

    getButtonText()
    {
        return "OK";
    }


}

class PageRefreshInfo extends TimedNotificationInfo
{
    constructor()
    {
        super("fa-exclamation-circle", "notification-line-countdown-10s");

        this.reason = "";
    }

    hideCancel()
    {
        return true;
    }

    onForceRefresh()
    {
        window.location.reload();
    }

    onRefresh()
    {
        if (this.isVisible())
            this.onForceRefresh();
    }

    show(reason)
    {
        if (typeof reason !== "undefined")
            this.reason = reason;

        this.question.onOk(this.onForceRefresh.bind(this));
        this.question.hideCancel();
        if (super.show())
            setTimeout(this.onRefresh.bind(this), 1000 * 10);
    }

    getTitle()
    {
        return Dictionary.get("refresh_title");
    }

    getText()
    {
        if (this.reason === "")
            return Dictionary.get("refresh_reason1");
        else
            return `${Dictionary.get("refresh_reason2")}<br><br><span class="question-question-reason">${this.reason}</span><br><br>${Dictionary.get("refresh_reason3")}`;
    }

    getButtonText()
    {
        return Dictionary.get("refresh_now");
    }
}

class ReDeckInfoNotification extends TimedNotificationInfo
{
    constructor()
    {
        super("fa-recycle", "");
    }

    static wasVisible = false;

    show()
    {
        if (!ReDeckInfoNotification.wasVisible)
        {
            ReDeckInfoNotification.wasVisible = true;
            super.show();
        }
    }

    getTitle()
    {
        return Dictionary.get("refresh_decknote");
    }

    getText()
    {
        return Dictionary.get("refresh_decknote_t");
    }

    getButtonText()
    {
        return Dictionary.get("refresh_decknode_ok");
    }
}

