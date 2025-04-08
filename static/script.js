// 初始化
// 初始化页面
window.onload = function () {
    setPenMode(1);
    // 工具栏浮现动画
    toolbar_main.style.opacity = 1;
    toolbar_main.style.transform = 'translateY(0)';
    toolbar_LB.style.opacity = 1;
    toolbar_LB.style.transform = 'translateY(0)';
    toolbar_RB.style.opacity = 1;
    toolbar_RB.style.transform = 'translateY(0)';
    // 初始化画布
    fetch('/api/getCanvasSize')
        .then(x => x.json())
        .then(canvasSize => function (canvasSize) {
            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height;
            resizeCanvas();
            // 填充画布背景
            ctx.fillStyle = "#0f261e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // 多页面
            canvasData.push([canvas.toDataURL(), bgColor]);
        }(canvasSize))
    // 阻止默认右键菜单
    document.documentElement.oncontextmenu = function (e) {
        e.preventDefault();
    }
}
// 初始化画笔参数
var pen_color = [255, 255, 255];
var pen_alpha = 1;
var pen_size = 0.3;
var pen_mode;
var bgColor = "#0f261e";
// 获取元素
var toolbar_main = document.querySelector('.toolbar-main');
var toolbar_LB = document.querySelector('.toolbar-LB');
var toolbar_RB = document.querySelector('.toolbar-RB');
var toolbar_color = document.querySelector('.toolbar-color');
var toolbar_alpha = document.querySelector('.toolbar-alpha');
var toolbar_size = document.querySelector('.toolbar-size');
var btn_pen = document.querySelector('.btn-pen');
var btn_eraser = document.querySelector('.btn-eraser');
var btn_autoColor = document.querySelector('.btn-autoColor');
var btn_currentColor = document.querySelector('.btn-currentColor');
var input_color = document.querySelector('.input-color');
var canvas = document.querySelector('.canvas');
var cursor = document.querySelector('.cursor');
var icon_nxtPg = document.querySelector('.icon-nxtPg');
var icon_fullScreen = document.querySelector('.icon-fullScreen');
var input_pageNumber = document.querySelector('.input-pageNumber');
var msg_box = document.querySelector('.msg-box');

// UI 相关
// 工具栏切换
function openToolBar(item) {
    toolbar_main.style.opacity = 0;
    toolbar_main.style.transform = 'scale(0.85)';
    document.querySelector(item).style.transform = 'translateY(0)';
}
function closeToolBar() {
    toolbar_main.style.opacity = 1;
    toolbar_main.style.transform = 'scale(1)';
    toolbar_color.style.transform = 'translateY(72px)';
    toolbar_alpha.style.transform = 'translateY(72px)';
    toolbar_size.style.transform = 'translateY(72px)';
}
// 全屏
function fullScreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
        icon_fullScreen.src = "/static/icons/fullscreen.svg";
    } else {
        document.documentElement.requestFullscreen();
        icon_fullScreen.src = "/static/icons/fullscreen_exit.svg";
    }
}
// 对话框
function toggleDialog(item) {
    document.querySelector(item).classList.toggle('dialog-open');
    if (item == '.dialog-jumpToPage' && document.querySelector(item).classList.contains('dialog-open')) {
        input_pageNumber.focus();
    }
}

