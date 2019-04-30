using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Windows.Forms;
using System.Dynamic;

namespace Send_and_Receive_Messages
{
    class PlayerEventHandler
    {
        private mainForm _parent;
        private TreeView _model;
        private Camera _camera;
        
        public PlayerEventHandler(mainForm parent)
        {
            _parent = parent;
            _model = new TreeView();
            _camera = new Camera();
        }

        public void HandlePlayerEvent(dynamic player_event)
        {
            string sender = player_event.sender;
            string type = player_event.type;
            string version = player_event.ver;
            string playerID = player_event.player_id;
            string caller = player_event.caller;
            dynamic player_event_args = player_event.args;

            string msg = "";
            switch (sender)
            {
                case "Loader":
                    if (type.Equals("Started"))
                    {
                        msg = "Loading started";
                    }
                    else if (type.Equals("Progress"))
                    {
                        dynamic p = player_event_args.progress;
                        msg = "Loading progress: " + p.ToString("0") + "%";
                    }
                    else if (type.Equals("Completed"))
                    {
                        msg = "Loading completed";
                        PopulateTreeStructure(player_event_args);
                    }
                    break;
                case "Camera":
                    if (type.Equals("Changed"))
                    {
                        dynamic pos = player_event_args.pos;
                        dynamic up = player_event_args.up;
                        dynamic lookat = player_event_args.lookat;

                        _camera.pos.Set(pos);
                        _camera.up.Set(up);
                        _camera.lookAt.Set(lookat);

                        msg = 
                            "Camera Changed" + Environment.NewLine +
                            "Position:" + _camera.pos.ToString() + Environment.NewLine +
                            "Up vector:" + _camera.up.ToString() + Environment.NewLine +
                            "Look at:" + _camera.lookAt.ToString() + Environment.NewLine;
                    }
                    break;
                case "TransitHandler":
                    if (type.Equals("PanoStarted"))
                    {
                        msg = "Pano transit to " + player_event_args.id + " " + type;
                    }
                    else if (type.Equals("PanoCompleted"))
                    {
                        msg = "Pano transit to " + player_event_args.id + " " + type;
                    }
                    break;
                case "ObjectHandler":
                    msg = player_event_args.name + " " + type;

                    if (type.Equals("Focused"))
                    {
                    }
                    else if (type.Equals("Blurred"))
                    {
                    }
                    else if (type.Equals("Selected"))
                    {
                        msg += Environment.NewLine + "Object type: " + player_event_args.type;
                    }
                    break;
               default: break;
            }

            string event_info = "Sender: " + sender +
                Environment.NewLine + "Type: " + type +
                Environment.NewLine + "Args: " + player_event_args +
                Environment.NewLine + "Ver: " + version +
                Environment.NewLine + "Player ID: " + playerID +
                Environment.NewLine + "Caller: " + caller;

            _parent.PrintToPlayerConsole(event_info);
            _parent.PrintToFormConsole(msg);
        }

        private void PopulateTreeStructure(dynamic tour)
        {
            string tour_id = (string) tour.tour_id;

            _model.Nodes.Clear();
            TreeNode tour_node = new TreeNode(tour_id);
            _model.Nodes.Add(tour_node);
            
            dynamic groups = tour.groups;
            var num_groups = groups.Count;
            int i, j, k;

            for (i = 0; i < num_groups; ++i) {
                dynamic group = groups[i];
                var group_name = (string) group.name;

                TreeNode group_node = new TreeNode(group_name);
                tour_node.Nodes.Add(group_node);

                dynamic sections = group.sections;
                var num_sections = sections.Count;

                double group_elevation = double.MaxValue;
                for (j = 0; j < num_sections; ++j)
                {
                    dynamic section = sections[j];
                    var section_name = (string) section.name;
                    var section_id = (string) section.id;
                    var section_elevation = (double) section.elevation;

                    TreeNode section_node = new TreeNode(section_name);
                    group_node.Nodes.Add(section_node);

                    group_elevation = Math.Min(group_elevation, section_elevation);
                    dynamic panos = section.panos;
                    var num_panos = panos.Count;

                    for (k = 0; k < num_panos; ++k)
                    {
                        dynamic pano = panos[k];

                        var pano_name = (string) pano.name;
                        var pano_id = (string) pano.id;
                        dynamic pano_pos = pano.pos;

                        var node_name = CipherPanoName(pano_id, pano_name);

                        TreeNode pano_node = new TreeNode(node_name);
                        section_node.Nodes.Add(pano_node);
                    }
                }

            }

            _parent.DuplicateTreeView(_model);
        }

        public string HandleTreeNodeSelected(TreeViewEventArgs e)
        {
            string pano_id, pano_name;

            if (DecipherPanoName(e.Node.Text, out pano_id, out pano_name))
            {
                dynamic args = new ExpandoObject() as dynamic;
                args.name = pano_name;
                args.id = pano_id;

                var post_obj = new PostObjectForJS("TransitHandler", "ChangePano", args);
                return post_obj.MakeScript();
            }

            return "";
        }

        public string HandleCameraChange(string type)
        {
            double angle_to_rotate = Math.PI * 15.0 / 180.0;

            dynamic args = new ExpandoObject() as dynamic;

            Quaternion q;
            Vec3 new_lookat = _camera.lookAt; 
            Vec3 new_upvec = _camera.up;
            Vec3 perp_vec = _camera.lookAt.Cross(_camera.up);

            switch (type)
            {
                case "Left":
                    q = new Quaternion(angle_to_rotate, _camera.up);
                    new_lookat = q.Rotate(_camera.lookAt);
                    break;
                case "Right":
                    q = new Quaternion(-angle_to_rotate, _camera.up);
                    new_lookat = q.Rotate(_camera.lookAt);
                    break;
                case "Up":
                    q = new Quaternion(angle_to_rotate, perp_vec);
                    new_lookat = q.Rotate(_camera.lookAt);
                    new_upvec = q.Rotate(_camera.up);
                    break;
                case "Down":
                    q = new Quaternion(-angle_to_rotate, perp_vec);
                    new_lookat = q.Rotate(_camera.lookAt);
                    new_upvec = q.Rotate(_camera.up);
                    break;
            }

            double[] look_at = { new_lookat.x, new_lookat.y, new_lookat.z };
            double[] up_vec = { new_upvec.x, new_upvec.y, new_upvec.z };

            args.lookat = look_at;
            args.up = up_vec;
            var post_obj = new PostObjectForJS("Camera", "Change", args);
            return post_obj.MakeScript();
        }

        public string CipherPanoName(string id, string name)
        {
            return "[" + id + "]" + " " + name;
        }

        public bool DecipherPanoName(string given, out string id, out string name)
        {
            int charLocation = given.IndexOf("]", StringComparison.Ordinal);
            id = "";
            name = "";

            if (charLocation < 1)
            {
                return false;
            }

            id = given.Substring(1, charLocation-1);
            name = given.Substring(charLocation+2);

            return true;
        }
    }
}
