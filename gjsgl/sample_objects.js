
//a Cube mesh with single bone
// cube front face   back face (as seen from front)
//        1    0        5   4
//        3    2        7   6
// triangles (anticlockwise for first)
//  3.2.1 2.1.0 1.0.4 0.4.2 4.2.6 2.6.7 6.7.4 7.4.5 4.5.1 5.1.7 1.7.3 7.3.2
// Cube strip
// 3, 2, 1, 0, 4, 2, 6, 7, 4, 5, 1, 7, 3, 2
const cube =  {
    positions : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ],
    normals : [
      1.0,  1.0, 1.0, 
      -1.0,  1.0, 1.0,
      1.0, -1.0, 1.0, 
      -1.0, -1.0, 1.0,

      1.0,  1.0, -1.0,
      -1.0,  1.0, -1.0,
      1.0, -1.0, -1.0,
      -1.0, -1.0, -1.0,
    ],
    texcoords : [ 1,0, 0,0, 1,1, 0,1,
            1,1, 0,1, 1,0, 0,0 ],
    weights : [
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      1., 0., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
      0., 1., 0., 0.,
    ],
    indices :  [3, 2, 1, 0, 4, 2, 6, 7,  4, 5, 1, 7, 3, 2],
    //submeshes : [ new Submesh([0,1,0,0], "TS", 0, 14),]
}

//a Double cube object
    // cube front face   mid   back face (as seen from front)
    //        1  0      5  4     9  8
    //        3  2      7  6    11 10
    // Double cube strip
    // 3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2
const dbl_cube =  {
    positions : [
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
    ],
    texcoords : [ 1,0, 0,0, 1,1, 0,1,
                  1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ],
    normals : [
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
    ],
    weights : [
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
    ],
    indices :  [3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2],
    // submeshes : [ new Submesh([0,1,2,0], "TS", 0, 22),]
}

const dbl_cube2 =  {
    positions : [
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
    ],
    normals : [
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
    ],
    texcoords : [ 1,0, 0,0, 1,1, 0,1,
                  1,0, 0,0, 1,1, 0,1,
                  1,1, 0,1, 1,0, 0,0 ],
    weights : [
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
    ],
    indices :  [3, 2, 1, 0, 4, 2, 6, 7,   11, 5, 9, 8, 11, 10, 6, 8,   4, 5, 1, 7, 3, 2],
    //submeshes : [ new Submesh([0,1,2,0], "TS", 0, 22),],
}
function make_snake(snake_slices, snake_height) {
    const snake_slice_height=snake_height/snake_slices;
    const snake_positions = [];
    const snake_normals = [];
    const snake_texcoords = [];
    const snake_weights = [];
    const snake_indices = [];
    for (i=0; i<=snake_slices; i++) {
        var z = 1.0 - i*snake_slice_height
        snake_positions.push(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z);
        snake_normals.push(1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0);
        if (i>=snake_slices/2) {
            z = 2-(i/snake_slices)*2;
            snake_texcoords.push( 1,1-z, 0,1-z, 0,1-z, 1,1-z);
            snake_weights.push(0., z, 1.-z, 0.);
            snake_weights.push(0., z, 1.-z, 0.);
            snake_weights.push(0., z, 1.-z, 0.);
            snake_weights.push(0., z, 1.-z, 0.);
        } else {
            z = 1-i/snake_slices * 2;
            snake_weights.push(z, 1.-z, 0., 0.);
            snake_texcoords.push( 1,z, 0,z, 0,z, 1,z);
            snake_weights.push(z, 1.-z, 0., 0.);
            snake_weights.push(z, 1.-z, 0., 0.);
            snake_weights.push(z, 1.-z, 0., 0.);
        }
    }
    for (i=0; i<snake_slices; i++) {
        const base=i*4;
        snake_indices.push(base, base, base, base+4, base+1, base+5, base+3, base+7, base+2, base+6);
        snake_indices.push(base, base+4, base+4, base+4);
    }
    {
        var z = 1.0;
        snake_positions.push(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z);
        snake_normals.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
        snake_texcoords.push( 1,0, 0,0, 1,1, 0,1);
        snake_weights.push(1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0 );
        z = 1 - snake_height;
        snake_positions.push(1, 1, z, -1, 1, z, 1, -1, z, -1, -1, z);
        snake_normals.push(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1);
        snake_texcoords.push( 1,0, 0,0, 1,1, 0,1);
        snake_weights.push(0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0);
    }
    endcap = 4*(snake_slices+1);
    snake_indices.push(endcap, endcap, endcap+1,endcap+2,endcap+3,endcap+3);// now ccw winding
    snake_indices.push(endcap+4,endcap+4,endcap+5,endcap+6,endcap+7); // now ccw winding
    
    const snake =  {
        positions : snake_positions,
        normals   : snake_normals,
        texcoords : snake_texcoords,
        weights   : snake_weights,
        indices   : snake_indices,
        //submeshes : [ new Submesh([0,1,2,0], "TS", 0, snake_indices.length),],
    }
    return snake;
}

