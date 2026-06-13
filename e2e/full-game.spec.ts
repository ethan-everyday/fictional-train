/**
 * The money test: a host screen and two phones play an ENTIRE seven-WEEK
 * game (St Sebastian, 1348) to the epilogue, then start a second game
 * (regression for the once-guard softlock), all against the real built
 * product served by server.js — the exact thing a Steam player would run.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

test.describe.configure({ mode: "serial" });

/** Pass the title screen (Start) and read the lobby's room code. */
async function readRoomCode(host: Page): Promise<string> {
  await host.getByRole("button", { name: "Start", exact: true }).click();
  const codeEl = host.locator("p.font-mono.text-7xl");
  await expect(codeEl).toBeVisible({ timeout: 20_000 });
  const code = (await codeEl.textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-Z0-9]{4}$/);
  return code;
}

async function joinAsPhone(
  context: BrowserContext,
  code: string,
  name: string,
): Promise<Page> {
  const phone = await context.newPage();
  await phone.goto("/play");
  await phone.getByPlaceholder("ABCD").fill(code);
  await phone.getByPlaceholder("Maria").fill(name);
  await phone.getByRole("button", { name: "Join" }).click();
  // Character creation: pick a role and a background, then enter.
  await expect(phone.getByText("Who are you?")).toBeVisible({ timeout: 30_000 });
  await phone.getByRole("button", { name: /Knight/ }).click();
  await phone.getByRole("button", { name: /Villein/ }).click();
  await phone.getByRole("button", { name: "Enter Hollowbrook" }).click();
  await expect(phone.getByText(/You're in/)).toBeVisible();
  return phone;
}

/** BEGIN THE WEEK, then read the Herald's prologue and make landfall. */
async function beginGame(host: Page): Promise<void> {
  await host.getByRole("button", { name: "BEGIN THE WEEK" }).click();
  await host.getByRole("button", { name: "Make landfall →" }).click();
}

/** Pick an activity, ride the event to its end, sleep on it. */
async function playStorylet(phone: Page): Promise<void> {
  await expect(phone.getByText(/Where will you go\?/)).toBeHidden({
    timeout: 30_000,
  });
  for (let i = 0; i < 40; i++) {
    if (await phone.getByText("Your week is over").isVisible().catch(() => false)) return;
    if (await phone.getByText("The week resolves").isVisible().catch(() => false)) return;

    const sleep = phone.getByRole("button", { name: "Sleep on it →" });
    if (await sleep.isVisible().catch(() => false)) {
      await sleep.click();
      continue;
    }
    const cont = phone.getByRole("button", { name: "Continue…" });
    if (await cont.isVisible().catch(() => false)) {
      await cont.click();
      continue;
    }
    // Activity buttons or in-event choice buttons: take the first.
    const choice = phone.locator("main button:not([disabled])").first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
      continue;
    }
    await phone.waitForTimeout(250);
  }
  const content = await phone.locator("body").innerText().catch(() => "<unreadable>");
  throw new Error(`storylet never completed; phone shows:\n${content}`);
}

async function playWeek(
  host: Page,
  phones: Page[],
  week: number,
): Promise<void> {
  await expect(host.getByText(`WEEK ${week}`, { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    host.getByText(`Week ${week} · Where is everyone going?`),
  ).toBeVisible({ timeout: 30_000 });

  // Each phone picks the first OPEN location from its preference list (drama
  // events can close a location in the late weeks).
  const prefs = [
    ["The Tavern", "The Market", "The Church"],
    ["The Docks", "The Slums", "The Church"],
  ];
  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];
    await expect(
      phone.getByText(`Week ${week} · Where will you go?`),
    ).toBeVisible({ timeout: 30_000 });
    let picked = false;
    for (const name of prefs[i % prefs.length]) {
      const btn = phone.getByRole("button", { name: new RegExp(name) });
      if (
        (await btn.isVisible().catch(() => false)) &&
        (await btn.isEnabled().catch(() => false))
      ) {
        await btn.click();
        picked = true;
        break;
      }
    }
    expect(picked, `phone ${i} found an open location`).toBe(true);
  }

  for (const phone of phones) {
    await playStorylet(phone);
  }

  await expect(host.getByText(`Around the fire, week ${week}`)).toBeVisible({
    timeout: 30_000,
  });
  const advance =
    week >= 7
      ? host.getByRole("button", { name: "To the reckoning →" })
      : host.getByRole("button", { name: `On to week ${week + 1} →` });
  await advance.click();
}

test("two phones play a full seven-week game, then start a second", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const phoneAContext = await browser.newContext();
  const phoneBContext = await browser.newContext();

  const host = await hostContext.newPage();
  await host.goto("/host");
  const code = await readRoomCode(host);

  const alice = await joinAsPhone(phoneAContext, code, "Alice");
  const bob = await joinAsPhone(phoneBContext, code, "Bob");

  await expect(host.getByText("2 of 2 have chosen their lot")).toBeVisible({
    timeout: 30_000,
  });
  await expect(host.getByText("Alice")).toBeVisible();
  await expect(host.getByText("Bob")).toBeVisible();

  await beginGame(host);

  for (let week = 1; week <= 7; week++) {
    await playWeek(host, [alice, bob], week);
  }

  // The reckoning: the town's fate + voting.
  await expect(host.getByText("THE SEVENTH WEEK ENDS")).toBeVisible({
    timeout: 30_000,
  });
  await expect(alice.getByText("The week is over")).toBeVisible();
  await alice.getByRole("button", { name: "Bob" }).click();
  await bob.getByRole("button", { name: "Alice" }).click();
  await expect(host.getByText("2/2 voted")).toBeVisible();

  await host.getByRole("button", { name: "END THE WEEK" }).click();

  // Epilogue: scoreboard + each player's seven-week recap.
  await expect(host.getByText("SEVEN WEEKS, ENDED")).toBeVisible();
  await expect(host.getByText("What became of each of you")).toBeVisible();
  await expect(host.getByText("W7", { exact: true })).toHaveCount(2);
  await expect(alice.getByText("Your seven weeks")).toBeVisible();
  await expect(alice.getByText("W7", { exact: true })).toBeVisible();

  // Second game: characters kept, week 1 must start again (softlock regression).
  await host.getByRole("button", { name: "Play another week →" }).click();
  await expect(host.getByText("2 of 2 have chosen their lot")).toBeVisible({
    timeout: 30_000,
  });
  await beginGame(host);
  await expect(host.getByText("WEEK 1", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    host.getByText("Week 1 · Where is everyone going?"),
  ).toBeVisible({ timeout: 30_000 });

  await hostContext.close();
  await phoneAContext.close();
  await phoneBContext.close();
});

test("a phone refresh mid-storylet auto-rejoins and resumes the story", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const phoneContext = await browser.newContext();

  const host = await hostContext.newPage();
  await host.goto("/host");
  const code = await readRoomCode(host);

  const phone = await joinAsPhone(phoneContext, code, "Solo");
  await beginGame(host);

  await expect(phone.getByText("Week 1 · Where will you go?")).toBeVisible({
    timeout: 30_000,
  });
  await phone.getByRole("button", { name: /The Church/ }).click();

  // Pick an activity so there's an in-progress week to recover, then reload.
  await expect(phone.getByText(/What will you do here\?/)).toBeVisible({
    timeout: 30_000,
  });
  await phone.locator("main button:not([disabled])").first().click();
  await expect(
    phone.getByRole("button", { name: /Continue…|Sleep on it →/ }).or(
      phone.locator("main button:not([disabled])").first(),
    ),
  ).toBeVisible({ timeout: 30_000 });

  await phone.reload();

  // No tapping Join: the tab auto-rejoins and the saved week restores to the
  // same location and event.
  await expect(phone.getByText("The Church", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await playStorylet(phone);

  await expect(host.getByText("Around the fire, week 1")).toBeVisible({
    timeout: 30_000,
  });
  await expect(host.getByText("Solo")).toBeVisible({ timeout: 30_000 });

  await hostContext.close();
  await phoneContext.close();
});
