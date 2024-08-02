import * as React from "react";
import Dictionary from "../components/Dictionary";
import PROXY_URL from "../operations/Proxy";

let isLoading = false;

export default function Whatsnew() {

    const [notes, setNotes] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (isLoading)
            return;

        isLoading = true;
        fetch(PROXY_URL + "/data/releasenotes").then(res => res.json()).then((json) => {
            const res: string[] = [];
            const len = json.length;
            for (let i = 0; i < len && i < 50; i++)
                res.push(json[i].description);

            setNotes(res);
        }).finally(() => isLoading = false);

    }, [setNotes]);

    return <>
        <div className={"application-home"}>
            <h1>{Dictionary("frontend.menu.whatsnew", "What's new)")}</h1>
            {notes.length === 0 && (<p>Nothing there.</p>)}
            {notes.length > 0 && (<ul className="release-notes">
                {notes.map((row: any, index: any) => <li key={"r" + index}><span>{row}</span></li>)}
            </ul>)}
        </div>
    </>;
}