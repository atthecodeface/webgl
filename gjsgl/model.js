//a Classes
//c ModelMaterial
class ModelMaterial {
    //f gl_program_configure ?
    gl_program_configure(program) {
        //# GL.glActiveTexture(GL.GL_TEXTURE0)
        //# GL.glBindTexture(GL.GL_TEXTURE_2D, texture.texture)
        //# shader.set_uniform_if("uTexture",    lambda u:GL.glUniform1i(u, 0))
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
        if (byte_length===undefined) {byte_length=data.length;}
        this.data = data;
        this.byte_length = byte_length;
        this.byte_offset = byte_offset;
        this.gl_buffer = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.gl_buffer===undefined) {
            this.gl_buffer = GL.createBuffer();
            GL.bindBuffer(GL.GL_ARRAY_BUFFER, this.gl_buffer);
            GL.bufferData(GL.GL_ARRAY_BUFFER, this.data.slice(this.byte_offset,self.byte_offset+self.byte_length), GL.GL_STATIC_DRAW);
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
        if (byte_length===undefined) {byte_length=data.length;}
        this.data = data;
        this.byte_length = byte_length;
        this.byte_offset = byte_offset;
        this.gl_buffer = undefined;
    }
    //f gl_create
    gl_create() {
        if (this.gl_buffer===undefined) {
            this.gl_buffer = GL.createBuffer();
            GL.bindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, this.gl_buffer)
            GL.bufferData(GL.GL_ELEMENT_ARRAY_BUFFER, this.data.slice(this.byte_offset, this.byte_offset+this.byte_length), GL.GL_STATIC_DRAW)
            // print(f"Bound {this.gl_buffer}")
            // print(f"Data {this.data[this.byte_offset:this.byte_offset+this.byte_length]}");
        }
    }
    //f gl_buffer
    gl_bind_program(shader) {
        GL.bindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, this.gl_buffer);
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("Indices "+this.byte_offset+" "+this.byte_length);
        return hier;
    }
    //f str
    str() {return str(this.hier_debug(Hierarchy()));}
    //f All done
}
    
//c ModelBufferView - for use in a vertex attribute pointer
class ModelBufferView {
    //f constructor
    constructor(data, count, gl_type, offset, stride) {
        if (stride===undefined) {stride=0;}
        this.data = data
        this.count = count
        this.gl_type = gl_type
        this.offset = offset
        this.stride = stride
    }
    //f gl_create
    gl_create() {
        this.data.gl_create();
    }
    //f gl_bind_program
    gl_bind_program(shader, attr) {
        a = shader.get_attr(attr)
        if (a !== undefined) {
            GL.bindBuffer(GL.GL_ARRAY_BUFFER, this.data.gl_buffer);
            GL.enableVertexAttribArray(a);
            // print(f"VAO {a} of {this.count} of {this.gl_type} {this.stride} {this.offset}")
            GL.vertexAttribPointer(a, this.count, this.gl_type, False, this.stride, ctypes.c_void_p(this.offset));
        }
    }
    //f hier_debug
    hier_debug(hier, use) {
        hier.add("BufferView "+use+" "+this.gl_type+" "+this.count+" "+this.offset+" "+this.stride)
        return hier;
    }
    //f str
    str() {return str(this.hier_debug(Hierarchy()));}
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
        this.normal     = undefined;
        this.tex_coords = undefined;
        this.joints     = undefined;
        this.weights    = undefined;
        this.tangent    = undefined;
        this.color      = undefined;
    }
    //f gl_create
    gl_create() {
        this.gl_vao = GL.glGenVertexArrays(1);
        GL.bindVertexArray(this.gl_vao);
        this.indices.gl_create()
        for (san in this.attribute_mapping) {
            an = this.attribute_mapping[san];
            mbv = this[an];
            if (mbv!==undefined) { mbv.gl_create(); }
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        GL.bindVertexArray(this.gl_vao);
        this.indices.gl_bind_program(shader_class);
        for (san in this.attribute_mapping) {
            an = this.attribute_mapping[san];
            mbv = this[an];
            if (mbv!==undefined) {
                mbv.gl_bind_program(shader_class, san);
            } else {
                sa = shader.get_attr(san);
                if ((sa !== undefined) && (sa>=0)) {
                    GL.disableVertexAttribArray(sa);
                }
            }
        }
    }
    //f hier_debug
    hier_debug(hier) {
        this.indices.hier_debug(hier);
        for (san in this.attribute_mapping) {
            an = this.attribute_mapping[san];
            mbv = this[an];
            if (mbv !== undefined) { mbv.hier_debug(hier, an); }
        }
        return hier;
    }
    //f str
    str() {return str(this.hier_debug(Hierarchy()));}
    //f All done
}

