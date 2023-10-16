let source = null;
let canvas = null;
let helperCanvas = null;
let helperContext = null;
let context = null;
let scaler = 0.9;
let size = { x: 0, y: 0, width: 0, height: 0, rows: 3, cols: 3 };
let pieces = [];
let selectedPiece = null;

function main() {
    canvas = document.getElementById("myCanvas"); // Getting canvas
    context = canvas.getContext("2d"); // Creating context
    helperCanvas = document.getElementById("helperCanvas"); // Getting canvas
    helperContext = helperCanvas.getContext("2d"); // Creating context
    source = document.createElement("img"); // Creating a image element
    source.src = "./puzzle.jpg";
    source.onload= function() {
        addEventListeners();
        initializePieces(size.rows, size.cols);
        handleResize();
        randomizePieces();
        window.addEventListener("resize", handleResize);
        updateCanvas();
    }
}

function handleResize() {
    canvas.width = window.innerWidth; // Full width of the screen
    canvas.height = window.innerHeight; // Full height of the screen
    helperCanvas.width = window.innerWidth; // Full width of the screen
    helperCanvas.height = window.innerHeight; // Full height of the screen
    let resizer = scaler *
        Math.min(
            window.innerWidth / source.width, // video.videoWidth,
            window.innerHeight / source.height // video.videoHeight
        );
    size.width = resizer * source.width; //video.videoWidth;
    size.height = resizer * source.height; // video.videoHeight;
    size.x = window.innerWidth / 2 - size.width / 2;
    size.y = window.innerHeight / 2 - size.height / 2;
}

function updateCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    helperContext.clearRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 0.5;
    context.drawImage(source, size.x, size.y, size.width, size.height); // draw image from user camera
    context.globalAlpha = 1;
    for (let i = 0; i < pieces.length; i++) {
        pieces[i].draw(context);
        pieces[i].draw(helperContext, false);
    }
    window.requestAnimationFrame(updateCanvas); // update animation
}

function addEventListeners() {
    // On Desktop
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);

    // On Mobile
    canvas.addEventListener("touchstart", onTouchStart,  { passive: true });
    canvas.addEventListener("touchend", onTouchEnd,  { passive: true });
    canvas.addEventListener("touchmove", onTouchMove,  { passive: true });
}
function onTouchStart(event) {
    let loc = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
    };
    onMouseDown(loc);
}
function onTouchMove(event) {
    let loc = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
    };
    onMouseMove(loc);
}
function onTouchEnd(event) {
    onMouseUp();
}

function onMouseDown(event) {
    const imgData = helperContext.getImageData(event.x, event.y, 1, 1);
    if (imgData.data[3] == 0) {
        return;
    }
    const clickedColor = `rgb(${imgData.data[0]}, ${imgData.data[1]}, ${imgData.data[2]})`;

    // selectedPiece = getPressedPiece(event);
    selectedPiece = getPressedPieceByColor(event, clickedColor);
    if (selectedPiece != null) {
        const index = pieces.indexOf(selectedPiece);
        if (index > -1) {
            pieces.splice(index, 1);
            pieces.push(selectedPiece);
        }
        selectedPiece.offset = {
            x: event.x - selectedPiece.x,
            y: event.y - selectedPiece.y,
        };
    }
}

function onMouseMove(event) {
    if (selectedPiece != null) {
        selectedPiece.x = event.x - selectedPiece.offset.x;
        selectedPiece.y = event.y - selectedPiece.offset.y;
    }
}

function onMouseUp() {
    if (selectedPiece != null && selectedPiece.isClose()) {
        selectedPiece.snap();
    }
    selectedPiece = null;
}

function getPressedPiece(loc) {
    for (let i = pieces.length - 1; i >= 0; i--) {
        if (
            loc.x > pieces[i].x &&
            loc.x < pieces[i].x + pieces[i].width &&
            loc.y > pieces[i].y &&
            loc.y < pieces[i].y + pieces[i].height
        ) {
            return pieces[i];
        }
    }
    return null;
}

function getPressedPieceByColor(loc, color) {
    for (let i = pieces.length - 1; i >= 0; i--) {
        if (pieces[i].color === color) {
            return pieces[i];
        }
    }
    return null;
}
// Initialize Pieces
function initializePieces(rows, cols) {
    size.rows = rows;
    size.cols = cols;
    pieces = [];
    const uniqueRandomColors = [];

    for (let i = 0; i < size.rows; i++) {
        for (let j = 0; j < size.cols; j++) {
            let color = getRandomColor();
            while (uniqueRandomColors.includes(color)) {
                color = getRandomColor();
            }
            pieces.push(new Piece(i, j, color));
        }
    }

    let count = 0;
    for (let i = 0; i < size.rows; i++) {
        for (let j = 0; j < size.cols; j++) {
            const piece = pieces[count];
            if (i == size.rows - 1) {
                piece.bottom = null;
            } else {
                const sign = Math.random() - 0.5 < 0 ? -1 : 1;
                piece.bottom = sign * (Math.random() * 0.4 + 0.3);
            }

            if (i == 0) {
                piece.top = null;
            } else {
                piece.top = -pieces[count - size.cols].bottom;
            }

            if (j == size.cols - 1) {
                piece.right = null;
            } else {
                const sign = Math.random() - 0.5 < 0 ? -1 : 1;
                piece.right = sign * (Math.random() * 0.4 + 0.3);
            }
            if (j == 0) {
                piece.left = null;
            } else {
                piece.left = -pieces[count - 1].right;
            }

            count++;
        }
    }
}

