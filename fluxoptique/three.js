import * as THREE from 'https://cdn.skypack.dev/three@0.136';


window.addEventListener('DOMContentLoaded', async () => {

    var renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);
    
    //setup shaders
    const vsh = await fetch('vertex-shader.glsl');
    const fsh = await fetch('fragment-shader.glsl');
    const vbA = await fetch('vbufferframe.glsl');
    const fbA = await fetch('bufferframe.glsl');

    //setup webcam
    video = document.getElementById( 'video' );
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

      const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

      navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {

        // apply the stream to the video element used in the texture

        video.srcObject = stream;
        video.play();

      } ).catch( function ( error ) {

        console.error( 'Unable to access the camera/webcam.', error );

      } );

    } else {

      console.error( 'MediaDevices interface not available.' );

    }

    const videoTexture = new THREE.VideoTexture(video);
    
    const offscreenTargetA = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    const sceneA = new THREE.Scene();
    const cameraA = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
    cameraA.position.set(0, 0, 1);
    const materialA = new THREE.ShaderMaterial({
      uniforms: {
        webcam: { value: videoTexture }
      },
      vertexShader: await vbA.text(),
      fragmentShader: await fbA.text()
    });
    const geometryA = new THREE.PlaneGeometry(1, 1);
    const planeA = new THREE.Mesh(geometryA, materialA);
    planeA.position.set(0.5, 0.5, 0);
    sceneA.add(planeA); 
    renderer.setRenderTarget(offscreenTargetA);
    renderer.render(sceneA, cameraA);
    renderer.setRenderTarget(null);

    //FINAL SHADER
    const material = new THREE.ShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        time: { value: 0.0 },
        webcam: { value: videoTexture },
        bufferframe: { value: offscreenTargetA.texture }
      },
      vertexShader: await vsh.text(),
      fragmentShader: await fsh.text()
    });
    //setup scene and camera
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
    camera.position.set(0, 0, 1);
    //add plane to draw fragment shader in
    const geometry = new THREE.PlaneGeometry(1, 1);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0.5, 0.5, 0);
    scene.add(plane); 
    
    //make whole window pretty with no sidebars 
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    }, false);
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    //animate with time t and render
    var previoustime = null;
    var totalTime = 0;
    function render() {
      requestAnimationFrame((t) => {
        if (previoustime === null) {
          previoustime = t;
        }
        const timeElapsed = t - previoustime;
        const timeElapsedS = timeElapsed * 0.001;
        totalTime += timeElapsedS;
        material.uniforms.time.value = totalTime;
        /*if (video.readyState === video.HAVE_ENOUGH_DATA) {
          videoTexture.needsUpdate = true;
        }*/
        renderer.setRenderTarget(null);
        renderer.render(scene, camera); //live
        renderer.setRenderTarget(offscreenTargetA); //store previous frame
        renderer.render(sceneA, cameraA);
        render();
        previoustime = t;
      });
    }
    render();
});

