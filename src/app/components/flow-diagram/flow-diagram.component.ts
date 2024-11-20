import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';
import Konva from 'konva';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  imgSrc: string;
  color: string;
  isDeleted?: boolean;
}

interface Connector {
  startNode: string;
  endNode: string;
  color: string;
  isDeleted?: boolean;
}

@Component({
  selector: 'app-flow-diagram',
  templateUrl: './flow-diagram.component.html',
  styleUrls: ['./flow-diagram.component.scss']
})
export class FlowDiagramComponent implements OnInit {
  stageConfig: any;
  layerConfig: any;
  companyID: string = '';
  nodes: Node[] = [];
  connectors: Connector[] = [];
  showTutorial: boolean = true;
  userData: any = ''
  layer: any;
  stage: any;
  icons: string[] = [
    'assets/svg/30.svg',
    'assets/svg/31.svg',
    'assets/svg/32.svg',
    'assets/svg/33.svg',
    'assets/svg/1.svg',
    'assets/svg/2.svg',
    'assets/svg/3.svg',
    'assets/svg/4.svg',
    'assets/svg/6.svg',
    'assets/svg/7.svg',
    'assets/svg/8.svg',
    'assets/svg/9.svg',
    'assets/svg/10.svg',
    'assets/svg/11.svg',
    'assets/svg/12.svg',
    'assets/svg/13.svg',
    'assets/svg/14.svg',
    'assets/svg/15.svg',
    'assets/svg/16.svg',
    // 'assets/svg/17.svg',
    'assets/svg/18.svg',
    'assets/svg/19.svg',
    // 'assets/svg/20.svg',
    'assets/svg/21.svg',
    'assets/svg/22.svg',
    'assets/svg/23.svg',
    'assets/svg/24.svg',
    'assets/svg/25.svg',
    'assets/svg/26.svg',
    'assets/svg/27.svg',
    // 'assets/svg/28.svg',
    'assets/svg/29.svg',
  ];

  selectedNode: Node | null = null;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {


    console.log(this.showTutorial)
    const container = document.getElementById('container');
    const containerWidth = container?.offsetWidth || 800;
    const containerHeight = Math.min(window.innerHeight * 0.85);

    this.stageConfig = { width: containerWidth, height: containerHeight };
    this.layer = new Konva.Layer();
    this.stage = new Konva.Stage({
      container: 'container',
      width: containerWidth,
      height: containerHeight
    });

    this.stage.add(this.layer);


    this.stage.on('wheel', (e: any) => {
      e.evt.preventDefault();
      this.handleZoom(e);
    });

  }

  handleCloseModal() {
    this.showTutorial = false;
  }

  handleSkipTutorial() {
    this.showTutorial = false;
  }


  initializeStage() {
    const container = document.getElementById('container');
    const containerWidth = container?.offsetWidth || 800;
    const containerHeight = 700;

    this.layer = new Konva.Layer();
    this.stage = new Konva.Stage({
      container: 'container',
      width: containerWidth,
      height: containerHeight,
    });

    this.stage.add(this.layer);

    this.stage.on('wheel', (e: any) => {
      e.evt.preventDefault();
      this.handleZoom(e);
    });

    window.addEventListener('resize', this.resizeStage.bind(this));
  }


  clearDiagram() {

    this.layer.find('.node').forEach((node: Konva.Node) => node.destroy());


    this.layer.find((node: Konva.Node) => node.name().startsWith('connector-')).forEach((connector: Konva.Node) => connector.destroy());

    this.layer.batchDraw();
  }



  handleZoom(e: any) {
    const oldScale = this.stage.scaleX();
    const pointer = this.stage.getPointerPosition();

    const zoomScaleBy = 1.1;
    let newScale = e.evt.deltaY > 0 ? oldScale / zoomScaleBy : oldScale * zoomScaleBy;


    newScale = Math.max(0.5, Math.min(newScale, 2));

    const mousePointTo = {
      x: pointer.x / oldScale - this.stage.x() / oldScale,
      y: pointer.y / oldScale - this.stage.y() / oldScale
    };

    this.stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: -(mousePointTo.x - pointer.x / newScale) * newScale,
      y: -(mousePointTo.y - pointer.y / newScale) * newScale
    };

