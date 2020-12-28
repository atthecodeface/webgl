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
    const mesh_objects = []
    mesh_objects.push(new MeshObject(gl, dbl_cube, [3,0,0]));
    mesh_objects.push(new MeshObject(gl, cube, [-3,0,0]));
    mesh_objects.push(new MeshObject(gl, dbl_cube2, [0,0,0]));
    run_animation(gl, shaders, mesh_objects);
}

function run_animation(gl, shaders, mesh_objects) {
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    var time=0.0;
    const cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix,     // destination matrix
                   cameraMatrix,     // matrix to translate
                   [-0.0, 0.0, -20.0]);  // amount to translate

    matrices = [projectionMatrix, cameraMatrix];
    step_animation = function() {
        drawScene(gl, shaders, mesh_objects, time, matrices);
        time+=0.1;
        requestAnimationFrame(step_animation);
    }
    requestAnimationFrame(step_animation);
}

function drawScene(gl, shaders, mesh_objects, time, matrices) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    //gl.cullFace(gl.FRONT);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (const m of mesh_objects) {
        m.animate(time);
    }    
    draw_objects(gl, shaders[0], mesh_objects, matrices);
}

main();
