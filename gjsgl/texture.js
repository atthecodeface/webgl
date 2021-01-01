function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
function loadTexture(url) {
    const texture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, texture);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = function() {
        GL.bindTexture(GL.TEXTURE_2D, texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    };
    return texture;
}

