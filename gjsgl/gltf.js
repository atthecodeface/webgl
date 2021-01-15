//a GLTF namespace wrapper
const GLTF = ( () => {
    
//a GLTF enumerations
class Enum {
    of_enum(num)  {return this.enum_to_cls[num];}
    of_name(name) {return this.name_to_cls[name];}
    constructor(enums) {
        this.enum_to_cls = {};
        this.name_to_cls = {};
        for (const e of enums) {
            this.enum_to_cls[e.num]  = e;
            this.name_to_cls[e.name] = e;
        }
    }
}

VTByte   = {num:5120, size:1, gl_type:(GL)=>GL.BYTE, name:"BYTE"};
VTUByte  = {num:5121, size:1, gl_type:(GL)=>GL.UNSIGNED_BYTE, name:"UNSIGNED_BYTE"};
VTShort  = {num:5122, size:2, gl_type:(GL)=>GL.SHORT, name:"SHORT"};
VTUShort = {num:5123, size:2, gl_type:(GL)=>GL.UNSIGNED_SHORT, name:"UNSIGNED_SHORT"};
VTUInt   = {num:5125, size:4, gl_type:(GL)=>GL.UNSIGNED_INT, name:"UNSIGNED_INT"};
VTFloat  = {num:5126, size:4, gl_type:(GL)=>GL.FLOAT, name:"FLOAT"};
class ValueType extends Enum{
    constructor() {
        const enums = [
            VTByte,
            VTUByte,
            VTShort,
            VTUShort,
            VTUInt,
            VTFloat,
        ];
        super(enums);
    }
}

const ValueTypes = new ValueType();

CTScalar     = { num:1, size:1,  name:"SCALAR"};
CTVec2Scalar = { num:2, size:2,  name:"VEC2"};
CTVec3Scalar = { num:3, size:3,  name:"VEC3"};
CTVec4Scalar = { num:4, size:4,  name:"VEC4"};
CTMat2Scalar = { num:5, size:4,  name:"MAT2"};
CTMat3Scalar = { num:6, size:9,  name:"MAT3"};
CTMat4Scalar = { num:7, size:16, name:"MAT4"};

class CompType extends Enum{
    constructor() {
        const enums = [
        CTScalar,
        CTVec2Scalar,
        CTVec3Scalar,
        CTVec4Scalar,
        CTMat2Scalar,
        CTMat3Scalar,
        CTMat4Scalar,
        ];
        super(enums);
    }
}
const CompTypes = new CompType();

    /*
class BViewTgt(Enum): pass
class BVTArray(BViewTgt): enum=34962; name="ARRAY_BUFFER"
class BVTIndex(BViewTgt): enum=34963; name="ELEMENT_ARRAY_BUFFER"
*/

PTPoints        = { num:0, gl_type:(GL)=>GL.POINTS,         name:"POINTS"};
PTLines         = { num:1, gl_type:(GL)=>GL.LINES,          name:"LINES"};
PTLineLoop      = { num:2, gl_type:(GL)=>GL.LINE_LOOP,      name:"LINE_LOOP"};
PTLineStrip     = { num:3, gl_type:(GL)=>GL.LINE_STRIP,     name:"LINE_STRIP"};
PTTriangles     = { num:4, gl_type:(GL)=>GL.TRIANGLES,      name:"TRIANGLES"};
PTTriangleStrip = { num:5, gl_type:(GL)=>GL.TRIANGLE_STRIP, name:"TRIANGLE_STRIP"};
PTTriangleFan   = { num:6, gl_type:(GL)=>GL.TRIANGLE_FAN,   name:"TRIANGLE_FAN"};

class PrimitiveType extends Enum{
    constructor() {
        const enums = [
            PTPoints,
            PTLines,
            PTLineLoop,
            PTLineStrip,
            PTTriangles,
            PTTriangleStrip,
            PTTriangleFan,
        ];
        super(enums);
    }
}
const PrimitiveTypes = new PrimitiveType();

//a Useful functions
function def (a,b) {
    if (a!==undefined) {return a;} else {return b;}
}
function do_if (a,f) {
    if (a!==undefined) {f(a);}
}

//a Data classes
//c Buffer
class Buffer {
    //f constructor
    constructor(json) {
        this.name   = json.name;
        this.uri    = json.uri;
        this.load_promise = fetch(this.uri).then(
            (response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch "+this.uri);
                } else {
                    return response.arrayBuffer();
                }
            }).then( (data) => {this.data=data;} );
    }
    //f init
    init() {
        return this.load_promise;
    }
    //f All done
}

//c BufferView
class BufferView {
    //f constructor
    constructor(gltf, json) {
        this.buffer = gltf.get_buffer(json.buffer);
        this.name   = def(json.name, "");
        this.stride = def(json.byteStride,0);
        this.offset = def(json.byteOffset,0);
        this.length = def(json.byteLength,0);
        this.target = def(json.target,0);
    }
    //f All done
}

//c Accessor
class Accessor {
    //f constructor
    constructor(gltf, json) {
        this.view       = gltf.get_buffer_view(json["bufferView"]);
        this.name      = def(json.name,"");
        this.offset    = def(json.byteOffset,0);
        this.acc_type  = CompTypes.of_name(def(json.type,"SCALAR"));
        this.comp_type = ValueTypes.of_enum(def(json.componentType,5120));
        this.count     = def(json.count,0);
    }
    //f to_model_buffer_view
    to_model_buffer_view() {
        const data        = this.view.buffer.data;
        const byte_offset = this.view.offset;
        const byte_length = this.view.length;
        const stride      = this.view.stride;
        const offset      = this.offset;
        const count       = this.acc_type.size; //# e.g. 3 for VEC3
        const gl_type     = this.comp_type.gl_type(GL); // e.g. of GL_FLOAT
        // console.log("Creating attributes of "+gl_type+" "+byte_offset+", "+byte_length+", "+data[byte_offset:byte_offset+byte_length]);
        const model_data  = new ModelBufferData(data, byte_offset, byte_length);
        return new ModelBufferView(model_data, count, gl_type, offset, stride);
    }
    //f to_model_buffer_indices
    to_model_buffer_indices() {
        const data        = this.view.buffer.data;
        const byte_offset = this.view.offset;
        const byte_length = this.view.length;
        // console.log("Creating indices of "+this.comp_type.gl_type+" "+byte_offset+", "+byte_length+", ",data);
        return new ModelBufferIndices(data, byte_offset, byte_length);
    }
    //f All done
}

//c GltfImage
class GltfImage {
    //f constructor
    constructor(json) {
        this.name        = def(json.name,"");
        this.uri         = json.uri;
        this.buffer_view = json.bufferView;
        this.mime_type   = json.mimeType;
        this.image_data  = undefined;
        this.image       = undefined;
        if (this.uri!==undefined) {
            this.load_promise = fetch(this.uri).then(
                (response) => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch image "+this.uri);
                    } else {
                        console.log(response);
                        this.mime_type = "image/jpeg";
                        return response.arrayBuffer();
                    }
                }).then( (data) => {this.image_data=data;} );
        } else {
            this.load_promise = new Promise.resolve();
        }
    }
    //f init
    init() {
        return this.load_promise;
    }
    //f make_image
    make_image() {
        if (this.image_data===undefined) {
            return Promise.resolve();
        }
        const blob = new Blob( [ this.image_data ], { type: this.mime_type } );
        this.image_url = URL.createObjectURL( blob );
        this.image = new Image();
        const promise = new Promise(
            (resolve) => {
                this.image.onload = () => {
                    URL.revokeObjectURL(this.image_url);
                    this.image_url  = undefined;
                    this.image_data = undefined;
                    console.log(this);
                    resolve();
                }
            });
        this.image.src = this.image_url;
        return promise;
    }
    //f All done
}

