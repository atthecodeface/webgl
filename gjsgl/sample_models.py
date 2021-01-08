#a Imports
from OpenGL import GL
import numpy as np
from .bone import Bone
from .sample_objects import Cube
from .transformation import Transformation
from .model import ModelBufferData, ModelBufferIndices, ModelBufferView, ModelMaterial, ModelPrimitiveView, ModelPrimitive, ModelMesh, ModelObject, ModelClass

from typing import *

#c Cube mesh with single bone
# cube front face   back face (as seen from front)
#        1    0        5   4
#        3    2        7   6
# triangles (anticlockwise for first)
#  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
# Cube strip
# 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
class CubeModel(ModelClass):
    name = "cube"
    root_object = ModelObject(parent=None)
    bones = []
    bones.append(Bone(parent=None, transformation=Transformation(translation=(0.,0.,-1.))))
    bones.append(Bone(parent=None, transformation=Transformation(translation=(0.,0.,2.))))
    bones[0].derive_matrices()
    cube = Cube
    num_pts = len(cube.weights)//4
    buffer_data = []
    buffer_data.extend(cube.positions)
    buffer_data.extend(cube.normals)
    buffer_data.extend(cube.texcoords)
    for i in range(num_pts):
        buffer_data.extend([0.5,0.5,0.,0.]) # cube.weights
        pass
    buffer_int_data = []
    for i in range(len(cube.positions)//3):
        buffer_int_data.extend([0,1,2,3])
        pass
    buffer_size = len(buffer_data) * 4
    model_data      = ModelBufferData(data=np.array(buffer_data,np.float32), byte_offset=0)
    model_int_data  = ModelBufferData(data=np.array(buffer_int_data,np.uint8), byte_offset=0)
    model_indices   = ModelBufferIndices(data=np.array(cube.indices,np.uint8), byte_offset=0)
    o = 0
    view = ModelPrimitiveView()
    view.position    = ModelBufferView(data=model_data, count=3, gl_type=GL.GL_FLOAT, offset=o)
    o += len(cube.positions) * 4
    view.normal      = ModelBufferView(data=model_data, count=3, gl_type=GL.GL_FLOAT, offset=o)
    o += len(cube.normals) * 4
    view.tex_coords  = ModelBufferView(data=model_data, count=2, gl_type=GL.GL_FLOAT, offset=o)
    o += len(cube.texcoords) * 4
    view.weights     = ModelBufferView(data=model_data, count=4, gl_type=GL.GL_FLOAT, offset=o)
    o += len(cube.weights) * 4
    o = 0
    view.joints      = ModelBufferView(data=model_int_data, count=4, gl_type=GL.GL_UNSIGNED_BYTE, offset=o)
    o += len(cube.positions) * 4 / 3
    view.indices = model_indices
    material = ModelMaterial()
    material.color = (1.,5.,3.,1.)
    primitive = ModelPrimitive()
    primitive.view = view
    primitive.material = material
    primitive.gl_type = GL.GL_TRIANGLE_STRIP
    primitive.indices_offset  = 0
    primitive.indices_count   = len(cube.indices)
    primitive.indices_gl_type = GL.GL_UNSIGNED_BYTE
    root_object.bones = bones[0]
    root_object.mesh = ModelMesh()
    root_object.mesh.primitives.append(primitive)
    pass
