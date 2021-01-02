var errors = 0;
var asserts = 0;
function assert(a,...args) {
    asserts++;
    if (!a) {
        errors++;
        console.log("ASSERTION FAILED: ",...args);
    }
}
function assert_eq(a,b,...args) {
    assert(a==b,...args);
}
function assert_vec_eq(a,b,...args) {
    assert ((a[0]==b[0]) && (a[1]==b[1]) && (a[2]!=b[2]), a,b,...args);
}
function assert_trans_eq(t,scale,trans,quat,msg) {
    const t2 = new Transformation(translation=trans,quaternion=quat,scale=scale);
    assert(t.distance(t2)<1E-5,msg,"transform not equal enough : actual, expected :", t, t2);
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
    const q = quat.create();
    assert_eq(a,b.parent,"b parent");
    assert_trans_eq(a.transformation,[1.,1.,1],[0.,0.,0.],q,"bone a trans");
    a.transform(new Transformation([1.,2.,3.],q,[3.,-1.,-2.]));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],q,"bone a trans");
    a.transform(new Transformation([1.,2.,3.],undefined,[3.,-1.,-2.]));
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],q,"bone a trans");
    assert_trans_eq(a.transformation_rest,[1.,1.,1],[0.,0.,0.],q,"bone a trans rest");
    a.derive_at_rest();
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],q,"bone a trans after at rest");
    assert_trans_eq(a.transformation_rest,[9.,1.,4],[2.,4.,6.],q,"bone a trans rest after at rest");
    a.transform(new Transformation([-1.,-2.,-3.],undefined,[1./3.,-1.,-1./2.]));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],q,"bone a trans again");
    a.transform(new Transformation(undefined,undefined,undefined));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],q,"bone a trans again v2");
    a.transform_from_rest(new Transformation(undefined,undefined,undefined));
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],q,"bone a trans again v3");
}

function main() {
    test_transformation();
    test_bone();
    console.log("Hit ",asserts," assertions");
    if (errors>0) {
        console.log("FAILED WITH",errors," errors");
        error;
    }
}
main();
