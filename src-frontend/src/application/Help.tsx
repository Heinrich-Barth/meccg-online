export default function Help() {
    return <>
        <div className={"application-home"}>
            <h2 id="thetable">The Table</h2>
            <p>When you enter the table, you will be greeted with an introduction popup telling you about chat
                opportunites and the drag and drop gameplay.
                Once closed, the table will look like this:
            </p>
            <p className="center"><img src="/media/assets/help/board-start.png" alt="empty table" /></p>

            <h2 id="howtoplay">Playing Cards</h2>
            <p>Playing cards works via <b>drag &amp; drop</b>. Once you drag the card, target drop zones will appear
                where you can drop the respective card.</p>
            <p className="center"><img src="/media/assets/help/sample-drop.png" alt="Sample Drop zones" /></p>
            <p>You can drag the card over each of the drop zones and drop it to put it into play (or to any pile).
                Each potential drop zone will have a tooltip appearing which indicates the action type.</p>

            <h2 id="playchars">Playing Characters</h2>
            <p>A character may <b>create a new company</b> or join an existing company under general influence or
                <b>follow</b> a character under direct influence. As a player, you have to make sure that the
                action is legitimate, i.e. there is enough general or direct influence available.</p >

            <p>Splitting and reoganizing companies is easy as well. Simply drag the character and perform the
                action. If they have followers, they will continue to follow as well.</p>
            <p className="center"><img alt="" src="/media/assets/help/char.png" /></p>
            <p>In this example, a character may join its current company under general influence, join another
                company either under direct or general influence or split into a separate company.</p>

            <h2 id="sites">Choosing a start site</h2>
            <p>A company is indicated by a dotted line, above which there is a mountain icon. Clicking on this will
                open the map where hyou can select your home site.</p>
            <p className="center"><img alt="" src="/media/assets/help/homesite.png" /></p>
            <p>The map will appear with red markers on it. Such a marker is called a region marker. Clicking on it
                will show all available sites in that region. Clicking on such a site will automatically set it as
                starting site.</p>
            <p className="center"><img alt="" src="/media/assets/help/homesite-map.png" /></p>
            <p>After having clicked on the site, the map window closes and the site is set.</p>
            <p className="center"><img alt="" src="/media/assets/help/homesite-done.png" /></p>

            <h2 id="movement">Planning your movement</h2>
            <p>To plan your movement, click on the mountain icon again to open the map. Similar to start site
                selection, choose your target site.</p>
            <p className="center"><img alt="" src="/media/assets/help/movement-1.png" /></p>
            <p>The sitepath will have to be chosen manually. To do so, click on a region and add it to the sitepath.
                To remove it again, click on the card in the sitepath.</p>
            <p className="center"><img alt="" src="/media/assets/help/movement-2.png" /></p>
            <p>To confirm this movement, click on the green icon and close the winodw again.</p>
            <p>To reval the movement to your opponent, click on the "eye" icon.</p>
            <p className="center"><img alt="" src="/media/assets/help/movement-3.png" /></p>

            <h2 id="hazards">Playing Hazards</h2>
            <p>Hazards can be either events or creatures. Usually, events are added to the staging area.</p>
            <p className="center"><img alt="" src="/media/assets/help/hazard-1.png" /></p>

            <p>Hazards may also be attached to a specific chraracter, e.g. corruption cards.</p>
            <p className="center"><img alt="" src="/media/assets/help/hazard-2.png" /></p>

            <p>To force a company or character to face hazard, drop it onto the regions and it will appear next to
                the site.</p>
            <p className="center"><img alt="" src="/media/assets/help/hazard-3.png" /></p>
            <p className="center"><img alt="" src="/media/assets/help/hazard-4.png" /></p>
            <p>If you want to play a card "on guard", simply drop it onto the destiation site and it will appear
                face fown.</p>
            <h2 id="agents">Playing Agents</h2>
            <p>Agents can be brought into play just as normal characters. Yet, they will appear face down by default.
                The same is true for any site card unless you reveal the movement actively. Every card that is attached to
                your agent will also be brought into play face down. As long as your agent is their only company character
                (i.e. single agent company), the company will be considered an "agent company" and site cards will come into play face down automatically.</p>
            <p className="center"><img alt="" src="/media/assets/help/agent-1.png" /></p>

            <p>Since special movement rules apply, you have to verify that your agent's movement is legal. To do so, you can
                add the site (either target or site of origin) as a ressource to your hand. This allows you to attach the site card to
                your agent similar to items etc. Please keep in mind that this procedure does not remove the card from
                your location map. Hence, you have to make sure you do not travel to a site that has been attached to your agent.
            </p>
            <p className="center">
                <img alt="" src="/media/assets/help/agent-2.png" />
                <img alt="" src="/media/assets/help/agent-3.png" />
            </p>
            <p>
                If you want to travel to the target site, you do not have to reveal your movement but can "arrive" yourself.
                To do so, right click on your target site again and choose "Company arrives at destination"
            </p>
            <p className="center"><img alt="" src="/media/assets/help/agent-4.png" /></p>

            <h2 id="mps">Obtaining Marshalling Points</h2>
            <p>To obtain marshalling points, simply drag a card onto your vicotry pile.</p>
            <p className="center"><img alt="" src="/media/assets/help/score-1.png" /></p>
            <p>This will open a window that lets you choose the category and amount of points.</p>
            <p className="center"><img alt="" src="/media/assets/help/score-2.png" /></p>

            <h2 id="nmh">No more hazards</h2>
            <p>You can signal the end of your hazard play against a company by right clicking on the target site and
                choosing the respective action.</p>
            <p className="center"><img alt="" src="/media/assets/help/nmh-1.png" className="center" />
                <img alt="" src="/media/assets/help/nmh-2.png" /></p>
            <p>This action will reduce the sitepath to the destiation site only. On guard cards will be kept
                attached to the site.</p>
            <p className="center"><img alt="" src="/media/assets/help/nmh-3.png" /></p>

            <h2 id="scores">Updating your scores</h2>
            <p>Click on the victory pile icon to open the score sheet.</p>
            <p className="center"><img alt="" src="/media/assets/help/score-3.png" /></p>
            <p>You can change your points at any time during the game.</p>
            <p className="center"><img alt="" src="/media/assets/help/score-4.png" /></p>

            <h2 id="tap">Tapping Cards and Sites</h2>
            <p>To alter the card state, hover over the card and wait for the cursor to change. A question mark
                indicates a right click action to be available.</p>
            <p className="center">
                <img alt="" src="/media/assets/help/tap-1.png" />
                <img alt="" src="/media/assets/help/tap-2.png" />
            </p>

            <p>The context menu provides all available actions.</p>
            <p className="center">
                <img alt="" src="/media/assets/help/tap-3.png" />
                <img alt="" src="/media/assets/help/tap-4.png" />
            </p>

            <h2 id="reshuffle">Reshuffle discard pile into playdeck</h2>
            <p>The discard pile will be reshuffled automatically once your playdeck is out of cards. You do not need
                to do this yourself.</p>

            <h2 id="shortcuts">Shortcuts</h2>
            <table className="shortcuts">
                <caption>Shortcuts</caption>
                <thead>
                    <tr>
                        <th>Shortcut</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <pre>r</pre>
                        </td>
                        <td>Roll the dice</td>
                    </tr>
                    <tr>
                        <td>
                            <pre>d</pre>
                        </td>
                        <td>Draw card</td>
                    </tr>
                    <tr>
                        <td>
                            <pre>Left Click</pre>
                        </td>
                        <td>Tap, wound or untap card</td>
                    </tr>
                    <tr>
                        <td>
                            <pre>Left Click+ALT</pre>
                        </td>
                        <td>Untap card</td>
                    </tr>
                    <tr>
                        <td>
                            <pre>Left Click+CTRL</pre>
                        </td>
                        <td>Highlight card for 5 seconds</td>
                    </tr>
                </tbody>
            </table>

            <h2 id="problems">Troubleshooting</h2>
            <ul>
                <li>Sometimes you may not hit the drop zone to play a card. Just retry.</li>
                <li>You may reload the page if it seems necessary.</li>
                <li>Open the browsers inspection tool console to check for errors. This should usually not happen
                    but you never know. Chrome's shortcut is CTRL+SHIFT+J</li>
            </ul>
        </div>
    </>
}