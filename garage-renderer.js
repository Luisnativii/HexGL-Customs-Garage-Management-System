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
      canvas.style.top = '8%';
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      // Add lighting
      var ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
      garageScene.add(ambientLight);

      var directionalLight = new THREE.DirectionalLight(0xffffff, 0.1);
      directionalLight.position.set(5, 10, 5);
      garageScene.add(directionalLight);

      // Create display base
      this.createDisplayBase();

      // Start animation loop
      this.animate();

      // Handle window resize
      window.addEventListener('resize', GarageRenderer.onWindowResize);
    },


    // Animation loop
    animate: function() {
      garageAnimId = requestAnimationFrame(GarageRenderer.animate);

      garageRenderer.render(garageScene, garageCamera);
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

    // Create display base (non-rotating circular platform)
    createDisplayBase: function() {
      // Create a cylinder with low height to look like a disk/circle on the floor
      var geometry = new THREE.CylinderGeometry(8, 8, 0.5, 32);
      
      // Create material using BasicMaterial for reliable color display
      var material = new THREE.MeshBasicMaterial({
        color: 0x1a4d7f
      });

      var displayBase = new THREE.Mesh(geometry, material);
      
      // Position on the floor, below the vehicle
      displayBase.position.y = -3;
      
      // Add to scene
      garageScene.add(displayBase);
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

