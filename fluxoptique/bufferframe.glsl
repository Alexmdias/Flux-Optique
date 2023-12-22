varying vec2 vUvs;
uniform vec2 resolution;
uniform float time;
uniform sampler2D webcam; 

void main()
{
    gl_FragColor = texture(webcam, vUvs);
}