// config 配置信息模板
// {
//   tagId: 'img-box',
//   img: {
//     url: "https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2018939532,1617516463&fm=26&gp=0.jpg",
//   },
//   description: [txt: '1111',]
// }

/**
 * canvas 文本换行
 */
CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
  if (typeof text != 'string' || typeof x != 'number' || typeof y != 'number') {
    return;
  }

  const context = this;
  const canvas = context.canvas;

  if (typeof maxWidth == 'undefined') {
    maxWidth = (canvas && canvas.width) || 300;
  }
  if (typeof lineHeight == 'undefined') {
    lineHeight = (canvas && parseInt(window.getComputedStyle(canvas).lineHeight)) || parseInt(window.getComputedStyle(document.body).lineHeight);
  }

  // 字符分隔为数组
  let arrText = text.split('');
  let line = '';

  for (var n = 0; n < arrText.length; n++) {
    var testLine = line + arrText[n];
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = arrText[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
};


class ImgDescription {
  constructor(config = {}, context) {
    this.context = context;
    if (!Object.keys(config).length) {
      return;
    }
    const {
      mountedTagId = "",
        img = {},
        description = []
    } = config;
    this.config = config; // 所有的配置信息
    this.mountedTagId = mountedTagId; // 目标 DOM 节点
    this.img = img;
    this.description = description; // 文本数组
    this.canvasId = 'ImgDescriptionCanvasId'; // canvas 标签 id
    this.canvasTag = null;
    this.ctx = null;
    this.canvasWidthHeight = { // 画布的宽高
      width: 500,
      height: 500
    }
    this.centerCoordinates = { // 中心坐标
      x: 0,
      y: 0
    }
    this.radius = 0; // 图片半径

    this.init();
  }

  init() {
    this.createCanvasDom();
    this.canvasInit();

    // 以 500 为基准，计算缩放比例
    const xScale = this.canvasWidthHeight.width / 500;
    const yScale = this.canvasWidthHeight.height / 500;
    this.ctx.scale(xScale, yScale); // x 和 y 方向全部进行缩放

    this.drawImg(); // 绘制图片

    // 获取文本描述列表
    const {
      description = []
    } = this.config;
    let count = description.length;
    let deg = 360 / count;
    for (let i = 0; i < count; i++) {
      this.drawText(deg * (i + 1), description[i]);
    }
  }

  /**
   * 创建 canvas DOM 节点
   */
  createCanvasDom() {
    if (!this.mountedTagId) {
      throw (new Error('目标挂载节点 id 不能为空！'));
    }
    const mountedDom = document.getElementById(this.mountedTagId); // 获取挂在的目标 DOM 节点
    const {
      clientWidth: width = 0,
      clientHeight: height = 0
    } = mountedDom;

    this.canvasWidthHeight = {
      width,
      height
    }

    this.centerCoordinates = { // 设置中心坐标
      x: Math.floor(width / 2),
      y: Math.floor(height / 2)
    }

    if (!mountedDom) {
      throw (new Error('目标节点为空！'));
    }
    const canvasDom = document.createElement('canvas');
    canvasDom.setAttribute('id', this.canvasId);
    canvasDom.setAttribute('width', width);
    canvasDom.setAttribute('height', height);
    mountedDom.appendChild(canvasDom);
  }

  /**
   * canvas 初始化
   */
  canvasInit() {
    this.canvasTag = document.getElementById(this.canvasId); // 获取canvas元素
    if (this.canvasTag.getContext) {
      this.ctx = this.canvasTag.getContext('2d'); // 获取'2d'context对象
    } else {
      throw (new Error('浏览器不支持 canvas !'));
    }
  }

  /**
   * 画图
   */
  drawImg() {
    const {
      url,
    } = this.img;
    const imgWidth = 160;
    const imgHeight = 160;
    // 图片半径，以宽高较短的边为基准
    this.radius = imgWidth <= imgHeight ? Math.floor(imgWidth / 2) : Math.floor(imgHeight / 2);
    // 获取中心坐标
    const {
      x: centerX,
      y: centerY
    } = this.centerCoordinates;
    // 图片的偏移量坐标
    const imgOffSetX = Math.floor(centerX - imgWidth / 2);
    const imgOffSetY = Math.floor(centerY - imgHeight / 2);

    const img = new Image(); // 创建图片对象
    img.src = url;
    img.onload = () => {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, this.radius, 0, 2 * Math.PI); // 绘制圆形区域
      this.ctx.clip(); // 裁剪
      this.ctx.drawImage(img, imgOffSetX, imgOffSetY, imgWidth, imgHeight); // 绘图
    };
  }

  /**
   * 画线
   * @param {*} rotateDeg ：旋转监角度，为每个描述占有的角度比例（360 / n）
   */
  drawText(rotateDeg, text) {
    const {
      x: centerX,
      y: centerY
    } = this.centerCoordinates;
    const radius = this.radius || 80; // 获取图片半径 todo:删除测试数据 80
    this.ctx.save(); // 保存状态到栈

    // 第一条线
    this.ctx.translate(centerX, centerY); // 以当前块的中心为坐标原点
    this.ctx.beginPath(); // 新建 path
    this.ctx.rotate(rotateDeg * Math.PI / 180); // 旋转
    this.ctx.moveTo(0, 0); // 把画笔移动到当前原点
    this.ctx.lineWidth = 1; // 设置线条宽度
    this.ctx.lineTo(0, -(radius + 60)); // 画线
    this.ctx.stroke(); //绘制路径
    this.ctx.closePath(); // 关闭 path

    // 第二条线
    this.ctx.translate(0, -(radius + 60)); // 以第一天线的结束坐标为坐标原点
    this.ctx.beginPath(); // 新建 path

    let sencondLineRotateDeg = 0; // 条线的旋转角度Math.abs(rotateDeg)
    if (rotateDeg > 0) {
      sencondLineRotateDeg = (90 - rotateDeg) * Math.PI / 180;
    }
    if (rotateDeg > 180) {
      sencondLineRotateDeg = (-90 - rotateDeg) * Math.PI / 180;
    }
    if (Math.abs(rotateDeg) % 90 == 0) {
      sencondLineRotateDeg = 0;
    }

    this.ctx.save(); // 保存状态到栈

    this.ctx.rotate(sencondLineRotateDeg); // 旋转
    this.ctx.moveTo(0, 0); // 把画笔移动到当前原点
    this.ctx.lineTo(0, -20); // 画线
    this.ctx.stroke(); //绘制路径
    this.ctx.closePath(); // 关闭 path

    this.ctx.restore(); // 恢复状态

    let textCoordinates = { // 文本坐标
      x: 0,
      y: 0
    }
    let textRotateDeg = 0;
    this.ctx.font = '14px sans-serif';
    this.ctx.textBaseline = 'top';
    if (rotateDeg > 0) {
      textRotateDeg = (0 - rotateDeg) * Math.PI / 180;
      textCoordinates = {
        x: 25,
        y: -10
      }
    }
    if (rotateDeg == 90) {
      textRotateDeg = (-0 - rotateDeg) * Math.PI / 180;
      textCoordinates = {
        x: 25,
        y: 0
      }
    }
    if (rotateDeg == 180) {
      textRotateDeg = (-0 - rotateDeg) * Math.PI / 180;
      textCoordinates = {
        x: -35,
        y: 25
      }
    }
    if (rotateDeg > 180) {
      textRotateDeg = (-0 - rotateDeg) * Math.PI / 180;
      textCoordinates = {
        x: -95,
        y: -10
      }
    }
    if (rotateDeg == 360) {
      textRotateDeg = (-0 - rotateDeg) * Math.PI / 180;
      if (text.length <= 5) {
        textCoordinates = {
          x: -35,
          y: -35
        }
      } else if (text.length <= 10 && text.length > 5) {
        textCoordinates = {
          x: -35,
          y: -50
        }
      } else {
        textCoordinates = {
          x: -35,
          y: -70
        }
      }
    }
    this.ctx.rotate(textRotateDeg); // 旋转
    this.ctx.wrapText(text, textCoordinates.x, textCoordinates.y, 80, 16); // 绘制文字
    this.ctx.restore(); // 恢复状态
  }
}