#a Imports
from OpenGL import GL
import ctypes
import numpy as np
import math
import glm
from .texture import Texture
from .bone import Bone
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

#c ModelObject
class ModelObject:
    """
    A ModelObject is a member of a hierarchy of ModelObjects,
    where each object has a transform and potentially a mesh,
    and further a bone set

    In GLTF the ModelObject is a subset of the nodes, and the bone set is a skin.
    """
    transformation: Optional[Transformation]
    children      : List["ModelObject"]
    parent        : Optional["ModelObject"]
    mesh          : Optional[ModelMesh]
    bones         : Optional[Bones]
    def __init__(self, parent:Optional["ModelObject"], transformation:Optional[Transformation]=None):
        self.transformation = transformation
        self.parent = parent
        self.children = []
        if self.parent is not None:
            self.parent.children.append(self)
            pass
        pass
    #f iter_objects
    def iter_objects(self, trans_mat:TransMat) -> Iterable[Tuple[TransMat,ModelObject]]:
        trans_mat = self.transformation.mat_after(trans_mat)
        yield(trans_mat, self)
        for c in self.children:
            c.iter_objects(trans_mat)
            pass
        pass
    #f has_bones
    def has_bones(self) -> bool:
        return self.bones is not None
    #f get_bones
    def get_bones(self) -> Bones:
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
    name : str
    root_object: ModelObject
    bones : List[Bones]
    #f __init__
    def __init__(self, name:str, root_object:ModelObject) -> None:
        self.name = name
        self.root_object = root_object
        pass
    #f iter_objects
    def iter_objects(self) -> Iterable[Tuple[TransMat,ModelObject]]:
        self.root_object.iter_objects(TransMat())
        pass
    pass

#c ModelInstance
class ModelInstance:
    """
    A ModelInstance is an instance of a ModelClass
    It has a bone pose hierarchy and a model transformation, and textures.
    """
    trans_mat     : TransMat
    bone_poses    : List[BonePose]
    meshes        : List[Tuple[TransMat, MeshInstance, BonePose]]
    def __init__(self, model_class:ModelClass) -> None:
        for (trans_mat,model) in model_class.iter_objects():
            if model.has_bones:
        pass
    pass
