import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NbtInputComponent } from './nbt-input.component';

describe('NbtInputComponent', () => {
  let component: NbtInputComponent;
  let fixture: ComponentFixture<NbtInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NbtInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NbtInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
