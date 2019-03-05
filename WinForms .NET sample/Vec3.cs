using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Send_and_Receive_Messages
{
    class Vec3
    {
        public double x, y, z;

        public void Set(dynamic p)
        {
            x = (double)p[0];
            y = (double)p[1];
            z = (double)p[2];
        }

        public Vec3 Cross(Vec3 o)
        {
            Vec3 r = new Vec3
            {
                x = y * o.z - z * o.y,
                y = -(x * o.z - z * o.x),
                z = x * o.y - y * o.x
            };

            return r;
        }

        override public string ToString()
        {
            return x.ToString("0.00") + ", " + y.ToString("0.00") + ", " + z.ToString("0.00");
        }
    }
}
