import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimationPreviewComponent } from '../animation-preview.component';

describe('AnimationPreviewComponent', () => {
  let component: AnimationPreviewComponent;
  let fixture: ComponentFixture<AnimationPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimationPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimationPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