    this.stage.position(newPos);
    this.stage.batchDraw();
  }


  ngAfterViewInit() {
    window.addEventListener('resize', this.resizeStage.bind(this));
  }

  resizeStage() {
    const container = document.getElementById('container');
    const containerWidth = container?.offsetWidth || 800;
    const containerHeight = container?.offsetHeight || 600;

    this.stage.width(containerWidth);
    this.stage.height(containerHeight);
    this.stage.batchDraw();
  }

  createNode(node: Node, color?: string) {

    const svgColor = color || node.color || '#000000';


    this.loadSVGWithColor(node.imgSrc, svgColor, (imageObj) => {
      const konvaImage = new Konva.Image({
        x: node.x,
        y: node.y,
        image: imageObj,
        width: 100,
        height: 100,
        draggable: true,
        name: 'node'
      });

      const konvaText = new Konva.Text({
        x: node.x,
        y: node.y + 110,
        text: node.name,
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: 'black',
        width: 100,
        align: 'center',
        name: 'text'
      });


      konvaImage.on('contextmenu', (e) => {
        e.evt.preventDefault();
        this.showContextMenu(e.evt.clientX, e.evt.clientY, node, konvaImage, konvaText);
      });


      konvaImage.on('dragmove', () => {
        node.x = konvaImage.x();
        node.y = konvaImage.y();
        konvaText.position({
          x: konvaImage.x(),
          y: konvaImage.y() + 110
        });

        this.updateConnectors();
        this.layer.batchDraw();
      });


      konvaText.on('dblclick', () => {
        this.editText(konvaText, node);
      });


      konvaImage.on('dblclick', () => {
        if (!this.selectedNode) {
          this.selectedNode = node;
        } else {
          if (this.selectedNode.id !== node.id) {
            const newConnector: Connector = { startNode: this.selectedNode.id, endNode: node.id, color: node.color };
            this.connectors.push(newConnector);
            this.createConnectors(newConnector);
          }
          this.selectedNode = null;
        }
      });

      this.layer.add(konvaImage);
      this.layer.add(konvaText);
      this.layer.draw();
    });
  }


  loadSVGWithColor(url: string, color: string, callback: (image: HTMLImageElement) => void) {
    fetch(url)
      .then(response => response.text())
      .then(data => {

        const coloredSVG = data
          .replace(/fill="[^"]*"/g, `fill="${color}"`)
          .replace(/style="[^"]*fill:[^;]*;/g, `style="fill:${color};`)
          .replace(/\.st\d+\s*{\s*fill:[^;]*;/g, (match) => match.replace(/fill:[^;]*;/, `fill:${color};`));

        const svgBlob = new Blob([coloredSVG], { type: 'image/svg+xml' });
        const newUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(newUrl);
          callback(img);
        };
        img.src = newUrl;
      });
  }





  showContextMenu(x: number, y: number, node: Node, konvaImage: Konva.Image, konvaText: Konva.Text) {
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid black';
    menu.style.padding = '5px';
    menu.style.zIndex = '1000';


    const renameOption = document.createElement('div');
    renameOption.innerText = 'Renombrar';
    renameOption.style.cursor = 'pointer';
    renameOption.style.margin = '5px';

    renameOption.addEventListener('click', () => {
      const newName = prompt('Enter new name:', node.name);
      if (newName !== null && newName.trim() !== '') {
        node.name = newName;
        konvaText.text(newName);
        this.layer.batchDraw();
      }
      document.body.removeChild(menu);
    });


    const deleteOption = document.createElement('div');
    deleteOption.innerText = 'Borrar';
    deleteOption.style.cursor = 'pointer';
    deleteOption.style.color = 'red';
    deleteOption.style.margin = '0 5px 5px 5px';

    deleteOption.addEventListener('click', () => {

      node.isDeleted = true;


      konvaImage.hide();
      konvaText.hide();


      this.connectors.forEach(conn => {
        if (conn.startNode === node.id || conn.endNode === node.id) {
          conn.isDeleted = true;


          const line = this.layer.findOne(`.connector-${conn.startNode}-${conn.endNode}`);
          if (line) {
            line.hide();
          }
        }
      });

      this.layer.batchDraw();
      document.body.removeChild(menu);
    });




const colors = [
  { color: '#4B91CB', label: 'Azul' },
  { color: '#FFBA49', label: 'Amarillo' },
  { color: '#9FD09F', label: 'Verde' }
];

colors.forEach(({ color, label }) => {
  const colorOption = document.createElement('div');
  colorOption.innerText = `Cambiar a ${label}`;
  colorOption.style.cursor = 'pointer';
  colorOption.style.padding = '5px';

  colorOption.addEventListener('click', () => {

    node.color = color;


    this.createNode(node, color);
    konvaImage.destroy();
    konvaText.destroy();
    document.body.removeChild(menu);
  });

  menu.appendChild(colorOption);
});


    menu.appendChild(renameOption);
    menu.appendChild(deleteOption);
    document.body.appendChild(menu);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!menu.contains(target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', handleClickOutside);
      }
    };

    document.addEventListener('click', handleClickOutside);
  }


