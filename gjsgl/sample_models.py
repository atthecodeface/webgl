#a Imports
from OpenGL import GL
import numpy as np
from .bone import Bone, BoneSet
from .object import Object
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
class ObjectModel(ModelClass):
    def __init__(self, name:str, obj:Object) -> None:
        
        bones = BoneSet()
        b = Bone(parent=None, transformation=Transformation(translation=(0.,0.,-1.)))
        bones.add_bone(b)
        b = Bone(parent=bones.bones[0], transformation=Transformation(translation=(0.,0.,2.)))
        bones.add_bone(b)
        b = Bone(parent=bones.bones[1], transformation=Transformation(translation=(0.,0.,2.)))
        bones.add_bone(b)
        bones.rewrite_indices()
        bones.derive_matrices()
        
        num_pts = len(obj.positions)//3
        buffer_data = []
        buffer_data.extend(obj.positions)
        buffer_data.extend(obj.normals)
        buffer_data.extend(obj.texcoords)
        buffer_data.extend(obj.weights)
        buffer_int_data = []
        for i in range(len(obj.positions)//3):
            buffer_int_data.extend([0,1,2,3])
            pass
        buffer_size = len(buffer_data) * 4
        model_data      = ModelBufferData(data=np.array(buffer_data,np.float32), byte_offset=0)
        model_int_data  = ModelBufferData(data=np.array(buffer_int_data,np.uint8), byte_offset=0)
        o = 0
        view = ModelPrimitiveView()
        view.position    = ModelBufferView(data=model_data, count=3, gl_type=GL.GL_FLOAT, offset=o)
        o += num_pts * 12
        view.normal      = ModelBufferView(data=model_data, count=3, gl_type=GL.GL_FLOAT, offset=o)
        o += num_pts * 12
        view.tex_coords  = ModelBufferView(data=model_data, count=2, gl_type=GL.GL_FLOAT, offset=o)
        o += num_pts * 8
        view.weights     = ModelBufferView(data=model_data, count=4, gl_type=GL.GL_FLOAT, offset=o)
        o += num_pts * 16
        o = 0
        view.joints      = ModelBufferView(data=model_int_data, count=4, gl_type=GL.GL_UNSIGNED_BYTE, offset=o)
        o += num_pts * 4

        material = ModelMaterial()
        material.color = (1.,5.,3.,1.)

        primitive = ModelPrimitive()
        primitive.view = view
        primitive.material = material
        primitive.gl_type = GL.GL_TRIANGLE_STRIP
        primitive.indices_offset  = 0
        primitive.indices_count   = len(obj.indices)
        if num_pts<255:
            primitive.indices_gl_type = GL.GL_UNSIGNED_BYTE
            model_indices   = ModelBufferIndices(data=np.array(obj.indices,np.uint8), byte_offset=0)
            view.indices = model_indices
            pass
        else:
            primitive.indices_gl_type = GL.GL_UNSIGNED_SHORT
            model_indices   = ModelBufferIndices(data=np.array(obj.indices,np.uint16), byte_offset=0)
            view.indices = model_indices
            pass

        root_object = ModelObject(parent=None)
        root_object.bones = bones
        root_object.mesh = ModelMesh()
        root_object.mesh.primitives.append(primitive)
        super().__init__(name, root_object)
        pass
    pass
