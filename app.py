from flask import Flask, request
from flask_socketio import SocketIO
import json
import time
import os
import sys
import socket
import configparser
import webbrowser
from engineio.async_drivers import gevent

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)

# 从 config.ini 导入配置
config = configparser.ConfigParser()
config.read("config.ini")
server_port = config.getint("server", "port")
canvas_width = config.getint("canvas", "width")
canvas_height = config.getint("canvas", "height")

# 初始化 canvasData 为字符串
canvasData = ""

# 如果有参数，则使用参数中指定的画布数据文件，否则创建空画布
if len(sys.argv) > 1:
    dataFile = sys.argv[1]
    with open(dataFile, "r") as f:
        canvasData = f.read()
else:
    # 创建画布数据文件，记录时间
    if not os.path.exists("./data"):
        os.mkdir("data")
    dataFile = "./data/canvasData_" + time.strftime("%Y%m%d_%H%M%S") + ".txt"
    with open(dataFile, "w") as f:
        pass  # 保持文件为空字符串

@app.route("/api/getCanvasSize", methods=["GET"])
def getCanvasSize():
    return json.dumps({"width": canvas_width, "height": canvas_height})

@app.route("/api/sendCanvasData", methods=["POST"])
def sendCanvasData():
    client_ip = request.remote_addr
    global canvasData
    data = request.get_data()
    client_code = json.loads(data).get("client_code")
    # 将数据转为 JSON 字符串
    data_str = json.dumps(json.loads(data).get("data"))
    # 更新内存并写入文件
    canvasData = data_str
    with open(dataFile, "w") as f:
        f.write(data_str)
    # 广播字符串数据
    socketio.emit(
        "canvasData",
        {"data": data_str, "client_code": client_code, "timestamp": time.time()},
    )
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端",
        client_ip,
        "（代号",
        client_code + "）绘制内容。",
    )
    return "success"


@socketio.on("getCanvasData")
def handleClientData():
    client_ip = request.remote_addr
    # 直接发送内存中的字符串数据
    socketio.emit(
        "canvasData",
        {"data": canvasData, "client_code": "server", "timestamp": time.time()},
    )
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端",
        client_ip,
        "获取画布数据。",
    )


# 客户端连接
@socketio.on("connect")
def handle_connect():
    client_ip = request.remote_addr
    print("[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端", client_ip, "已连接。")


# 客户端断开
@socketio.on("disconnect")
def handle_disconnect():
    client_ip = request.remote_addr
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端", client_ip, "已断开连接。"
    )


@app.route("/favicon.ico")
def favicon():
    return app.send_static_file("favicon.ico")


@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    # 获取本机局域网 IP
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    server_ip = s.getsockname()[0] + ":" + str(server_port)
    s.close()
    # 输出时间、IP
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] WebCanvas 服务已启动，访问",
        "http://" + server_ip + "/",
        "开始使用。",
    )
    # 使用浏览器打开
    webbrowser.open("http://" + server_ip + "/")
    socketio.run(app, host="0.0.0.0", port=server_port, debug=False)
