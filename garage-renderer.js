// Garage 3D Renderer for Three.js r53 (HexGL project)
// Compatible with legacy Three.js API

(function() {
  var garageScene, garageCamera, garageRenderer, garageAnimId, garageMesh;

  window.GarageRenderer = {
    // Initialize the garage scene
    init: function(containerElement) {
      if (garageRenderer) {
        console.warn('Garage renderer already initialized');
        return;
      }

      // Get container dimensions with fallback
      var width = containerElement.clientWidth;
      var height = containerElement.clientHeight;
      
      // Fallback to window dimensions if container has no size
      if (!width || width === 0) width = window.innerWidth * 0.9;
      if (!height || height === 0) height = window.innerHeight * 0.9;
      
      console.log('GarageRenderer init - dimensions:', width, 'x', height);

      // Create scene
      garageScene = new THREE.Scene();

      // Create camera
      garageCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
      garageCamera.position.set(0, 0, 15);
      garageCamera.lookAt(0, 0, 0);
      garageScene.add(garageCamera);

      // Create renderer using legacy API (following HexGL.js pattern)
      garageRenderer = new THREE.WebGLRenderer();

      garageRenderer.setSize(width, height);
      // Use legacy API to set clear color
      if (typeof garageRenderer.setClearColorHex === 'function') {
        garageRenderer.setClearColorHex(0x1a1a2e, 1);
      } else if (typeof garageRenderer.setClearColor === 'function') {
        garageRenderer.setClearColor(new THREE.Color(0x1a1a2e), 1);
      }

      // Append to container (will create a new canvas element)
      containerElement.appendChild(garageRenderer.domElement);

      // Ensure container has positioning so absolute canvas can fill it
      try {
        var computedPos = window.getComputedStyle(containerElement).position;
        if (!computedPos || computedPos === 'static') {
          containerElement.style.position = 'relative';
        }
      } catch (e) {
        containerElement.style.position = 'relative';
      }

      // Force canvas to fill the container and be visible
      var canvas = garageRenderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.zIndex = '9999';

      console.log('Renderer appended. Canvas element:', canvas);
      console.log('Canvas size (attr):', canvas.width, 'x', canvas.height);
      console.log('Canvas size (style):', canvas.style.width, 'x', canvas.style.height);

      // Create a simple triangle geometry
      this.createTriangle();

      // Start animation loop
      this.animate();

      // Handle window resize
      window.addEventListener('resize', GarageRenderer.onWindowResize);
    },

    // Create a simple cube using r53-compatible APIs (CubeGeometry)
    createTriangle: function() {
      // CubeGeometry is the r53 name for modern BoxGeometry
      var geometry = new THREE.CubeGeometry(2, 2, 2);

      // Material: simple basic material (no lighting required)
      var material = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        wireframe: true
      });

      // Create mesh and add to scene
      garageMesh = new THREE.Mesh(geometry, material);
      garageScene.add(garageMesh);

      console.log('Cube created and added to scene');
    },

    // Animation loop
    animate: function() {
      garageAnimId = requestAnimationFrame(GarageRenderer.animate);

      if (garageMesh) {
        garageMesh.rotation.x += 0.005;
        garageMesh.rotation.y += 0.008;
        garageMesh.rotation.z += 0.003;
      }

      if (garageRenderer && garageScene && garageCamera) {
        garageRenderer.render(garageScene, garageCamera);
      } else {
        console.warn('Cannot render - missing renderer, scene, or camera');
      }
    },

    // Handle window resize
    onWindowResize: function() {
      if (!garageRenderer) return;

      var containerElement = document.getElementById('garage');
      if (!containerElement) return;

      var width = containerElement.clientWidth || window.innerWidth * 0.9;
      var height = containerElement.clientHeight || window.innerHeight * 0.8;

      garageCamera.aspect = width / height;
      garageCamera.updateProjectionMatrix();
      garageRenderer.setSize(width, height);
    },

    // Stop rendering and clean up
    destroy: function() {
      if (!garageRenderer) return;

      // Cancel animation
      if (garageAnimId) {
        cancelAnimationFrame(garageAnimId);
        garageAnimId = null;
      }

      // Remove renderer DOM element
      if (garageRenderer.domElement && garageRenderer.domElement.parentNode) {
        garageRenderer.domElement.parentNode.removeChild(garageRenderer.domElement);
      }

      // Clean up
      garageScene = null;
      garageCamera = null;
      garageRenderer = null;
      garageMesh = null;

      window.removeEventListener('resize', GarageRenderer.onWindowResize);
    }
  };
})();

