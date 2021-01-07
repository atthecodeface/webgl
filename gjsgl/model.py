#a Imports
from OpenGL import GL
import ctypes
import numpy as np
import math
import glm
from .texture import Texture
from .bone import Bone, BonePose
from .shader import ShaderClass, ShaderProgram
from .transformation import Transformation, TransMat

from typing import *
ByteBuffer = Any

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

#a Classes
#c ModelMaterial
class ModelMaterial:
    name     : str
    color    : Tuple[float,float,float,float] # Base color
    metallic : float # 0 is fully dielectric, 1.0 is fully metallic
    roughness: float # 0.5 is specular, no specular down to 0 full reflection, up to 1 fully matt
    base_texture: Optional[Texture]
    normal_texture: Optional[Texture]
    def gl_program_configure(self, program:ShaderProgram) -> None:
        # GL.glActiveTexture(GL.GL_TEXTURE0)
        # GL.glBindTexture(GL.GL_TEXTURE_2D, texture.texture)
        # shader.set_uniform_if("uTexture",    lambda u:GL.glUniform1i(u, 0))
        pass
    pass

#c ModelBufferData
class ModelBufferData:
    data        : ByteBuffer
    byte_offset : int
    byte_length : int
    gl_buffer   : GL.Buffer # if a gl buffer then bound to data[byte_offset] .. + byte_length
    def __init__(self, data:Any, byte_offset:int=0, byte_length:int=0) -> None:
        if byte_length==0: byte_length=len(data)
        self.data = data
        self.byte_length = byte_length
        self.byte_offset = byte_offset
        self.gl_buffer = -1 # type: ignore
        pass
    def gl_create(self) -> None:
        if self.gl_buffer < 0: # type: ignore
            self.gl_buffer = GL.glGenBuffers(1)
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.gl_buffer)
            GL.glBufferData(GL.GL_ARRAY_BUFFER, self.data[self.byte_offset:self.byte_offset+self.byte_length], GL.GL_STATIC_DRAW)
            pass
        pass
    
#c ModelBufferIndices
class ModelBufferIndices:
    data: ByteBuffer
    byte_offset : int
    byte_length : int
    gl_buffer   : "GL.Buffer"
    def __init__(self, data:Any, byte_offset:int=0, byte_length:int=0) -> None:
        if byte_length==0: byte_length=len(data)
        self.data = data
        self.byte_length = byte_length
        self.byte_offset = byte_offset
        self.gl_buffer = -1 # type: ignore
        pass
    def gl_create(self) -> None:
        if self.gl_buffer < 0: # type: ignore
            self.gl_buffer = GL.glGenBuffers(1)
            GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, self.gl_buffer)
            GL.glBufferData(GL.GL_ELEMENT_ARRAY_BUFFER, self.data[self.byte_offset:self.byte_offset+self.byte_length], GL.GL_STATIC_DRAW)
            pass
        pass
    def gl_bind_program(self, shader:ShaderClass) -> None:
        GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, self.gl_buffer)
        pass
    pass
    
#c ModelBufferView - for use in a vertex attribute pointer
class ModelBufferView:
    data: ModelBufferData
    count: int # Number of <comp type> per vertex - 1 to 4
    gl_type : "GL.ValueTypeEnum" # e.g. GL_FLOAT
    offset : int # Offset from start of buffer to first byte of data
    stride : int # Stride of data in the buffer - 0 for count*sizeof(gl_type)
    def __init__(self, data:ModelBufferData, count:int, gl_type:"GL.ValueTypeEnum", offset:int, stride:int=0) -> None:
        self.data = data
        self.count = count
        self.gl_type = gl_type
        self.offset = offset
        self.stride = stride
        pass
    def gl_create(self) -> None:
        self.data.gl_create()
        pass
    def gl_bind_program(self, shader:ShaderClass, attr:str) -> None:
        a = shader.get_attr(attr)
        if a is not None:
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.data.gl_buffer)
            GL.glEnableVertexAttribArray(a)
            GL.glVertexAttribPointer(a, self.count, self.gl_type, False, self.stride, ctypes.c_void_p(self.offset))
            pass
        pass
    pass

#c ModelPrimitiveView
class ModelPrimitiveView:
    indices    : ModelBufferIndices
    position   : ModelBufferView
    normal     : ModelBufferView
    tex_coords : Optional[ModelBufferView]
    joints     : Optional[ModelBufferView]
    weights    : Optional[ModelBufferView]
    tangent    : Optional[ModelBufferView]
    color      : Optional[ModelBufferView]
    gl_vao     : "GL.VAO"
    def __init__(self) -> None:
        self.tex_coords = None
        self.joints = None
        self.weights = None
        self.tangent = None
        self.color = None
        pass
    def gl_create(self) -> None:
        self.indices.gl_create()
        self.position.gl_create()
        self.normal.gl_create()
        if self.tex_coords is not None: self.tex_coords.gl_create()
        if self.joints     is not None: self.joints.gl_create()
        if self.weights    is not None: self.weights.gl_create()
        if self.tangent    is not None: self.tangent.gl_create()
        if self.color      is not None: self.color.gl_create()
        self.gl_vao = GL.glGenVertexArrays(1)
        pass
    def gl_bind_program(self, shader:ShaderClass) -> None:
        GL.glBindVertexArray(self.gl_vao)
        self.indices.gl_bind_program(shader)
        self.position.gl_bind_program(shader, "vPosition")
        self.normal.gl_bind_program(shader, "vNormal")
        if self.tex_coords is not None: self.tex_coords.gl_bind_program(shader, "vTexture")
        if self.joints     is not None: self.joints.gl_bind_program(shader, "vJoints")
        if self.weights    is not None: self.weights.gl_bind_program(shader, "vWeights")
        if self.tangent    is not None: self.tangent.gl_bind_program(shader, "vTangent")
        if self.color      is not None: self.color.gl_bind_program(shader, "vColor")
        pass
    pass