//c GltfSampler
class GltfSampler {
    //f constructor
    constructor(json) {
        this.name        = def(json.name,"");
        this.mag_filter  = def(json.magFilter,"");
        this.min_filter  = def(json.minFilter,"");
        this.wrap_s      = def(json.wrapS,"");
        this.wrap_t      = def(json.wrapT,"");
    }
}

//c GltfTexture
class GltfTexture {
    //f constructor
    constructor(gltf, json) {
        this.name        = def(json.name,"");
        this.sampler     = gltf.get_sampler(json["sampler"]);
        this.image       = gltf.get_image(json["source"]);
        this.texture = undefined;
    }
    //f to_texture
    to_texture() {
        if (this.texture!==undefined) {return this.texture;}
        if (this.image.image===undefined) { throw new Error("Image not loaded for texture");}
        const data = this.image.image;
        this.texture = new Texture(data);
        return this.texture;
    }
}

//c GltfMaterial
class GltfMaterial {
    //f constructor
    constructor(gltf, json) {
        this.name    = def(json.name,"");
        const pbr    = def(json.pbrMetallicRoughness,{});
        this.color   = (1.,1.,1.,1.);
        this.metallic  = 1.;
        this.roughness = 1.;
        this.base_texture   = undefined;
        this.mr_texture     = undefined;
        this.normal_texture = undefined;
        this.occlusion_texture = undefined;
        this.emission_texture = undefined;
        this.color     = def(pbr.baseColorFactor,this.color);
        this.roughness = def(pbr.roughnessFactor,this.roughness);
        this.metallic  = def(pbr.metallicFactor, this.metallic);
        do_if(pbr.baseColorTexture,  (n)=>{this.base_texture     =gltf.get_texture(n.index);} );
        do_if(pbr.metallicRoughnessTexture,  (n)=>{this.mr_texture     =gltf.get_texture(n.index);} );
        do_if(json.normalTexture,    (n)=>{this.normal_texture   =gltf.get_texture(n.index);} );
        do_if(json.emissionTexture,  (n)=>{this.emission_texture =gltf.get_texture(n.index);} );
        do_if(json.occlusionTexture, (n)=>{this.occlusion_texture=gltf.get_texture(n.index);} );
    }
    //f to_model_material
    to_model_material() {
        const m = new ModelMaterial()
        m.color = this.color;
        return m;
    }
    //f All done
}

