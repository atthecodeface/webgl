#a Changes
"""
function -> def
gl[lower case] -> gl[upper case]
"""
#a Imports
from OpenGL import GL
import ctypes
import numpy as np
from PIL import Image
from glm import mat4, vec3, quat, value_ptr, angleAxis
from .bone import Bone

#a Useful functions
#f isPowerOf2
def isPowerOf2(value):
    return (value & (value - 1)) == 0

#f loadTexture
def loadTexture(url):
    texture = GL.glGenTextures(1)
    image = Image.open(url)
    image_data = np.fromstring(image.tobytes(), np.uint8)
    GL.glBindTexture(GL.GL_TEXTURE_2D, texture);
    GL.glPixelStorei(GL.GL_UNPACK_ALIGNMENT, 1)
    GL.glTexImage2D(GL.GL_TEXTURE_2D, 0, GL.GL_RGB, image.size[0], image.size[1], 0, GL.GL_RGB, GL.GL_UNSIGNED_BYTE, image_data);
    GL.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_MIN_FILTER, GL.GL_LINEAR);
    GL.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_WRAP_S, GL.GL_CLAMP_TO_EDGE);
    GL.glTexParameteri(GL.GL_TEXTURE_2D, GL.GL_TEXTURE_WRAP_T, GL.GL_CLAMP_TO_EDGE);

    return texture

#a Classes
#c Submesh
class Submesh:
    def __init__(self,bone_indices, gl_type, offset, count):
        self.bone_indices = bone_indices
        self.gl_type = gl_type
        self.vindex_offset = offset
        self.vindex_count = count
        pass
    pass

#c Mesh
class Mesh:
    #f __init__
    def __init__(self, shader, obj):
        self.glid = GL.glGenVertexArrays(1)  # create OpenGL vertex array id
        GL.glBindVertexArray(self.glid)      # activate to receive state below
        self.positions  = GL.glGenBuffers(1) # glCreateBuffer()
        self.normals    = GL.glGenBuffers(1) # glCreateBuffer()
        self.texcoords  = GL.glGenBuffers(1) # glCreateBuffer()
        self.weights    = GL.glGenBuffers(1) # glCreateBuffer()
        self.indices    = GL.glGenBuffers(1) # glCreateBuffer()

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

        self.submeshes = obj.submeshes
        pass
    #f draw
    def draw(self, shader, bones):
        GL.glBindVertexArray(self.glid)

        mymatrix = np.zeros(64,np.float32)
        gl_types = {"TS":GL.GL_TRIANGLE_STRIP}
        for sm  in self.submeshes:
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
    def __init__(self, obj, shader, texture, world_vec):
        self.texture = texture
        self.world_matrix = mat4()
        self.place(world_vec)
        self.mesh = Mesh(shader, obj)
        self.bones = []
        self.bones.append(Bone())
        self.bones.append(Bone(self.bones[0]))
        self.bones.append(Bone(self.bones[1]))
        self.bones[0].translate_from_rest(vec3([0.,0.,1.]))
        self.bones[1].translate_from_rest(vec3([0.,0.,-2.]))
        self.bones[2].translate_from_rest(vec3([0.,0.,-2.]))
        self.bones[0].derive_at_rest()
        self.bones[0].derive_animation()
        pass
    #f place
    def place(self, world_vec):
        self.world_matrix = mat4()
        self.world_matrix[3][0] = world_vec[0]
        self.world_matrix[3][1] = world_vec[1]
        self.world_matrix[3][2] = world_vec[2]
        pass
    #f animate
    def animate(self, time):
        import math
        angle = math.sin(time*0.2)*0.3
        q = quat()
        q = angleAxis(time*0.3, vec3([0,0,1])) * q
        q = angleAxis(1.85,     vec3([1,0,0])) * q
        self.bones[0].translate_from_rest(vec3([0.,0.,0.]))
        self.bones[0].quaternion_from_rest(q)
        q = quat()
        q = angleAxis(angle*4, vec3([0,0,1])) * q
        self.bones[1].translate_from_rest(vec3([0.,0.,0.0-math.cos(4*angle)]))
        self.bones[1].quaternion_from_rest(q)
        q = quat()
        q = angleAxis(angle*4, vec3([0,0,1])) * q
        self.bones[2].translate_from_rest(vec3([0.,0.,0.0+math.cos(4*angle)]))
        self.bones[2].quaternion_from_rest(q)
        self.bones[0].derive_animation()
        pass
    #f draw
    def draw(self, shader):
        # GL.glEnable(GL.GL_TEXTURE_2D)
        GL.glActiveTexture(GL.GL_TEXTURE0)
        GL.glBindTexture(GL.GL_TEXTURE_2D, self.texture)
        GL.glUniformMatrix4fv(shader.uniforms["uModelMatrix"], 1, False, value_ptr(self.world_matrix))
        self.mesh.draw(shader, self.bones)
        pass
    pass