#c ModelPrimitive
class ModelPrimitive:
    name       : str
    material   : ModelMaterial
    view       : ModelPrimitiveView
    gl_type          : "GL.ElementType"
    indices_count   : int
    indices_offset  : int
    indices_gl_type : "GL.ValueTypeEnum"
    def __init__(self) -> None:
        pass
    def clone(self) -> None:
        pass
    def gl_create(self) -> None:
        self.view.gl_create()
        pass
    def gl_bind_program(self, shader:ShaderClass) -> None:
        self.view.gl_bind_program(shader)
        pass
    def gl_draw(self, program:ShaderProgram) -> None:
        GL.glBindVertexArray(self.view.gl_vao)
        self.material.gl_program_configure(program)
        GL.glDrawElements(self.gl_type, self.indices_count, self.indices_gl_type, ctypes.c_void_p(self.indices_offset))
        pass
    pass

#c ModelMesh
class ModelMesh:
    name       : str
    primitives : List[ModelPrimitive]
    def __init__(self) -> None:
        self.primitives = []
        pass
    def gl_create(self) -> None:
        for p in self.primitives:
            p.gl_create()
            pass
        pass
    def gl_bind_program(self, shader:ShaderClass) -> None:
        for p in self.primitives:
            p.gl_bind_program(shader)
            pass
        pass
    def gl_draw(self, program:ShaderProgram) -> None:
        for p in self.primitives:
            p.gl_draw(program)
            pass
        pass
    pass

#c ModelObject
class ModelObject:
    """
    A ModelObject is a member of a hierarchy of ModelObject's,
    where each object has a transform and potentially a mesh,
    and further a bone set

    In GLTF the ModelObject is a subset of the nodes, and the bone set is a skin.
    """
    transformation: Optional[Transformation]
    children      : List["ModelObject"]
    parent        : Optional["ModelObject"]
    mesh          : Optional[ModelMesh]
    bones         : Optional[Bone]
    #f __init__
    def __init__(self, parent:Optional["ModelObject"], transformation:Optional[Transformation]=None):
        self.transformation = transformation
        self.parent = parent
        self.children = []
        if self.parent is not None:
            self.parent.children.append(self)
            pass
        pass
    #f iter_objects
    def iter_objects(self, trans_mat:TransMat) -> Iterable[Tuple[TransMat,"ModelObject"]]:
        trans_mat = self.transformation.mat_after(trans_mat)
        yield(trans_mat, self)
        for c in self.children:
            c.iter_objects(trans_mat)
            pass
        pass
    #f has_mesh
    def has_mesh(self) -> bool:
        return self.mesh is not None
    #f get_mesh
    def get_mesh(self) -> ModelMesh:
        assert self.mesh is not None
        return self.mesh
    #f has_bones
    def has_bones(self) -> bool:
        return self.bones is not None
    #f get_bones
    def get_bones(self) -> Bone:
        assert self.bones is not None
        return self.bones
    #f All done
    pass

#c ModelClass
class ModelClass:
    """
    A ModelClass is a model that may be instanced.

    It consists of a root ModelObject, and a list of bones
    """
    name       : str
    root_object: ModelObject
    bones      : List[Bone]
    #f __init__
    def __init__(self, name:str, root_object:Optional[ModelObject]=None) -> None:
        self.name = name
        if root_object is not None:
            self.root_object = root_object
            pass
        self.bones = []
        pass
    #f iter_objects
    def iter_objects(self) -> Iterable[Tuple[TransMat,ModelObject]]:
        for o in self.root_object.iter_objects(TransMat()):
            yield o
        pass
    pass

#c ModelInstance
class ModelInstance:
    """
    A ModelInstance is an instance of a ModelClass
    It has a bone pose hierarchy and a model transformation.
    It should have any texture and color overrides too.

    The model transform places it appropriately in world space
    Each model object instance inside the model has a transformation relative to that
    In addition, the model object instances may have a bone pose hierarchy
    """
    trans_mat     : TransMat
    bone_poses    : List[BonePose]
    meshes        : List[Tuple[TransMat, ModelMesh, int]]
    def __init__(self, model_class:ModelClass) -> None:
        self.bone_poses = []
        self.meshes = []
        bones_dict = {}
        for (trans_mat,model) in model_class.iter_objects():
            if not model.has_mesh(): continue
            mesh_instance = model.get_mesh()
            bone_index = -1
            if model.has_bones:
                bone = model.get_bones() # get root bone
                if bone not in bones_dict:
                    bones_dict[bone] = len(self.bone_poses)
                    self.bone_poses.append(BonePose.pose_bones(bone))
                    pass
                bone_index = bones_dict[bone]
                pass
            self.meshes.append( (trans_mat, mesh_instance, bone_index) )
            pass
        pass
    pass
