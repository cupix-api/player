using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Dynamic;
using Newtonsoft.Json;

namespace Send_and_Receive_Messages
{
    class PostObjectForJS
    {
        private dynamic _event_to_send = new ExpandoObject();

        public PostObjectForJS(string sender, string type, ExpandoObject args)
        {
            _event_to_send.ver = 2;
            _event_to_send.caller = ".Net Cupix Player API Example App";
            _event_to_send.sender = sender;
            _event_to_send.type = type;
            _event_to_send.args = args;
        }

        public string MakeScript()
        {
            string args_str = JsonConvert.SerializeObject(_event_to_send);
            return string.Format("window.postMessage('{0}','*')", args_str); 
        }
    }
}
