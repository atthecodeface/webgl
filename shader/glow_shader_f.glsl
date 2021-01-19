struct Material {
    vec4      base_color;
    sampler2D base_texture;
};
uniform Material uMaterial;

in vec3 normal;
in vec2 tex_uv;
out vec4 outColor;
void main() {
    vec4 t = texture( uMaterial.base_texture, tex_uv );
    t.rgb = t.rgb * uMaterial.base_color.rgb;
    t.rgb = t.rgb + uMaterial.base_color.rgb * uMaterial.base_color.a;
    outColor = t;
}

