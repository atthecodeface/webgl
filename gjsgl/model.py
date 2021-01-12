#a Imports
from OpenGL import GL
import ctypes
import numpy as np
import math
import glm
from .hierarchy import Hierarchy
from .texture import Texture
from .bone import Bone, BonePose, BoneMatrixArray, BoneSet, BonePoseSet
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
    #V Properties
    name     : str
    color    : Tuple[float,float,float,float] # Base color
    metallic : float # 0 is fully dielectric, 1.0 is fully metallic
    roughness: float # 0.5 is specular, no specular down to 0 full reflection, up to 1 fully matt
    base_texture: Optional[Texture]
    normal_texture: Optional[Texture]
    #f gl_program_configure ?
    def gl_program_configure(self, program:ShaderProgram) -> None:
        # GL.glActiveTexture(GL.GL_TEXTURE0)
        # GL.glBindTexture(GL.GL_TEXTURE_2D, texture.texture)
        # shader.set_uniform_if("uTexture",    lambda u:GL.glUniform1i(u, 0))
        pass
    #f __str__
    def __str__(self) -> str:
        r = str(self.__dict__)
        return r
    #f All done
    pass

#c ModelBufferData
class ModelBufferData:
    #v Properties
    data        : ByteBuffer
    byte_offset : int
    byte_length : int
    gl_buffer   : GL.Buffer # if a gl buffer then bound to data[byte_offset] .. + byte_length
    #f __init__
    def __init__(self, data:Any, byte_offset:int=0, byte_length:int=0) -> None:
        if byte_length==0: byte_length=len(data)
        self.data = data
        self.byte_length = byte_length
        self.byte_offset = byte_offset
        self.gl_buffer = -1 # type: ignore
        pass
    #f gl_create
    def gl_create(self) -> None:
        if self.gl_buffer < 0: # type: ignore
            self.gl_buffer = GL.glGenBuffers(1)
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.gl_buffer)
            GL.glBufferData(GL.GL_ARRAY_BUFFER, self.data[self.byte_offset:self.byte_offset+self.byte_length], GL.GL_STATIC_DRAW)
            # print(f"Bound {self.gl_buffer}")
            # print(f"Data {self.data[self.byte_offset:self.byte_offset+self.byte_length]}")
            pass
        pass
    #f __str__
    def __str__(self) -> str:
        r = str(self.__dict__)
        return r
    #f All done
    pass
    
#c ModelBufferIndices
class ModelBufferIndices:
    #v properties
    data: ByteBuffer
    byte_offset : int
    byte_length : int
    gl_buffer   : "GL.Buffer"
    #f __init__
    def __init__(self, data:Any, byte_offset:int=0, byte_length:int=0) -> None:
        if byte_length==0: byte_length=len(data)
        self.data = data
        self.byte_length = byte_length
        self.byte_offset = byte_offset
        self.gl_buffer = -1 # type: ignore
        pass
    #f gl_create
    def gl_create(self) -> None:
        if self.gl_buffer < 0: # type: ignore
            self.gl_buffer = GL.glGenBuffers(1)
            GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, self.gl_buffer)
            GL.glBufferData(GL.GL_ELEMENT_ARRAY_BUFFER, self.data[self.byte_offset:self.byte_offset+self.byte_length], GL.GL_STATIC_DRAW)
            # print(f"Bound {self.gl_buffer}")
            # print(f"Data {self.data[self.byte_offset:self.byte_offset+self.byte_length]}")
            pass
        pass
    #f gl_buffer
    def gl_bind_program(self, shader:ShaderClass) -> None:
        GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, self.gl_buffer)
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"Indices {self.byte_offset} {self.byte_length}")
        return hier
    #f __str__
    def __str__(self) -> str:
        r = str(self.__dict__)
        return r
    #f All done
    pass
    
#c ModelBufferView - for use in a vertex attribute pointer
class ModelBufferView:
    #v Properties
    data: ModelBufferData
    count: int # Number of <comp type> per vertex - 1 to 4
    gl_type : "GL.ValueTypeEnum" # e.g. GL_FLOAT
    offset : int # Offset from start of buffer to first byte of data
    stride : int # Stride of data in the buffer - 0 for count*sizeof(gl_type)
    #f __init__
    def __init__(self, data:ModelBufferData, count:int, gl_type:"GL.ValueTypeEnum", offset:int, stride:int=0) -> None:
        self.data = data
        self.count = count
        self.gl_type = gl_type
        self.offset = offset
        self.stride = stride
        pass
    #f gl_create
    def gl_create(self) -> None:
        self.data.gl_create()
        pass
    #f gl_bind_program
    def gl_bind_program(self, shader:ShaderClass, attr:str) -> None:
        a = shader.get_attr(attr)
        if a is not None:
            GL.glBindBuffer(GL.GL_ARRAY_BUFFER, self.data.gl_buffer)
            GL.glEnableVertexAttribArray(a)
            # print(f"VAO {a} of {self.count} of {self.gl_type} {self.stride} {self.offset}")
            GL.glVertexAttribPointer(a, self.count, self.gl_type, False, self.stride, ctypes.c_void_p(self.offset))
            pass
        pass 
    #f hier_debug
    def hier_debug(self, hier:Hierarchy, use:str) -> Hierarchy:
        hier.add(f"BufferView {use} {self.gl_type} {self.count} {self.offset} {self.stride}")
        return hier
    #f __str__
    def __str__(self) -> str:
        r = str(self.__dict__)
        return r
   #f All done
    pass

