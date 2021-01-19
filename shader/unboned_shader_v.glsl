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

out vec3 normal;
out vec2 tex_uv;

void main() {
    mat4 mesh_to_world = uModelMatrix * uMeshMatrix;
    vec3 world_pos = (mesh_to_world * vec4(vPosition, 1.)).xyz;
    normal         = (mesh_to_world * vec4(vNormal,   0.)).xyz;
    gl_Position    = uProjectionMatrix * uCameraMatrix * vec4(world_pos.xyz, 1.);
    tex_uv         = vTexture.xy;
}