// 画笔相关
// 设置笔模式
function setPenMode(mode) {
    pen_mode = mode;
    if (mode == 0) {
        btn_eraser.classList.add('btn-penMode-active');
        btn_pen.classList.remove('btn-penMode-active');
    }
    if (mode == 1) {
        btn_eraser.classList.remove('btn-penMode-active');
        btn_pen.classList.add('btn-penMode-active');
    }
}
// 设置笔颜色
var auto_color = false;
function setColor(color) {
    if (color == 'auto') {
        auto_color = true;
        btn_autoColor.classList.add('btn-penMode-active');
        pen_color = [255, 0, 0];
    } else {
        auto_color = false;
        btn_autoColor.classList.remove('btn-penMode-active');
        pen_color = toRGB(color);
    }
    document.querySelectorAll('.color-box')[0].style.backgroundColor = color;
}
input_color.addEventListener('input', function () {
    setColor(this.value);
});
// 设置笔透明度
function setAlpha(alpha) {
    pen_alpha = alpha;
    document.querySelectorAll('.toolbar-alpha .toolbar-item').forEach(function (item) {
        item.classList.remove('toolbar-item-active');
    }
    );
    document.querySelectorAll('.toolbar-alpha .toolbar-item')[Math.round(alpha * 10)].classList.add('toolbar-item-active');
}
// 设置笔大小
function setSize(size) {
    pen_size = size;
    document.querySelectorAll('.toolbar-size .toolbar-item').forEach(function (item) {
        item.classList.remove('toolbar-item-active');
    }
    );
    document.querySelectorAll('.toolbar-size .toolbar-item')[Math.round(size * 10)].classList.add('toolbar-item-active');
}
// 画笔光标
canvas.addEventListener('touchstart', moveCursor);
canvas.addEventListener('mousemove', moveCursor);
canvas.addEventListener('touchmove', moveCursor);
canvas.addEventListener('touchend', function (e) {
    setTimeout(() => {
        cursor.style.opacity = '0';
    }, 100);
});
canvas.addEventListener('mouseout', function (e) {
    cursor.style.opacity = '0';
});
function moveCursor(e) {
    if (pen_mode == 1 && typeof e.touches != 'object') {
        cursor.style.opacity = '1';
        cursor.style.left = e.clientX - 12 + 'px';
        cursor.style.top = e.clientY - 12 + 'px';
        cursor.style.background = "rgba(" + pen_color.join() + "," + pen_alpha + ")";
        cursor.style.transform = "scale(" + pen_size + ")";
    }
    if (pen_mode == 0) {
        cursor.style.opacity = '1';
        if (typeof e.touches == 'object') {
            e = e.touches[0];
        }
        cursor.style.left = e.clientX - 12 + 'px';
        cursor.style.top = e.clientY - 12 + 'px';
        cursor.style.background = "rgba(240, 240, 240, 0.5)";
        cursor.style.transform = "scale(2)";
    }
}

// 画布相关
// 绘制
var ctx = canvas.getContext('2d');
var is_drawing = false;
var last_point = [0, 0];
var pen_size_adjusted;
canvas.addEventListener('mousedown', _draw);
canvas.addEventListener('touchstart', _draw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('mouseup', draw_);
canvas.addEventListener('touchend', draw_);
function _draw(e) {
    if (document.querySelector('.dialog-jumpToPage').classList.contains('dialog-open')) {
        toggleDialog('.dialog-jumpToPage');
    }
    if (document.querySelector('.dialog-about').classList.contains('dialog-open')) {
        toggleDialog('.dialog-about');
    }
    if (document.querySelector('.dialog-fillBg').classList.contains('dialog-open')) {
        toggleDialog('.dialog-fillBg');
    }
    if (typeof e.touches == 'object') {
        e = e.touches[0];
    }
    document.querySelectorAll(".toolbar").forEach(function (item) {
        item.style.pointerEvents = 'none';
    });
    var _clientX = e.clientX / document.body.clientWidth * canvas.width;
    var _clientY = e.clientY / document.body.clientHeight * canvas.height;
    is_drawing = true;
    last_point = [_clientX, _clientY];
    pen_size_adjusted = 0.1;
    draw(e);
}
function draw(e) {
    e.preventDefault();
    if (typeof e.touches == 'object') {
        e = e.touches[0];
    }
    var _clientX = e.clientX / document.body.clientWidth * canvas.width;
    var _clientY = e.clientY / document.body.clientHeight * canvas.height;
    if (is_drawing) {
        if (pen_mode == 1) {
            if (auto_color) {
                // 色相渐变
                pen_color = createRainbowChanger(pen_color)();
            }
            if (pen_size_adjusted < pen_size) {
                pen_size_adjusted += 0.05 / document.body.clientWidth * canvas.width;
            }
            var _color = "rgba(" + pen_color.join() + "," + pen_alpha + ")";
            var _size = pen_size_adjusted * 20 / document.body.clientWidth * canvas.width;
        }
        if (pen_mode == 0) {
            var _color = bgColor;
            var _size = 40 / document.body.clientWidth * canvas.width;
        }
        ctx.beginPath();
        ctx.moveTo(last_point[0], last_point[1]);
        ctx.lineTo(_clientX, _clientY);
        ctx.lineWidth = _size;
        ctx.strokeStyle = _color;
        ctx.stroke();
        if ((pen_mode == 1 && pen_alpha == 1) || pen_mode == 0) {
            ctx.beginPath();
            ctx.arc(_clientX, _clientY, _size / 2, 0, 2 * Math.PI);
            ctx.fillStyle = _color;
            ctx.fill();
        }
        last_point = [_clientX, _clientY];
    }
}
function draw_(e) {
    document.querySelectorAll(".toolbar").forEach(function (item) {
        item.style.pointerEvents = 'all';
    });
    is_drawing = false;
    canvasData[currentPage][0] = canvas.toDataURL();
    sendCanvasData();
    saveState(false, true);
}
// 多页面
var canvasData = [];
var currentPage = 0;
var img_canvas = document.createElement('img');
function prevPage() {
    loadPage(currentPage - 1);
}
function nextPage() {
    if (currentPage < canvasData.length - 1) {
        loadPage(currentPage + 1);
    } else {
        // 创建新页面
        bgColor = "#0f261e";
        ctx.fillStyle = "#0f261e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvasData.push([canvas.toDataURL(), bgColor]);
        saveState(true, true);
        currentPage++;
        document.querySelector('.page-number').textContent = currentPage + 1 + ' / ' + canvasData.length;
    }
}
function loadPage(page, clearStack = true) {
    if (page >= 0 && page < canvasData.length) {
        currentPage = page;
        img_canvas.src = canvasData[currentPage][0];
        bgColor = canvasData[currentPage][1];
        img_canvas.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img_canvas, 0, 0);
            if (clearStack) {
                saveState(true, true);
            } else {
                saveState(false, false);
            }
        }
        document.querySelector('.page-number').textContent = currentPage + 1 + ' / ' + canvasData.length;
        // 下一页 / 新建页面图标
        if (currentPage == canvasData.length - 1) {
            icon_nxtPg.src = "/static/icons/add.svg";
        } else {
            icon_nxtPg.src = "/static/icons/keyboard_arrow_right.svg";
        }
    }
}
// 调整画布大小
function resizeCanvas() {
    canvas.style.transform = `scale(${document.body.clientWidth / canvas.width}, ${document.body.clientHeight / canvas.height})`;
}
window.addEventListener('resize', resizeCanvas);
// 跳转页面
input_pageNumber.addEventListener('keydown', function (e) {
    if (e.keyCode == 13) {
        jumpToPage();
    }
});
function jumpToPage() {
    if (input_pageNumber.value == '') {
        toggleDialog('.dialog-jumpToPage');
        input_pageNumber.blur();
    } else {
        var _pageNumber = parseInt(input_pageNumber.value);
        if (_pageNumber > 0 && _pageNumber <= canvasData.length) {
            currentPage = _pageNumber - 1;
            loadPage(currentPage);
            toggleDialog('.dialog-jumpToPage');
            input_pageNumber.blur();
        } else {
            input_pageNumber.focus();
        }
        input_pageNumber.value = '';
    }
}

