//a GLTF enumerations
/*
class Enum:
    @classmethod
    def of_enum(cls:Type["Enum"], enum:int) -> Type["Enum"]: return cls.enum_to_cls[enum]
    @classmethod
    def of_name(cls:Type["Enum"], name:str) -> Type["Enum"]: return cls.name_to_cls[name]
    pass

class ValueType(Enum): size: int; gl_type:GL.ValueTypeEnum; pass
class VTByte(ValueType):   enum=5120; size=1; gl_type=GL.GL_BYTE;           name="BYTE"
class VTUByte(ValueType):  enum=5121; size=1; gl_type=GL.GL_UNSIGNED_BYTE;  name="UNSIGNED_BYTE"
class VTShort(ValueType):  enum=5122; size=2; gl_type=GL.GL_SHORT;          name="SHORT"
class VTUShort(ValueType): enum=5123; size=2; gl_type=GL.GL_UNSIGNED_SHORT; name="UNSIGNED_SHORT"
class VTUInt(ValueType):   enum=5125; size=4; gl_type=GL.GL_UNSIGNED_INT;   name="UNSIGNED_INT"
class VTFloat(ValueType):  enum=5126; size=4; gl_type=GL.GL_FLOAT;          name="FLOAT"
ValueType.enum_to_cls = {
    VTByte.enum   : VTByte,
    VTUByte.enum  : VTUByte,
    VTShort.enum  : VTShort,
    VTUShort.enum : VTUShort,
    VTUInt.enum   : VTUInt,
    VTFloat.enum  : VTFloat,
}

class CompType(Enum): size: int; pass
class CTScalar(CompType):     enum=1; size=1;  name="SCALAR"
class CTVec2Scalar(CompType): enum=1; size=2;  name="VEC2"
class CTVec3Scalar(CompType): enum=1; size=3;  name="VEC3"
class CTVec4Scalar(CompType): enum=1; size=4;  name="VEC4"
class CTMat2Scalar(CompType): enum=1; size=4;  name="MAT2"
class CTMat3Scalar(CompType): enum=1; size=9;  name="MAT3"
class CTMat4Scalar(CompType): enum=1; size=16; name="MAT4"
CompType.name_to_cls = {
    CTScalar.name                    :CTScalar,
    CTVec2Scalar.name                    :CTVec2Scalar,
    CTVec3Scalar.name                    :CTVec3Scalar,
    CTVec4Scalar.name                    :CTVec4Scalar,
    CTMat2Scalar.name                    :CTMat2Scalar,
    CTMat3Scalar.name                    :CTMat3Scalar,
    CTMat4Scalar.name                    :CTMat4Scalar,
}


class BViewTgt(Enum): pass
class BVTArray(BViewTgt): enum=34962; name="ARRAY_BUFFER"
class BVTIndex(BViewTgt): enum=34963; name="ELEMENT_ARRAY_BUFFER"

class PrimitiveType(Enum): gl_type:GL.ElementType; pass
class PTPoints(PrimitiveType):        enum=0; gl_type=GL.GL_POINTS; name="POINTS"
class PTLines(PrimitiveType):         enum=1; gl_type=GL.GL_LINES; name="LINES"
class PTLineLoop(PrimitiveType):      enum=2; gl_type=GL.GL_LINE_LOOP; name="LINE_LOOP"
class PTLineStrip(PrimitiveType):     enum=3; gl_type=GL.GL_LINE_STRIP; name="LINE_STRIP"
class PTTriangles(PrimitiveType):     enum=4; gl_type=GL.GL_TRIANGLES; name="TRIANGLES"
class PTTriangleStrip(PrimitiveType): enum=5; gl_type=GL.GL_TRIANGLE_STRIP; name="TRIANGLE_STRIP"
class PTTriangleFan(PrimitiveType)  : enum=6; gl_type=GL.GL_TRIANGLE_FAN; name="TRIANGLE_FAN"
PrimitiveType.enum_to_cls = {
    PTPoints.enum          : PTPoints,
    PTLines.enum           : PTLines,
    PTLineLoop.enum        : PTLineLoop,
    PTLineStrip.enum       : PTLineStrip,
    PTTriangles.enum       : PTTriangles,
    PTTriangleStrip.enum   : PTTriangleStrip,
    PTTriangleFan.enum     : PTTriangleFan,
    }
*/

