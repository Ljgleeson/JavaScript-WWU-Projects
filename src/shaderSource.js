//This file contains shader source code as strings
var VertexSource = `
    uniform mat4 ModelViewProjection;

    //This matrix is used to transform normals
    uniform mat4 ModelViewProjInv;

    //These matrices are used to calculate distance and light direction
    uniform mat4 Model;
    uniform mat4 ModelView;
    uniform mat4 ModelViewInvTranspose;

    attribute vec3 Position;
    attribute vec3 Normal;

    varying vec3 Color;

    // Constants you should use to compute the final color
    const vec3 LightPosition = vec3(4, 1, 4);
    const vec3 LightIntensity = vec3(20);
    const vec3 ka = 0.3*vec3(1, 0.5, 0.5);
    const vec3 kd = 0.7*vec3(1, 0.5, 0.5);

    void main() {
        //Transform the position
        gl_Position = ModelViewProjection * vec4(Position, 1.0);

        //distance squared
        float r = distance(LightPosition, (Model * vec4(Position, 1.0)).xyz );

        //Dot product
        float d = dot((ModelViewInvTranspose * vec4(Normal, 0.0)).xyz, normalize(LightPosition-(ModelView * vec4(Position, 1.0)).xyz));

        //Compute the color
        Color = ka + (kd * LightIntensity * 1.0/(r*r)  * max(0.0,d));
    }
`;
var FragmentSource = `
    precision highp float;
    varying vec3 Color;
    void main() {
      gl_FragColor = vec4(Color, 1.0);
    }
`;

var TextureVertShader = `
    uniform mat4 Model;
    uniform mat4 ModelViewProjection;

    attribute vec3 Position;
    attribute vec3 Normal;
    //I believe you could use UV as a template for other mappings
    attribute vec2 UV;

    varying vec2 vUV;
    varying vec3 vNormal;

    void main() {
      //Give the values to be interpolated
      vUV = UV;
      vNormal = (Model * vec4(Normal, 0.0)).xyz;
      gl_Position = ModelViewProjection * vec4(Position, 1.0);
    }
`;
var TextureFragShader = `
    precision highp float;
    uniform sampler2D sampler;
    uniform sampler2D sampler2;
    varying vec2 vUV;
    varying vec3 vNormal;

    //Ambient light
    const vec3 ka = vec3(0.2, 0.2, 0.2);
    //Directional light (aka Sun position in world coordinates)
    const vec3 direction = normalize(vec3(0, -3, 6));
    const vec3 color = vec3(0.6, 0.4, 0.3);

    void main() {
      float d = dot(normalize(vNormal),direction);

      vec3 lightIntensity = ka + color * max(0.0, d);
      vec4 kd = texture2D(sampler, vUV);
      gl_FragColor = kd * vec4(lightIntensity, 1.0);
    }
`;
