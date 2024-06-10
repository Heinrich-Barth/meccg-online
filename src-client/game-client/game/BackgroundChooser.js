class BackgroundChooser extends PreferenceChoise 
{
    getHeadline()
    {
        return Dictionary.get("bg_choose");
    }

    getDescription()
    {
        return Dictionary.get("bg_choose_text");
    }

    insertOption(folder)
    {
        const elem = document.createElement("div");
        elem.setAttribute("class", "dice-option image-option " + folder);
        elem.setAttribute("data-type", folder);
        elem.setAttribute("title", Dictionary.get("bg_click"));
        elem.onclick = (e) => this.onDiceClick(e.target);
        elem.innerText = " ";

        return elem;
    }

    #replaceBackground(sNew)
    {
        if (sNew === undefined || sNew === "" || document.body.classList.contains(sNew))
            return false;

        document.body.classList.add(sNew)

        const list = document.body.classList;
        for (let _name of list)
        {
            if (_name !== sNew && _name.indexOf("bg-") === 0)
                document.body.classList.remove(_name);
        }

        return true;
    }

    onClickPerformed(elem)
    {
        this.#replaceBackground(elem);
        this.updateCookie("background", elem);
    }
}

document.body.addEventListener("meccg-background-chooser", () => new BackgroundChooser().init("/data/backgrounds"), false);