//c ModelPrimitive
class ModelPrimitive {
    constructor() {
    }
    gl_create() {
        this.view.gl_create();
    }
    gl_bind_program(shader_class) {
        this.view.gl_bind_program(shader_class);
    }
    gl_draw(shader_program) {
        GL.bindVertexArray(this.view.gl_vao);
        this.material.gl_program_configure(shader_program);
        GL.drawElements(this.gl_type, this.indices_count, this.indices_gl_type, ctypes.c_void_p(this.indices_offset));
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
    str() {return str(this.hier_debug(Hierarchy()));}
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
        for (p of this.primitives) {
            p.gl_bind_program(shader_class);
        }
    }
    //f gl_draw
    gl_draw(shader_program) {
        for (p of this.primitives) {
            p.gl_draw(shader_program);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelMesh");
        hier.push();
        for (p of this.primitives) {
            p.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return str(this.hier_debug(Hierarchy()));}
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
        for (c of this.children) {
            for (x of c.iter_objects(trans_mat)) {
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
    str() {return str(this.hier_debug(Hierarchy()));}
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
        for (o of this.root_object.iter_objects(TransMat())) {
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
    str() {return str(this.hier_debug(Hierarchy()));}
    //f All done
}

//c ModelInstance
class ModelInstance {
    //f constructor
    constructor(model_class) {
        this.bone_set_poses = [];
        this.meshes = [];
        bone_set_dict = {};
        for ([trans_mat,model] of model_class.iter_objects()) {
            if (!model.has_mesh()) {continue;}
            mesh_instance = model.get_mesh();
            bone_set_index = -1;
            if (model.has_bones()) {
                bone_set = model.get_bones(); // get bone set
                if (bone_set_dict[bone_set]===undefined) {
                    bone_set_dict[bone_set] = len(this.bone_set_poses);
                    pose = BonePoseSet(bone_set);
                    this.bone_set_poses.append(pose);
                }
                bone_set_index = bone_set_dict[bone_set];
            }
            this.meshes.append( [trans_mat, mesh_instance, bone_set_index] );
        }
    }
    //f gl_create
    gl_create() {
        for ([t,m,b] of this.meshes) {
            m.gl_create();
        }
    }
    //f gl_bind_program
    gl_bind_program(shader_class) {
        for ([t,m,b] of this.meshes) {
            m.gl_bind_program(shader_class);
        }
    }
    //f gl_draw
    gl_draw(shader_program, tick) {
        mat = mat4.create();
        GL.uniformMatrix4fv(shader_program.uniforms["uModelMatrix"], 1, False, mat);
        for (bone_set_pose of this.bone_set_poses) {
            bone_set_pose.update(tick);
        }
        for ([t,m,b] of this.meshes) {
            if (b>=0) {
                bma = this.bone_set_poses[b]
                shader_program.set_uniform_if("uBonesMatrices",
                                              (u) => GL.glUniformMatrix4fv(u, bma.max_index, False, bma.data))
            }
            // Provide mesh matrix and material uniforms
            shader_program.set_uniform_if("uMeshMatrix",
                                          (u) => GL.glUniformMatrix4fv(u, 1, False, glm.value_ptr(t.mat4())) )
            shader_program.set_uniform_if("uBonesScale",
                                          (u) => GL.glUniform1f(u, 1.0) )
            m.gl_draw(program);
        }
    }
    //f hier_debug
    hier_debug(hier) {
        hier.add("ModelInstance with "+this.bone_set_poses.length+" poses");
        hier.push();
        for (i in this.bone_set_poses) {
            hier.add("Pose/Matrix "+i);
            this.bone_set_poses[i].hier_debug(hier);
        }
        for ([t,m,b] of this.meshes) {
            hier.add("Mesh transform "+t+" pose/matrix "+b);
            m.hier_debug(hier);
        }
        hier.pop();
        return hier;
    }
    //f str
    str() {return str(this.hier_debug(Hierarchy()));}
    //f All done
}