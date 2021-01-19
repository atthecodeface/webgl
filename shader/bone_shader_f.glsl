struct Material {
    vec4      base_color;
    vec4      mrxx;
    sampler2D base_texture;
    sampler2D mr_texture;
    sampler2D normal_texture;
    sampler2D occlusion_texture;
    sampler2D emission_texture;
};
uniform Material uMaterial;

in vec3 color_pos;
in vec3 normal;
in vec2 tex_uv;
out vec4 outColor;
void main() {
    vec4 t = texture( uMaterial.base_texture, tex_uv );
    t.rgb = t.rgb * uMaterial.base_color.rgb;
    t.rgb = t.rgb + uMaterial.base_color.rgb * uMaterial.base_color.a;
    vec3 light_direction = -normalize(vec3(1, 0., -1.));
    // float n = clamp( abs(dot(light_direction, normalize(normal))), 0., 1. );
    float n = clamp( (dot(light_direction, normalize(normal))), 0., 1. );
    vec4 c = vec4((n*0.8 + vec3(0.2)).xyz,1.) * t;
    outColor = vec4(c.xyz, 1.0);
    // outColor =vec4(1.0);
    //outColor.xyz = color_pos;
}

