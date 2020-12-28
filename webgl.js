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
    const buffers = initBuffers(gl);
    run_animation(gl, shaders, buffers);
}

var time=0.0;
function run_animation(gl, shaders, buffers) {
    a = new Bone(null);
    b = new Bone(a);
    c = new Bone(b);
    a.translate_from_rest(vec3.set(vec3.create(),0.,0.,1.));
    b.translate_from_rest(vec3.set(vec3.create(),0.,0.,-2.));
    c.translate_from_rest(vec3.set(vec3.create(),0.,0.,-2.));
    
    a.derive_at_rest();
    a.derive_animation();
    bones = [a,b,c];
    step_animation = function() {drawScene(gl, shaders, buffers, time, bones); time+=0.1; requestAnimationFrame(step_animation);}
    requestAnimationFrame(step_animation);
}

function drawScene(gl, shaders, buffers, time, bones) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    //gl.cullFace(gl.FRONT);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const cameraMatrix = mat4.create();
  mat4.translate(cameraMatrix,     // destination matrix
                 cameraMatrix,     // matrix to translate
                 [-0.0, 0.0, -40.0]);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  gl.useProgram(shaders[0].program);

  gl.uniformMatrix4fv(shaders[0].uniformLocations.projectionMatrix,false, projectionMatrix);
  gl.uniformMatrix4fv(shaders[0].uniformLocations.cameraMatrix, false, cameraMatrix);

    const mymatrix = Array(64);
    const q = quat.create();
    const angle=Math.sin(time*0.2)*0.3;
    quat.identity(q);
    bones[0].translate_from_rest(vec3.set(vec3.create(),0.,0.,0.));
    bones[0].quaternion_from_rest(q);
    quat.identity(q);
    quat.rotateZ(q,q,4*angle);
    bones[1].translate_from_rest(vec3.set(vec3.create(),0.,0.,-angle*0.9));
    bones[1].quaternion_from_rest(q);
    quat.identity(q);
    quat.rotateZ(q,q,-4*angle);
    bones[2].translate_from_rest(vec3.set(vec3.create(),0.,0.,+angle*0.9));
    bones[2].quaternion_from_rest(q);
    bones[0].derive_animation();
    mat4.copy(mymatrix, bones[0].animated_mtm);
    for (var i=0; i<16; i++) {
        mymatrix[ 0+i] = bones[0].animated_mtm[i];
        mymatrix[16+i] = bones[1].animated_mtm[i];
        mymatrix[32+i] = bones[2].animated_mtm[i];
    }
  gl.uniformMatrix4fv(shaders[0].uniformLocations.boneMatrices, false, mymatrix);    

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

  gl.bindBuffer(gl.ARRAY_BUFFER,         buffers.position);
  gl.enableVertexAttribArray(shaders[0].attribLocations.vertexPosition);
  gl.vertexAttribPointer(shaders[0].attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER,         buffers.weight);
  gl.enableVertexAttribArray(shaders[0].attribLocations.vertexWeights);
  gl.vertexAttribPointer(shaders[0].attribLocations.vertexWeights, 4, gl.FLOAT, false, 0, 0);

  const axis1 = vec3.create();
  const axis2 = vec3.create();
  vec3.set(axis1,0.,1.,0.);
  vec3.set(axis2,1.,0.,0.);
  var modelMatrix = mat4.create();
  const scale = vec4.create();
  vec3.set(scale,2.5,2.5,2.5,1.0);
  mat4.translate(modelMatrix, modelMatrix, [3.0, 0.0, 0.0]);
  mat4.rotate(modelMatrix, modelMatrix, time*0.13, axis2 );
  mat4.rotate(modelMatrix, modelMatrix, time*0.10, axis1 );
    mat4.scale(modelMatrix, modelMatrix, scale);
  gl.uniformMatrix4fv(shaders[0].uniformLocations.modelMatrix, false, modelMatrix);
  gl.drawElements(gl.TRIANGLE_STRIP, 22, gl.UNSIGNED_BYTE, 0);
}

main();
