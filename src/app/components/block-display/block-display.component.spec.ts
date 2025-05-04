import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlockDisplayComponent } from './block-display.component';

describe('BlockDisplayComponent', () => {
  let component: BlockDisplayComponent;
  let fixture: ComponentFixture<BlockDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BlockDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
