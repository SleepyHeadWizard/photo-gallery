import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImageDetailModalComponent } from './image-detail-modal.component';

describe('ImageDetailModalComponent', () => {
  let component: ImageDetailModalComponent;
  let fixture: ComponentFixture<ImageDetailModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ImageDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
