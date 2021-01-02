import unittest
import glm
import math
from gjsgl.object import Mesh, MeshObject
from gjsgl.sample_objects import Cube, DoubleCube, DoubleCube2, Snake
from gjsgl.transformation import Transformation
from gjsgl.bone import Bone
from gjsgl.shader import BoneShader, FlatShader
from gjsgl.frontend import Frontend
from gjsgl.texture import Texture

class Transform(unittest.TestCase):
    eps = 1E-5
    def int_test_transformation_of_mat(self, angle:float, axis:glm.Vec3, scale:glm.Vec3, translation:glm.Vec3) -> None:
        q = glm.angleAxis(angle, axis)
        a = Transformation(translation=translation, quaternion=q, scale=scale)
        m = a.mat4()
        b = Transformation()
        b.from_mat4(m)
        self.assertTrue(b.distance(a)<self.eps, f"failed with {a}, {b}")
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
            translation = glm.vec3([-1,1,9])*(i+1)
            self.int_test_transformation_of_mat(angle, axis, scale, translation)
            pass
        pass
    pass

if __name__=="__main__":
    unittest.main()
    pass
