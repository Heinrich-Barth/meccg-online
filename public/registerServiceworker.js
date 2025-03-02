const doRegister = async () => 
{
    try 
    {
        const registration = await navigator.serviceWorker.register("/serviceWorker.js", {
          scope: "/",
        });
        if (registration.installing) 
          console.info("Service worker installing");
        else if (registration.waiting) 
          console.info("Service worker installed");
        else if (registration.active) 
          console.info("Service worker active");
    } 
    catch (error) 
    {
        console.error(`Registration failed with ${error}`);
    }
}

if (navigator.serviceWorker) 
  doRegister();
else 
  console.info("Service worker not available");