// 其他功能
// 保存
var a_saveCanvas = document.createElement('a');
function saveCanvas() {
    var _date = new Date();
    a_saveCanvas.href = canvas.toDataURL();
    a_saveCanvas.download = 'WebCanvas_' + _date.getFullYear() + '-' + String(_date.getMonth() + 1).padStart(2, '0') + '-' + String(_date.getDate()).padStart(2, '0') + '_' + String(_date.getHours()).padStart(2, '0') + '-' + String(_date.getMinutes()).padStart(2, '0') + '-' + String(_date.getSeconds()).padStart(2, '0') + '.png';
    a_saveCanvas.click();
}
// 长按填充背景色
btn_currentColor.addEventListener('mousedown', listenLongPress);
btn_currentColor.addEventListener('mouseup', stopLongPress);
btn_currentColor.addEventListener('touchstart', listenLongPress);
btn_currentColor.addEventListener('touchend', stopLongPress);
btn_currentColor.oncontextmenu = function () {
    toggleDialog('.dialog-fillBg');
}
function listenLongPress(e) {
    timer_longPress = setTimeout(() => {
        toggleDialog('.dialog-fillBg');
    }, 1000);
}
function stopLongPress(e) {
    clearTimeout(timer_longPress);
}
function fillBg() {
    var _color = "rgb(" + pen_color.join() + ")"
    ctx.fillStyle = _color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvasData[currentPage] = [canvas.toDataURL(), _color];
    saveState(false, true);
    toggleDialog('.dialog-fillBg');
    bgColor = _color;
    document.documentElement.style.backgroundColor = _color;
    document.body.style.backgroundColor = _color;
    sendCanvasData();
}
// 插入图片
var input_insertImage = document.createElement('input');
input_insertImage.type = 'file';
input_insertImage.accept = 'image/*';
input_insertImage.addEventListener('change', function () {
    var file = this.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        var img = new Image();
        img.src = reader.result;
        img.onload = function () {
            var _width = img.width;
            var _height = img.height;
            if (_width > canvas.width || _height > canvas.height) {
                if (_width / _height > canvas.width / canvas.height) {
                    _width = canvas.width;
                    _height = _width / img.width * img.height;
                } else {
                    _height = canvas.height;
                    _width = _height / img.height * img.width;
                }
            }
            var _x = (canvas.width - _width) / 2;
            var _y = (canvas.height - _height) / 2;
            ctx.drawImage(img, _x, _y, _width, _height);
            canvasData[currentPage][0] = canvas.toDataURL();
            saveState(false, true);
            sendCanvasData();
        }
    }
});
// 拖放导入图片
canvas.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    msg_box.innerHTML = '释放鼠标即可导入图片';
    msg_box.classList.add('msg-box-open');
});
canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    msg_box.classList.remove('msg-box-open');
    var file = e.dataTransfer.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        var img = new Image();
        img.src = reader.result;
        img.onload = function () {
            var _width = img.width;
            var _height = img.height;
            if (_width > canvas.width || _height > canvas.height) {
                if (_width / _height > canvas.width / canvas.height) {
                    _width = canvas.width;
                    _height = _width / img.width * img.height;
                } else {
                    _height = canvas.height;
                    _width = _height / img.height * img.width;
                }
            }
            var _x = (canvas.width - _width) / 2;
            var _y = (canvas.height - _height) / 2;
            ctx.drawImage(img, _x, _y, _width, _height);
            canvasData[currentPage][0] = canvas.toDataURL();
            saveState(false, true);
            sendCanvasData();
        }
    }
});
canvas.addEventListener('dragleave', function (e) {
    e.preventDefault();
    msg_box.classList.remove('msg-box-open');
});
// 撤销与重做
var undoStack = [];
var redoStack = [];
function saveState(clearUndo = false, clearRedo = false) {
    if (clearUndo) {
        undoStack = [];
    }
    if (clearRedo) {
        redoStack = [];
    }
    // 获取当前状态
    const currentState = [canvas.toDataURL(), bgColor];
    // 仅当状态变化时才入栈
    if (undoStack.length === 0 ||
        currentState[0] !== undoStack[undoStack.length - 1][0]) {
        undoStack.push(currentState);
    } else {
        undoStack[undoStack.length - 1] = currentState;
    }
}
function undo() {
    if (undoStack.length > 1) {
        canvasData[currentPage] = undoStack[undoStack.length - 2];
        redoStack.push(undoStack.pop());
        loadPage(currentPage, false);
        bgColor = canvasData[currentPage][1];
        sendCanvasData();
    }
}
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        canvasData[currentPage] = undoStack[undoStack.length - 1];
        loadPage(currentPage, false);
        bgColor = canvasData[currentPage][1];
        sendCanvasData();
    }
}

