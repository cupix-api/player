using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Send_and_Receive_Messages
{
    class Quaternion
    {
        public double w, x, y, z;

        public Quaternion()
        {
            w = 1.0;
            x = y = z = 0.0;
        }

        public Quaternion(Vec3 v)
        {
            w = 0.0;
            x = v.x;
            y = v.y;
            z = v.z;
        }

        // Rotate "angle" around the vector "v"
        public Quaternion(double angle, Vec3 v)
        {
            w = Math.Cos(angle / 2);
            var s = Math.Sin(angle / 2);
            x = s * v.x;
            y = s * v.y;
            z = s * v.z;
        }

        public Quaternion Conjugate()
        {
            var r = new Quaternion
            {
                w = w,
                x = -x,
                y = -y,
                z = -z
            };

            return r;
        }

        public Quaternion Product(Quaternion o)
        {
            var r = new Quaternion
            {
                w = w * o.w - x * o.x - y * o.y - z * o.z,
                x = w * o.x + x * o.w + y * o.z - z * o.y,
                y = w * o.y - x * o.z + y * o.w + z * o.x,
                z = w * o.z + x * o.y - y * o.x + z * o.w
            };

            return r;
        }

        public Vec3 Rotate(Vec3 v)
        {
            var rv = new Vec3();

            var vq = new Quaternion(v);
            var hq = this.Product(vq);
            var rq = hq.Product(this.Conjugate());

            rv.x = rq.x;
            rv.y = rq.y;
            rv.z = rq.z;

            return rv;
        }
    }
}
