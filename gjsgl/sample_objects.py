#a Imports
from .object import Object, Submesh

from typing import *

#c Cube mesh with single bone
# cube front face   back face (as seen from front)
#        1    0        5   4
#        3    2        7   6
# triangles (anticlockwise for first)
#  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
# Cube strip
# 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
class Cube(Object):
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
class DoubleCube(Object):
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
class DoubleCube2(Object):
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
class Snake(Object):
    def __init__(self, snake_slices:int, snake_height:float) -> None:
        snake_slice_height=snake_height/snake_slices
        snake_positions = []
        snake_normals = []
        snake_texcoords = []
        snake_weights = []
        snake_indices = []
        for i in range(snake_slices+1):
            z = 1.0 - i*snake_slice_height
            snake_positions.extend( [1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z ])
            snake_normals.extend( [1., 1., 0, -1, 1, 0, 1, -1, 0, -1, -1, 0 ])
            if (i>=snake_slices/2):
                z = 2-(i/snake_slices)*2
                snake_texcoords.extend( [ 1,1-z, 0,1-z, 0,1-z, 1,1-z ])
                snake_weights.extend( [0., z, 1.-z, 0. ])
                snake_weights.extend( [0., z, 1.-z, 0. ])
                snake_weights.extend( [0., z, 1.-z, 0. ])
                snake_weights.extend( [0., z, 1.-z, 0. ])
                pass
            else:
                z = 1-i/snake_slices * 2
                snake_weights.extend( [z, 1.-z, 0., 0. ])
                snake_texcoords.extend( [ 1,z, 0,z, 0,z, 1,z ])
                snake_weights.extend( [z, 1.-z, 0., 0. ])
                snake_weights.extend( [z, 1.-z, 0., 0. ])
                snake_weights.extend( [z, 1.-z, 0., 0. ])
                pass
            pass
        for i in range(snake_slices):
            base=i*4
            snake_indices.extend( [base, base, base, base+4, base+1, base+5, base+3, base+7, base+2, base+6 ])
            snake_indices.extend( [base, base+4, base+4, base+4 ])
            pass
        if True:
            z = 1.0
            snake_positions.extend( [1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z ])
            snake_normals.extend( [0,0,1, 0,0,1, 0,0,1, 0,0,1 ])
            snake_texcoords.extend( [ 1,0, 0,0, 1,1, 0,1 ])
            snake_weights.extend( [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0  ])
            z = 1 - snake_height
            snake_positions.extend( [1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z ])
            snake_normals.extend( [0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1 ])
            snake_texcoords.extend( [ 1,0, 0,0, 1,1, 0,1 ])
            snake_weights.extend( [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0 ])
            pass
        endcap = 4*(snake_slices+1)
        snake_indices.extend( [endcap, endcap, endcap+2,endcap+1,endcap+3,endcap+3 ])# now ccw winding
        snake_indices.extend( [endcap+4,endcap+4,endcap+5,endcap+6,endcap+7 ]) # now ccw winding
    
        self.positions = snake_positions
        self.normals   = snake_normals
        self.texcoords = snake_texcoords
        self.weights   = snake_weights
        self.indices   = snake_indices
        self.submeshes = [ Submesh([0,1,2,0], "TS", 0, len(snake_indices)),
                           ]
        pass
    pass
