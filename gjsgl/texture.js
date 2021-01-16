function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
class Texture {
    constructor(data) {
        this.data = data;
        this.texture = undefined;
    }
    gl_create() {
        if (this.texture!==undefined) {return;}
        this.texture = GL.createTexture();
        GL.bindTexture(GL.TEXTURE_2D, this.texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, this.data);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S,     GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T,     GL.CLAMP_TO_EDGE);
    }
}
class TextureImage extends Texture {
    constructor(url) {
        super();
        this.image = new Image();
        this.url = url;
    }
    init() {
        const promise = new Promise(
            (resolve,reject) => {
                this.image.crossOrigin = "anonymous";
                this.image.src = this.url;
                this.image.onload = (
                    (progress_event) => {
                        this.data = this.image;
                        resolve(this.image);
                    });
                this.image.onerror = () => reject();
            }
        );
        return promise;
    }
}