#c ModelPrimitiveView
class ModelPrimitiveView:
    #v Properties
    indices    : ModelBufferIndices
    position   : ModelBufferView
    normal     : Optional[ModelBufferView]
    tex_coords : Optional[ModelBufferView]
    joints     : Optional[ModelBufferView]
    weights    : Optional[ModelBufferView]
    tangent    : Optional[ModelBufferView]
    color      : Optional[ModelBufferView]
    gl_vao     : "GL.VAO"
    attribute_mapping = { "vPosition":"position",
                          "vNormal":"normal",
                          "vTexture":"tex_coords",
                          "vJoints":"joints",
                          "vWeights":"weights",
                          "vTangent":"tangent",
                          "vColor":"color",
                          }
    #f __init__
    def __init__(self) -> None:
        self.normal = None
        self.tex_coords = None
        self.joints = None
        self.weights = None
        self.tangent = None
        self.color = None
        pass
    #f gl_create
    def gl_create(self) -> None:
        # stops the indices messing up other VAO
        GL.glBindVertexArray(0) # type:ignore
        self.indices.gl_create()
        for (san,an) in self.attribute_mapping.items():
            if hasattr(self, an):
                mbv = getattr(self,an)
                if mbv is not None: mbv.gl_create()
                pass
            pass
        self.gl_vao = GL.glGenVertexArrays(1)
        pass
    #f gl_bind_program
    def gl_bind_program(self, shader:ShaderClass) -> None:
        GL.glBindVertexArray(self.gl_vao)
        self.indices.gl_bind_program(shader)
        for (san,an) in self.attribute_mapping.items():
            if hasattr(self, an):
                mbv = getattr(self,an)
                if mbv is not None:
                    mbv.gl_bind_program(shader, san)
                    pass
                else:
                    sa = shader.get_attr(san)
                    if (sa is not None) and (sa>=0): # type: ignore
                        GL.glDisableVertexAttribArray(sa)
                    pass
                pass
            pass
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        self.indices.hier_debug(hier)
        for (san,an) in self.attribute_mapping.items():
            if hasattr(self, an):
                mbv = getattr(self,an)
                if mbv is not None: mbv.hier_debug(hier, an)
                pass
            pass
        return hier
    #f All done
    pass

#c ModelPrimitive
class ModelPrimitive:
    name       : str = ""
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
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"Primitive '{self.name}' {self.gl_type} {self.indices_gl_type} {self.indices_count} {self.indices_offset}")
        hier.push()
        self.view.hier_debug(hier)
        hier.pop()
        return hier
    #f All done
    pass

#c ModelMesh
class ModelMesh:
    name       : str
    primitives : List[ModelPrimitive]
    #f __init__
    def __init__(self) -> None:
        self.primitives = []
        pass
    #f gl_create
    def gl_create(self) -> None:
        for p in self.primitives:
            p.gl_create()
            pass
        pass
    #f gl_bind_program
    def gl_bind_program(self, shader:ShaderClass) -> None:
        for p in self.primitives:
            p.gl_bind_program(shader)
            pass
        pass
    #f gl_draw
    def gl_draw(self, program:ShaderProgram) -> None:
        for p in self.primitives:
            p.gl_draw(program)
            pass
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add("ModelMesh")
        hier.push()
        for p in self.primitives:
            p.hier_debug(hier)
            pass
        hier.pop()
        return hier
    #f All done
    pass

