import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenerateCommandComponent } from './generate-command.component';

describe('GenerateCommandComponent', () => {
  let component: GenerateCommandComponent;
  let fixture: ComponentFixture<GenerateCommandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateCommandComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
