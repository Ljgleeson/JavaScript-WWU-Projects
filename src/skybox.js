//This file contains the static data for the skybox
sbFaces =
  [
    document.getElementById("right"),
    document.getElementById("left"),
    document.getElementById("top"),
    document.getElementById("bottom"),
    document.getElementById("back"),
    document.getElementById("front"),
  ];
sbPositions = new Float32Array(
  [
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);
