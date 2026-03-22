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
    const seconds = millis / 1000
    const mins = seconds / 60;
    const hrs = mins / 60;
    const days = hrs / 60;
    return Math.floor(days);
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
    entry: JourneyStation;
}

const getCurrentEntry = function()
{
    const duration = getTotalDuration();
    const journey = GetJourney();
    const lastDay = journey[journey.length-1].day;
    const onDayOfFourneyToRealLife = lastDay / duration;
    const currentDayOnJourney = getAlreadyElapsed() * onDayOfFourneyToRealLife;

    const res:Entry = {
        currentDay: currentDayOnJourney,
        completed: Math.round((currentDayOnJourney / lastDay) * 100),
        entry: journey[0]
    }

    for (let i = 0; i < journey.length && res.entry.day <= currentDayOnJourney; i++)
        res.entry = journey[i];

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
    const [entry, setEntry] = React.useState<Entry|null>();
    const [image, setImage] = React.useState("");

    React.useEffect(() => {
        const _e = getCurrentEntry();
        const code = getRandomImage(_e);

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
            <span className="lure">Yourney to Lure {YEAR}</span>
            {entry.entry.text}
        </div>
        <LinearProgress variant="determinate" value={entry.completed}  />
    </div>
}