#c ModelObject
class ModelObject:
    """
    A ModelObject is a member of a hierarchy of ModelObject's,
    where each object has a transform and potentially a mesh,
    and further a bone set

    In GLTF the ModelObject is a subset of the nodes, and the bone set is a skin.
    """
    #v Properties
    transformation: Optional[Transformation]
    children      : List["ModelObject"]
    parent        : Optional["ModelObject"]
    mesh          : Optional[ModelMesh]
    bones         : Optional[BoneSet]
    #f __init__
    def __init__(self, parent:Optional["ModelObject"], transformation:Optional[Transformation]=None):
        self.transformation = transformation
        self.parent = parent
        self.children = []
        if self.parent is not None:
            self.parent.children.append(self)
            pass
        self.mesh = None
        self.bones = None
        pass
    #f iter_objects
    def iter_objects(self, trans_mat:TransMat) -> Iterable[Tuple[TransMat,"ModelObject"]]:
        if self.transformation is not None:
            trans_mat = self.transformation.trans_mat_after(trans_mat)
            pass
        yield(trans_mat, self)
        for c in self.children:
            for x in c.iter_objects(trans_mat):
                yield x
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
    def get_bones(self) -> BoneSet:
        assert self.bones is not None
        return self.bones
    #f gl_create
    def gl_create(self) -> None:
        if self.mesh is not None: self.mesh.gl_create()
        pass
    #f gl_bind_program
    def gl_bind_program(self, shader:ShaderClass) -> None:
        if self.mesh is not None: self.mesh.gl_bind_program(shader)
        pass
    #f gl_draw
    def gl_draw(self, program:ShaderProgram) -> None:
        if self.mesh is not None: self.mesh.gl_draw(program)
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add("ModelObject")
        hier.push()
        hier.add(f"Transformation {self.transformation}")
        if self.mesh is not None:
            self.mesh.hier_debug(hier)
            pass
        if self.bones is not None:
            self.bones.hier_debug(hier)
            pass
        for c in self.children:
            c.hier_debug(hier)
            pass
        hier.pop()
        return hier
    #f __str__
    def __str__(self) -> str:
        return str(self.hier_debug(Hierarchy()))
    #f All done
    pass

#c ModelClass
class ModelClass:
    """
    A ModelClass is a model that may be instanced.

    It consists of a root ModelObject, and a list of bones
    """
    #v Properties
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
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"ModelClass '{self.name}'")
        hier.push()
        self.root_object.hier_debug(hier)
        for bone in self.bones:
            bone.hier_debug(hier)
            pass
        hier.pop()
        return hier
    #f __str__
    def __str__(self) -> str:
        return str(self.hier_debug(Hierarchy()))
    #f All done
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
    trans_mat       : TransMat
    bone_set_poses  : List[BonePoseSet]
    meshes          : List[Tuple[TransMat, ModelMesh, int]]
    #f __init__
    def __init__(self, model_class:ModelClass) -> None:
        self.bone_set_poses = []
        self.meshes = []
        bone_set_dict = {}
        for (trans_mat,model) in model_class.iter_objects():
            if not model.has_mesh(): continue
            mesh_instance = model.get_mesh()
            bone_set_index = -1
            if model.has_bones():
                bone_set = model.get_bones() # get bone set
                if bone_set not in bone_set_dict:
                    bone_set_dict[bone_set] = len(self.bone_set_poses)
                    pose = BonePoseSet(bone_set)
                    self.bone_set_poses.append(pose)
                    pass
                bone_set_index = bone_set_dict[bone_set]
                pass
            self.meshes.append( (trans_mat, mesh_instance, bone_set_index) )
            pass
        pass
    #f gl_create
    def gl_create(self) -> None:
        for (t,m,b) in self.meshes:
            m.gl_create()
            pass
        pass
    #f gl_bind_program
    def gl_bind_program(self, shader:ShaderClass) -> None:
        for (t,m,b) in self.meshes:
            m.gl_bind_program(shader)
            pass
        pass
    #f gl_draw
    def gl_draw(self, program:ShaderProgram, tick:int) -> None:
        mat = glm.mat4()
        GL.glUniformMatrix4fv(program.uniforms["uModelMatrix"], 1, False, glm.value_ptr(mat))
        for bone_set_pose in self.bone_set_poses:
            bone_set_pose.update(tick)
            pass
        for (t,m,b) in self.meshes:
            if b>=0:
                bma = self.bone_set_poses[b]
                program.set_uniform_if("uBonesMatrices",
                                      lambda u:GL.glUniformMatrix4fv(u, bma.max_index, False, bma.data))
                pass
            # Provide mesh matrix and material uniforms
            program.set_uniform_if("uMeshMatrix",
                                   lambda u: GL.glUniformMatrix4fv(u, 1, False, glm.value_ptr(t.mat4())) )
            program.set_uniform_if("uBonesScale",
                                   lambda u: GL.glUniform1f(u, 1.0) )
            m.gl_draw(program)
            pass
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"ModelInstance with {len(self.bone_set_poses)} poses")
        hier.push()
        for i in range(len(self.bone_set_poses)):
            hier.add(f"Pose/Matrix {i}")
            self.bone_set_poses[i].hier_debug(hier)
            pass
        for (t,m,b) in self.meshes:
            hier.add(f"Mesh transform {t} pose/matrix {b}")
            m.hier_debug(hier)
            pass
        hier.pop()
        return hier
    #f __str__
    def __str__(self) -> str:
        return str(self.hier_debug(Hierarchy()))
    #f All done
    pass
