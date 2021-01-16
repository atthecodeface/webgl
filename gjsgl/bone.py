#a Imports
import glm
import numpy as np
from .hierarchy import Hierarchy
from .transformation import Transformation

from typing import *
if not TYPE_CHECKING:
    glm.Vec3 = Tuple[float,float,float]
    glm.Vec4 = Tuple[float,float,float,float]
    glm.Mat4 = Tuple[glm.Vec4,glm.Vec4,glm.Vec4,glm.Vec4]
    glm.Quat = object
    pass
FloatArray = Any

def mat4_str(mat:glm.Mat4) -> str:
    return "[" + ("   ".join([" ".join([str(v) for v in col]) for col in mat])) + "]" # type: ignore
    
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
    matrix_index   : int # Index into matrix array to put this bones animated mtm
    ptb            : glm.Mat4
    mtb            : glm.Mat4
    #f __init__
    def __init__(self, parent:Optional["Bone"], transformation:Transformation, matrix_index:int=-1) -> None:
        self.parent = parent
        if parent is not None:
            parent.children.append(self)
            pass
        self.children = []
        self.matrix_index = matrix_index
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
    #f enumerate_hierarchy
    def enumerate_hierarchy(self) -> Tuple[int,int]:
        max_index = 0
        bone_count = 0
        for b in self.iter_hierarchy():
            if b.matrix_index>=max_index:
                max_index = b.matrix_index + 1
                pass
            bone_count += 1
            pass
        return (bone_count, max_index)
    #f rewrite_indices
    def rewrite_indices(self) -> None:
        (cnt,max) = self.enumerate_hierarchy()
        if max>=cnt: return
        bone_count = 0
        for b in self.iter_hierarchy():
            b.matrix_index = bone_count
            bone_count += 1
            pass
        pass
    #f set_transformation
    def set_transformation(self, transform:Transformation) -> None:
        self.transformation.combine(self.transformation, transform)
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
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"Bone {self.matrix_index}")
        hier.push()
        hier.add(f"{self.transformation}")
        if hasattr(self, "ptb"): hier.add(f"parent-to-bone: {mat4_str(self.ptb)}")
        if hasattr(self, "mtb"): hier.add(f"mesh-to-bone  : {mat4_str(self.mtb)}")
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

#c BoneSet
class BoneSet:
    bones: List[Bone]
    roots : List[int]
    #f __init__
    def __init__(self) -> None:
        self.bones = []
        self.roots = []
        pass
    #f add_bone
    def add_bone(self, bone:Bone) -> Bone:
        n = len(self.bones)
        if bone.parent is None: self.roots.append(n)
        self.bones.append(bone)
        return bone
    #f derive_matrices
    def derive_matrices(self) -> None:
        for r in self.roots:
            self.bones[r].derive_matrices()
            pass
        pass
    #f add_bone_hierarchy
    def add_bone_hierarchy(self, root:Bone) -> None:
        for b in root.iter_hierarchy():
            self.add_bone(bone=b)
            pass
        pass
    #f iter_roots
    def iter_roots(self) -> Iterable[Bone]:
        for r in self.roots:
            yield(self.bones[r])
            pass
        pass
    #f rewrite_indices
    def rewrite_indices(self) -> None:
        for i in range(len(self.bones)):
            self.bones[i].matrix_index = i
            pass
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"BoneSet {self.roots}")
        hier.push()
        for b in self.iter_roots():
            b.hier_debug(hier)
            pass
        hier.pop()
        return hier
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
    #f set_parent
    def set_parent(self, parent:"BonePose") -> None:
        assert self.parent is None
        self.parent = parent
        parent.children.append(self)
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
        self.transformation.combine(self.transformation, transform)
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
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"Pose {self.bone.matrix_index}")
        hier.push()
        hier.add(f"{self.transformation}")
        hier.add(f"parent-to-bone: {mat4_str(self.ptb)}")
        hier.add(f"bone-to-parent: {mat4_str(self.btp)}")
        hier.add(f"bone-to-mesh  : {mat4_str(self.animated_btm)}")
        hier.add(f"mesh-to-mesh  : {mat4_str(self.animated_mtm)}")
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

#c BonePoseSet
class BonePoseSet:
    bones        : BoneSet
    poses        : List[BonePose] # one-for-one with BoneSet.bones
    data         : FloatArray
    max_index    : int
    last_updated : int
    #f __init__
    def __init__(self, bones:BoneSet) -> None:
        self.bones = bones
        self.poses = []
        bone_to_pose_dict = {}
        for b in self.bones.bones:
            pose = BonePose(b)
            bone_to_pose_dict[b] = pose
            self.poses.append(pose)
            pass
        for (bone, pose) in self.iter_bones_and_poses():
            if bone.parent is not None:
                parent_pose = bone_to_pose_dict[bone.parent]
                pose.set_parent(parent_pose)
                pass
            pass
        max_index = -1
        for bone in self.bones.iter_roots():
            (_,max) = bone.enumerate_hierarchy()
            if max>max_index: max_index=max
            pass
        if max_index<1: max_index=1
        self.data = np.zeros(max_index*16,np.float32)
        self.max_index = max_index
        self.last_updated = -1
        pass
    #f iter_bones_and_poses
    def iter_bones_and_poses(self) -> Iterable[Tuple[Bone,BonePose]]:
        for i in range(len(self.poses)):
            yield (self.bones.bones[i], self.poses[i])
            pass
        pass
    #f derive_animation
    def derive_animation(self) -> None:
        for i in self.bones.roots:
            self.poses[i].derive_animation()
            pass
        pass
    #f update
    def update(self, tick:int) -> None:
        if tick==self.last_updated: return
        self.last_updated = tick
        self.derive_animation()
        for (bone,pose) in self.iter_bones_and_poses():
            if bone.matrix_index<0: continue
            base = bone.matrix_index*16
            for i in range(16):
                (r,c) = (i//4, i%4)
                self.data[base+i] = pose.animated_mtm[r][c]
                pass
            pass
        pass
    #f hier_debug
    def hier_debug(self, hier:Hierarchy) -> Hierarchy:
        hier.add(f"BonePoseSet {self.bones.roots} {self.max_index} {self.last_updated} {self.data}")
        hier.push()
        self.bones.hier_debug(hier)
        for pose in self.poses:
            pose.hier_debug(hier)
            pass
        hier.pop()
        return hier
    #f All done
    pass
