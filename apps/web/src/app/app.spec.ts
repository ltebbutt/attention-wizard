import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { WizardAvatar } from './wizard/wizard-avatar';

describe('App shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('creates the app with the wizard in the header (WIZ-01)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('aw-wizard-avatar svg')).toBeTruthy();
    expect(compiled.querySelector('.wordmark')?.textContent).toContain('Attention Wizard');
  });
});

describe('WizardAvatar (spec 002)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WizardAvatar] }).compileComponents();
  });

  const STATES = ['idle', 'thinking', 'celebrating', 'concerned'] as const;
  const SIZES = { sm: 32, md: 56, lg: 96 } as const;

  it('AC-1: renders all four states at all three sizes', () => {
    for (const state of STATES) {
      for (const [size, px] of Object.entries(SIZES)) {
        const fixture = TestBed.createComponent(WizardAvatar);
        fixture.componentRef.setInput('state', state);
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        const svg: SVGElement = fixture.nativeElement.querySelector('svg');
        expect(svg).withContext(`${state}/${size}`).toBeTruthy();
        expect(svg.getAttribute('width')).toBe(String(px));
        expect(svg.classList.contains(`wiz-${state}`)).toBeTrue();
      }
    }
  });

  it('uses only design tokens for colour (DS-01)', () => {
    const fixture = TestBed.createComponent(WizardAvatar);
    fixture.detectChanges();
    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    const fills = [...svg.querySelectorAll('[fill]')]
      .map((el) => el.getAttribute('fill')!)
      .filter((f) => f !== 'none');
    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) {
      expect(fill.startsWith('var(--aw-')).withContext(fill).toBeTrue();
    }
  });
});
