//This file contains shader source code as strings

var NormalVertSource =`
    uniform mat4 Model;
    uniform mat4 ModelViewProjection;

    attribute vec3 Position;
    attribute vec3 Normal;
    attribute vec3 Tangent;
    attribute vec3 Bitangent;
    attribute vec2 UV;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vTangent;
    varying vec3 vBitangent;

    void main() {
        //Give the values to be interpolated
        vUV = UV;
        //Transform these vectors from model space to world space
        vNormal = (Model * vec4(Normal, 0.0)).xyz;
        vTangent = (Model * vec4(Tangent, 0.0)).xyz;
        vBitangent = (Model * vec4(Bitangent, 0.0)).xyz;
        gl_Position = ModelViewProjection * vec4(Position, 1.0);
    }
`;
var NormalFragSource =`
    precision highp float;
    uniform sampler2D sampler;
    uniform sampler2D sampler2;
    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vTangent;
    varying vec3 vBitangent;

    //Ambient light
    const vec3 ka = vec3(0.2, 0.2, 0.2);
    //Directional light (aka Sun position in world coordinates)
    const vec3 direction = normalize(vec3(0, -3, 6));
    const vec3 color = vec3(0.6, 0.4, 0.3);

    //Transform tan and bit to model space DONE IN VERTEX
    //Form TBN matrix after nomralizing T, B, and N
    //Transform the normal from sampler 2 into world space using TBM

    void main() {
        //Normalize the interpolated data

        //Create the TBN matrix if issues arise try inverting and/or transposign TBN
        mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), normalize(vNormal));

        vec3 normal = normalize(2.0*texture2D(sampler2, vUV).xyz - 1.0);

        //Transform the normal into world space with TBM then re-normalize
        normal = normalize(TBN * normal);
        float d = dot(normal,direction);

        vec3 lightIntensity = ka + color * max(0.0, d);
        vec4 kd = texture2D(sampler, vUV);
        gl_FragColor = kd * vec4(lightIntensity, 1.0);
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

var VertexSource = `
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
var FragmentSource = `
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
    const vec4 kd = vec4(0.7, 0.3, 0.5, 1.0);

    void main() {
        float d = dot(normalize(vNormal),direction);

        vec3 lightIntensity = ka + color * max(0.0, d);
        gl_FragColor = kd * vec4(lightIntensity, 1.0);
    }
`;

var SkyboxVertSource = `
    attribute vec4 Position;
    varying vec4 vPosition;
    void main() {
        vPosition = Position;
        gl_Position = Position;
        gl_Position.z = 1.0;
    }
`;

var SkyboxFragSource = `
    precision highp float;

    uniform samplerCube sampler;
    uniform mat4 ViewProjInv;

    varying vec4 vPosition;
    void main() {
        //Rename mvpinv
        vec4 t = ViewProjInv * vPosition;
        gl_FragColor = textureCube(sampler, normalize(t.xyz / t.w));
    }
`;
