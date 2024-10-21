<script lang="ts">
   // @ts-ignore
   import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
   // @ts-ignore
   import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
   import { T, useTask } from "@threlte/core";
   import { Text3DGeometry, Align, OrbitControls } from "@threlte/extras";
   import * as detectGPU from "detect-gpu";
   import { Object3D } from "three";
   import Color from "color";

   // Setup DRACOLoader
   const gltfLoader = new GLTFLoader();
   const dracoLoader = new DRACOLoader();
   dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
   gltfLoader.setDRACOLoader(dracoLoader);

   const { getGPUTier } = detectGPU;
   let model = $state(0);
   let colour = $state([1, 0, 0]);
   let hue = 0;
   let normalizedColour = $state([1, 0, 0]);
   let autoRotateSpeed = $state(1.5);

   useTask((delta) => {
      hue = (hue + delta * 30) % 360;
      colour = Color({ h: hue, s: 100, l: 50 }).rgb().array();

      normalizedColour = colour.map((value) => value / 255);

      autoRotateSpeed = delta * 300;
   });

   (async () => {
      const gpuTier = await getGPUTier();

      console.log(gpuTier);

      if (gpuTier.tier < 2) {
         model = 1;
         console.warn("Low power GPU detected, using low quality model");
      } else model = 0;
   })();

   // svelte-ignore non_reactive_update
   let rotate = false;
   let rotation = Math.PI / 2;

   const laptopEl = document.querySelector(".laptop");
   const loadingEl = document.querySelector(".loading");

   const models = [
      "/models/Pro laptop model.glb",
      "/models/Noob laptop model.glb",
   ];

   type ModelsData = {
      scale: number;
      position: number;
      text1: [x: number, y: number, z: number];
      text2: [x: number, y: number, z: number];
      text3: [x: number, y: number, z: number];
      text4: [x: number, y: number, z: number];
   };

   const modelsData: ModelsData[] = [
      {
         scale: 1,
         position: 0.4,
         text1: [0, 2.4, -0.7],
         text2: [1, 1.7, -0.65],
         text3: [-0.4, 0.6, 0.8],
         text4: [0.2, 0.6, -0.8],
      },
      {
         scale: 7,
         position: 1.5,
         text1: [0, 2.3, -0.5],
         text2: [1, 1.7, -0.31],
         text3: [-0.4, 0.75, 1],
         text4: [0.2, 0.9, -0.2],
      },
   ];
</script>

<T.PerspectiveCamera makeDefault position={[10, 10, 0]} zoom={3}>
   <OrbitControls
      autoRotate
      enableDamping
      {autoRotateSpeed}
      enablePan={false}
      enableZoom={false}
      target.y={1}
   />
</T.PerspectiveCamera>

<T.DirectionalLight
   position={[-2, 5, 2]}
   intensity={2}
   castShadow
   shadow.bias={-0.0001}
/>
<T.DirectionalLight
   position={[3, 3, -2]}
   intensity={1.5}
   shadow.bias={-0.0001}
/>
<T.DirectionalLight
   position={[0.4, 0 - 0.5, -2]}
   intensity={0.5}
   shadow.bias={-0.0001}
/>

{#await gltfLoader.loadAsync(models[model]) then gltf}
   {laptopEl?.classList.add("done")}
   {loadingEl?.classList.add("done")}
   {(rotate = true)}
   {gltf.scene.traverse((object: Object3D & { material: any }) => {
      // @ts-ignore
      if (object.isMesh) {
         object.castShadow = true;
         object.receiveShadow = true;

         if (object.name === "Object005") {
            object.material.emissive.set(...normalizedColour);
            object.material.color.set(...normalizedColour);
         }

         if (object.name === "Key_") {
            object.material.emissive.set(...normalizedColour);
         }
      }
   })}
   <T
      is={gltf.scene}
      position.y={modelsData[model].position}
      rotation.y={rotation}
      scale={modelsData[model].scale}
   />
{/await}

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow position.y={0.4}>
   <T.CircleGeometry args={[7, 100]} />
   <T.ShadowMaterial opacity={0.3} />
</T.Mesh>

{#snippet RotatingText(
   origin: [x: number, y: number, z: number],
   position: [x: number, y: number, z: number],
   text: string,
   rotation: [x: number, y: number, z: number] = [0, 0, 0],
)}
   <T.Group rotation={origin}>
      <T.Group {position}>
         <Align>
            {#snippet children({ align })}
               <T.Mesh castShadow {rotation}>
                  <Text3DGeometry
                     {text}
                     size={0.1}
                     depth={0.02}
                     font="/fonts/Inter Medium_Regular.json"
                     oncreate={() => {
                        align();
                     }}
                  />
               </T.Mesh>
            {/snippet}
         </Align>
      </T.Group>
   </T.Group>
{/snippet}

{@render RotatingText(
   [0, rotation, 0],
   modelsData[model].text1,
   "Lenovo Legion Pro 7i Gen 8",
)}

{@render RotatingText(
   [0, rotation, 0],
   modelsData[model].text2,
   "240hz, 2560x1600",
   [-0.2, 0, 0],
)}

{@render RotatingText(
   [0, rotation, 0],
   modelsData[model].text3,
   "2x4TB SSD, 32GB RAM",
   [-Math.PI / 2, 0, 0],
)}

{@render RotatingText(
   [0, rotation, 0],
   modelsData[model].text4,
   "RTX 4070, i9-13900hx",
   [0.5, Math.PI, 0],
)}
