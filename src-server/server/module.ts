
import InitRoutingErrorPages from "./RoutingErrorPages";
import InitRoutingGelerals from "./RoutingGenerals";
import InitRoutingHealth from "./RoutingHealth";
import InitRoutingLogin from "./RoutingLogin";
import InitRoutingMap from "./RoutingMap";
import InitRoutingPlay from "./RoutingPlay";

export default function InitRouting()
{
    InitRoutingPlay();
    InitRoutingMap();
    InitRoutingLogin();
    InitRoutingGelerals();
    InitRoutingHealth();
    InitRoutingErrorPages();
}