#a Imports
from OpenGL import GL
import ctypes
import numpy as np
import math
from . import glm as Glm
from .texture import Texture
from .bone import Bone, BoneSet, BonePose, BonePoseSet
from .shader import ShaderProgram
from .transformation import Transformation

from typing import *

if not TYPE_CHECKING:
    GL.VAO          = object
    GL.Program      = object
    GL.Shader       = object
    GL.ShaderType   = object
    GL.Texture      = object
    GL.Buffer       = object
    GL.Uniform      = object
    GL.Attribute    = object
    pass

#a Objects
#c Object
class Object:
    positions : List[float]
    normals   : List[float]
    texcoords : List[float]
    weights   : List[float]
    joints    : List[int]
    indices   : List[int]
    submeshes : List["Submesh"]
    pass

#a Classes
#c Submesh
class Submesh:
    #v Properties
    bone_indices : List[int]
    gl_type       : str
    vindex_offset : int
    vindex_count  : int
    #f __init__
    def __init__(self, bone_indices:List[int], gl_type:str, offset:int, count:int) -> None:
        self.bone_indices = bone_indices
        self.gl_type = gl_type
        self.vindex_offset = offset
        self.vindex_count = count
        pass
    #f All done
    pass

#c MeshBase
class MeshBase:
    #f draw
    def draw(self, shader:ShaderProgram, poses:BonePoseSet, texture:Texture) -> None:
        pass
    #f All done
    pass

#c Mesh
class Mesh(MeshBase):
    glid       : GL.VAO
    obj        : Object
    positions  : GL.Buffer
    normals    : GL.Buffer
    texcoords  : GL.Buffer
    weights    : GL.Buffer
    indices    : GL.Buffer
    #f __init__
    def __init__(self, shader:ShaderProgram, obj:Object) -> None:
        self.obj = obj
        num_pts = len(obj.weights)//4
        if not hasattr(obj,"joints"):
            obj.joints = []
            for i in range(num_pts*4):
                obj.joints.append(i%4)
                pass
            pass
        self.glid = GL.glGenVertexArrays(1)
        GL.glBindVertexArray(self.glid)

        self.positions  = GL.glGenBuffers(1)
        self.normals    = GL.glGenBuffers(1)
        self.texcoords  = GL.glGenBuffers(1)
        self.weights    = GL.glGenBuffers(1)
        self.joints     = GL.glGenBuffers(1)
        self.indices    = GL.glGenBuffers(1)

        a = shader.get_attr("vPosition")
        assert a is not None
        GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.positions)
        GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.positions,np.float32), GL.GL_STATIC_DRAW)
        GL.glEnableVertexAttribArray(a)
        GL.glVertexAttribPointer(a, 3, GL.GL_FLOAT, False, 0, None)

        a = shader.get_attr("vNormal")
        if a is not None:
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.normals)
            GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.normals,np.float32), GL.GL_STATIC_DRAW)
            GL.glEnableVertexAttribArray(a)
            GL.glVertexAttribPointer(a, 3, GL.GL_FLOAT, False, 0, None)
            pass
        
        a = shader.get_attr("vTexture")
        if a is not None:
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.texcoords)
            GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.texcoords,np.float32), GL.GL_STATIC_DRAW)
            GL.glEnableVertexAttribArray(a)
            GL.glVertexAttribPointer(a, 2, GL.GL_FLOAT, False, 0, None)
            pass
        
        a = shader.get_attr("vWeights")
        if a is not None:
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.weights)
            GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.weights,np.float32), GL.GL_STATIC_DRAW)
            GL.glEnableVertexAttribArray(a)
            GL.glVertexAttribPointer(a, 4, GL.GL_FLOAT, False, 0, None)
            pass

        a = shader.get_attr("vJoints")
        if a is not None:
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.joints)
            GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.joints,np.int32), GL.GL_STATIC_DRAW)
            GL.glEnableVertexAttribArray(a)
            GL.glVertexAttribPointer(a, 4, GL.GL_INT, False, 0, None)
            pass

        GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, self.indices)
        GL.glBufferData(GL.GL_ELEMENT_ARRAY_BUFFER, np.array(obj.indices,np.uint8), GL.GL_STATIC_DRAW)

        pass
    #f bind
    def bind(self, shader:ShaderProgram) -> None:
        GL.glBindVertexArray(self.glid)
        pass
    #f draw
    def draw(self, shader:ShaderProgram, poses:BonePoseSet, texture:Texture) -> None:
        self.bind(shader)

        if texture.texture is not None:
            GL.glActiveTexture(GL.GL_TEXTURE0)
            GL.glBindTexture(GL.GL_TEXTURE_2D, texture.texture)
            pass
        shader.set_uniform_if("uTexture",    lambda u:GL.glUniform1i(u, 0))
        shader.set_uniform_if("uBonesScale", lambda u:GL.glUniform1f(u, 1.))

        shader.set_uniform_if("uBonesMatrices", lambda u:GL.glUniformMatrix4fv(u, 4, False, poses.data))
        gl_types = {"TS":GL.GL_TRIANGLE_STRIP}
        for sm  in self.obj.submeshes:
            GL.glDrawElements(gl_types[sm.gl_type], sm.vindex_count, GL.GL_UNSIGNED_BYTE, ctypes.c_void_p(sm.vindex_offset))
            pass
        pass
    #f All done
    pass

