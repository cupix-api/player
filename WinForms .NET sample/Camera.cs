using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Send_and_Receive_Messages
{
    class Camera
    {
        public Vec3 pos;
        public Vec3 up;
        public Vec3 lookAt;
        public double fov;

        public Camera()
        {
            pos = new Vec3();
            up = new Vec3();
            lookAt = new Vec3();
            fov = 0.0;
        }
    }
}
