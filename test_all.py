import unittest
import glm
import math
import random
from gjsgl.object import Mesh, MeshObject
from gjsgl.sample_objects import Cube, DoubleCube, DoubleCube2, Snake
from gjsgl.transformation import Transformation
from gjsgl.bone import Bone
from gjsgl.shader import BoneShader, FlatShader
from gjsgl.frontend import Frontend
from gjsgl.texture import Texture
from gjsgl.collider import Collider

from typing import *
Vec2 = Any

class Transform(unittest.TestCase):
    eps = 1E-5
    def int_test_transformation_of_mat(self, angle:float, axis:glm.Vec3, scale:glm.Vec3, translation:glm.Vec3) -> None:
        q = glm.angleAxis(angle, axis)
        a = Transformation(translation=translation, quaternion=q, scale=scale)
        m = a.mat4()
        b = Transformation()
        b.from_mat4(m)
        self.assertTrue(b.distance(a)<self.eps, f"failed with {a}, {b}")
        # c = Transformation()
        # c.from_mat4(m*m)
        # print(c)
        # print(m*m)
        # print(c.mat4())
        pass
    def test_transformation(self):
        for (i,axis) in [ (0, [1.,0.,0.],),
                          (1, [0.,1.,0.],),
                          (2, [1.,0.,1.],),
                          (3, [0.,0.,1.],),
                          (4, [1.,1.,1.],),
                          (5, [3.,10.,-9.],),
                          (6, [2.,0.,0.],),
                          (7, [17.,9.,-10.],),
                          (8, [-1000.,0.,0.],),
                          ]: 
            axis = glm.normalize(axis)
            angle = i*36.0 * 3.1415/180.0
            scale = glm.vec3([1,2,3])*(i+1)
            # scale = glm.vec3([1,1,1])*(i+1)
            translation = glm.vec3([-1,1,9])*(i+1)
            self.int_test_transformation_of_mat(angle, axis, scale, translation)
            pass
        pass
    pass

