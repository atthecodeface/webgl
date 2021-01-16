//a Classes
//c ModelMaterial
class ModelMaterial {
    constructor() {
        this.color      = [1.,1.,1.,1.];
        this.metallic  = 1.;
        this.roughness = 1.;
        this.base_texture      = undefined;
        this.mr_texture        = undefined;
        this.normal_texture    = undefined;
        this.occlusion_texture = undefined;
        this.emission_texture  = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.base_texture!==undefined)      {this.base_texture.gl_create();}
        if (this.mr_texture!==undefined)        {this.mr_texture.gl_create();}
        if (this.normal_texture!==undefined)    {this.normal_texture.gl_create();}
        if (this.occlusion_texture!==undefined) {this.occlusion_texture.gl_create();}
        if (this.emission_texture!==undefined)  {this.emission_texture.gl_create();}
    }
    //f gl_program_configure
    gl_program_configure(program) {
        if (this.base_texture!==undefined) {
            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, this.base_texture.texture);
            program.set_uniform_if("uMaterial.base_texture", (u) => GL.uniform1i(u, 0) );
        }
        program.set_uniform_if("uMaterial.base_color",   (u) => GL.uniform4fv(u, this.color) );
    }
    //f str
    str() {
           return "Material";
          }
    //f All done
}

//c ModelBufferData
class ModelBufferData {
    //f constructor
    constructor(data, byte_offset, byte_length) {
        if (byte_length===undefined) {byte_length=data.byteLength;}
        this.data = data;
        this.byte_length = byte_length;
        this.byte_offset = byte_offset;
        this.gl_buffer = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.gl_buffer===undefined) {
            this.gl_buffer = GL.createBuffer();
            GL.bindBuffer(GL.ARRAY_BUFFER, this.gl_buffer);
            GL.bufferData(GL.ARRAY_BUFFER, this.data.slice(this.byte_offset,this.byte_offset+this.byte_length), GL.STATIC_DRAW);
        }
    }
    //f str
    str() {
        return "ModelBufferData "+this.byte_offset+" "+this.byte_length;
    }
    //f All done
}
    
//c ModelBufferIndices
class ModelBufferIndices {
    //f constructor
    constructor(data, byte_offset, byte_length) {
        if (byte_length===undefined) {byte_length=data.byteLength;}
        this.data = data;
        this.byte_length = byte_length;
        this.byte_offset = byte_offset;
        this.gl_buffer = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.gl_buffer===undefined) {
            this.gl_buffer = GL.createBuffer();
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.gl_buffer)
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, this.data.slice(this.byte_offset, this.byte_offset+this.byte_length), GL.STATIC_DRAW)
        }
    }
    //f gl_buffer
    gl_bind_program(shader) {
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.gl_buffer);
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Indices "+this.byte_offset+" "+this.byte_length);
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}
    
