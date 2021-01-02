#a Changes
"""
function -> def
gl[lower case] -> gl[upper case]
"""
#a Imports
from OpenGL import GL
import ctypes
import numpy as np
import math
import glm
from .texture import Texture
from .bone import Bone
from .shader import Shader
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

#c Mesh
class Mesh:
    obj        : Object
    glid       : GL.VAO
    positions  : GL.Buffer
    normals    : GL.Buffer
    texcoords  : GL.Buffer
    weights    : GL.Buffer
    indices    : GL.Buffer
    #f __init__
    def __init__(self, shader:Shader, obj:Object) -> None:
        self.obj = obj
        self.glid = GL.glGenVertexArrays(1)
        GL.glBindVertexArray(self.glid)

        self.positions  = GL.glGenBuffers(1)
        self.normals    = GL.glGenBuffers(1)
        self.texcoords  = GL.glGenBuffers(1)
        self.weights    = GL.glGenBuffers(1)
        self.indices    = GL.glGenBuffers(1)

        GL.glEnableVertexAttribArray(0)      # assign to layout = 0 attribute
        GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.positions)
        GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.positions,np.float32), GL.GL_STATIC_DRAW)
        GL.glVertexAttribPointer(shader.attributes["aVertexPosition"], 3, GL.GL_FLOAT, False, 0, None)
        
        GL.glEnableVertexAttribArray(1)      # assign to layout = 0 attribute
        GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.normals)
        GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.normals,np.float32), GL.GL_STATIC_DRAW)
        GL.glVertexAttribPointer(shader.attributes["aVertexNormal"], 3, GL.GL_FLOAT, False, 0, None)
        
        GL.glEnableVertexAttribArray(2)      # assign to layout = 0 attribute
        GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.texcoords)
        GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.texcoords,np.float32), GL.GL_STATIC_DRAW)
        GL.glVertexAttribPointer(shader.attributes["aVertexTexture"], 2, GL.GL_FLOAT, False, 0, None)
        
        GL.glEnableVertexAttribArray(3)      # assign to layout = 0 attribute
        GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.weights)
        GL.glBufferData(GL.GL_ARRAY_BUFFER, np.array(obj.weights,np.float32), GL.GL_STATIC_DRAW)
        GL.glVertexAttribPointer(shader.attributes["aVertexWeights"], 4, GL.GL_FLOAT, False, 0, None)

        GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, self.indices)
        GL.glBufferData(GL.GL_ELEMENT_ARRAY_BUFFER, np.array(obj.indices,np.uint8), GL.GL_STATIC_DRAW)

        pass
    #f bind
    def bind(self, shader:Shader) -> None:
        GL.glBindVertexArray(self.glid)
        pass
    #f draw
    def draw(self, shader:Shader, bones:List[Any], texture:Texture) -> None:
        self.bind(shader)

        GL.glActiveTexture(GL.GL_TEXTURE0)
        GL.glBindTexture(GL.GL_TEXTURE_2D, texture.texture)
        GL.glUniform1i(shader.uniforms["uTexture"], 0)

        mymatrix = np.zeros(64,np.float32)
        gl_types = {"TS":GL.GL_TRIANGLE_STRIP}
        for sm  in self.obj.submeshes:
            for i in range(16):
                (r,c) = (i//4, i%4)
                mymatrix[ 0+i] = bones[sm.bone_indices[0]].animated_mtm[r][c]
                mymatrix[16+i] = bones[sm.bone_indices[1]].animated_mtm[r][c]
                mymatrix[32+i] = bones[sm.bone_indices[2]].animated_mtm[r][c]
                mymatrix[48+i] = bones[sm.bone_indices[3]].animated_mtm[r][c]
                pass
            GL.glUniformMatrix4fv(shader.uniforms["uBonesMatrices"], 4, False, mymatrix)
            GL.glDrawElements(gl_types[sm.gl_type], sm.vindex_count, GL.GL_UNSIGNED_BYTE, ctypes.c_void_p(sm.vindex_offset))
            pass
        pass
    #f All done
    pass

#c MeshObject
class MeshObject:
    #f __init__
    def __init__(self, obj:Object, shader:Shader, texture:Texture, world_vec:glm.Vec3) -> None:
        self.texture = texture
        self.world_matrix = glm.mat4()
        self.place(world_vec)
        self.mesh = Mesh(shader, obj)
        self.bones = []
        self.bones.append(Bone())
        self.bones.append(Bone(self.bones[0]))
        self.bones.append(Bone(self.bones[1]))
        self.bones[0].transform(Transformation(translation=(0.,0., 1.)))
        self.bones[1].transform(Transformation(translation=(0.,0.,-2.)))
        self.bones[2].transform(Transformation(translation=(0.,0.,-2.)))
        self.bones[0].derive_at_rest()
        self.bones[0].derive_animation()
        pass
    #f place
    def place(self, world_vec:glm.Vec3) -> None:
        self.world_matrix = glm.mat4()
        self.world_matrix[3][0] = world_vec[0]
        self.world_matrix[3][1] = world_vec[1]
        self.world_matrix[3][2] = world_vec[2]
        pass
    #f animate
    def animate(self, time:float) -> None:
        angle = math.sin(time*0.2)*0.3
        q = glm.quat()
        q = glm.angleAxis(time*0.3, glm.vec3([0,0,1])) * q
        q = glm.angleAxis(1.85,     glm.vec3([1,0,0])) * q
        self.bones[0].transform_from_rest(Transformation(translation=(0.,0.,0.), quaternion=q))
        q = glm.quat()
        q = glm.angleAxis(angle*4, glm.vec3([0,0,1])) * q
        self.bones[1].transform_from_rest(Transformation(translation=(0.,0.,-math.cos(4*angle)), quaternion=q))
        q = glm.quat()
        q = glm.angleAxis(angle*4, glm.vec3([0,0,1])) * q
        self.bones[2].transform_from_rest(Transformation(translation=(0.,0.,+math.cos(4*angle)), quaternion=q))
        self.bones[0].derive_animation()
        pass
    #f draw
    def draw(self, shader:Shader) -> None:
        # GL.glEnable(GL.GL_TEXTURE_2D)
        GL.glUniformMatrix4fv(shader.uniforms["uModelMatrix"], 1, False, glm.value_ptr(self.world_matrix))
        self.mesh.draw(shader, self.bones, self.texture)
        pass
    pass