//c Primitive - Add non-standard maps
class Primitive {
    //f constructor
    constructor(gltf, mesh, json) {
        const attributes    = def(json.attributes,{"POSITION":0});
        this.mode     = PrimitiveTypes.of_enum(def(json.mode,4));
        this.position = gltf.get_accessor(def(attributes.POSITION,0));
        this.indices  = gltf.get_accessor(def(json.indices,0));
        this.material = gltf.get_material(def(json.material,0));
        this.normal  = [];
        do_if(attributes.NORMAL, (a)=>this.normal.push(gltf.get_accessor(a)) );
        this.tangent  = []
        do_if(attributes.TANGENT, (a)=>this.tangent.push(gltf.get_accessor(a)) );
        this.color   = [];
        this.tex_coords = [];
        do_if(attributes.TEXCOORD_0, (a)=>this.tex_coords.push(gltf.get_accessor(a)) );
        do_if(attributes.TEXCOORD_1, (a)=>this.tex_coords.push(gltf.get_accessor(a)) );
        this.joints  = []
        do_if(attributes.JOINTS_0, (a)=>this.joints.push(gltf.get_accessor(a)) );
        this.weights  = []
        do_if(attributes.WEIGHTS_0, (a)=>this.weights.push(gltf.get_accessor(a)) );
        // if attributes has this.material = gltf.get_accessor(json.get("material",0))
    }
    //f to_model_primitive
    to_model_primitive() {
        const material = this.material.to_model_material();

        const view      = new ModelPrimitiveView();
        view.indices  = this.indices.to_model_buffer_indices();
        view.position = this.position.to_model_buffer_view();
        if (this.normal.length!=0)     {view.normal     = this.normal[0].to_model_buffer_view();}
        if (this.tangent.length!=0)    {view.tangent    = this.tangent[0].to_model_buffer_view();}
        if (this.color.length!=0)      {view.color      = this.color[0].to_model_buffer_view();}
        if (this.tex_coords.length!=0) {view.tex_coords = this.tex_coords[0].to_model_buffer_view();}
        if (this.joints.length!=0)     {view.joints     = this.joints[0].to_model_buffer_view();}
        if (this.weights.length!=0)    {view.weights    = this.weights[0].to_model_buffer_view();}
        const primitive = new ModelPrimitive();
        primitive.material        = material;
        primitive.view            = view;
        primitive.gl_type         = this.mode.gl_type(GL);
        primitive.indices_offset  = this.indices.offset;
        primitive.indices_count   = this.indices.count;
        primitive.indices_gl_type = this.indices.comp_type.gl_type(GL);
        return primitive;
    }
    //f All done
}

