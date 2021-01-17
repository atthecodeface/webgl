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
function assert_close(a,b,...args) {
    assert(Math.abs(a-b)<1E-4,a,b,...args);
}
function assert_vec2_eq(a,b,...args) {
    const d = Glm.vec2.subtract(Glm.vec2.create(),a,b);
    assert (Glm.vec2.length(d)<1E-4, a,b,...args);
}
function assert_vec3_eq(a,b,...args) {
    const d = Glm.vec3.subtract(Glm.vec3.create(),a,b);
    assert (Glm.vec3.length(d)<1E-4, a,b,...args);
}
function assert_mat2_eq(a,b,...args) {
    const c = Glm.mat2.subtract(Glm.mat2.create(),a,b);
    const d = Math.abs(Glm.mat2.determinant(c));
    assert (d<1E-4, a,b,...args);
}
function assert_mat3_eq(a,b,...args) {
    const c = Glm.mat3.subtract(Glm.mat3.create(),a,b);
    const d = Math.abs(Glm.mat3.determinant(c));
    assert (d<1E-4, a,b,...args);
}
function assert_mat4_eq(a,b,...args) {
    const c = Glm.mat4.subtract(Glm.mat4.create(),a,b);
    const d = Math.abs(Glm.mat4.determinant(c));
    assert (d<1E-4, a,b,...args);
}
function assert_trans_eq(t,scale,trans,quat,msg) {
    const t2 = new Transformation(translation=trans,quaternion=quat,scale=scale);
    assert(t.distance(t2)<1E-5,msg,"transform not equal enough : actual, expected :", t, t2);
}

function test_trans_mat() {
    const a = new TransMat();
    const b = Glm.mat4.create();
    assert_mat4_eq(a.mat4(),b,"Trans mat of none");
    const c = a.mat_after(a);
    assert_mat4_eq(c.mat4(),b,"Trans mat of identity squared");
    
}

