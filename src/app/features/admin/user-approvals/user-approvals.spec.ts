import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserApprovals } from './user-approvals';

describe('UserApprovals', () => {
  let component: UserApprovals;
  let fixture: ComponentFixture<UserApprovals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserApprovals],
    }).compileComponents();

    fixture = TestBed.createComponent(UserApprovals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
