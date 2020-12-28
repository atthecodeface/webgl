// a skinned mesh vertex is a vec3 and an array of N influences for N bones
// Each bone derives a mat4.
// PosedVertex = Sum(Influence[n] * BoneMat4[n]) * RestVertex
function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl     = canvas.getContext("webgl");
    if (!gl) {
        alert("Unable to start webgl");
        return;
    }

    shaders = shader_compile(gl);
    const meshes = []
    meshes.push(new Mesh(gl, dbl_cube.positions, dbl_cube.weights, dbl_cube.indices, dbl_cube.submeshes));
    meshes.push(new Mesh(gl, cube.positions, cube.weights, cube.indices, cube.submeshes));
    run_animation(gl, shaders, meshes);
}

var time=0.0;
function run_animation(gl, shaders, meshes) {
    a = new Bone(null);
    b = new Bone(a);
    c = new Bone(b);
    a.translate_from_rest(vec3.set(vec3.create(),0.,0.,1.));
    b.translate_from_rest(vec3.set(vec3.create(),0.,0.,-2.));
    c.translate_from_rest(vec3.set(vec3.create(),0.,0.,-2.));
    
    a.derive_at_rest();
    a.derive_animation();
    bones = [a,b,c];

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix,     // destination matrix
                   cameraMatrix,     // matrix to translate
                   [-0.0, 0.0, -20.0]);  // amount to translate
    matrices = [projectionMatrix, cameraMatrix, mat4.create()];
    step_animation = function() {
        drawScene(gl, shaders, meshes, time, bones, matrices);
        time+=0.1;
        requestAnimationFrame(step_animation);
    }
    requestAnimationFrame(step_animation);
}

function drawScene(gl, shaders, meshes, time, bones, matrices) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    //gl.cullFace(gl.FRONT);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const q = quat.create();
    const angle=Math.sin(time*0.2)*0.3;
    quat.identity(q);
    quat.rotateX(q,q,1.85);
    //quat.rotateX(q,q,+angle*2);
    bones[0].translate_from_rest(vec3.set(vec3.create(),0.,0.,0.));
    bones[0].quaternion_from_rest(q);
    quat.identity(q);
    quat.rotateZ(q,q,4*angle);
    bones[1].translate_from_rest(vec3.set(vec3.create(),0.,0.,1.0-Math.cos(4*angle)));
    bones[1].quaternion_from_rest(q);
    quat.identity(q);
    quat.rotateZ(q,q,-4*angle);
    bones[2].translate_from_rest(vec3.set(vec3.create(),0.,0.,1.0-Math.cos(4*angle)));
    bones[2].quaternion_from_rest(q);
    bones[0].derive_animation();

    mat4.identity(matrices[2]);
    mat4.translate(matrices[2], matrices[2], [3.0, 0.0, 0.0]);
    draw_objects(gl, shaders[0], meshes, bones, matrices);
}

main();