// Randomize Pieces
function randomizePieces() {
    for (let i = 0; i < pieces.length; i++) {
        let loc = {
            x: Math.random() * (canvas.width - pieces[i].width),
            y: Math.random() * (canvas.height - pieces[i].height),
        };
        pieces[i].x = loc.x;
        pieces[i].y = loc.y;
    }
}

// Piece class
class Piece {
    constructor(rowIndex, colIndex, color) {
        this.color = color;
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.x = size.x + (size.width * this.colIndex) / size.cols;
        this.y = size.y + (size.height * this.rowIndex) / size.rows;
        this.width = size.width / size.cols;
        this.height = size.height / size.rows;
        this.xCorrect = this.x;
        this.yCorrect = this.y;
    }

    draw(context, desktop = true) {
        context.beginPath();

        const sz = Math.min(this.width, this.height);
        const neck = 0.1 * sz;
        const tabWidth = 0.2 * sz;
        const tabHeight = 0.2 * sz;

        // from top left
        context.moveTo(this.x, this.y);

        //to top right
        if (this.top) {
            context.lineTo(
                this.x + this.width * Math.abs(this.top) - neck,
                this.y
            );

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) - neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) - tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top),
                this.y - tabHeight * Math.sign(this.top)
            );

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) + tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top) + neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) + neck,
                this.y
            );

            context.lineTo(
                this.x + this.width * Math.abs(this.top) + neck,
                this.y
            );
        }
        context.lineTo(this.x + this.width, this.y);

        // to bottom right
        if (this.right) {
            context.lineTo(
                this.x + this.width,
                this.y + this.height * Math.abs(this.right) - neck
            );

            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) - neck,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) - tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right)
            );

            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) + tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) + neck,

                this.x + this.width,
                this.y + this.height * Math.abs(this.right) + neck
            );

            context.lineTo(
                this.x + this.width,
                this.y + this.height * Math.abs(this.right) + neck
            );
        }
        context.lineTo(this.x + this.width, this.y + this.height);

        // to bottom left
        if (this.bottom) {
            context.lineTo(
                this.x + this.width * Math.abs(this.bottom) + neck,
                this.y + this.height
            );

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) + neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) + tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom),
                this.y + this.height + tabHeight * Math.sign(this.bottom)
            );

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) - tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height
            );

            context.lineTo(
                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height
            );
        }
        context.lineTo(this.x, this.y + this.height);

        // to top left
        if (this.left) {
            context.lineTo(
                this.x,
                this.y + this.height * Math.abs(this.left) + neck
            );

            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) + neck,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) + tabWidth,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left)
            );

            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) - tabWidth,

                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) - neck,

                this.x,
                this.y + this.height * Math.abs(this.left) - neck
            );

            context.lineTo(
                this.x,
                this.y + this.height * Math.abs(this.left) - neck
            );
        }
        context.lineTo(this.x, this.y);
        context.save();
        context.clip();
        const scaledTabHeight =
            (Math.min(source.width / size.cols, source.height / size.rows) *
                tabHeight) /
            sz;

        if (desktop) {
            context.drawImage(
                source,
                (this.colIndex * source.width) / size.cols - scaledTabHeight,
                (this.rowIndex * source.height) / size.rows - scaledTabHeight,
                source.width / size.cols + scaledTabHeight * 2,
                source.height / size.rows + scaledTabHeight * 2,
                this.x - tabHeight,
                this.y - tabHeight,
                this.width + tabHeight * 2,
                this.height + tabHeight * 2
            );
        } else {
            context.fillStyle = this.color;
            context.fillRect(
                this.x - tabHeight,
                this.y - tabHeight,
                this.width + tabHeight * 2,
                this.height + tabHeight * 2
            );
        }
        context.restore();

        context.stroke();
    }

    isClose() {
        if (
            distance(
                { x: this.x, y: this.y },
                { x: this.xCorrect, y: this.yCorrect }
            ) <
            this.width / 3
        ) {
            return true;
        }
        return false;
    }

    snap() {
        this.x = this.xCorrect;
        this.y = this.yCorrect;
    }
}

function distance(p1, p2) {
    return Math.sqrt(
        (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
    );
}

function getRandomColor() {
    const red = Math.floor(Math.random() * 255);
    const green = Math.floor(Math.random() * 255);
    const blue = Math.floor(Math.random() * 255);
    return `rgb(${red}, ${green}, ${blue})`;
}


main();