editText(konvaText: Konva.Text, node: Node) {
  const stage = this.stage;
  const textPosition = konvaText.getAbsolutePosition();
  const stageBox = stage.container().getBoundingClientRect();
  const input = document.createElement('input');
  document.body.appendChild(input);

  input.value = konvaText.text();
  input.style.position = 'absolute';
  input.style.top = `${textPosition.y + stageBox.top}px`;
  input.style.left = `${textPosition.x + stageBox.left}px`;
  input.style.width = `${konvaText.width()}px`;
  input.style.fontSize = '18px';
  input.style.fontFamily = 'Calibri';
  input.style.padding = '0';
  input.style.margin = '0';
  input.style.border = '1px solid black';

  input.focus();

  const removeInput = () => {
    if (input.value.trim() !== '') {
      node.name = input.value;
      konvaText.text(input.value);
    }
    this.layer.batchDraw();
    document.body.removeChild(input);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      removeInput();
    }
  });

  input.addEventListener('blur', removeInput);
}

onDrop(event: DragEvent) {
  event.preventDefault();

  const imgSrc = event.dataTransfer?.getData('text/plain');
  const stageBox = this.stage.container().getBoundingClientRect();

  const scale = this.stage.scaleX();
  const stageX = this.stage.x();
  const stageY = this.stage.y();


  const position = {
    x: (event.clientX - stageBox.left - stageX) / scale,
    y: (event.clientY - stageBox.top - stageY) / scale
  };

  if (imgSrc && position) {
    const newNode: Node = {
      id: (this.nodes.length + 1).toString(),
      name: `Nodo ${this.nodes.length + 1}`,
      x: position.x,
      y: position.y,
      imgSrc: imgSrc,
      color: '#808080'
    };

    this.nodes.push(newNode);
    this.createNode(newNode);
  }
}


  onDragStart(event: DragEvent, icon: string) {
    event.dataTransfer?.setData('text/plain', icon);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  createNodes(): Promise<void> {
    return new Promise((resolve) => {

      const existingNodes = this.layer.find('.node') as Konva.Node[];
      const existingTexts = this.layer.find('.text') as Konva.Text[];


      existingNodes.forEach((node: Konva.Node) => {
        const nodeId = node.attrs.id;
        if (!this.nodes.some((n) => n.id === nodeId)) {
          node.destroy();
        }
      });

      existingTexts.forEach((text: Konva.Text) => {
        const textId = text.attrs.id;
        if (!this.nodes.some((n) => n.id === textId)) {
          text.destroy();
        }
      });


      this.nodes.forEach(node => {
        const konvaNode = this.layer.findOne(`.node[id="${node.id}"]`);
        const konvaText = this.layer.findOne(`.text[id="${node.id}"]`);

        if (!konvaNode || !konvaText) {
          this.createNode(node);
        }
      });


      this.layer.batchDraw();
      resolve();
    });
  }

  showContextMenuForLine(line: Konva.Line, x: number, y: number, connector: Connector) {
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid black';
    menu.style.padding = '5px';
    menu.style.zIndex = '1000';

    const colors = [
      { color: '#4B91CB', label: 'Azul' },
      { color: '#FFBA49', label: 'Amarillo' },
      { color: '#9FD09F', label: 'Verde' }
    ];

    colors.forEach(({ color, label }) => {
      const colorOption = document.createElement('div');
      colorOption.innerText = `Cambiar a ${label}`;
      colorOption.style.cursor = 'pointer';
      colorOption.style.padding = '5px';

      colorOption.addEventListener('click', () => {

        const connectorIndex = this.connectors.findIndex(c =>
          c.startNode === connector.startNode && c.endNode === connector.endNode
        );
        if (connectorIndex !== -1) {
          this.connectors[connectorIndex].color = color;
        }


        line.stroke(color);
        this.layer.batchDraw();
        document.body.removeChild(menu);
      });

      menu.appendChild(colorOption);
    });

    const deleteOption = document.createElement('div');
    deleteOption.innerText = 'Borrar';
    deleteOption.style.cursor = 'pointer';
    deleteOption.style.color = 'red';
    deleteOption.style.margin = '5px 0px 0px 5px';

    deleteOption.addEventListener('click', () => {

      connector.isDeleted = true;


      line.hide();

      this.layer.batchDraw();
      document.body.removeChild(menu);
    });

    menu.appendChild(deleteOption);
    document.body.appendChild(menu);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!menu.contains(target)) {
        document.body.removeChild(menu);
        document.removeEventListener('click', handleClickOutside);
      }
    };

    document.addEventListener('click', handleClickOutside);
  }


  createConnectors(connector?: Connector) {
    if (connector) {
        const startNode = this.nodes.find(n => n.id === connector.startNode);
        const endNode = this.nodes.find(n => n.id === connector.endNode);

        if (startNode && endNode) {
            const arrow = new Konva.Arrow({
                points: this.calculateConnectorPoints(startNode, endNode),
                stroke: connector.color || 'orange',
                strokeWidth: 15,
                dash: [30, 5],
                tension: 0.03,
                pointerLength: 10,
                pointerWidth: 10,
                name: `connector-${connector.startNode}-${connector.endNode}`,
                draggable: false
            });

            // Añadir la animación de desplazamiento en reversa a dos tercios de la velocidad
            const anim = new Konva.Animation((frame) => {
                if (frame) {
                    const dashOffset = -(frame.time / 45) % 35; // Reversa y dos tercios de la velocidad original
                    arrow.dashOffset(dashOffset);
                }
            }, this.layer);
            anim.start();

            arrow.on('contextmenu', (e) => {
                e.evt.preventDefault();
                // anim.stop();
                this.showContextMenuForLine(arrow, e.evt.clientX, e.evt.clientY, connector);
            });

            this.layer.add(arrow);
            arrow.moveToBottom();
            this.layer.draw();
        }
    } else {
        this.connectors.forEach(conn => {
            const startNode = this.nodes.find(n => n.id === conn.startNode);
            const endNode = this.nodes.find(n => n.id === conn.endNode);

            if (startNode && endNode) {
                const arrow = new Konva.Arrow({
                    points: this.calculateConnectorPoints(startNode, endNode),
                    stroke: conn.color || 'orange',
                    strokeWidth: 15,
                    dash: [30, 5],
                    tension: 0.03,
                    pointerLength: 10,
                    pointerWidth: 10,
                    name: `connector-${conn.startNode}-${conn.endNode}`,
                    draggable: false
                });

                // Añadir la animación de desplazamiento en reversa a dos tercios de la velocidad
                const anim = new Konva.Animation((frame) => {
                    if (frame) {
                        const dashOffset = -(frame.time / 45) % 35; // Reversa y dos tercios de la velocidad original
                        arrow.dashOffset(dashOffset);
                    }
                }, this.layer);
                anim.start();

                arrow.on('contextmenu', (e) => {
                    e.evt.preventDefault();
                    anim.stop(); // Detener la animación temporalmente cuando se abre el menú contextual
                    this.showContextMenuForLine(arrow, e.evt.clientX, e.evt.clientY, conn);
                });

                this.layer.add(arrow);
                arrow.moveToBottom();
            }
        });

        this.layer.draw();
    }
}


  updateConnectors() {
    this.connectors.forEach(connector => {
      const startNode = this.nodes.find(n => n.id === connector.startNode);
      const endNode = this.nodes.find(n => n.id === connector.endNode);

      if (startNode && endNode) {
        const line = this.layer.findOne(`.connector-${connector.startNode}-${connector.endNode}`);
        if (line) {
          line.points(this.calculateConnectorPoints(startNode, endNode));
        }
      }
    });

    this.layer.batchDraw();
  }

  calculateConnectorPoints(startNode: Node, endNode: Node): number[] {
    const nodeRadius = 50;


    const startX = startNode.x + nodeRadius;
    const startY = startNode.y + nodeRadius;
    const endX = endNode.x + nodeRadius;
    const endY = endNode.y + nodeRadius;


    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);


    const startAdjustedX = startX + (deltaX * nodeRadius) / distance;
    const startAdjustedY = startY + (deltaY * nodeRadius) / distance;
    const endAdjustedX = endX - (deltaX * nodeRadius) / distance;
    const endAdjustedY = endY - (deltaY * nodeRadius) / distance;


    const midX = (startAdjustedX + endAdjustedX) / 2;

    return [startAdjustedX, startAdjustedY, midX, startAdjustedY, midX, endAdjustedY, endAdjustedX, endAdjustedY];
  }


  redrawDiagram() {

    this.layer.destroyChildren();


    this.nodes.forEach(node => {
      if (!node.isDeleted) {
        this.createNode(node);
      }
    });


    this.connectors.forEach(connector => {
      if (!connector.isDeleted) {
        this.createConnectors(connector);
      }
    });

    this.layer.batchDraw();
  }


updateConnectorNodeId(oldNodeId: string, newNodeId: string) {

  this.connectors = this.connectors.map((connector) => {
    if (connector.startNode === oldNodeId) {
      console.log(`Actualizando startNode del conector de ${oldNodeId} a ${newNodeId}`);
      return {
        ...connector,
        startNode: newNodeId
      };
    }
    if (connector.endNode === oldNodeId) {
      console.log(`Actualizando endNode del conector de ${oldNodeId} a ${newNodeId}`);
      return {
        ...connector,
        endNode: newNodeId
      };
    }
    return connector;
  });
}


closeTutorial() {
  this.showTutorial = false;
}

downloadImage() {
  const captureDiv = document.getElementById('container');

  if (captureDiv) {
    html2canvas(captureDiv).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'diagrama.png';
      link.click();
    });
  }
}

}
