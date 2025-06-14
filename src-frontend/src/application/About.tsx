
export default function About() {
    return <>
    <div className={"application-home"}>
        <h1>About</h1>

        <p>This project allows you to play your favourite card game online.</p>

        <h2>Importantly</h2>
        <p>Middle-earth CCG and LotR are trademarks of Middle-earth Enterprises and/or Iron Crown Enterprises. This website will be taken down willingly if requested by the rights holders. However, please consider that this is a 100% non-commercial and non-profit project made by fans so that MECCG community can continue to enjoy this very special game.</p>
        <p>The website maintainer very strongly believes that no financial harm is done to any trademark, since this game has been out of print for over two decades and actively published Lord of the Rings card games are successfully being produced and sold. What is more, many (if not even the vast majority) of the MECCG players also play such contemporary card games.</p>

        <h2>General Data Protection Regulation Notice (GDPN)</h2>
        <p>This website (i.e. the server this website is hosted on), saves your IP address in the server logfiles. This is a technical requirement. However, the IP address will not be processed in any other way by the website maintainer.</p>
        <p>This website runs on heroku.com (or their app platform herokuapp.com) and said platform may store personal data. Please consult their GDPN for specific information.</p>
        <p>No non-technical data is collected by this application, nor does it forward any to a third party. Cookies are stored in such a whay that it can only be accessed by the browser.</p>
        <p>Any data stored in the browser's local- and/or session-storage is technically necessary but protected by your browser to any third party. No personal data is stored on said storages.</p>
        <p>No tracking is used - the maintainer is not interested in your personal data or in any kind of tracking.</p>

        <h2>Cookie Information</h2>
        <p>To play a game, you need to allow the site to store essential cookies in your browser. The cookies are only accessed by the server to make sure you can actually play a game. The following cookies are stored:</p>
        <ol>
            <li><b>room</b> - the name of the game</li>
            <li><b>username</b> - your display name when creating/joining a game</li>
            <li><b>userid</b> - a unique id necessary to associate your in-game data.</li>
            <li><b>joined</b> - the time at which you joined (necessary to identify idle or inactive games)</li>
        </ol>

        <p>The <b>userid</b> is only used for in-game actions. It is created anew each time you start or join a game.
            Importantly, it is not associated with your <b>username</b> outside of your active game.</p>

        <h2>Security Measurements</h2>
        <p>This site does not require any databases or other storage containers.</p>
        <p>No persistence is needed - other than at the time of launch, nothing is written to any disk. Everything is kept in memory.</p>
        <p>All card images are requested from a content delivery server (CDS) to keep images and this application separate.</p>

        <p>To avoid cross-site-scripting attacks from your game opponents, the following <b>Content-Security-Policy</b> and <b>X-Content-Security-Policy</b> are applied in a game:</p>
        <ul>
            <li>default-src 'self'</li>
            <li>script-src 'self'</li>
            <li>img-src 'self' (and the CDS)</li>
        </ul>
        <p>Content-Security-Policy violation attempts can be reported depending on the host's configuration.</p>

        <h2>Library and Licenses Information</h2>
        <p>This project uses the following third-party libraries.</p>
        <ul>
            <li>Node.JS - express (MIT License)</li>
            <li>Node.JS - express cookie-parser (MIT License)</li>
            <li>Node.JS - socket.io (MIT License)</li>
            <li>Node.JS - winston (MIT License)</li>
            <li>jQuery (MIT License)</li>
            <li>jQuery UI v1.12.1 - 2021-03-20 (widget.js, data.js, scroll-parent.js, widgets/draggable.js, widgets/droppable.js, widgets/mouse.js, MIT License)</li>
            <li><a href="https://github.com/furf/jquery-ui-touch-punch" target="_blank" rel="noreferrer">jQuery UI Touch Punch</a> (MIT License) </li>
            <li>leafletjs (BSD 2-Clause "Simplified" License)</li>
        </ul>

        <h2>HTML / CSS </h2>
        <ul>
            <li>The CSS colours and some design ideas were taken from https://cardnum.net (MIT License)</li>
            <li>Font Awesome Free, see https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)</li>
            <li>Open Sans, see https://fonts.google.com/specimen/Open+Sans/about (Open Font License)</li>
        </ul>

        <h2>Images and Icons</h2>
        <ul>
            <li>All icon licenses are "free for commercial use" with no link back Icons were taken from https://www.iconfinder.com</li>
            <li>Background images taken from https://www.pexels.com/ Unfotunately, I cannot remember the link exactly anymore.</li>
        </ul>

        <h2>License information</h2>
        <p>This source code is licensed under GNU General Public License v2.0.</p>
        <p>You can read the full license text at <a href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html" rel="nofollow" target="_blank">https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html</a></p>
    </div>
    </>;
}