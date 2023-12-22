varying vec2 vUvs;
uniform vec2 resolution;
uniform float time;
uniform sampler2D webcam; 
uniform sampler2D bufferframe; 

float previous(vec2 p)
{
    vec3 rgb = texture(bufferframe, p, 1.0).rgb; 
	return rgb.r + rgb.g + rgb.b;
}

float current(vec2 p)
{
	vec3 rgb = texture(webcam, p, 1.0).rgb; 
	return rgb.r + rgb.g + rgb.b;
}

vec2 flow()
{
    vec2 vector = vec2(0.0, 0.0);
    vec2 offset = 16.0 / resolution; //offset sur les pixels
    vec2 region = vec2(80.,80.) / resolution; //zone autour qu'on differentie
    for (vec2 i = vUvs-region; i.y < vUvs.y+region.y; i.y+=offset.y)
        for (vec2 i = i; i.x < vUvs.x+region.x; i.x+=offset.x)
        {
            float t = current(i);
            float dt = t - previous(i);
            float dx = current(i - vec2(offset.x, 0.0)) - current(i + vec2(offset.x,0.0)); 
            float dy = current(i - vec2(0.0, offset.y)) - current(i + vec2(0.0,offset.y)); 
            vector += vec2(dx*dt, dy*dt);
        }
    return  vector * vec2(1.0, -1.0);
}

void main()
{
    vec2 flow = flow();

    //---------------------------Partie visuelle-------------------------------

    //visualization par vecteurs inspiré de https://www.shadertoy.com/view/3dlGDM
    float squaresize = 20.0;//combien de pixel chaque block prend
    vec2 pointPos = mod(gl_FragCoord.xy, squaresize) - vec2(0.5 * squaresize); //milieu
    float direction = abs(dot(normalize(flow.yx), pointPos)); 
    float line = smoothstep(0.2 * squaresize, 0.0, direction);//suit la direction

    vec3 r = vec3(1.0, 0.0, 0.0);
    vec3 g = vec3(0.0, 1.0, 0.0);
    vec3 b = vec3(0.0, 0.0, 1.0);
    vec3 y = vec3(1.0, 1.0, 0.0);
    
    vec3 up = mix(b, vec3(-0.5), 1.-flow.y); //interpolation improvise sur 4 directions
    vec3 down = mix(y, vec3(-0.5), flow.y);
    vec3 left = mix(r, vec3(-0.5), flow.x);
    vec3 right = mix(g, vec3(-0.5), 1.-flow.x);
    
    vec3 linecolor = normalize(up+down+left+right);
    linecolor = pow(linecolor, vec3(1./3.0));

    vec4 color = vec4(vec3(line)*linecolor, 1.0);
    vec4 camera = texture(webcam, vUvs, 1.0);

    gl_FragColor = (dot(flow, flow) < 5.0) ? camera : camera + color;
}