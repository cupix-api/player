using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;

namespace Send_and_Receive_Messages
{
    public partial class mainForm : Form
    {
        private ChromiumWebBrowser webChromeBrowser;
        private PlayerEventHandler eventHandler;

        public mainForm()
        {
            InitializeComponent();
            Customize();
        }

        private void Customize()
        {
            CefSettings settings = new CefSettings();
            // Initialize cef with the provided settings
            Cef.Initialize(settings);
            CefSharpSettings.LegacyJavascriptBindingEnabled = true;

            // Create a browser component
            var default_url = "https://players.cupix.com/p/bUVnYXBp";
            webChromeBrowser = new ChromiumWebBrowser(default_url);
            // Add it to the form and set the dimensions
            webChromeBrowser.Dock = DockStyle.Fill;
            this.tableLayoutMain.Controls.Add(webChromeBrowser, 1, 0);
            webChromeBrowser.Location = new System.Drawing.Point(0, 0);
            webChromeBrowser.MinimumSize = new System.Drawing.Size(20, 20);

            int width = this.tableLayoutMain.GetColumnWidths()[0];
            int height = this.tableLayoutMain.GetRowHeights()[1];

            webChromeBrowser.Size = new System.Drawing.Size(width, height);
            webChromeBrowser.TabIndex = 0;

            // Optional - pop up the Chrome development tool window
            webChromeBrowser.IsBrowserInitializedChanged += (sender, args) =>
            {
                if (args.IsBrowserInitialized)
                {
                    webChromeBrowser.ShowDevTools();
                }
            };

            // Javascript object binding - CefSharpMessage javascript object will be created under the parent window
            webChromeBrowser.RegisterAsyncJsObject("CefSharpMessage", new CallbackObjectForJS(this));

            txtTourURL.Text = default_url;
            // Handle other events
            txtTourURL.KeyDown += new KeyEventHandler(txtTourURL_KeyDown);

            eventHandler = new PlayerEventHandler(this);
        }

        private void txtTourURL_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                webChromeBrowser.Load(txtTourURL.Text);
            }
        }

        //public void OnJavascriptEventArrived(string sender, string type, string args, string version, string playerID, string caller)
        public void OnJavascriptEventArrived(dynamic e)
        {
            eventHandler.HandlePlayerEvent(e);
        }

        delegate void PrintToPlayerConsoleCallback(string msg);
        public void PrintToPlayerConsole(string msg)
        {
            if (this.txtPlayerConsole.InvokeRequired)
            {
                PrintToPlayerConsoleCallback d = new PrintToPlayerConsoleCallback(PrintToPlayerConsole);
                this.Invoke(d, new object[] { msg });
            }
            else
            {
                this.txtPlayerConsole.Text = msg;
            }
        }

        delegate void PrintToFormConsoleCallback(string msg);
        public void PrintToFormConsole(string msg)
        {
            if (this.txtFormConsole.InvokeRequired)
            {
                PrintToFormConsoleCallback d = new PrintToFormConsoleCallback(PrintToFormConsole);
                this.Invoke(d, new object[] { msg });
            }
            else
            {
                this.txtFormConsole.Text = msg;
            }
        }

        delegate void DuplicateTreeViewCallback(TreeView source);
        public void DuplicateTreeView(TreeView source)
        {
            if (this.treeTourStructure.InvokeRequired)
            {
                DuplicateTreeViewCallback d = new DuplicateTreeViewCallback(DuplicateTreeView);
                this.Invoke(d, new object[] { source });
            }
            else
            {
                this.treeTourStructure.Nodes.Clear();

                this.treeTourStructure.BeginUpdate();

                TreeNode new_tn;
                foreach (TreeNode tn in source.Nodes)
                {
                    new_tn = new TreeNode(tn.Text);
                    DuplicateTreeChildren(new_tn, tn);

                    this.treeTourStructure.Nodes.Add(new_tn);
                }

                this.treeTourStructure.EndUpdate();
            }
        }

        private void DuplicateTreeChildren(TreeNode parent, TreeNode willCopied)
        {
            TreeNode new_tn;
            foreach (TreeNode tn in willCopied.Nodes)
            {
                new_tn = new TreeNode(tn.Text);
                parent.Nodes.Add(new_tn);

                DuplicateTreeChildren(new_tn, tn);
            }
        }

        private void treeTourStructure_AfterSelect(object sender, TreeViewEventArgs e)
        {
            var script = eventHandler.HandleTreeNodeSelected(e);

            if (!script.Equals(""))
            {
                webChromeBrowser.GetMainFrame().ExecuteJavaScriptAsync(script);
            }
        }

        private void mainForm_Load(object sender, EventArgs e)
        {

        }

        private void btnCamLeft_Click(object sender, EventArgs e)
        {
            OnCamButtonClick(sender);
        }

        private void btnCamRight_Click(object sender, EventArgs e)
        {
            OnCamButtonClick(sender);
        }

        private void btnCamUp_Click(object sender, EventArgs e)
        {
            OnCamButtonClick(sender);
        }

        private void btnCamDown_Click(object sender, EventArgs e)
        {
            OnCamButtonClick(sender);
        }

        private void OnCamButtonClick(object sender)
        {
            var script = eventHandler.HandleCameraChange(((Button)sender).Text);

            if (!script.Equals(""))
            {
                webChromeBrowser.GetMainFrame().ExecuteJavaScriptAsync(script);
            }
        }
    }
}
