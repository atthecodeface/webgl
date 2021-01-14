function set_fov(n,v)   { viewer.projection.set_fov(n,v); }
function set_euler(n,v) { viewer.camera.set_euler(n,v); }
function set_xyz(n,v)   { viewer.camera.set_xyz(n,v); }
function set_zoom(v)    { viewer.camera.set_zoom(v); }
viewer = new ViewerFrontend();
viewer.run();

