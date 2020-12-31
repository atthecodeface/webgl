#a Notes on conversion js to python
"""
replace-string // with #
replace-string this. with self.
replace class heading () : with :
replace constructor( with def __init__(self, 
macro replace #f ... next line <>( etc with def <>(self, 
replace-string ; with nothing
replace-string 'new Array()' with []
replace-string '} else :' with else:
replace-string ':' with :
replace-string '}' with '    pass'
Add imports
hand tidy
"""

#a Imports
from glm import mat4, quat, vec3, mat4_cast, inverse

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
    #f __init__
    def __init__(self, parent=None):
        self.parent = parent
        if parent is not None:
            parent.children.append(self)
            pass
        self.children = []
        self.translation = vec3()
        self.quaternion = quat() # defaults to identity

        self.translation_rest = vec3()
        self.quaternion_rest = quat()

        self.btp = mat4()
        self.ptb = mat4()
        self.ptb_rest = mat4()
        self.mtb_rest = mat4() # mesh to bone
        self.animated_btm = mat4() # bone to mesh
        self.animated_mtm = mat4() # mesh to animated mesh
        pass
    #f quaternion_from_rest
    def quaternion_from_rest(self, quaternion):
        self.quaternion =  quaternion * self.quaternion_rest
        pass
    #f translate_from_rest
    def translate_from_rest(self, trans) :
        self.translation = trans + self.translation_rest
        pass
    #f derive_matrices
    def derive_matrices(self, ) :
        self.btp = mat4_cast(self.quaternion)
        self.btp[3][0] += self.translation[0]
        self.btp[3][1] += self.translation[1]
        self.btp[3][2] += self.translation[2]
        self.ptb = inverse(self.btp)
        pass
    #f derive_at_rest
    def derive_at_rest(self, ) :
        self.derive_matrices()
        self.translation_rest = vec3(self.translation)
        self.quaternion_rest  = quat(self.quaternion)
        self.ptb_rest         = mat4(self.ptb)
        if self.parent is None:
            self.mtb_rest = mat4(self.ptb)
            pass
        else:
            self.mtb_rest = self.ptb * self.parent.mtb_rest
            pass
        for c in self.children:
            c.derive_at_rest()
            pass
        pass
    #f derive_animation
    def derive_animation(self, ) :
        self.btp = mat4_cast(self.quaternion)
        self.btp[3][0] += self.translation[0]
        self.btp[3][1] += self.translation[1]
        self.btp[3][2] += self.translation[2]
        if self.parent is None:
            self.animated_btm = mat4(self.btp)
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

