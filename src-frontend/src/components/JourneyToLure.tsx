"use client"

import React from "react";
import GetJourney, { JourneyStation } from "../operations/GetJourney";
import { LinearProgress } from "@mui/material";
import { FetchCardImages } from "../operations/FetchCards";

const YEAR = "2027";
const g_nLureTargetTimestamp = Date.parse(YEAR + "-02-20T00:00:00Z");
const g_nStartTimestamp = Date.parse("2026-03-22T00:00:00Z");

const alreadyPassed = function()
{
    return Date.now() >= g_nLureTargetTimestamp;
}

const toDays = function(millis:number)
{
    /* muiltiplication and a final division is much faster than multiple divisions */
    const dayInMillisconds = 1000 * 60 * 60 * 24;
    return Math.floor(millis / dayInMillisconds);
}

const getTotalDuration = function()
{
    return toDays(g_nLureTargetTimestamp - g_nStartTimestamp);
}

const getAlreadyElapsed = function()
{
    return toDays(Date.now() - g_nStartTimestamp);
}

interface Entry {
    currentDay: number;
    completed: number;
    duration: number;
    entry: JourneyStation;
}

const getCurrentEntry = function()
{
    const journey = GetJourney();
    const durationReafLife = getTotalDuration();
    const lastDayOfJourney = journey[journey.length-1].day;
    const ourTimeInJourneyTime = durationReafLife / lastDayOfJourney;
    const currentDayOnJourney = Math.floor(getAlreadyElapsed() / ourTimeInJourneyTime);

    const res:Entry = {
        currentDay: currentDayOnJourney,
        completed: currentDayOnJourney / lastDayOfJourney * 100,
        entry: journey[0],
        duration: 0,
    }

    for (let i = 0; i < journey.length && journey[i].day <= currentDayOnJourney; i++)
    {
        res.entry = journey[i];
        if (i + 1 < journey.length)
            res.duration = journey[i+1].day ;
    }

    res.duration = res.duration / lastDayOfJourney * 100; 
    return res;
}

function getRandomImage(entry:Entry): string
{
    const list = entry.entry.cards;
    if (list.length < 2)
        return list[0];

    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

export default function JourneyToLure()
{
    const [entry, setEntry] = React.useState<Entry|null>(null);
    const [image, setImage] = React.useState("");

    React.useEffect(() => {
        const _e = getCurrentEntry();
        const code = getRandomImage(_e).toLocaleLowerCase();

        FetchCardImages().then(map => {
            let image = "";
            if (map.images[code]?.image)
                image = map.images[code].image;
            else {
                const codeR = code.replace(" [h]", "").replace(" [m]", "")
                if (map.images[codeR]?.image)
                    image = map.images[codeR].image;
                
                if (!image)
                    throw new Error("Cannot find image " + code + " or " + codeR);
            }

            setEntry(_e);
            setImage(image);
        }).
        catch(console.error);

    }, [setEntry, setImage])

    if (alreadyPassed())
    {
        console.info("Event has already passed");
        return <React.Fragment />
    }

    if (!entry || !image)
        return <></>

    const css:any = { }
    if (entry.completed <= 50)
        css.left = entry.completed + "%";
    else
        css.right = (100 - entry.completed) + "%";

    return <div className="journey">
        <div className="image-wrapper"  style={{ ...css }}>
            <div className="image">
                <img src={image} />
            </div>
        </div>
        <div className="text">
            <span className="lure">Journey to Lure {YEAR}</span>
            {entry.entry.text}
        </div>
        <LinearProgress variant="buffer" value={entry.completed} valueBuffer={entry.duration}  />
    </div>
}

