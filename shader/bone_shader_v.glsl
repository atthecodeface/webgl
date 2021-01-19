layout(location = 0) in vec3 vPosition;
layout(location = 1) in vec3 vNormal;
layout(location = 2) in vec4 vWeights;
layout(location = 3) in vec2 vTexture;
layout(location = 4) in vec4 vJoints;
layout(location = 5) in vec4 vColor;

uniform mat4 uProjectionMatrix;
uniform mat4 uCameraMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uMeshMatrix;
uniform mat4 uBonesMatrices[16];
uniform float uBonesScale;

out vec3 color_pos;
out vec3 normal;
out vec2 tex_uv;

void main() {
    mat4 weightedMatrix = ( (uBonesMatrices[int(vJoints.x)] * vWeights.x) +
                            (uBonesMatrices[int(vJoints.y)] * vWeights.y) +
                            (uBonesMatrices[int(vJoints.z)] * vWeights.z) +
                            (uBonesMatrices[int(vJoints.w)] * vWeights.w) );
    weightedMatrix = weightedMatrix * uBonesScale + (mat4(1.) * (1.-uBonesScale));
    color_pos      = (normalize(vPosition) + 1.) / 2.0;
    color_pos = vWeights.xyz/4.0;

    mat4 mesh_to_world = uModelMatrix * uMeshMatrix * weightedMatrix;
    vec3 world_pos = (mesh_to_world * vec4(vPosition, 1.)).xyz;
    normal         = (mesh_to_world * vec4(vNormal,   0.)).xyz;
    gl_Position    = uProjectionMatrix * uCameraMatrix * vec4(world_pos.xyz, 1.);
    tex_uv         = vTexture.xy;
}
