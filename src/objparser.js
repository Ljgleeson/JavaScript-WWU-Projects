function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
    setGeometry();
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
}

// // Map .obj vertex info line names to our returned property names
// var vertexInfoNameMap = {v: 'vertexPositions', vt: 'vertexUVs', vn: 'vertexNormals'}

// function ParseWavefrontObj (wavefrontString) {
//   'use strict'

//   var parsedJSON = {vertexNormals: [], vertexUVs: [], vertexPositions: [], vertexNormalIndices: [], vertexUVIndices: [], vertexPositionIndices: []}

//   var linesInWavefrontObj = wavefrontString.split('\n')

//   var currentLine, currentLineTokens, vertexInfoType, i, k

//   // Loop through and parse every line in our .obj file
//   for (i = 0; i < linesInWavefrontObj.length; i++) {
//     currentLine = linesInWavefrontObj[i]
//     // Tokenize our current line
//     currentLineTokens = currentLine.trim().split(/\s+/)
//     // vertex position, vertex texture, or vertex normal
//     vertexInfoType = vertexInfoNameMap[currentLineTokens[0]]

//     if (vertexInfoType) {
//       for (k = 1; k < currentLineTokens.length; k++) {
//         parsedJSON[vertexInfoType].push(parseFloat(currentLineTokens[k]))
//       }
//       continue
//     }

//     if (currentLineTokens[0] === 'f') {
//       // Get our 4 sets of vertex, uv, and normal indices for this face
//       for (k = 1; k < 5; k++) {
//         // If there is no fourth face entry then this is specifying a triangle
//         // in this case we push `-1`
//         // Consumers of this module should check for `-1` before expanding face data
//         if (k === 4 && !currentLineTokens[4]) {
//           parsedJSON.vertexPositionIndices.push(-1)
//           parsedJSON.vertexUVIndices.push(-1)
//           parsedJSON.vertexNormalIndices.push(-1)
//         } else {
//           var indices = currentLineTokens[k].split('/')
//           parsedJSON.vertexPositionIndices.push(parseInt(indices[0], 10) - 1) // We zero index
//           parsedJSON.vertexUVIndices.push(parseInt(indices[1], 10) - 1) // our face indices
//           parsedJSON.vertexNormalIndices.push(parseInt(indices[2], 10) - 1) // by subtracting 1
//         }
//       }
//     }
//   }

//   return parsedJSON
// }