//a Data classes
//c Buffer
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log('Taking a break...');
  await sleep(2000);
  console.log('Two seconds later, showing sleep in a loop...');

  // Sleep in loop
  for (let i = 0; i < 5; i++) {
    if (i === 1)
        await sleep(2000);
  }
}
function read_file(file) {
    return new Promise(
        (resolve,reject) => {
            var reader = new FileReader();
            reader.onload = (x) => resolve(reader.result);
            reader.readAsArrayBuffer(file); // or readAsText or readAsDataURL
        }
    );
}
async function demo_read() {
    console.log('Taking a break...');
    await read_file("a.banana");
    console.log('Done');
}
class Buffer {
    //f constructor
    constructor(json) {
        this.name   = json.get("name","");
        this.uri    = json["uri"];
        this.length = json["byteLength"];
        if (this.uri[:17] == "data:application/") {
            data = this.uri.split(";base64,")[1];
            this.data = np.frombuffer(base64.b64decode(data),dtype=np.uint8);
        } else {
            path = Path(this.uri);
            with path.open("rb") as f {
                data = f.read();
                this.data = np.frombuffer(data, dtype=np.uint8);
            }
        }
    }
}

//c BufferView
class BufferView {
    //f constructor
    constructor(gltf, json) {
        this.buffer = gltf.get_buffer(json["buffer"]);
        this.name   = json.get("name","");
        this.stride = json.get("byteStride",0);
        this.offset = json.get("byteOffset",0);
        this.length = json.get("byteLength",0);
        this.target = json.get("target",0);
    }
    //f All done
}

//c Accessor
class Accessor {
    //f constructor
    constructor(gltf, json) {
        this.view = gltf.get_buffer_view(json["bufferView"]);
        this.name   = json.get("name","");
        this.offset = json.get("byteOffset",0);
        this.acc_type  = cast(CompType, CompType.of_name(json.get("type","SCALAR")));
        this.comp_type = cast(ValueType, ValueType.of_enum(json.get("componentType",5120)));
        this.count = json.get("count",0);
    }
    //f to_model_buffer_view
    to_model_buffer_view() {
        const data        = this.view.buffer.data;
        const byte_offset = this.view.offset;
        const byte_length = this.view.length;
        const stride      = this.view.stride;
        const offset      = this.offset;
        const count       = this.acc_type.size; //# e.g. 3 for VEC3
        const gl_type     = this.comp_type.gl_type; // e.g. of GL_FLOAT
        // console.log("Creating attributes of "+gl_type+" "+byte_offset+", "+byte_length+", "+data[byte_offset:byte_offset+byte_length]);
        const model_data  = new ModelBufferData(data=data, byte_offset=byte_offset, byte_length=byte_length);
        return new ModelBufferView(data=model_data, count=count, gl_type=gl_type, offset=offset, stride=stride);
    }
    //f to_model_buffer_indices
    to_model_buffer_indices() {
        const data        = this.view.buffer.data;
        const byte_offset = this.view.offset;
        const byte_length = this.view.length;
        console.log("Creating indices of "+this.comp_type.gl_type+" "+byte_offset+", "+byte_length+", "+data[byte_offset:byte_offset+byte_length]);
        return new ModelBufferIndices(data=data, byte_offset=byte_offset, byte_length=byte_length);
    }
    //f All done
}

//c Image
class Image {
}

//c Sampler
// sampler has magFilter, minFilter, wrapS, wrapT
class Sampler {
}

//c Texture
// texture which refers to an image and a sampler
// @dataclass
class Texture {
}

//c Material
// Texture use is Texture and aan int is an index to the tex_coords list to use to index the texture
class Material {
    //f constructor
    constructor(gltf, json) {
        this.name   = json.get("name","")
        pbr : Json = json.get("pbrMetallicRoughness",[])
        this.color = (1.,1.,1.,1.)
        this.metallic = 1.
        this.roughness = 0.
        this.base_texture = None
        this.normal_texture = None
        if len(pbr)>0:
            this.color     = tuple(json.get("baseColorFactor",this.color)) # type: ignore
            this.roughness = json.get("roughnessFactor",this.roughness)
            this.metallic  = json.get("metallicFactor",this.metallic)
            pass
        pass
    }
    //f to_model_material
    to_model_material() {
        m = ModelMaterial()
        m.color = this.color
        return m;
    }
    //f All done
}

