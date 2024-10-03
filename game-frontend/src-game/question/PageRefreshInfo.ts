import Dictionary from "../utils/dictionary";
import Question from "./question";

class TimedNotificationInfo 
{
    visible:boolean;
    question:Question;
    
    constructor(iconCss:string, additionalCss:string)
    {
        this.visible = false;
        this.question = new Question(iconCss).addClass(additionalCss);
    }

    isVisible()
    {
        return this.question.isVisible();
    }

    show(_reason="")
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
    reason:string = "";

    constructor()
    {
        super("fa-exclamation-circle", "notification-line-countdown-10s");
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

    show(reason:string)
    {
        if (typeof reason !== "undefined")
            this.reason = reason;

        this.question.onOk(this.onForceRefresh.bind(this));
        this.question.hideCancel();
        if (super.show())
            setTimeout(this.onRefresh.bind(this), 1000 * 10);

        return true;
    }

    getTitle()
    {
        return Dictionary.get("refresh_title", "Connectivity Problem");
    }

    getText()
    {
        if (this.reason === "")
            return Dictionary.get("refresh_reason1", "It seems the connection to the server was lost.<br><br>This page will be reloaded in 10 seconds");
        else
            return `${Dictionary.get("refresh_reason2", "Connection lost due to the reason:")}<br><br><span class="question-question-reason">${this.reason}</span><br><br>${Dictionary.get("refresh_reason3", "This page will be reloaded in 10 seconds")}`;
    }

    getButtonText()
    {
        return Dictionary.get("refresh_now", "Reload now");
    }
}

export class ReDeckInfoNotification extends TimedNotificationInfo
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

        return true;
    }

    getTitle()
    {
        return Dictionary.get("refresh_decknote", "Deck Notification");
    }

    getText()
    {
        return Dictionary.get("refresh_decknote_t", "Your deck is about to exhaust. It will be reshuffled automatically if needed. Just keep on drawing.");
    }

    getButtonText()
    {
        return Dictionary.get("refresh_decknode_ok", "Got it.");
    }
}

export { PageRefreshInfo };