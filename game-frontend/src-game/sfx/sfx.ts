import Dictionary from "../utils/dictionary";
import g_pGamesPreferences from "../preferences/preferences-game";

class SoundEffects {

    static INSTANCE = new SoundEffects();

    effects = { };
    eventCount = 0;
    types:any = {
            "dice": "/dist-client/js/game/sfx/dice-roll.mp3",
            "drawcard": "/dist-client/js/game/sfx/card-draw.mp3",
            "shuffle": "/dist-client/js/game/sfx/card-shuffle.mp3",
            "score": "/dist-client/js/game/sfx/score.mp3",
            "discard": "",
            "launch": "",
            "endgame": "",
            "yourturn": "",
            "notify": ""
    };
    volume = 30;
    isReady = false;
    additionals = { };

    onLoadAdditionalSounds(data:any)
    {
        for (let key of Object.keys(data))
            this.registerStaticEffect(key, data[key]);
    }

    init()
    {
        fetch("/media/personalisation/sounds/sounds.json").then((response) =>
        {
            if (response.status === 200)
                response.json().then((data) => SoundEffects.INSTANCE.onLoadAdditionalSounds(data));
        }).catch(() => { /** do nothing */});
    }

    registerStaticEffect(id:string, uri:string)
    {
        if (id !== undefined && id !== "" && uri !== undefined && uri !== "" && uri.indexOf("//") === -1)
            this.types[id] = uri;
    }

    requireId()
    {
        return "m" + (++this.eventCount);
    }

    playAudio(src:string)
    {
        if (src !== undefined && src !== "")
        {
            const audio = new Audio(src);
            audio.volume = this.volume / 100;
            audio.loop = false;
            let promise = audio.play();

            if (promise !== undefined) 
            {
                promise.then(_ => {/* Autoplay started */ }).catch(_error => 
                {
                    document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
                        name : "System",
                        message : Dictionary.get("sound_blocked", "Could not play sound. Browser blocked it.")
                    }}));
                });
              }
        }
    }

    onSfx(e:any)
    {
        if (this.isReady && this.allowSfx() && e.detail !== undefined && this.types["" + e.detail] !== undefined)
            this.playAudio(this.types["" + e.detail]);
    }

    onSfxTest(e:any)
    {
        this.volume = e.detail;
        this.playAudio(this.types["drawcard"]);
    }

    allowSfx()
    {
        return g_pGamesPreferences?.allowSfx();
    }

    onReady()
    {
        this.isReady = true;
        document.body.addEventListener("meccg-sfx", this.onSfx.bind(this), false);
        document.body.addEventListener("meccg-sfx-test", this.onSfxTest.bind(this), false);
        this.playAudio(this.types["launch"]);
    }
}

export function InitSoundEffects()
{
    SoundEffects.INSTANCE.init();
    document.body.addEventListener("meccg-sfx-ready", SoundEffects.INSTANCE.onReady.bind(SoundEffects.INSTANCE), false);    
}

export default SoundEffects;