//c Mesh
class Mesh {
    //f constructor
    constructor(gltf, json) {
        this.name       = def(json.name,"");
        this.primitives = [];
        for (const p of def(json.primitives,[])) {
            this.primitives.push(new Primitive(gltf, this, p));
        }
    }
    //f to_model_mesh
    to_model_mesh(gltf) {
        const model_mesh = new ModelMesh();
        for (const p of this.primitives) {
            model_mesh.primitives.push(p.to_model_primitive());
        }
        return model_mesh;
    }
    //f All done
}

//c Skin
class Skin {
    //f constructor
    constructor(gltf, json) {
        this.name   = def(json.name,"");
        this.joints = def(json.joints,[]);
        this.root   = def(json.skeleton,0);
        this.ibms   = def(json.inverseBindMatrices,undefined);
    }
    //f to_bones
    to_bones(gltf) {
        const bone_set = new BoneSet();
        const nodes = [];
        for (const j of this.joints) {
            const node = gltf.get_node(j);
            nodes.push(node);
        }
        nodes.sort((a,b)=>(a.depth-b.depth));
        const bones = new Map();
        for (const j of this.joints) {
            const n = gltf.get_node(j);
            if (bones.has(n)) {continue;}
            const add_bone = function(n,b) {bones.set(n,b);}
            const bone = n.to_bone(gltf, add_bone, undefined);
            bone_set.add_bone_hierarchy(bone);
        }
        for (const i in this.joints) {
            const j = this.joints[i];
            const n = gltf.get_node(j);
            const b = bones.get(n);
            b.matrix_index = i;
        }
        bone_set.derive_matrices();
        return bone_set;
    }
}