class ColliderTest(unittest.TestCase):
    o = glm.vec2()
    x05 = glm.vec2([0.5,0])
    xm5 = glm.vec2([-0.5,0])
    x = glm.vec2([1,0])
    x15 = glm.vec2([1.5,0])
    y = glm.vec2([1,0])
    xy = glm.vec2([1,1])
    def random_point(self, rnd, xsc=1, ysc=1)->Any:
        x = rnd.random()*xsc
        y = rnd.random()*ysc
        return glm.vec2([x,y])
    def random_vector(self, rnd, p:Vec2=None, d=None)->Any:
        if d is None:
            d = rnd.random()
            pass
        angle = math.pi*rnd.random()*2
        length = d
        c = math.cos(angle)
        s = math.sin(angle)
        x = length*c
        y = length*s
        if p is not None:
            x += p[0]
            y += p[1]
            pass
        return glm.vec2([x,y])
    def bound_to_vector(self, p) -> None:
        size = 1
        if p[0]<-size: p[0]+=2*size
        if p[0]>size : p[0]-=2*size
        if p[1]<-size: p[1]+=2*size
        if p[1]>size : p[1]-=2*size
        pass
    def bound_to_postion(self, p) -> None:
        size = 1
        if p[0]<-size: p[0]+=2*size
        if p[0]>size : p[0]-=2*size
        if p[1]<-size: p[1]+=2*size
        if p[1]>size : p[1]-=2*size
        pass
    def test_coincident_circles(self) -> None:
        self.assertTrue( Collider.circle_to_circle(self.o,1, self.o,1), "Coincident circles" );
        self.assertTrue( Collider.circle_to_circle(self.o,1, self.o,0.1), "Coincident circles" );
        pass
    def test_circle_to_circle_x_1(self) -> None:
        self.assertTrue(  Collider.circle_to_circle(self.o,1.0,  self.x,0.1), "o 1. x 0.1" );
        self.assertTrue(  Collider.circle_to_circle(self.o,0.5,  self.x,0.6), "o 0.5 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.o,0.35, self.x,0.6), "o 0.35 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.o,0.01, self.x,0.98), "o 0.01 x 0.98");

        self.assertTrue(  Collider.circle_to_circle(self.x05,1.0,  self.x15,0.1), "o 1. x 0.1" );
        self.assertTrue(  Collider.circle_to_circle(self.x05,0.5,  self.x15,0.6), "o 0.5 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x05,0.35, self.x15,0.6), "o 0.35 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x05,0.01, self.x15,0.98), "o 0.01 x 0.98");

        self.assertTrue(  Collider.circle_to_circle(self.x05,1.0,  self.x15,0.1, self.bound_to_vector), "o 1. x 0.1" );
        self.assertTrue(  Collider.circle_to_circle(self.x05,0.5,  self.x15,0.6, self.bound_to_vector), "o 0.5 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x05,0.35, self.x15,0.6, self.bound_to_vector), "o 0.35 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x05,0.01, self.x15,0.98, self.bound_to_vector), "o 0.01 x 0.98");

        self.assertTrue(  Collider.circle_to_circle(self.x05,1.0,  self.xm5,0.1, self.bound_to_vector), "o 1. x 0.1" );
        self.assertTrue(  Collider.circle_to_circle(self.x05,0.5,  self.xm5,0.6, self.bound_to_vector), "o 0.5 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x05,0.35, self.xm5,0.6, self.bound_to_vector), "o 0.35 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x05,0.01, self.xm5,0.98, self.bound_to_vector), "o 0.01 x 0.98");
        pass
    def test_circle_to_circle_x_05(self) -> None:
        self.assertTrue(  Collider.circle_to_circle(self.x,0.5,  self.xm5,0.1, self.bound_to_vector), "o 1. x 0.1" );
        self.assertTrue(  Collider.circle_to_circle(self.x,0.5,  self.xm5,0.6, self.bound_to_vector), "o 0.5 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x,0.35, self.xm5,0.13, self.bound_to_vector), "o 0.35 x 0.6");
        self.assertFalse( Collider.circle_to_circle(self.x,0.01, self.xm5,0.48, self.bound_to_vector), "o 0.01 x 0.98");
        self.assertTrue( Collider.circle_to_circle(self.x,0.03, self.xm5,0.48, self.bound_to_vector), "o 0.01 x 0.98");
        pass
    def test_circle_to_circle_random(self, seed="banana") -> None:
        rnd = random.Random()
        rnd.seed(seed)
        for i in range(10000):
            d = rnd.random()*0.9
            c0 = self.random_point(rnd)
            c1 = self.random_vector(rnd, p=c0, d=d)
            r0 = rnd.random()*d
            r1 = d-r0
            self.assertTrue(  Collider.circle_to_circle(c0,r0, c1,r1+0.001), "just in range" );
            self.assertFalse( Collider.circle_to_circle(c0,r0, c1,r1-0.001), "just out of range");
            self.bound_to_postion(c1)
            self.assertTrue(  Collider.circle_to_circle(c0,r0, c1,r1+0.001, self.bound_to_vector), f"just in range {c0}, {r0}, {c1}, {r1}" );
            self.assertFalse( Collider.circle_to_circle(c0,r0, c1,r1-0.001, self.bound_to_vector), "just out of range");
            pass
        pass
    def test_circle_to_line_random_unbounded(self, seed="apple") -> None:
        rnd = random.Random()
        rnd.seed(seed)
        for i in range(10000):
            d = rnd.random()*0.9
            c0 = self.random_point(rnd) # Centre of circle
            radius = self.random_vector(rnd, d=d) # radius vector length d
            line = glm.vec2([radius[1],-radius[0]]) # line direction - tangential to circle at c0+radius
            # points on the line are (c0 + radius + k*line)
            # Unbounded distance to line between p(k0) and p(k1) is >r if sign(k0)==sign(k1)
            k0 = rnd.random()*2-1
            k1 = rnd.random()*2-1
            k0s = math.copysign(1,k0)
            k1s = math.copysign(1,k1)
            p0 = c0 + radius + (line*k0)
            p1 = c0 + radius + (line*k1)
            dp = p1 - p0
            ctl = Collider.circle_to_line(c0, d+0.001, p0=p0, dp=dp)
            if (k0s!=k1s):
                self.assertTrue( ctl is not None, f"Line is supposed to intersect circle radius {d}")
                self.assertTrue( abs(d-ctl)<1E-4, f"Line is supposed to intersect circle radius {d}")
                pass
            else:
                self.assertTrue( ctl is None, "Line should not get radius {d} from circle" )
                pass
            ctl = Collider.circle_to_line(c0, d-0.001, p0=p0, dp=dp)
            self.assertTrue( ctl is None, "Line should not get radius {d} from circle" )
            pass
        pass
    def test_circle_to_line_random_bounded(self, seed="pear") -> None:
        rnd = random.Random()
        rnd.seed(seed)
        for i in range(10000):
            d = rnd.random()*0.9
            c0 = self.random_point(rnd) # Centre of circle
            radius = self.random_vector(rnd, d=d) # radius vector length d
            line = glm.vec2([radius[1],-radius[0]]) # line direction - tangential to circle at c0+radius
            # points on the line are (c0 + radius + k*line)
            # Unbounded distance to line between p(k0) and p(k1) is >r if sign(k0)==sign(k1)
            k0 = (rnd.random()*2-1) * 0.5
            k1 = (rnd.random()*2-1) * 0.5
            k0s = math.copysign(1,k0)
            k1s = math.copysign(1,k1)
            p0 = c0 + radius + (line*k0)
            p1 = c0 + radius + (line*k1)
            dp = p1 - p0
            self.bound_to_postion(p0)
            ctl = Collider.circle_to_line(c0, d+0.001, p0=p0, dp=dp, make_relative=self.bound_to_vector)
            # print(f"c0:{c0}, p0:{p0}, p0-c0:{p0-c0}, dp:{dp}, {d}, {radius}, {line}, {k0}:{k1}, {ctl}")
            if (k0s!=k1s):
                self.assertTrue( ctl is not None, f"Line is supposed to intersect circle radius {d}")
                self.assertTrue( abs(d-ctl)<1E-4, f"Line is supposed to intersect circle radius {d}")
                pass
            else:
                self.assertTrue( ctl is None, "Line should not get radius {d} from circle" )
                pass
            ctl = Collider.circle_to_line(c0, d-0.001, p0=p0, dp=dp, make_relative=self.bound_to_vector)
            self.assertTrue( ctl is None, "Line should not get radius {d} from circle" )
            pass
        pass
    def test_circle_to_line_specific(self) -> None:
        for (cx, cy, s, px, py, dpx, dpy, d) in [
                ( 208.145, -3.95585, 3.0, 208.44, -3.97875,  0.140605, -0.142811, 0.194146 ),
                ( 208.145, -3.95585, 3.0, 208.30, -4.11,     0.140605, -0.142811, 0.002301 ),
                ]:
            c  = glm.vec2([cx,cy])
            p  = glm.vec2([px,py])
            dp = glm.vec2([dpx,dpy])
            ctl = Collider.circle_to_line(c0=c, r0=s, p0=p, dp=dp, make_relative=self.bound_to_vector)
            if d is None: self.assertTrue(ctl==None)
            if d is not None: self.assertTrue(abs(d-ctl)<1E-4)
            # print(f"{c}, {s}, {p}, {dp}, {ctl}")
            pass
        pass
    pass

if __name__=="__main__":
    unittest.main()
    pass