//c Primitive - Add non-standard maps
class Primitive {
    //f constructor__
    constructor(gltf, mesh, json) {
        attributes = json.get("attributes",{"POSITION":0})
        this.mode     = cast(PrimitiveType, PrimitiveType.of_enum(json.get("mode",4)))
        this.position = gltf.get_accessor(attributes.get("POSITION",0))
        this.indices  = gltf.get_accessor(json.get("indices",0))
        this.material = gltf.get_material(json.get("material",0))
        this.normal  = []
        if "NORMAL" in attributes:
            this.normal.append( gltf.get_accessor(attributes["NORMAL"]) )
            pass
        this.tangent = []
        if "TANGENT" in attributes:
            this.tangent.append( gltf.get_accessor(attributes["TANGENT"]) )
            pass
        this.color   = []
        this.tex_coords = []
        if "TEXCOORD_0" in attributes:
            this.tex_coords.append( gltf.get_accessor(attributes["TEXCOORD_0"]) )
            pass
        if "TEXCOORD_1" in attributes:
            this.tex_coords.append( gltf.get_accessor(attributes["TEXCOORD_1"]) )
            pass
        if "TEXCOORD_1" in attributes:
            this.tex_coords.append( gltf.get_accessor(attributes["TEXCOORD_1"]) )
            pass
        this.joints  = []
        if "JOINTS_0" in attributes:
            this.joints.append( gltf.get_accessor(attributes["JOINTS_0"]) )
            pass
        this.weights = []
        if "WEIGHTS_0" in attributes:
            this.weights.append( gltf.get_accessor(attributes["WEIGHTS_0"]) )
            pass
        # if attributes has this.material = gltf.get_accessor(json.get("material",0))
    }
    //f to_model_primitive
    to_model_primitive() {
        material = this.material.to_model_material()

        view      = ModelPrimitiveView()
        view.indices  = this.indices.to_model_buffer_indices()
        view.position = this.position.to_model_buffer_view()
        if this.normal!=[]:     view.normal     = this.normal[0].to_model_buffer_view()
        if this.tangent!=[]:    view.tangent    = this.tangent[0].to_model_buffer_view()
        if this.color!=[]:      view.color      = this.color[0].to_model_buffer_view()
        if this.tex_coords!=[]: view.tex_coords = this.tex_coords[0].to_model_buffer_view()
        if this.joints!=[]:     view.joints     = this.joints[0].to_model_buffer_view()
        if this.weights!=[]:    view.weights    = this.weights[0].to_model_buffer_view()
        primitive = ModelPrimitive()
        primitive.material        = material
        primitive.view            = view
        primitive.gl_type         = this.mode.gl_type
        primitive.indices_offset  = this.indices.offset
        primitive.indices_count   = this.indices.count
        primitive.indices_gl_type = this.indices.comp_type.gl_type
        print(f"Created model primitive {primitive}")
        return primitive;
    }
    //f All done
}

//c Mesh
class Mesh {
    //f constructor
    constructor(gltf, json) {
        this.name   = json.get("name","")
        this.primitives = []
        if "primitives" in json:
            for p in json["primitives"]:
                this.primitives.append(Primitive(gltf, this, p))
                pass
            pass
    }
    //f to_model_mesh
    to_model_mesh(gltf) {
        model_mesh = ModelMesh()
        for p in this.primitives:
            model_mesh.primitives.append(p.to_model_primitive())
            pass
        print(f"Created model mesh {model_mesh}")
        return model_mesh;
    }
    //f All done
}

//c Skin
class Skin {
    //f constructor
    constructor(gltf, json) {
        this.name   = json.get("name","")
        this.joints = json.get("joints",[])
        this.root   = json.get("skeleton",0)
        this.ibms   = json.get("inverseBindMatrices",None)
    }
    //f to_bones
    to_bones(gltf) {
        bone_set = BoneSet()
        nodes = []
        for j in this.joints:
            n = gltf.get_node(j)
            nodes.append(n)
            pass
        nodes.sort(key=lambda x:x.depth)
        bones = {}
        for j in this.joints:
            n = gltf.get_node(j)
            if n in bones: continue
            def add_bone(n:"Node",b:Bone)->None: bones[n]=b
            bone = n.to_bone(gltf, add_callback=add_bone)
            bone_set.add_bone_hierarchy(bone)
            pass
        for i in range(len(this.joints)):
            j = this.joints[i]
            n = gltf.get_node(j)
            b = bones[n]
            b.matrix_index = i
            pass
        bone_set.derive_matrices()
        return bone_set;
    }
}

