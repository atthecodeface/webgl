var errors = 0;
var asserts = 0;
function assert(a,...args) {
    asserts++;
    if (!a) {
        errors++;
        console.log("ASSERTION FAILED: ",...args);
    }
}
function assert_id(a,b,...args) {
    assert(a===b,a,b,...args);
}
function assert_eq(a,b,...args) {
    assert(a==b,a,b,...args);
}
function assert_vec_eq(a,b,...args) {
    const d = vec3.subtract(vec3.create(),a,b);
    assert (vec3.length(d)<1E-4, a,b,...args);
}
function assert_mat4_eq(a,b,...args) {
    const c = mat4.subtract(mat4.create(),a,b);
    const d = Math.abs(mat4.determinant(c));
    assert (d<1E-4, a,b,...args);
}
function assert_trans_eq(t,scale,trans,quat,msg) {
    const t2 = new Transformation(translation=trans,quaternion=quat,scale=scale);
    assert(t.distance(t2)<1E-5,msg,"transform not equal enough : actual, expected :", t, t2);
}

function test_trans_mat() {
    const a = new TransMat();
    const b = mat4.create();
    assert_mat4_eq(a.mat4(),b,"Trans mat of none");
    const c = a.mat_after(a);
    assert_mat4_eq(c.mat4(),b,"Trans mat of identity squared");
    
}

function test_transformation() {
    const a = new Transformation();
    const b = new Transformation();
    b.copy(a);
    const c = new Transformation(translation=vec3.set(vec3.create(),1.,2.,3.),
                                 quaternion=b.quaternion,
                                 scale=b.scale);
    const d = new Transformation();

    const q = quat.create();
    assert_trans_eq(a,[1.,1.,1.],[0.,0.,0.],q,"a");
    assert_trans_eq(b,[1.,1.,1.],[0.,0.,0.],q,"b");
    assert_trans_eq(c,[1.,1.,1.],[1.,2.,3.],q,"c");
    d.set(a,c);
    assert_trans_eq(d,[1.,1.,1.],[1.,2.,3.],q,"d");
    d.set(d,c);
    assert_trans_eq(d,[1.,1.,1.],[2.,4.,6.],q,"d2");

    const ma = new Transformation(translation=vec3.fromValues(4.,5.,6.),
                                  quaternion=quat.setAxisAngle(quat.create(),vec3.fromValues(1.,0.,0.),0.1),
                                  scale=vec3.fromValues(7.,8.,9.));
    const mb = new Transformation();
    mb.from_mat4(ma.mat4());
    assert(mb.distance(ma)<1E-5, "transformation to and from mat4")
}

function test_bone() {
    const a = new Bone();
    const b = new Bone(a);
    const bs = new BoneSet();
    bs.add_bone_hierarchy(a);
    bs.derive_matrices();
    bs.rewrite_indices();
    const bps=  new BonePoseSet(bs);
    const q = quat.create();

    assert_id(a,b.parent,"b parent");
    assert_id(a,bs.bones[0],"bone set 0");
    assert_id(b,bs.bones[1],"bone set 1");
    assert_eq(bs.roots[0],0,"bone set 0 root is 0");

    // console.log(bps.str());
    assert_trans_eq(a.transformation,[1.,1.,1],[0.,0.,0.],q,"bone a trans");

    bps.poses[0].transform(new Transformation([1.,2.,3.],q,[3.,-1.,-2.]));
    assert_trans_eq(bps.poses[0].transformation,[3.,-1.,-2],[1.,2.,3.],q,"posed bone a trans");

    bps.poses[0].transform(new Transformation([1.,2.,3.],undefined,[3.,-1.,-2.]));
    assert_trans_eq(bps.poses[0].transformation,[9.,1.,4],[2.,4.,6.],q,"posed bone a trans");
    
    assert_trans_eq(a.transformation,[1.,1.,1],[0.,0.,0.],q,"bone a trans rest");
    a.derive_matrices();

    a.set_transformation(bps.poses[0].transformation);
    assert_trans_eq(bps.poses[0].transformation,[9.,1.,4],[2.,4.,6.],q,"bone a trans after at rest");
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],q,"bone a trans rest after at rest");

    a.set_transformation(new Transformation([-1.,-2.,-3.],undefined,[1./3.,-1.,-1./2.]));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],q,"bone a trans again");

    a.set_transformation(new Transformation(undefined,undefined,undefined));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],q,"bone a trans again v2");
    
    bps.poses[0].transform(new Transformation(undefined,undefined,undefined));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],q,"bone a trans again v3");
}

function test_hierarchy() {
    a = new Hierarchy();
    a.add("fred");
    a.push();
    a.add("joe");
    a.pop();
    a_str = a.str();
    assert(a_str=="fred\n  joe\n","Blah");
}

function read_file(file) {
    return new Promise(
        (resolve,reject) => {
            var reader = new FileReader();
            reader.onload = (x) => resolve(reader.result);
            // reader.readAsArrayBuffer(file); // or readAsText or readAsDataURL
            reader.readAsText(file); // or readAsText or readAsDataURL
        }
    );
}
function get_file(file) {
    return new Promise(
        (resolve,reject) => {
            console.log("Starting to get file "+file);
            var req = new XMLHttpRequest();
            req.open("GET", file, true);
            // req.responseType = "arraybuffer";
            req.responseType = "text";
            req.onload = (x) => resolve(req.response);
            req.send();
            console.log(req);
            // reader.readAsArrayBuffer(file); // or readAsText or readAsDataURL
            // reader.readAsText(file); // or readAsText or readAsDataURL
        }
    );
}

async function demo_read() {
    console.log('Kicking of initialization...');
    try {
        get_milo = get_file("milo.gltf");
        console.log(get_milo); 
        const data = await get_milo;
        console.log("get complete"); 
        // console.log(data);
  } catch(e) {
    console.error(e); // 30
  }
    console.log('Done');
}

function main() {
    demo_read();
    console.log("Keep going...");
    test_hierarchy();
    test_trans_mat();
    test_transformation();
    test_bone();
    console.log("Hit ",asserts," assertions");
    if (errors>0) {
        console.log("FAILED WITH",errors," errors");
        error;
    } else {
        console.log("PASSED");
    }
}
main();
