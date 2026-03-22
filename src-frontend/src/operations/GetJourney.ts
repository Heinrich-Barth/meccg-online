function getCSV() { 
    return `
1;Departure from Bag End: Frodo and Sam leave the Shire;bag end (tw)
4;Crickhollow;the shire (tw);farmer maggot (as);gildor inglorion (tw)
5;The hobbits meet Tom Bombadil;Tom Bombadil (TW);old forest [h] (tw);goldberry (tw)
7;Bree: Meeting Strider (Aragorn) at the Prancing Pony;bree [h] (tw);strider (ba)
14;Weathertop: Frodo is wounded by the Witch-king;weathertop [m] (as);the witch-king (le);glorfindel ii (tw)
28;Ford of Bruinen: Flight to the Ford. Arrival at Rivendell;ford (tw)
29;Stay in Rivendell;rivendell [h] (tw)
33;The Council of Elrond; the Fellowship is formed;council of elrond (rs)
40;Stay in Rivendell;rivendell [h] (tw);reforging (tw);andúril, the flame of the west (tw);boromir ii (tw);gimli (tw);aragorn ii (tw);arwen (tw);elrond (tw)
94;Fellowship Departs: The group leaves Rivendell at dusk;great-road (tw);hollin (tw)
112;Caradhras;cruel caradhras (td);snowstorm (tw);
113;Mines of Moria;gandalf [h] (tw);moria [m] (le);
115;Balrog of Moria;balrog of moria (tw);escape (tw);dimrill dale [h] (tw)
117;Lothlórien: Meeting Galadriel and Celeborn;galadriel (tw)
118;Stay in Lórien: Resting and receiving Elven gifts;galadriel (tw);lórien [h] (tw);cup of farewell (dm);three golden hairs (td);mirror of galadriel (tw)
156;Amon Hen: Breaking of the Fellowship. Frodo and Sam go alone;amon hen [h] (tw)
159;Emyn Muil: Capturing Gollum, who becomes their guide;lost in emyn muil (ti);gollum (tw);dagorlad (tw)
164;Aragorn reunites with Gandalf. Arrival at Isengard;the white wizard (wh);isengard [m] (le)
165;The Black Gate: Arrival at Morannon. Turn toward Cirith Ungol;morannon (tw)
167;Ithilien: Meeting Faramir and the Rangers of Gondor;ithilien (tw);rangers of ithilien (tw);faramir (tw)
172;Cirith Ungol: Entering Shelob’s Lair. Frodo is captured.;cirith ungol [h] (tw);shelob's lair [h] (tw)
174;Aragorn reaches the Battle of the Pelennor Fields;minas tirith [h] (tw)
175;Barad-Dûr: Sam rescues Frodo. They begin the trek across Gorgoroth;barad-dûr [h] (tw)
177;The Army of the West departs for Mordor;minas tirith [h] (tw);morannon (tw);mouth of sauron (tw)
185;Mount Doom: Destruction of the Ring and the fall of Sauron;mount doom [m] (le);gollum's fate (tw);the one ring [h] (tw)
`.trim();
}

export type JourneyStation = {
    day: number;
    text: string;
    cards: string[];
}

export default function GetJourney()
{
    const res:JourneyStation[] = [];
    const lines = getCSV().split("\n");
    for (const entry of lines)
    {
        const parts = entry.split(";");
        const data:JourneyStation = {
            day: parseInt(parts[0]),
            text: parts[1].trim(),
            cards: []
        }

        for (let i = 2; i < parts.length; i++)
            data.cards.push(parts[i]);

        res.push(data);
    }
    
    return res;
}