//c Node
class Node {
    //f constructor
    constructor(gltf, json) {
        this.name   = json.get("name","")
        this.mesh = None
        this.skin = None
        this.children = json.get("children",[])
        this.transformation = Transformation()
        this.depth = -1
        if "mesh" in json:
            this.mesh = gltf.get_mesh(json["mesh"])
            pass
        if "skin" in json:
            this.skin = gltf.get_skin(json["skin"])
            pass
        if "matrix" in json:
            this.transformation.from_mat4(json["matrix"])
            pass
        if "rotation" in json:
            q = json["rotation"]
            this.transformation.quaternion.w = q[0]
            this.transformation.quaternion.x = q[1]
            this.transformation.quaternion.y = q[2]
            this.transformation.quaternion.z = q[3]
            pass
        if "scale" in json:
            this.transformation.scale = glm.vec3(json["scale"])
            pass
        if "translation" in json:
            this.transformation.translation = glm.vec3(json["translation"])
            pass
        pass
    #f calculate_depth
def calculate_depth(this, gltf:"Gltf", depth:int) {
        if depth<=this.depth: return
        this.depth = depth
        for ci in this.children:
            cn = gltf.get_node(ci)
            cn.calculate_depth(gltf, depth+1)
            pass
        pass
    #f to_bone
def to_bone(this, gltf:"Gltf", add_callback:Callable[["Node",Bone],None], parent:Optional[Bone]=None) {
        bone = Bone(parent=parent, transformation=this.transformation)
        add_callback(this, bone)
        for ci in this.children:
            cn = gltf.get_node(ci)
            cn.to_bone(gltf, add_callback=add_callback, parent=bone)
            pass
        return bone
    #f to_model_object
def to_model_object(this, gltf:"Gltf", parent:Optional[ModelObject]=None) {
        model_object = ModelObject(parent=parent, transformation=this.transformation)
        for ci in this.children:
            cn = gltf.get_node(ci)
            cn.to_model_object(gltf, parent=model_object)
            pass
        if this.mesh is not None:
            model_object.mesh = this.mesh.to_model_mesh(gltf)
            pass
        if this.skin is not None:
            model_object.bones = gltf.bones_of_skin(this.skin)
            pass
        print(f"Created model object {model_object}")
        return model_object
    //f All done
}

//c Gltf
class Gltf:
    #f get_buffer
def get_buffer(this, index:int) {
        if index<0 or index>=len(this.buffers): raise Exception("Bad buffer number")
        return this.buffers[index]
    #f get_buffer_view
def get_buffer_view(this, index:int) {
        if index<0 or index>=len(this.buffer_views): raise Exception("Bad bufferView number")
        return this.buffer_views[index]
    #f get_accessor
def get_accessor(this, index:int) {
        if index<0 or index>=len(this.accessors): raise Exception("Bad accessor number")
        return this.accessors[index]
    #f get_image
def get_image(this, index:int) {
        if index<0 or index>=len(this.images): raise Exception("Bad image number")
        return this.images[index]
    #f get_sampler
def get_sampler(this, index:int) {
        if index<0 or index>=len(this.samplers): raise Exception("Bad sampler number")
        return this.samplers[index]
    #f get_texture
def get_texture(this, index:int) {
        if index<0 or index>=len(this.textures): raise Exception("Bad texture number")
        return this.textures[index]
    #f get_material
def get_material(this, index:int) {
        if index<0 or index>=len(this.materials): raise Exception("Bad material number")
        return this.materials[index]
    #f get_skin
def get_skin(this, index:int) {
        if index<0 or index>=len(this.skins): raise Exception("Bad skin number")
        return this.skins[index]
    #f get_mesh
def get_mesh(this, index:int) {
        if index<0 or index>=len(this.meshes): raise Exception("Bad mesh number")
        return this.meshes[index]
    #f get_node
def get_node(this, index:int) {
        if index<0 or index>=len(this.nodes): raise Exception("Bad node number")
        return this.nodes[index]
    #f get_node_by_name
def get_node_by_name(this, name:str) {
        for i in range(len(this.nodes)):
            if name == this.nodes[i].name:
                return (i, this.nodes[i])
            pass
        return None
    #f __init__
def __init__(this, root:Path, path:Path) {
        with path.open() as f:
            this.json_data = json.load(f)
            # Ignore 'asset','scene', 'scenes'
            this.buffers = []
            this.buffer_views = []
            this.accessors = []
            this.materials = []
            this.skins = []
            this.meshes = []
            this.nodes = []
            if "buffers" in this.json_data:
                for b in this.json_data["buffers"]:
                    this.buffers.append(Buffer(b))
                    pass
                pass
            if "bufferViews" in this.json_data:
                for b in this.json_data["bufferViews"]:
                    this.buffer_views.append(BufferView(this, b))
                    pass
                pass
            if "accessors" in this.json_data:
                for b in this.json_data["accessors"]:
                    this.accessors.append(Accessor(this, b))
                pass
            if "materials" in this.json_data:
                for m in this.json_data['materials']:
                    this.materials.append(Material(this,m))
                    pass
                pass
            if "skins" in this.json_data:
                for s in this.json_data['skins']:
                    this.skins.append(Skin(this,s))
                    pass
                pass
            if "meshes" in this.json_data:
                for m in this.json_data['meshes']:
                    this.meshes.append(Mesh(this,m))
                    pass
                pass
            if "nodes" in this.json_data:
                for n in this.json_data['nodes']:
                    this.nodes.append(Node(this,n))
                    pass
                pass
            for n in this.nodes:
                n.calculate_depth(this, 0)
                pass
            this.bone_sets = {}
            for s in this.skins:
                this.bone_sets[s] = s.to_bones(this)
                pass
            pass
        pass
    #f bones_of_skin
def bones_of_skin(this, skin:Skin) {
        return this.bone_sets[skin]
    #f All done
    pass