#a Cube mesh with single bone
# cube front face   back face (as seen from front)
#        1    0        5   4
#        3    2        7   6
# triangles (anticlockwise for first)
#  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
# Cube strip
# 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
class Cube:
    positions = [
        1.0,  1.0, 1.0, 
        -1.0,  1.0, 1.0,
        1.0, -1.0, 1.0, 
        -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
    ]
    normals = [
        1.0,  1.0, 1.0, 
        -1.0,  1.0, 1.0,
        1.0, -1.0, 1.0, 
        -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
    ]
    texcoords = [ 1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ]
    weights = [
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        0., 1., 0., 0.,
        0., 1., 0., 0.,
        0., 1., 0., 0.,
        0., 1., 0., 0.,
    ]
    indices   =  [3, 2, 1, 0, 4, 2, 6, 7,  4, 5, 1, 7, 3, 2]
    submeshes = [ Submesh([0,1,0,0], "TS", 0, len(indices)),
    ]
    pass

#c Double cube object
    # cube front face   mid   back face (as seen from front)
    #        1  0      5  4     9  8
    #        3  2      7  6    11 10
    # Double cube strip
    # 3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2
class DoubleCube:
    positions = [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,

      1.0,  1.0, -3.0,
      -1.0,  1.0, -3.0,
      1.0, -1.0, -3.0,
      -1.0, -1.0, -3.0,
    ]
    texcoords = [ 1,0, 0,0, 1,1, 0,1,
                  1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ]
    normals = [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0,  0.,
      -1.0,  1.0, 0.,
      1.0, -1.0,  0.,
      -1.0, -1.0, 0.,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ]
    weights = [
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 0., 1., 0.,
      0., 0., 1., 0.,
      0., 0., 1., 0.,
      0., 0., 1., 0.,
    ]
    indices =  [3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2]
    submeshes = [ Submesh([0,1,2,0], "TS", 0, 22),
                ]
    pass

#c DoubleCube2
class DoubleCube2:
    positions = [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,

      1.0,  1.0, -3.0,
      -1.0,  1.0, -3.0,
      1.0, -1.0, -3.0,
      -1.0, -1.0, -3.0,
    ]
    normals = [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0,  0.,
      -1.0,  1.0, 0.,
      1.0, -1.0,  0.,
      -1.0, -1.0, 0.,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ]
    texcoords = [ 1,0, 0,0, 1,1, 0,1,
                  1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ]
    weights = [
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        1., 0., 0., 0.,
        0.4, 0.6, 0., 0.,
        0.4, 0.6, 0., 0.,
        0.4, 0.6, 0., 0.,
        0.4, 0.6, 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
    ]
    indices =  [3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2]
    submeshes = [ Submesh([0,1,2,0], "TS", 0, 22),
                ]
    pass

#c Snake
"""
class Snake:
    def __init__(self, snake_slices, snake_height):
    const snake_slice_height=snake_height/snake_slices
    const snake_positions = []
    const snake_normals = []
    const snake_texcoords = []
    const snake_weights = []
    const snake_indices = []
    for (i=0 i<=snake_slices i++) {
        var z = 1.0 - i*snake_slice_height
        snake_positions.append(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z)
        snake_normals.append(1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0)
        if (i>=snake_slices/2) {
            z = 2-(i/snake_slices)*2
            snake_texcoords.append( 1,1-z, 0,1-z, 0,1-z, 1,1-z)
            snake_weights.append(0., z, 1.-z, 0.)
            snake_weights.append(0., z, 1.-z, 0.)
            snake_weights.append(0., z, 1.-z, 0.)
            snake_weights.append(0., z, 1.-z, 0.)
        } else {
            z = 1-i/snake_slices * 2
            snake_weights.append(z, 1.-z, 0., 0.)
            snake_texcoords.append( 1,z, 0,z, 0,z, 1,z)
            snake_weights.append(z, 1.-z, 0., 0.)
            snake_weights.append(z, 1.-z, 0., 0.)
            snake_weights.append(z, 1.-z, 0., 0.)
        }
    }
    for (i=0 i<snake_slices i++) {
        const base=i*4
        snake_indices.append(base, base, base, base+4, base+1, base+5, base+3, base+7, base+2, base+6)
        snake_indices.append(base, base+4, base+4, base+4)
    }
    {
        var z = 1.0
        snake_positions.append(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z)
        snake_normals.append(0,0,1, 0,0,1, 0,0,1, 0,0,1)
        snake_texcoords.append( 1,0, 0,0, 1,1, 0,1)
        snake_weights.append(1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0 )
        z = 1 - snake_height
        snake_positions.append(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z)
        snake_normals.append(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1)
        snake_texcoords.append( 1,0, 0,0, 1,1, 0,1)
        snake_weights.append(0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0)
    }
    endcap = 4*(snake_slices+1)
    snake_indices.append(endcap, endcap, endcap+1,endcap+2,endcap+3,endcap+3)# now ccw winding
    snake_indices.append(endcap+4,endcap+4,endcap+5,endcap+6,endcap+7) # now ccw winding
    
    const snake =  {
        positions : snake_positions,
        normals   : snake_normals,
        texcoords : snake_texcoords,
        weights   : snake_weights,
        indices   : snake_indices,
        submeshes : [ Submesh([0,1,2,0], "TS", 0, snake_indices.length),
                    ],
    }
    return snake                 
}
"""
