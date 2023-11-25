/*
    https://www.youtube.com/watch?v=HgQzOmnBGCo
    OK BASICALLY:
    TO DO ANY KIND OF MATRIX TRANSFORMATION, USE THIS MATRIX:
        | Rx  Ux  Fx |     | 1  0  0 |
        | Ry  Uy  Fy | AKA | 0  1  0 |
        | Rz  Uz  Fz |     | 0  0  1 |

    WHERE F IS "FRONT", U IS "UP", AND R IS "RIGHT"
    
    LETS SAY F WAS 2 UNITS LONG INSTEAD OF 1, THIS WOULD REPRESENT SCALING THE TRANSFORM BY 2 IN THE Z AXIS:
        | Rx  Ux  Fx |
        | Ry  Uy  Fy |
        | Rz  Uz   2 |
    IF WE MULTIPLED THIS BY A VECTOR:
        | 1  0  0 | | x |      | 1 |      | 0 |      | 0 |
        | 0  1  0 | | y |  =  x| 0 |  +  y| 1 |  +  z| 0 |
        | 0  0  2 | | z |      | 0 |      | 0 |      | 2 |
    THIS MATRIX WOULD ONLY CHANGE THE Z COMPONENT, MULTIPLYING IT BY 2. THIS REPRESENTS A SCALE BY 2 ON THE Z AXIS
    TO CREATE ANY 3D TRANSFORMATION, JUST FIND X IN THIS:
        - IDENTITY VECTOR * X = IDENTITY VECTOR AFTER TRANSFORM
    TRANSLATION MIGHT NEED A 4X4 MATRIX IDK WHY
    
    ROTATE, SCALE, TRANSLATE ?
    OR
    SCALE, ROTATE, TRANSLATE ?

    ROTATION:
    Rx() {
        | 1     0      0 |   | x |    | 1 |    |    0 |
        | 0  cosT  -sinT | * | y | = x| 0 | + y| cosT | etc
        | 0  sinT   cosT |   | z |    | 0 |    | sinT |
    }

    Ry() {
        |  cosT  0  sinT |
        |     0  1     0 |
        | -sinT  0  cosT |
    }
    
    Rz() {
        | cosT  -sinT  0 |
        | sinT   cosT  0 |
        | 0        0   1 |
    }

*/

function sin(degrees) { return Math.sin(degrees * Math.PI / 180); }
function cos(degrees) { return Math.cos(degrees * Math.PI / 180); }

const FPS = 120;
const Color = {
    darker: "#023436",
    dark: "#037971",
    light: "#03B5AA",
    lighter: "#00BFB3",
    red: "#FF0000",
    green: "#00FF00",
    blue: "#0000FF"
}

class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /** Returns a new Vector3 */
    add(vector3)      { return new Vector3(this.x + vector3.x, this.y + vector3.y, this.z + vector3.z); }
    /** Returns a new Vector3 */
    subtract(vector3) { return new Vector3(this.x - vector3.x, this.y - vector3.y, this.z - vector3.z); }
    /** Returns a new Vector3 */
    divide(scalar)    { return new Vector3(this.x/scalar, this.y/scalar, this.z/scalar); }
    /** Returns a new Vector3 */
    multiply(scalar)  { return new Vector3(this.x*scalar, this.y*scalar, this.z*scalar); }

    copy() { return new Vector3(this.x, this.y, this.z); }

    /** Returns a new Vector3 */
    rotatedBy(v3 = Vector3.zero) {
        
        // Rotate about the Y axis
        let rY = new Vector3(
            this.x * cos(-v3.y) + this.z * sin(-v3.y),
            this.y,
            this.z * cos(-v3.y) - this.x * sin(-v3.y),
        );

        return new Vector3(
            rY.x,
            rY.y * cos(-v3.x) - rY.z * sin(-v3.x),
            rY.z * cos(-v3.x) + rY.y * sin(-v3.x)
        )
    }

    /** Read-Only. Returns a new Vector3 */
    get direction() { return this.divide(this.magnitude); }
    /** Read-Only. Returns a new Vector3 */
    get magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }

    static get zero()     { return new Vector3( 0,  0,  0); }
    static get one()      { return new Vector3( 1,  1,  1); }
    static get forward()  { return new Vector3( 0,  0,  1); }
    static get backward() { return new Vector3( 0,  0, -1); }
    static get up()       { return new Vector3( 0,  1,  0); }
    static get down()     { return new Vector3( 0, -1,  0); }
    static get right()    { return new Vector3( 1,  0,  0); }
    static get left()     { return new Vector3(-1,  0,  0); }
}

