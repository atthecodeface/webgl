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
    
#a Bone and pose classes
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
    parent         : Optional["Bone"]
    children       : List["Bone"]
    transformation : Transformation # at rest
    ptb            : glm.Mat4
    mtb            : glm.Mat4
    #f __init__
    def __init__(self, parent:Optional["Bone"], transformation:Transformation) -> None:
        self.parent = parent
        if parent is not None:
            parent.children.append(self)
            pass
        self.children = []
        self.transformation = Transformation()
        self.set_transformation(transformation)
        pass
    #f iter_hierarchy
    def iter_hierarchy(self) -> Iterable["Bone"]:
        yield(self)
        for c in self.children:
            for cc in c.iter_hierarchy():
                yield(cc)
                pass
            pass
        pass
    #f set_transformation
    def set_transformation(self, transform:Transformation) -> None:
        self.transformation.set(self.transformation, transform)
        pass
    #f derive_matrices
    def derive_matrices(self) -> None:
        btp = self.transformation.mat4()
        self.ptb = glm.inverse(btp) # type: ignore
        if self.parent is None:
            self.mtb = glm.mat4(self.ptb)
            pass
        else:
            self.mtb = self.ptb * self.parent.mtb
            pass
        for c in self.children:
            c.derive_matrices()
            pass
        pass
    #f All done
    pass

#c BonePose
T = TypeVar('T', bound='BonePose')
class BonePose:
    #v Properties
    bone             : Bone
    parent           : Optional["BonePose"]
    children         : List["BonePose"]
    transformation   : Transformation # relative to bone rest
    btp              : glm.Mat4
    ptb              : glm.Mat4
    animated_btm     : glm.Mat4
    animated_mtm     : glm.Mat4
    #f pose_bones
    @classmethod
    def pose_bones(cls:Type[T], bone:Bone, parent:Optional["BonePose"]=None) -> T:
        pose = cls(bone, parent)
        for b in bone.children:
            cls.pose_bones(b, pose)
            pass
        return pose
    #f __init__
    def __init__(self, bone:Bone, parent:Optional["BonePose"]=None) -> None:
        self.parent = parent
        if parent is not None:
            parent.children.append(self)
            pass
        self.children = []
        self.bone = bone
        self.transformation = Transformation()
        self.transformation_reset()

        self.btp = glm.mat4()
        self.ptb = glm.mat4()
        self.animated_btm = glm.mat4() # bone to mesh
        self.animated_mtm = glm.mat4() # mesh to animated mesh
        pass
    #f iter_hierarchy
    def iter_hierarchy(self) -> Iterable["BonePose"]:
        yield(self)
        for c in self.children:
            for cc in c.iter_hierarchy():
                yield(cc)
                pass
            pass
        pass
    #f transformation_reset
    def transformation_reset(self) -> None:
        self.transformation.copy(self.bone.transformation)
        pass
    #f transform
    def transform(self, transform:Transformation) -> None:
        self.transformation.set(self.transformation, transform)
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
        self.animated_mtm = self.animated_btm * self.bone.mtb
        for c in self.children:
            c.derive_animation()
            pass
        pass
    #f All done
    pass
