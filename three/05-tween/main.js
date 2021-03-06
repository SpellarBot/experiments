
var container;
var camera, scene, renderer, domEvents;

var mouse = new THREE.Vector2(),
	INTERSECTED;
var radius = 50,
	theta = 0;

// Make the view take all the entire available size
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

// Compute mouse coordinates relative to the center of the screen
function onDocumentMouseMove(event) {
	event.preventDefault();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function objectsUnderPoint( x, y, camera, scene ){
	var projector = new THREE.Projector();
	var raycaster = new THREE.Raycaster();

	var vector = new THREE.Vector3(x, y, 1);
	projector.unprojectVector(vector, camera);
	raycaster.set(camera.position, vector.sub(camera.position).normalize());

	return raycaster.intersectObjects(scene.children);
}
function render() {

	//theta += 0.1;
	camera.position.x = radius * Math.sin(THREE.Math.degToRad(theta));
	camera.position.y = radius * Math.sin(THREE.Math.degToRad(theta));
	camera.position.z = radius * Math.cos(THREE.Math.degToRad(theta));
	camera.lookAt(scene.position);

	// find intersections
	//var intersects = objectsUnderPoint( mouse.x, mouse.y, camera, scene );
	//var i, l = intersects.length;
	//for( i=0; i<l; i+=1 ){
	//	intersects[i].object.rotation.z += 0.1;
	//}

	TWEEN.update();

	renderer.render(scene, camera);

}

function createThingy(x,y,z,geometry,scene){
	var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
		color: Math.random() * 0xffffff
	}));
	
	object.position.x = x;
	object.position.y = y;
	object.position.z = z;

	object.rotation.x = Math.random() * 2 * Math.PI;
	object.rotation.y = Math.random() * 2 * Math.PI;
	object.rotation.z = Math.random() * 2 * Math.PI;

	scene.add(object);

	domEvents.addEventListener(object, 'mouseover', function(event){
		//console.info( event );
		new TWEEN.Tween( event.target.scale ).to( {
			x: 3,
			y: 3,
			z: 3
		}, 750 ).easing( TWEEN.Easing.Elastic.Out ).start();
	}, false);
	domEvents.addEventListener(object, 'mouseout', function(event){
		//console.info( event );
		new TWEEN.Tween( event.target.scale ).to( {
			x: 1,
			y: 1,
			z: 1
		}, 750 ).easing( TWEEN.Easing.Elastic.Out ).start();
	}, false);
}

function init() {

	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xf0f0f0);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.sortObjects = false;
	container.appendChild(renderer.domElement);

	domEvents = new THREEx.DomEvents(camera, renderer.domElement);
	console.info( domEvents );

	var light = new THREE.DirectionalLight(0xffffff, 2);
	light.position.set(1, 1, 1).normalize();
	scene.add(light);

	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(-1, -1, -1).normalize();
	scene.add(light);

	var geometry = new THREE.BoxGeometry(20, 20, 20);

	//for (var i = 0; i < 20; i++) {
	//	createRandomly( geometry, scene );
	//}
	for( var x=0; x<10; x+=1 ){
		for( var y=0; y<10; y+=1 ){
			createThingy( x*60-300, y*60-300, -300, geometry, scene );
		}
	}

	document.addEventListener('mousemove', onDocumentMouseMove, false);

	window.addEventListener('resize', onWindowResize, false);

}

function animate() {
	requestAnimationFrame(animate);
	render();
}

// Main
init();
animate();

// NEXT STEP:
// http://threejs.org/examples/#canvas_interactive_cubes_tween

