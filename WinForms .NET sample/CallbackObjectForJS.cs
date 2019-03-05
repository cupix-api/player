using System;

namespace Send_and_Receive_Messages {
    public class CallbackObjectForJS
    {
        private mainForm _parent;

        public CallbackObjectForJS(mainForm parent)
        {
            _parent = parent;
        }

        public void postMessage(dynamic e)
        {
            _parent.OnJavascriptEventArrived(e);
        }
    }
}