class Control {
    static movement = Vector3.zero;
    static rotation = Vector3.zero;
    static sensitivityY = 10 / FPS;
    static sensitivityX = 10 / FPS;

    static keyAction(e) {
        if (e.repeat) return;
        let up = e.type == "keyup";
        switch(e.code) {
            case "KeyW":
                Control.movement.z = up ? 0 :  1; break;
            case "KeyS": 
                Control.movement.z = up ? 0 : -1; break;
            case "KeyD": 
                Control.movement.x = up ? 0 :  1; break;
            case "KeyA": 
                Control.movement.x = up ? 0 : -1; break;
            case "Space":
                Control.movement.y = up ? 0 :  1; break;     
            case "ControlLeft":
                Control.movement.y = up ? 0 : -1; break;
            case "ShiftLeft":
                Player.speedXZ = up ? 10/FPS : 40/FPS; break;
            // case "ArrowUp": 
            //     Control.rotation.x = up ? 0 : -1; break;
            // case "ArrowDown": 
            //     Control.rotation.x = up ? 0 :  1; break;
            // case "ArrowRight":
            //     Control.rotation.y = up ? 0 :  1; break; 
            // case "ArrowLeft":
            //     Control.rotation.y = up ? 0 : -1; break;
        };
    }

    static wheelAction(e) {
        Camera.screenDistance += (e.wheelDelta > 0) ? 10 : -10;
    }

    static mouseAction(e = new MouseEvent()) {
        if (!(e.movementY || e.movementX)) return;
        Control.rotation.x = e.movementY * Control.sensitivityY; 
        Control.rotation.y = e.movementX * Control.sensitivityX;
    }
}

class Transform {
    constructor(position = Vector3.zero, rotation = Vector3.zero, scale = Vector3.one) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }

    static get default() { return new Transform(); }

    // Move this transform by a given Vector3
    Translate(vector3) {
        this.position = this.position.add(vector3);
    }
    // Rotate this transform by a given Vector3
    Rotate(vector3) {
        this.rotation = this.rotation.add(vector3);
    }
    // Scale this trandform by a given Vector3
    Scale(vector3) {
        this.scale.multiply(vector3);
    }

    // Returns a new Vector3 rotated by v3
    rotatedBy(v3) {
        return this.rotation.add(v3);
    }
}

class Camera {
    static screenDistance = 800;