function test_transformation() {
    const a = new Transformation();
    const b = new Transformation();
    b.copy(a);
    const c = new Transformation(translation=Glm.vec3.set(Glm.vec3.create(),1.,2.,3.),
                                 quaternion=b.quaternion,
                                 scale=b.scale);
    const d = new Transformation();

    const q = Glm.quat.create();
    assert_trans_eq(a,[1.,1.,1.],[0.,0.,0.],q,"a");
    assert_trans_eq(b,[1.,1.,1.],[0.,0.,0.],q,"b");
    assert_trans_eq(c,[1.,1.,1.],[1.,2.,3.],q,"c");
    d.set(a,c);
    assert_trans_eq(d,[1.,1.,1.],[1.,2.,3.],q,"d");
    d.set(d,c);
    assert_trans_eq(d,[1.,1.,1.],[2.,4.,6.],q,"d2");

    const ma = new Transformation(translation=Glm.vec3.fromValues(4.,5.,6.),
                                  quaternion=Glm.quat.setAxisAngle(Glm.quat.create(),Glm.vec3.fromValues(1.,0.,0.),0.1),
                                  scale=Glm.vec3.fromValues(7.,8.,9.));
    console.log(ma);
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
    const q = Glm.quat.create();
    console.log(q);

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

function test_vector() {
    const sqrt2 = Math.sqrt(2.);
    const x = Glm.vec2.fromValues(1.,0.);
    const y = Glm.vec2.fromValues(0.,1.);
    const z = Glm.vec2.create();
    const xy = Glm.vec2.add(Glm.vec2.create(),x,y);
    const t = Glm.vec2.create();

    assert_eq(x[0],y[1],"Vec 2 ones match");
    assert_eq(x[1],y[0],"Vec 2 zeros match");
    assert_eq(xy[0],1.,"XY match");
    assert_eq(xy[1],1.,"XY match");
    Glm.vec2.normalize(x,x);
    Glm.vec2.normalize(y,y);
    Glm.vec2.normalize(z,z);
    assert_eq(x[0],1.+x[1],"XY match");
    assert_eq(y[1],1.+y[0],"XY match");
    assert_eq(z[0],z[1],"Z match");
    Glm.vec2.add(x,x,z);
    assert_eq(x[0],1.+x[1],"X+Z match");
    Glm.vec2.add(x,z,x);
    assert_eq(x[0],1.+x[1],"Z+X match");
    assert_eq(Glm.vec2.length(x),1.,"X length");
    assert_eq(Glm.vec2.length(z),0.,"Z length");

    Glm.vec2.add(x,x,x);
    assert_eq(Glm.vec2.length(x),2.,"2X length");
    Glm.vec2.normalize(x,x);
    assert_eq(Glm.vec2.length(x),1.,"X length");
    assert_eq(Glm.vec2.length(xy),sqrt2,"XY length");
    Glm.vec2.add(t,x,y);
    assert_eq(Glm.vec2.length(t),sqrt2,"X+Y length");
    Glm.vec2.normalize(t,t);
    assert_close(Glm.vec2.length(t),1,"Norm(X+Y) length");

    Glm.vec2.add(t,xy,xy);
    assert_close(Glm.vec2.length(t),2*sqrt2,"2*XY length");
    
    Glm.vec2.scaleAndAdd(t,z,xy,sqrt2);
    assert_close(Glm.vec2.length(t),2,"Sqrt(2)*XY length");

    Glm.vec2.scaleAndAdd(t,xy,z,sqrt2);
    assert_close(Glm.vec2.length(t),sqrt2,"XY length");
    
    Glm.vec2.copy(t,x);
    assert_close(Glm.vec2.length(t),1,"XY length");
    
    Glm.vec2.subtract(t,x,x);
    assert_close(Glm.vec2.length(t),0,"X-X length");
    Glm.vec2.subtract(t,y,y);
    assert_close(Glm.vec2.length(t),0,"Y-Y length");
    Glm.vec2.subtract(t,xy,y);
    assert_close(Glm.vec2.length(t),1,"XY-Y length");

    assert_eq(Glm.vec2.dot(x,y),0,"X dot Y");
    assert_eq(Glm.vec2.dot(y,x),0,"Y dot X");
    assert_eq(Glm.vec2.dot(x,z),0,"X dot Z");
    assert_eq(Glm.vec2.dot(y,z),0,"Y dot Z");
    assert_eq(Glm.vec2.dot(xy,x),1,"XY dot X");
    assert_eq(Glm.vec2.dot(xy,y),1,"XY dot Y");

}

function test_matrix2() {
    const sqrt2 = Math.sqrt(2.);
    const i   = Glm.mat2.create();
    const rp90 = Glm.mat2.set(Glm.mat2.create(),0.,1.,-1.,0.);
    const rm90 = Glm.mat2.set(Glm.mat2.create(),0.,-1.,1.,0.);
    const tm = Glm.mat2.create();
    const tm2 = Glm.mat2.create();
    const x = Glm.vec2.fromValues(1.,0.);
    const y = Glm.vec2.fromValues(0.,1.);
    const xy = Glm.vec2.add(Glm.vec2.create(),x,y);
    const tv = Glm.vec2.create();
    assert_eq(Glm.mat2.determinant(i),1,"Determinant identity");
    Glm.mat2.add(tm,rp90,rm90);
    assert_eq(Glm.mat2.determinant(tm),0,"Determinant sum rotate and back");
    Glm.mat2.multiply(tm,rp90,rm90);
    assert_eq(Glm.mat2.determinant(tm),1,"Determinant rotate and back");
    assert_mat2_eq(tm,i,"rotate and back is identity");

    Glm.vec2.transformMat2(tv,x,rp90);
    assert_vec2_eq(tv,y,"Rotated 90 x is y");
    Glm.vec2.transformMat2(tv,y,rm90);
    assert_vec2_eq(tv,x,"Rotated -90 y is x");

    Glm.mat2.multiply(tm,rp90,rp90);
    assert_eq(Glm.mat2.determinant(tm),1,"Determinant rotate 180");
    Glm.mat2.multiply(tm,tm,tm);
    assert_mat2_eq(tm,i,"rotate 4 times is identity");

    Glm.mat2.invert(tm,rp90);
    assert_mat2_eq(tm,rm90,"rotate inverse is its inverse");

    Glm.mat2.set(tm,1.,3.,5.,-100.);
    Glm.mat2.invert(tm2,tm);
    Glm.mat2.multiply(tm2,tm,tm2);
    assert_mat2_eq(tm2,i,"matrix times inverse is identity");

    Glm.mat2.set(tm,0.,36,12.,-1.);
    Glm.mat2.invert(tm2,tm);
    Glm.mat2.multiply(tm2,tm,tm2);
    assert_mat2_eq(tm2,i,"matrix times inverse is identity");
    
}

function test_matrix3() {
    const sqrt2 = Math.sqrt(2.);
    const i   = Glm.mat3.create();
    const rxp90 = Glm.mat3.set(Glm.mat3.create(),1.,0.,0., 0.,0.,1.,  0.,-1.,0.);
    const rxm90 = Glm.mat3.set(Glm.mat3.create(),1.,0.,0., 0.,0.,-1., 0.,1.,0.);
    const tm = Glm.mat3.create();
    const tm2 = Glm.mat3.create();
    const x = Glm.vec3.fromValues(1., 0, 0.);
    const y = Glm.vec3.fromValues(0., 1, 0.);
    const z = Glm.vec3.fromValues(0., 0, 1.);
    const xy = Glm.vec3.add(Glm.vec3.create(),x,y);
    const tv = Glm.vec3.create();
    
    assert_eq(Glm.mat3.determinant(i),1,"Determinant identity");
    Glm.mat3.add(tm,rxp90,rxm90);
    assert_eq(Glm.mat3.determinant(tm),0,"Determinant sum rotate and back");
    Glm.mat3.multiply(tm,rxp90,rxm90);
    assert_eq(Glm.mat3.determinant(tm),1,"Determinant rotate and back");
    assert_mat3_eq(tm,i,"rotate and back is identity");

    Glm.vec3.transformMat3(tv,y,rxp90);
    assert_vec3_eq(tv,z,"Rotated 90 y is z");
    Glm.vec3.transformMat3(tv,z,rxm90);
    assert_vec3_eq(tv,y,"Rotated -90 z is y");

    Glm.mat3.multiply(tm,rxp90,rxp90);
    assert_eq(Glm.mat3.determinant(tm),1,"Determinant rotate 180");
    Glm.mat3.multiply(tm,tm,tm);
    assert_mat3_eq(tm,i,"rotate 4 times is identity");

    Glm.mat3.invert(tm,rxp90);
    assert_mat3_eq(tm,rxm90,"rotate inverse is its inverse");

    Glm.mat3.set(tm,1,3,5,-10,2,4,7,8,9);
    Glm.mat3.invert(tm2,tm);
    Glm.mat3.multiply(tm2,tm,tm2);
    assert_mat3_eq(tm2,i,"matrix times inverse is identity");

    Glm.mat3.set(tm,0.,36,12.,-1.);
    Glm.mat3.invert(tm2,tm);
    Glm.mat3.multiply(tm2,tm,tm2);
    assert_mat3_eq(tm2,i,"matrix times inverse is identity");
    
}

function main() {
    console.log(Glm);
    test_hierarchy();
    test_vector();
    test_matrix2();
    test_matrix3();
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
