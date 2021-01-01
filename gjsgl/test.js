function assert_eq(a,b,msg) {
    if (a!=b) {
        console.log("ASSERTION FAILED: ",a,b,msg);
    }
}
function assert_vec_eq(a,b,msg) {
    if ((a[0]!=b[0]) || (a[1]!=b[1]) || (a[2]!=b[2])) {
        console.log("ASSERTION FAILED: ",a,b,msg);
    }
}
function assert_trans_eq(t,scale,trans,quat,msg) {
    assert_vec_eq(t.scale,      scale,msg+"Scale");
    assert_vec_eq(t.translation,trans,msg+"Trans");
}

function test_transformation() {
    const a = new Transformation();
    const b = new Transformation();
    b.copy(a);
    const c = new Transformation(translation=vec3.set(vec3.create(),1.,2.,3.),
                                 quaternion=b.quaternion,
                                 scale=b.scale);
    const d = new Transformation();

    assert_trans_eq(a,[1.,1.,1.],[0.,0.,0.],0,"a");
    assert_trans_eq(b,[1.,1.,1.],[0.,0.,0.],0,"b");
    assert_trans_eq(c,[1.,1.,1.],[1.,2.,3.],0,"c");
    d.set(a,c);
    assert_trans_eq(d,[1.,1.,1.],[1.,2.,3.],0,"d");
    d.set(d,c);
    assert_trans_eq(d,[1.,1.,1.],[2.,4.,6.],0,"d2");
}

function test_bone() {
    const a = new Bone();
    const b = new Bone(a);
    assert_eq(a,b.parent,"b parent");
    assert_trans_eq(a.transformation,[1.,1.,1],[0.,0.,0.],0,"bone a trans");
    a.transform(new Transformation([1.,2.,3.],undefined,[3.,-1.,-2.]));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],0,"bone a trans");
    a.transform(new Transformation([1.,2.,3.],undefined,[3.,-1.,-2.]));
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],0,"bone a trans");
    assert_trans_eq(a.transformation_rest,[1.,1.,1],[0.,0.,0.],0,"bone a trans rest");
    a.derive_at_rest();
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],0,"bone a trans after at rest");
    assert_trans_eq(a.transformation_rest,[9.,1.,4],[2.,4.,6.],0,"bone a trans rest after at rest");
    a.transform(new Transformation([-1.,-2.,-3.],undefined,[1./3.,-1.,-1./2.]));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],0,"bone a trans again");
    a.transform(new Transformation(undefined,undefined,undefined));
    assert_trans_eq(a.transformation,[3.,-1.,-2],[1.,2.,3.],0,"bone a trans again v2");
    a.transform_from_rest(new Transformation(undefined,undefined,undefined));
    assert_trans_eq(a.transformation,[9.,1.,4],[2.,4.,6.],0,"bone a trans again v3");
}

function main() {
    test_transformation();
    test_bone();
}
main();
