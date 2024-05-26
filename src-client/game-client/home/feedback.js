setTimeout(() => {

    fetch("/data/feedbackform")
    .then(res => res.json())
    .then(json => {
        
        const url = json.url;
        if (typeof url !== "string" || url === "")
            return;

        const div = document.createDocumentFragment();
        
        const h2 = document.createElement("h2");
        h2.innerText = "Your Feedback wanted.";

        const p = document.createElement("p")
        
        const aLink = document.createElement("a");
        aLink.setAttribute("href", url);
        aLink.setAttribute("target", "_blank");
        aLink.setAttribute("rel", "nofollow");
        aLink.setAttribute("class", "inline-link");

        const aI = document.createElement("i");
        aI.setAttribute("class", "fa fa-google");
        aI.innerHTML = "&nbsp;";

        aLink.append(aI, document.createTextNode("Google Form."));

        const smaller = document.createElement("small");
        smaller.innerText = "Please be aware: Google might collect your IP address.";

        p.append(
            document.createTextNode("If you find the time, please provide feedback using this "),
            aLink,
            document.createElement("br"),
            smaller
        );

        div.append(h2, p);

        const pSibling = document.getElementById("active_games");
        pSibling.parentElement.insertBefore(div, pSibling);

    })
    .catch(console.error);

}, 50);