// 颜色处理
// Hex 转 RGB
function toRGB(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}
// 色相计算，代码由 DeepSeek R1 提供
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    let delta = max - min;
    if (delta === 0) {
        h = 0;
        s = 0;
    } else {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return [h, s, l];
}
function hslToRgb(h, s, l) {
    h %= 360;
    if (s === 0) {
        let val = Math.round(l * 255);
        return [val, val, val];
    }
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let hPrime = h / 60;
    let x = c * (1 - Math.abs((hPrime % 2) - 1));
    let rgb = [0, 0, 0];
    if (hPrime < 1) rgb = [c, x, 0];
    else if (hPrime < 2) rgb = [x, c, 0];
    else if (hPrime < 3) rgb = [0, c, x];
    else if (hPrime < 4) rgb = [0, x, c];
    else if (hPrime < 5) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    let m = l - c / 2;
    return rgb.map((val) => Math.round(Math.max(0, Math.min(255, (val + m) * 255))));
}
function createRainbowChanger(initialColor, step = 1) {
    let [r, g, b] = initialColor;
    let [h, s, l] = rgbToHsl(r, g, b);
    return function () {
        h = (h + step) % 360;
        return hslToRgb(h, s, l);
    };
}

// 网络相关
// 网络部分
// 生成随机代号
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * 36)];
    }
    return code;
}
var client_code = generateCode();
// 发送画布数据
function sendCanvasData() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/sendCanvasData');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ data: canvasData, client_code: client_code }));
}
// 接收画布数据
var lastTimestamp = -1;
var socket = io();
socket.on('canvasData', function (data) {
    if (data.data.length == 0) {
        saveState();
        sendCanvasData();
    } else if (data.client_code != client_code && data.timestamp > lastTimestamp) {
        canvasData = JSON.parse(data.data);
        loadPage(currentPage, false);
        lastTimestamp = data.timestamp;
    }
});
// 连接时获取画布数据
socket.on('connect', function () {
    socket.emit('getCanvasData');
});