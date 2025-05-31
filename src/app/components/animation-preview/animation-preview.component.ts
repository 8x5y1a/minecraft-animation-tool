import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { BlockData } from 'src/app/types/type';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshNormalMaterial,
  Mesh,
  Object3DEventMap,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-animation-preview',
  imports: [CommonModule, MatButton],
  templateUrl: './animation-preview.component.html',
  styleUrl: './animation-preview.component.css',
})
export class AnimationPreviewComponent implements OnInit {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  private blockList: BlockData[] = [];
  private cubes: Mesh<BoxGeometry, MeshNormalMaterial, Object3DEventMap>[] = [];
  private scene: Scene = new Scene();

  constructor(private nbtService: NbtDataService) {
    this.nbtService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((blockList) => {
        this.blockList = blockList;
      });
  }

  ngOnInit(): void {
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvasContainer.nativeElement.appendChild(renderer.domElement);

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshNormalMaterial();

    this.blockList.forEach((block) => {
      const cube = new Mesh(geometry, material);
      cube.position.set(block.position.x, block.position.y, block.position.z);
      scene.add(cube);
    });

    camera.position.z = 20;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  }

  //TODO: Use gsap to animate?
}