    static render() {
        ctx.fillStyle = Color.light;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let point of Cube.points) {
            this.draw3DPoint(point.add(Cube.transform.position));
        }
    }

    static toScreenCoordinates(point) {
        let relativePosition = point.subtract(Player.transform.position);
        let relativePositionRotated = relativePosition.rotatedBy(Player.transform.rotation);
        let screenX = (relativePositionRotated.x / relativePositionRotated.z) * this.screenDistance + canvas.width/2;
        let screenY = (relativePositionRotated.y / relativePositionRotated.z) * this.screenDistance - canvas.height/2;
        return new Vector3(screenX, -screenY, relativePositionRotated.z);
    }
    // Draws a 3DPoint
    static draw3DPoint(vector3) {
        let onScreen = Camera.toScreenCoordinates(vector3);
        if (onScreen.z < 0) return;
        Camera.drawPoint(onScreen.x, onScreen.y, onScreen.z);
    }
    /** Draws a point on the screen */
    static drawPoint(x, y, d) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = Color.dark;
        ctx.beginPath();
        let radius = 20*(1/d);
        ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }

    static draw3DLine(startPoint, endPoint) {
        let s = Camera.toScreenCoordinates(startPoint);
        let e = Camera.toScreenCoordinates(endPoint);
        if (s.z < 0 || e.z < 0) return;
        Camera.drawLine(s.x, s.y, e.x, e.y);
    }

    static drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    static drawCoordLines() {
        const numOfLines = 5;
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = Color.dark;
        for (let i = -numOfLines; i <= numOfLines; i++) {
            Camera.draw3DLine(new Vector3(i, 0, -numOfLines), new Vector3(i, 0, numOfLines));
        }
        for (let i = -numOfLines; i <= numOfLines; i++) {
            Camera.draw3DLine(new Vector3(-numOfLines, 0, i), new Vector3(numOfLines, 0, i));
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = Color.red;
        Camera.draw3DLine(new Vector3(-numOfLines, 0, 0), new Vector3(numOfLines, 0, 0));
        ctx.strokeStyle = Color.green;
        Camera.draw3DLine(new Vector3(0, -numOfLines, 0), new Vector3(0, numOfLines, 0));
        ctx.strokeStyle = Color.blue;
        Camera.draw3DLine(new Vector3(0, 0, -numOfLines), new Vector3(0, 0, numOfLines));
    }
    /* Draws some stats */
    static drawStats() {
        let playerRotation = Player.transform.rotation.multiply(-1);
        playerRotation.x = 0;
        let movementVector = Control.movement.rotatedBy(playerRotation).multiply(Player.speedXZ);
        movementVector.y = Control.movement.y * Player.speedY;

        ctx.font = "30px Fira sans";
        ctx.fillStyle = Color.dark;
        ctx.fillText(`Player Position: ${JSON.stringify(Player.transform.position)}`, 10, 35);
        ctx.fillText(`Player Rotation: ${JSON.stringify(Player.transform.rotation)}`, 10, 65);
        ctx.fillText(`Player FOV: ${Camera.screenDistance}`, 10, 95);
        ctx.fillText(`Control Move: ${JSON.stringify(Control.movement)}`, 10, 125);
        ctx.fillText(`Control Rota: ${JSON.stringify(Control.rotation)}`, 10, 155);
        ctx.fillText(`Move Vector: ${JSON.stringify(movementVector)}`, 10, 185);
    }
}

class Player {
    static transform = Transform.default;
    static speedXZ = 10 / FPS;
    static speedY = 10 / FPS;
    

    static Move() {
        let playerRotation = Player.transform.rotation.multiply(-1);
        playerRotation.x = 0;
        let movementVector = Control.movement.rotatedBy(playerRotation).multiply(this.speedXZ);
        movementVector.y = Control.movement.y * this.speedY;
        this.transform.Translate(movementVector);
    }

    static Rotate() {
        this.transform.Rotate(Control.rotation);
        Control.rotation = Vector3.zero;
    }
}

class Cube {
    static transform = new Transform(new Vector3(0, 0, 1));
    static points = [
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1),
        new Vector3(0, 1, 0),
        new Vector3(0, 1, 1),
        new Vector3(1, 0, 0),
        new Vector3(1, 0, 1),
        new Vector3(1, 1, 0),
        new Vector3(1, 1, 1)
    ];
}

var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
start();
function start() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    document.addEventListener("keydown", Control.keyAction);
    document.addEventListener("keyup", Control.keyAction);
    document.addEventListener("wheel", Control.wheelAction);
    document.addEventListener("mousemove", Control.mouseAction);
    canvas.onclick = () => { canvas.requestPointerLock(); }
    setInterval(update, 1000 / FPS);
}

function update() {
    gameLogic();
    Camera.render();
    Camera.drawStats();
    Camera.drawCoordLines();
}

function gameLogic() {
    Player.Move();
    Player.Rotate();
}
