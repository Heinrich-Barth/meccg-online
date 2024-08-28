import { Alert, Button, Grid, TextField } from "@mui/material";
import React from "react";
import Dictionary from "./Dictionary";
import FetchCards, { CardData } from "../operations/FetchCards";
import { ConvertCardsStringMap } from "../operations/ExploreDeckData";

type Props = {
    pool: string;
    deck: string;
    sideboard: string;
    sites: string;
    notes: string;

    onUpdate: Function
    onCancel: Function
}

const defaultRowCount = 15;
const cards: any = {};
const cardsMap: {[code:string]:CardData} = { };

const processCardList = function (list: CardData[]) {
    for (let card of list)
    {
        cards[card.code.toLowerCase()] = card.code;
        cardsMap[card.code.toLowerCase()] = card;
    }
}

export function GetCardByCode(code:string)
{
    code = verifyCardCode(code);
    const card = code === "" ? null : cardsMap[code];
    if (card)
        return card;
    else 
        return null;
}

export function verifyCardCode(code: string) {
    const sCode = code.toLowerCase().trim();
    if (cards[sCode] !== undefined)
        return sCode;

    const map: any = {
        " (": [" [h] (", " [m] ("],
        " [h] (": [" ("],
        " [m] (": [" ("]
    }

    for (let pattern in map) {
        for (let rep of map[pattern]) {
            let candidate = sCode.replace(pattern, rep);
            if (cards[candidate])
                return candidate;
        }
    }

    console.warn("Unknown card code", sCode);
    return "";
}

export function InitCustomDeck() {
    FetchCards().then(processCardList);
}

export default function CustomDeckInput(props: Props) {
    const [textPool, setTextPool] = React.useState(props.pool);
    const [textDeck, setTextDeck] = React.useState(props.deck);
    const [textSideboard, setTextSideboard] = React.useState(props.sideboard);
    const [textSites, setTextSites] = React.useState(props.sites);
    const [textNotes, setTextNotes] = React.useState(props.notes);
    const [errors, setErrors] = React.useState("");

    const onVerifySection = function (val: string, callback: Function) {
        const map = ConvertCardsStringMap(val);
        const res: string[] = [];
        const resunknown: string[] = [];
        for (let code in map) {
            let val = verifyCardCode(code);
            if (val === "")
                resunknown.push(map[code] + " " + code);
            else
                res.push(map[code] + " " + val);
        }

        if (resunknown.length > 0) {
            const text1 = resunknown.join("\n").trim();
            const text2 = res.join("\n").trim();
            callback(text1 + "\n\n" + text2);
            return false;
        }

        return true;
    }

    const onVerify = function () {
        const errors: string[] = []
        if (!onVerifySection(textPool, setTextPool))
            errors.push("Pool");
        if (!onVerifySection(textDeck, setTextDeck))
            errors.push("Deck");
        if (!onVerifySection(textSideboard, setTextSideboard))
            errors.push("Sideboard")
        if (!onVerifySection(textSites, setTextSites))
            errors.push("Sites");

        if (errors.length > 0) {
            setErrors(errors.join(", "));
        }
        else {
            props.onUpdate(textPool, textDeck, textSideboard, textSites, textNotes);
        }

    }

    const onApply = function () {
        setErrors("");

        if (Object.keys(cards).length > 0)
            onVerify();
        else
            FetchCards().then(processCardList).catch(console.error).finally(onVerify);
    }

    return <>
        <Grid item xs={12} textAlign="center" className='padding2em1m'>
            <h3>View / Edit deck</h3>
            <p>If you want to use this deck, please click on the 'apply' button</p>
        </Grid>
        <Grid item xs={12} container rowGap={2}>
            <Grid item xs={6} lg={3} className="custom-deck">
                <TextField rows={defaultRowCount} value={textPool} multiline onChange={(e) => setTextPool(e.target.value)} fullWidth label={"Pool"} placeholder={"1 Gandalf [H] (TW)"} variant="filled" />
            </Grid>
            <Grid item xs={6} lg={3} className="custom-deck">
                <TextField rows={defaultRowCount} value={textDeck} multiline onChange={(e) => setTextDeck(e.target.value)} fullWidth label={"Deck"} placeholder={"1 Gandalf [H] (TW)"} variant="filled" />
            </Grid>
            <Grid item xs={6} lg={3} className="custom-deck">
                <TextField rows={defaultRowCount} value={textSideboard} multiline onChange={(e) => setTextSideboard(e.target.value)} fullWidth label={"Sideboard"} placeholder={"1 Gandalf [H] (TW)"} variant="filled" />
            </Grid>
            <Grid item xs={6} lg={3} className="custom-deck">
                <TextField rows={defaultRowCount} value={textSites} multiline onChange={(e) => setTextSites(e.target.value)} fullWidth label={"Sites"} placeholder={"1 Rivendell [H] (TW)"} variant="filled" />
            </Grid>
            <Grid item xs={12} className="custom-deck">
                <TextField rows={10} value={textNotes} multiline onChange={(e) => setTextNotes(e.target.value)} fullWidth label={"Notes"} variant="filled" />
            </Grid>
            {errors !== "" && (<Grid xs={12} textAlign={"center"}>
                <Alert severity="error">Some cards in <b>{errors}</b> are incorrect.</Alert>
            </Grid>
            )}
            <Grid xs={6} textAlign={"center"}>
                <Button onClick={() => props.onCancel()} variant="outlined">{Dictionary("candel", "Cancel")}</Button>
            </Grid>
            <Grid xs={6} textAlign={"center"}>
                <Button onClick={onApply} variant="contained">Verify and apply</Button>
            </Grid>
        </Grid>
    </>
}