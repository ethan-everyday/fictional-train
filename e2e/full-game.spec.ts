/**
 * The money test: a host screen and two phones play an ENTIRE seven-night
 * game to the epilogue, then start a second week (regression for the
 * once-guard softlock), all against the real built product served by
 * server.js — the exact thing a Steam player would run.
 */
import { test, expect, type Page, type BrowserContext } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function readRoomCode(host: Page): Promise<string> {
  const codeEl = host.locator("p.font-mono.text-8xl");
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
  await expect(phone.getByText(/You're in/)).toBeVisible();
  return phone;
}

/** Click through one storylet on a phone until the night is over. */
async function playStorylet(phone: Page): Promise<void> {
  // Wait until the choose screen has actually given way to the storylet,
  // so the click loop can't hit location buttons by mistake.
  await expect(phone.getByText(/Where will you go\?/)).toBeHidden({
    timeout: 30_000,
  });
  for (let i = 0; i < 40; i++) {
    if (await phone.getByText("Your night is over").isVisible().catch(() => false)) return;
    if (await phone.getByText("The night resolves").isVisible().catch(() => false)) return;

    const cont = phone.getByRole("button", { name: "Continue…" });
    if (await cont.isVisible().catch(() => false)) {
      await cont.click();
      continue;
    }
    const choice = phone.locator("main button:not([disabled])").first();
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
      continue;
    }
    await phone.waitForTimeout(250);
  }
  const content = await phone
    .locator("body")
    .innerText()
    .catch(() => "<unreadable>");
  throw new Error(`storylet never completed; phone shows:\n${content}`);
}

async function playNight(
  host: Page,
  phones: Page[],
  night: number,
): Promise<void> {
  // Title card, then the choose screen.
  await expect(host.getByText(`NIGHT ${night}`, { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    host.getByText(`Night ${night} · Where is everyone going?`),
  ).toBeVisible({ timeout: 30_000 });

  // Phones pick different locations (some may be closed by a drama event,
  // so pick the first open one from a per-phone preference list).
  const prefs = [
    ["The Tavern", "The Market", "The Church"],
    ["The Docks", "The Farms", "The Slums"],
  ];
  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];
    await expect(
      phone.getByText(`Night ${night} · Where will you go?`),
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

  // Everyone picked -> storylets begin at once.
  for (const phone of phones) {
    await playStorylet(phone);
  }

  // Resolve screen: skip the beat timer with the host button.
  await expect(host.getByText(`Night ${night} · What happened out there`)).toBeVisible({
    timeout: 30_000,
  });
  const advance =
    night >= 7
      ? host.getByRole("button", { name: "To the finale →" })
      : host.getByRole("button", { name: `On to night ${night + 1} →` });
  await advance.click();
}

test("two phones play a full seven-night game, then start a second week", async ({
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

  // Host sees both players in the lobby.
  await expect(host.getByText("2 players ready")).toBeVisible();
  await expect(host.getByText("Alice")).toBeVisible();
  await expect(host.getByText("Bob")).toBeVisible();

  await host.getByRole("button", { name: "BEGIN THE WEEK" }).click();

  for (let night = 1; night <= 7; night++) {
    await playNight(host, [alice, bob], night);
  }

  // Finale: ending text + voting.
  await expect(host.getByText("THE SEVENTH NIGHT ENDS")).toBeVisible({
    timeout: 30_000,
  });
  await expect(alice.getByText("The week is over")).toBeVisible();
  await alice.getByRole("button", { name: "Bob" }).click();
  await bob.getByRole("button", { name: "Alice" }).click();
  await expect(host.getByText("2/2 voted")).toBeVisible();

  await host.getByRole("button", { name: "END THE WEEK" }).click();

  // Epilogue: scoreboard + the full week recap for both players.
  await expect(host.getByText("SEVEN NIGHTS, SURVIVED")).toBeVisible();
  await expect(host.getByText("The week, night by night")).toBeVisible();
  // Both players finished all 7 nights -> two N7 entries in the recaps.
  await expect(host.getByText("N7", { exact: true })).toHaveCount(2);
  await expect(alice.getByText("Your week")).toBeVisible();
  await expect(alice.getByText("N7", { exact: true })).toBeVisible();

  // Second week: the lobby keeps the players and night 1 must start again
  // (regression: the one-shot transition guard used to softlock game two).
  await host.getByRole("button", { name: "Play another week →" }).click();
  await expect(host.getByText("2 players ready")).toBeVisible({
    timeout: 30_000,
  });
  await host.getByRole("button", { name: "BEGIN THE WEEK" }).click();
  await expect(host.getByText("NIGHT 1", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    host.getByText("Night 1 · Where is everyone going?"),
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
  await host.getByRole("button", { name: "BEGIN THE WEEK" }).click();

  await expect(phone.getByText("Night 1 · Where will you go?")).toBeVisible({
    timeout: 30_000,
  });
  await phone.getByRole("button", { name: /The Church/ }).click();

  // Enter the storylet, read the first beat, then pull the rug.
  const cont = phone.getByRole("button", { name: "Continue…" });
  await expect(cont).toBeVisible({ timeout: 30_000 });
  await cont.click();

  await phone.reload();

  // No tapping Join: the tab auto-rejoins and the ink save restores.
  await expect(phone.getByText("The Church", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await playStorylet(phone);

  // The night resolves on the host with Solo's outcome shown.
  await expect(host.getByText("Night 1 · What happened out there")).toBeVisible({
    timeout: 30_000,
  });
  await expect(host.getByText("Solo")).toBeVisible({ timeout: 30_000 });

  await hostContext.close();
  await phoneContext.close();
});