#c MeshObject
class MeshObject:
    #f __init__
    def __init__(self, mesh:MeshBase, texture:Texture, world_vec:Glm.vec3) -> None:
        self.texture = texture
        self.world_matrix = Glm.mat4.create()
        self.place(world_vec)
        self.mesh = mesh

        self.bones = BoneSet()
        self.bones.add_bone(Bone(parent=None,                transformation=Transformation(translation=Glm.vec3.fromValues(0.,0., 1.))))
        self.bones.add_bone(Bone(parent=self.bones.bones[0], transformation=Transformation(translation=Glm.vec3.fromValues(0.,0.,-2.))))
        self.bones.add_bone(Bone(parent=self.bones.bones[1], transformation=Transformation(translation=Glm.vec3.fromValues(0.,0.,-2.))))
        self.bones.rewrite_indices()
        self.bones.derive_matrices()
        self.pose = BonePoseSet(self.bones)
        self.poses = self.pose.poses
        pass
    #f place
    def place(self, world_vec:Glm.vec3) -> None:
        self.world_matrix = Glm.mat4.create()
        self.world_matrix[12] = world_vec[0]
        self.world_matrix[13] = world_vec[1]
        self.world_matrix[14] = world_vec[2]
        pass
    #f animate
    def animate(self, time:float) -> None:
        self.poses[0].transformation_reset()
        self.poses[1].transformation_reset()
        self.poses[2].transformation_reset()
        angle = math.sin(time*0.2)*0.3
        q = Glm.quat.create()
        Glm.quat.identity(q);
        Glm.quat.rotateX(q,q,1.85);
        Glm.quat.rotateZ(q,q,time*0.3);
        self.poses[0].transform(Transformation(translation=Glm.vec3.fromValues(0.,0.,0.), quaternion=q))
        Glm.quat.identity(q);
        Glm.quat.rotateZ(q,q,4*angle);
        self.poses[1].transform(Transformation(translation=Glm.vec3.fromValues(0.,0.,-math.cos(4*angle)), quaternion=q))
        Glm.quat.identity(q);
        Glm.quat.rotateZ(q,q,-4*angle);
        self.poses[2].transform(Transformation(translation=Glm.vec3.fromValues(0.,0.,+math.cos(4*angle)), quaternion=q))
        self.pose.update(int(time*1E5))
        pass
    #f draw
    def draw(self, shader:ShaderProgram) -> None:
        GL.glUniformMatrix4fv(shader.uniforms["uModelMatrix"], 1, False, self.world_matrix)
        self.mesh.draw(shader, self.pose, self.texture)
        pass
    pass

