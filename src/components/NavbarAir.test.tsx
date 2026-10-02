import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ThemeProvider } from '../lib/theme';
import { LanguageProvider } from '../lib/i18n';
import { NavbarAir } from './NavbarAir';
import { SECTION_ANCHOR_OFFSET_PX } from '../lib/use-active-section';

/* The mobile drawer was never covered: the page-wide axe sweep in App.test
   only ever ran with the menu closed, so the suite links inside it shipped
   with no accessible name at all, and the drawer had no dismissal path other
   than the toggle itself. The scroll spy is new behaviour and is pinned here
   because it is invisible to a type checker and easy to silently break. */

const SECTION_IDS = ['radar', 'simulator', 'uld', 'cargovillage', 'corridors', 'tracker'];

/** jsdom has no layout: place each section by hand so the spy has geometry. */
function layoutSections(topById: Record<string, number>) {
  for (const id of SECTION_IDS) {
    const element = document.getElementById(id)!;
    const top = topById[id];
    element.getBoundingClientRect = () =>
      ({ top, bottom: top + 500, left: 0, right: 0, width: 0, height: 500, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
  }
}

function renderNavbar() {
  const main = document.createElement('main');
  for (const id of SECTION_IDS) {
    const section = document.createElement('section');
    section.id = id;
    main.appendChild(section);
  }
  document.body.appendChild(main);

  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 8000, configurable: true });

  return render(
    <ThemeProvider>
      <LanguageProvider>
        <NavbarAir onOpenAwbModal={() => undefined} />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

/** Drive one scroll pass and let the rAF-coalesced measurement land. */
async function scrollTo(y: number) {
  await act(async () => {
    window.scrollY = y;
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

beforeEach(() => {
  window.scrollY = 0;
});

afterEach(() => {
  document.querySelectorAll('main').forEach((element) => element.remove());
});

describe('navbar section tracking', () => {
  it('reads the page below the point an anchor click parks a section', () => {
    // Fixtures below are laid out around this line; if it moves they must too.
    expect(SECTION_ANCHOR_OFFSET_PX).toBe(136);
  });

  it('marks the section under the reading line as current, in both navigations', async () => {
    renderNavbar();
    // `simulator` straddles the reading line; everything else is clear of it.
    layoutSections({ radar: -900, simulator: 50, uld: 700, cargovillage: 1300, corridors: 1900, tracker: 2500 });
    await scrollTo(1000);

    const desktopNav = screen.getByRole('navigation', { name: /page sections/i });
    await waitFor(() =>
      expect(within(desktopNav).getByRole('link', { name: 'SIMULATOR' })).toHaveAttribute('aria-current', 'true'),
    );
    expect(within(desktopNav).getByRole('link', { name: 'RADAR' })).not.toHaveAttribute('aria-current');

    // Exactly one anchor may claim the position at a time.
    expect(within(desktopNav).getAllByRole('link').filter((a) => a.getAttribute('aria-current'))).toHaveLength(1);
  });

  it('follows the reader to the next section', async () => {
    renderNavbar();
    // Each section is 500px tall, so cargovillage ends above the reading line
    // and corridors is the one straddling it.
    layoutSections({ radar: -2400, simulator: -1800, uld: -1200, cargovillage: -600, corridors: 60, tracker: 800 });
    await scrollTo(3000);

    const desktopNav = screen.getByRole('navigation', { name: /page sections/i });
    await waitFor(() =>
      expect(within(desktopNav).getByRole('link', { name: 'CORRIDORS' })).toHaveAttribute('aria-current', 'true'),
    );
  });

  it('claims no section while the reader is still above the first one', async () => {
    renderNavbar();
    layoutSections({ radar: 900, simulator: 1500, uld: 2100, cargovillage: 2700, corridors: 3300, tracker: 3900 });
    await scrollTo(0);

    const desktopNav = screen.getByRole('navigation', { name: /page sections/i });
    for (const link of within(desktopNav).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });
});

describe('navbar mobile drawer', () => {
  it('gives every suite control an accessible name and no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = renderNavbar();

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const drawerNav = screen.getByRole('navigation', { name: /navigation menu/i });
    expect(within(drawerNav).getAllByRole('link')).toHaveLength(6);

    /* Icon-only suite entries: previously `<a>` elements with an icon and
       nothing else, i.e. links with no name at all. */
    for (const name of ['Hub', 'Land', 'Ocean']) {
      expect(screen.getAllByRole('link', { name }).length).toBeGreaterThan(0);
    }

    // The surface you are already on is a label, not a link to itself.
    expect(screen.queryByRole('link', { name: 'Air' })).not.toBeInTheDocument();

    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it('closes on Escape and returns focus to the toggle', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggle = screen.getByRole('button', { name: /open menu/i });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveFocus();
  });

  it('closes when the reader interacts with the page behind it', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    await user.click(document.querySelector('main')!);

    await waitFor(() => expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument());
  });

  it('wires the toggle to the drawer it controls', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggle = screen.getByRole('button', { name: /open menu/i });
    await user.click(toggle);

    const controls = screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls!)).not.toBeNull();
  });
});
