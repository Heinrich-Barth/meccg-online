class DiceChooser extends PreferenceChoise 
{
    getHeadline()
    {
        return Dictionary.get("dice_title", "Choose Dices");
    }

    getDescription()
    {
        return Dictionary.get("dice_text", "Click on a dice to immediately choose it or click anywhere else to close the panel");
    }

    insertOption(folder)
    {
        let elem = document.createElement("div");
        elem.setAttribute("class", "dice-option");

        for (let i = 1; i < 7; i++)
        {
            let img = document.createElement("img");
            img.setAttribute("src", "/media/personalisation/dice/" + folder + "/dice-" + i + ".png");
            img.setAttribute("data-type", folder);
            img.setAttribute("title", Dictionary.get("dice_clickchoose", "Click to use these dices"));
            img.onclick = (e) => this.onDiceClick(e.target);
            elem.appendChild(img);
        }

        return elem;
    }

    onClickPerformed(elem)
    {
        this.updateCookie("dices", elem);
        MeccgApi.send("/game/dices/set", { type: elem });
    }
}

document.body.addEventListener("meccg-dice-chooser", () => new DiceChooser().init("/data/dices"), false);