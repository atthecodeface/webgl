#a Imports
import glm
from .transformation import Transformation

from typing import *
if not TYPE_CHECKING:
    glm.Vec3 = Tuple[float,float,float]
    glm.Vec4 = Tuple[float,float,float,float]
    glm.Mat4 = Tuple[glm.Vec4,glm.Vec4,glm.Vec4,glm.Vec4]
    glm.Quat = object
    pass
    
#a Bone class
#c Bone
class Bone:
    #d Documentation
    # The bone has an origin relative to its parent
    # and it has a quaternion that represents the scale and change in orientation of its contents/children
    # A point in this bone's space is then translate(rotate(scale(pt))) in its parent's space
    # From this the bone has a local bone-to-parent transform matrix
    # and it has a local parent-to-bone transform matrix
    # At rest (where a mesh is skinned) there are two rest matrix variants
    # Hence bone_relative = ptb * parent_relative
    # The skinned mesh has points that are parent relative, so
    # animated_parent_relative(t) = btp(t) * ptb * parent_relative(skinned)
    # For a chain of bones Root -> A -> B -> C
    # bone_relative = C.ptb * B.ptb * A.ptb * mesh
    # root = A.btp * B.btp * C.btp * C_bone_relative
    # animated(t) = A.btp(t) * B.btp(t) * C.btp(t) * C.ptb * B.ptb * A.ptb * mesh
    #v Properties
    parent : Optional["Bone"]
    children : List["Bone"]
    transformation      : Transformation
    transformation_rest  : Transformation
    btp              : glm.Mat4
    ptb              : glm.Mat4
    ptb_rest         : glm.Mat4
    mtb_rest         : glm.Mat4
    animated_btm     : glm.Mat4
    animated_mtm     : glm.Mat4
    #f __init__
    def __init__(self, parent:Optional["Bone"]=None) -> None:
        self.parent = parent
        if parent is not None:
            parent.children.append(self)
            pass
        self.children = []
        self.transformation      = Transformation()
        self.transformation_rest = Transformation()

        self.btp = glm.mat4()
        self.ptb = glm.mat4()
        self.ptb_rest = glm.mat4()
        self.mtb_rest = glm.mat4() # mesh to bone
        self.animated_btm = glm.mat4() # bone to mesh
        self.animated_mtm = glm.mat4() # mesh to animated mesh
        pass
    #f transform_from_rest
    def transform_from_rest(self, transform:Transformation) -> None:
        self.transformation.set(self.transformation_rest, transform)
        pass
    #f transform
    def transform(self, transform:Transformation) -> None:
        self.transformation.set(self.transformation, transform)
        pass
    #f derive_matrices
    def derive_matrices(self) -> None:
        self.btp = self.transformation.mat4()
        self.ptb = glm.inverse(self.btp) # type: ignore
        pass
    #f derive_at_rest
    def derive_at_rest(self) -> None :
        self.derive_matrices()
        self.transformation_rest.copy(self.transformation)
        self.ptb_rest         = glm.mat4(self.ptb)
        if self.parent is None:
            self.mtb_rest = glm.mat4(self.ptb)
            pass
        else:
            self.mtb_rest = self.ptb * self.parent.mtb_rest
            pass
        for c in self.children:
            c.derive_at_rest()
            pass
        pass
    #f derive_animation
    def derive_animation(self) -> None:
        self.btp = self.transformation.mat4()
        if self.parent is None:
            self.animated_btm = glm.mat4(self.btp)
            pass
        else:
            self.animated_btm = self.parent.animated_btm * self.btp
            pass
        self.animated_mtm = self.animated_btm * self.mtb_rest
        for c in self.children:
            c.derive_animation()
            pass
        pass
    #f All done