//c ModelBufferView - for use in a vertex attribute pointer
class ModelBufferView {
    //f constructor
    constructor(data, count, gl_type, offset, stride) {
        if (stride===undefined) {stride=0;}
        this.data = data;
        this.count = count;
        this.gl_type = gl_type;
        this.offset = offset;
        this.stride = stride;
    }
    //f gl_create
    gl_create() {
        this.data.gl_create();
    }
    //f gl_bind_program
    gl_bind_program(shader, attr) {
        const a = shader.get_attr(attr)
        if (a !== undefined) {
            GL.bindBuffer(GL.ARRAY_BUFFER, this.data.gl_buffer);
            GL.enableVertexAttribArray(a);
            GL.vertexAttribPointer(a, this.count, this.gl_type, false, this.stride, this.offset);
        }
    }
    //f hier_debug
    hier_debug(hier, use) {
        hier.add("BufferView "+use+" "+this.gl_type+" "+this.count+" "+this.offset+" "+this.stride)
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelPrimitiveView
class ModelPrimitiveView {
    attribute_mapping = { "vPosition":"position",
                          "vNormal":"normal",
                          "vTexture":"tex_coords",
                          "vJoints":"joints",
                          "vWeights":"weights",
                          "vTangent":"tangent",
                          "vColor":"color",
                          }
    //f constructor
    constructor() {
        this.position   = undefined;
        this.normal     = undefined;
        this.tex_coords = undefined;
        this.joints     = undefined;
        this.weights    = undefined;
        this.tangent    = undefined;
        this.color      = undefined;
    }
    //f gl_create
    gl_create() {
        this.gl_vao = GL.createVertexArray();
        GL.bindVertexArray(this.gl_vao);
        this.indices.gl_create()
        for (const san in this.attribute_mapping) {
            const an = this.attribute_mapping[san];
            const mbv = this[an];
            if (mbv!==undefined) { mbv.gl_create(); }
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        GL.bindVertexArray(this.gl_vao);
        this.indices.gl_bind_program(shader_class);
        for (const san in this.attribute_mapping) {
            const an = this.attribute_mapping[san];
            const mbv = this[an];
            if (mbv!==undefined) {
                mbv.gl_bind_program(shader_class, san);
            } else {
                const sa = shader_class.get_attr(san);
                if ((sa !== undefined) && (sa>=0)) {
                    GL.disableVertexAttribArray(sa);
                }
            }
        }
    }
    //f hier_debug
    hier_debug(hier) {
        this.indices.hier_debug(hier);
        for (const san in this.attribute_mapping) {
            const an = this.attribute_mapping[san];
            const mbv = this[an];
            if (mbv !== undefined) { mbv.hier_debug(hier, an); }
        }
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelPrimitive
class ModelPrimitive {
    constructor() {
    }
    gl_create() {
        this.view.gl_create();
        this.material.gl_create();
    }
    gl_bind_program(shader_class) {
        this.view.gl_bind_program(shader_class);
    }
    gl_draw(shader_program) {
        GL.bindVertexArray(this.view.gl_vao);
        this.material.gl_program_configure(shader_program);
        GL.drawElements(this.gl_type, this.indices_count, this.indices_gl_type, this.indices_offset);
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Primitive '"+this.name+"' "+this.gl_type+" "+this.indices_gl_type+" "+this.indices_count+" "+this.indices_offset);
        hier.push();
        this.view.hier_debug(hier);
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelMesh
class ModelMesh {
    //f constructor
    constructor() {
        this.primitives = [];
    }
    //f gl_create
    gl_create() {
        for (var p of this.primitives) {
            p.gl_create();
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        for (const p of this.primitives) {
            p.gl_bind_program(shader_class);
        }
    }
    //f gl_draw
    gl_draw(shader_program) {
        for (const p of this.primitives) {
            p.gl_draw(shader_program);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelMesh");
        hier.push();
        for (const p of this.primitives) {
            p.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelObject
class ModelObject {
    //f constructor
    constructor(parent, transformation) {
        this.transformation = transformation;
        this.parent = parent;
        this.children = [];
        if (this.parent !== undefined) {
            this.parent.children.push(this);
        }
        this.mesh  = undefined;
        this.bones = undefined;
    }
    //f iter_objects
    iter_objects = function*(trans_mat) {
        if (this.transformation !== undefined) {
            trans_mat = this.transformation.trans_mat_after(trans_mat);
        }
        yield([trans_mat, this]);
        for (const c of this.children) {
            for (const x of c.iter_objects(trans_mat)) {
                yield(x);
            }
        }
    }
    //f has_mesh
    has_mesh() { return this.mesh!==undefined; }
    //f get_mesh
    get_mesh() { return this.mesh; }
    //f has_bones
    has_bones() { return this.bones!==undefined; }
    //f get_bones
    get_bones() { return this.bones; }
    //f gl_create
    gl_create() {
        if (this.mesh!==undefined) { this.mesh.gl_create(); }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        if (this.mesh!==undefined) { this.mesh.gl_bind_program(shader_class); }
    }
    //f gl_draw
    gl_draw(shader_program) {
        if (this.mesh!==undefined) { this.mesh.gl_draw(shader_program); }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelObject");
        hier.push();
        hier.add("Transformation "+this.transformation);
        if (this.mesh!==undefined)  { this.mesh.hier_debug(hier); }
        if (this.bones!==undefined) { this.bones.hier_debug(hier); }
        for (c of this.children) {
            c.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelClass
class ModelClass {
    //f constructor
    constructor(name, root_object) {
        this.name = name;
        if (root_object!==undefined) {this.root_object = root_object;}
        this.bones = [];
    }
    //f iter_objects
    iter_objects = function*() {
        for (const o of this.root_object.iter_objects(new TransMat())) {
            yield(o);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelClass '"+this.name+"'");
        hier.push();
        this.root_object.hier_debug(hier);
        for (bone of this.bones) {
            bone.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}

//c ModelInstance
class ModelInstance {
    //f constructor
    constructor(model_class) {
        this.bone_set_poses = [];
        this.meshes = [];
        const bone_set_dict = new Map();
        for (const [trans_mat,model] of model_class.iter_objects()) {
            if (!model.has_mesh()) {continue;}
            const mesh_instance = model.get_mesh();
            var bone_set_index = -1;
            if (model.has_bones()) {
                const bone_set = model.get_bones(); // get bone set
                if (bone_set_dict.get(bone_set)===undefined) {
                    bone_set_dict.set(bone_set,this.bone_set_poses.length);
                    const pose = new BonePoseSet(bone_set);
                    this.bone_set_poses.push(pose);
                }
                bone_set_index = bone_set_dict.get(bone_set);
            }
            this.meshes.push( [trans_mat, mesh_instance, bone_set_index] );
        }
    }
    //f gl_create
    gl_create() {
        for (const [t,m,b] of this.meshes) {
            m.gl_create();
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        for (const [t,m,b] of this.meshes) {
            m.gl_bind_program(shader_class);
        }
    }
    //f gl_draw
    gl_draw(shader_program, tick) {
        const mat = mat4.create();
        GL.uniformMatrix4fv(shader_program.uniforms["uModelMatrix"], false, mat);
        for (const bone_set_pose of this.bone_set_poses) {
            bone_set_pose.update(tick);
        }
        for (const [t,m,b] of this.meshes) {
            if (b>=0) {
                const bma = this.bone_set_poses[b];
                shader_program.set_uniform_if("uBonesMatrices",
                                              (u) => GL.uniformMatrix4fv(u, false, bma.data.subarray(0,bma.max_index*16)));
                shader_program.set_uniform_if("uBonesScale", (u) => GL.uniform1f(u, 1.0) )
            } else {
                shader_program.set_uniform_if("uBonesScale", (u) => GL.uniform1f(u, 0.0) )
            }
            // Provide mesh matrix and material uniforms
            shader_program.set_uniform_if("uMeshMatrix",
                                          (u) => GL.uniformMatrix4fv(u, false, mat)); //t.mat4()) )
            m.gl_draw(shader_program);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelInstance with "+this.bone_set_poses.length+" poses");
        hier.push();
        for (const i in this.bone_set_poses) {
            hier.add("Pose/Matrix "+i);
            this.bone_set_poses[i].hier_debug(hier);
        }
        for (const [t,m,b] of this.meshes) {
            hier.add("Mesh transform "+t+" pose/matrix "+b);
            m.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return this.hier_debug(new Hierarchy()).str();}
    //f All done
}
