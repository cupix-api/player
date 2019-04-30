* Cupix Player API supports [CefSharp](https://github.com/cefsharp/CefSharp) web browser component embedded in a .NET app (WinForms or WPF).
* A javascript object with the "CefSharpMessage" name should be registered in the CefSharp instance.
* Player's event is sent to **postMessage()** method of the callback object and the event argument is a **dynamic (ExpandoObject)** object.

```csharp
  public class CallbackObjectForJS
  {
    public void postMessage(dynamic e)
    {
      // Handle event e sent from the Cupix Player
    }
  }
  ...
  {
    webChromeBrowser = new ChromiumWebBrowser(default_url);
    webChromeBrowser.RegisterAsyncJsObject("CefSharpMessage", new CallbackObjectForJS(this));
  }
  ...
```
* Use **window.postMessage()** javascript method when an event is sent to the Player and the argument should be a serialized json string representing the event structure.
* In the sample, [Json.NET](https://www.newtonsoft.com/json) is used for serialization.
```csharp
  dynamic event_to_send = new ExpandoObject();
  event_to_send.ver = "2";
  event_to_send.caller = ".Net Cupix Player API Example App";
  event_to_send.sender = "ObjectHandler";
  ...
  string event_str = JsonConvert.SerializeObject(event_to_send);
  string script = string.Format("window.postMessage('{0}','*')", event_str); 
  webChromeBrowser.GetMainFrame().ExecuteJavaScriptAsync(script);
```
* How to reinstall Nuget Packages
* https://docs.microsoft.com/ko-kr/nuget/consume-packages/reinstalling-and-updating-packages