//c Node
class Node {
    //f constructor
    constructor(gltf, json) {
        this.name           = def(json.name,"");
        this.mesh           = undefined;
        this.skin           = undefined;
        this.children       = def(json.children,[]);
        this.transformation = new Transformation();
        this.depth = -1;
        do_if(json.mesh,   (m)=>{this.mesh = gltf.get_mesh(m);} );
        do_if(json.skin,   (m)=>{this.skin = gltf.get_skin(m);} );
        do_if(json.matrix, (m)=>{this.transformation.from_mat4(m);} );
        if (json.rotation!==undefined) {
            const q = json.rotation;
            this.transformation.quaternion = [q[1],q[2],q[3],q[0]];
        }
        do_if(json.scale,       (m)=>{this.transformation.scale=m;} );
        do_if(json.translation, (m)=>{this.transformation.translation=m;} );
    }
    //f calculate_depth
    calculate_depth(gltf, depth) {
        if (depth<=this.depth) {return;}
        this.depth = depth;
        for (const ci of this.children) {
            const cn = gltf.get_node(ci)
            cn.calculate_depth(gltf, depth+1);
        }
    }
    //f to_bone
    to_bone(gltf, add_callback, parent) {
        const bone = new Bone(parent, this.transformation, -1);
        add_callback(this, bone);
        for (const ci of this.children) {
            const cn = gltf.get_node(ci);
            cn.to_bone(gltf, add_callback, bone);
        }
        return bone;
    }
    //f to_model_object
    to_model_object(gltf, parent) {
        const model_object = new ModelObject(parent, this.transformation);
        for (const ci of this.children) {
            const cn = gltf.get_node(ci);
            cn.to_model_object(gltf, model_object);
        }
        if (this.mesh!==undefined) {
            model_object.mesh = this.mesh.to_model_mesh(gltf);
        }
        if (this.skin!==undefined) {
            model_object.bones = gltf.bones_of_skin(this.skin);
        }
        return model_object;
    }
    //f All done
}

    
//c Gltf
class Gltf {
    //f constructor
    constructor(uri) {
        this.uri    = uri;
        this.buffers = [];
        this.images = [];
        this.buffer_views = [];
        this.accessors = [];
        this.samplers = [];
        this.textures = [];
        this.materials = [];
        this.skins = [];
        this.meshes = [];
        this.nodes = [];
        this.init_promise = new Promise(
            (resolve) => {
                this.load_promise = fetch(this.uri).then(
                    (response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch gltf "+this.uri);
                        } else {
                            return response.json();
                        }
                    }).then(
                        (json) => {
                            this.json = json;                            
                            return this.fetch_buffers();
                        }).then(
                                () => {
                                    this.resolve_json();
                                    resolve();
                                });
            });
    }
    fetch_buffers() {
        const promises = [];
        for (const b of def(this.json.buffers,[])) {
            const buffer = new Buffer(b);
            this.buffers.push(buffer);
            promises.push(buffer.init());
        }
        for (const i of def(this.json.images,[])) {
            const image = new GltfImage(i);
            this.images.push(image);
            promises.push(image.init());
        }
        return Promise.all(promises).then( () => {return this.make_images();} );
    }
    make_images() {
        const promises = [];
        for (const image of this.images) {
            promises.push(image.make_image());
        }
        return Promise.all(promises);
    }
    init() {
        return this.init_promise;
    }
    resolve_json() {
        for (const b of def(this.json.bufferViews,[])) {
            this.buffer_views.push(new BufferView(this, b));
        }
        for (const b of def(this.json.accessors,[])) {
            this.accessors.push(new Accessor(this, b));
        }
        for (const b of def(this.json.samplers,[])) {
            this.samplers.push(new GltfSampler(this, b));
        }
        for (const b of def(this.json.textures,[])) {
            this.textures.push(new GltfTexture(this, b));
        }
        for (const b of def(this.json.materials,[])) {
            this.materials.push(new GltfMaterial(this, b));
        }
        for (const b of def(this.json.skins,[])) {
            this.skins.push(new Skin(this, b));
        }
        for (const b of def(this.json.meshes,[])) {
            this.meshes.push(new Mesh(this, b));
        }
        for (const b of def(this.json.nodes,[])) {
            this.nodes.push(new Node(this, b));
        }
        for (const n of this.nodes) {
            n.calculate_depth(this, 0);
        }
        this.bone_sets = new Map();
        for (const s of this.skins) {
            this.bone_sets[s] = s.to_bones(this);
        }
    }
    //f get_buffer
    get_buffer(index) {
        if ((index<0) || (index>=this.buffers.length)) {throw new Error("Bad buffer number");}
        return this.buffers[index];
    }
    //f get_buffer_view
    get_buffer_view(index) {
        if ((index<0) || (index>=this.buffer_views.length)) {throw new Error("Bad buffer_view number");}
        return this.buffer_views[index];
    }
    //f get_accessor
    get_accessor(index) {
        if ((index<0) || (index>=this.accessors.length)) {throw new Error("Bad accessor number");}
        return this.accessors[index];
    }
    //f get_image
    get_image(index) {
        if ((index<0) || (index>=this.images.length)) {throw new Error("Bad image number");}
        return this.images[index];
    }
    //f get_sampler
    get_sampler(index) {
        if ((index<0) || (index>=this.samplers.length)) {throw new Error("Bad sampler number");}
        return this.samplers[index];
    }
    //f get_texture
    get_texture(index) {
        if ((index<0) || (index>=this.textures.length)) {throw new Error("Bad texture number");}
        return this.textures[index];
    }
    //f get_material
    get_material(index) {
        if ((index<0) || (index>=this.materials.length)) {throw new Error("Bad material number");}
        return this.materials[index];
    }
    //f get_skin
    get_skin(index) {
        if ((index<0) || (index>=this.skins.length)) {throw new Error("Bad skin number");}
        return this.skins[index];
    }
    //f get_mesh
    get_mesh(index) {
        if ((index<0) || (index>=this.meshes.length)) {throw new Error("Bad mesh number");}
        return this.meshes[index];
    }
    //f get_node
    get_node(index) {
        if ((index<0) || (index>=this.nodes.length)) {throw new Error("Bad node number");}
        return this.nodes[index];
    }
    //f get_node_by_name
    get_node_by_name(name) {
        for (const i in this.nodes) {
            if (name == this.nodes[i].name) {
                return (i, this.nodes[i]);
            }
        }
        return undefined;
    }
    //f bones_of_skin
    bones_of_skin(skin) {
        return this.bone_sets[skin];
    }
    //f All done
    pass
}

//a GLTF wrapper end
    return {Gltf:Gltf};
})();
