/**
 * End-to-end walkthrough of the core story, through the real UI:
 *   Dexter puts 3 experiences in one gift, pays only for the most expensive,
 *   Yashar receives a 14-character code, chooses one, books it, and later
 *   uses the leftover balance (with a top-up) for something bigger.
 *
 * Usage:  npm run dev   (in another terminal, test-payment mode)
 *         npm run e2e   (BASE_URL=http://localhost:3000 by default)
 * Screenshots are written to ./e2e-screenshots.
 */
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "e2e-screenshots";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "cadeau-admin";
mkdirSync(OUT, { recursive: true });

const inDays = (n) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);
let step = 0;
async function shot(page, name, fullPage = false) {
  step += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${String(step).padStart(2, "0")}-${name}.png`, fullPage });
}
function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
  console.log(`  ✓ ${msg}`);
}
const money = (s) => Number(String(s).replace(/[^\d.]/g, ""));

const browser = await chromium.launch();
try {
  /* ----------------------------------------------------------- Dexter */
  console.log("Dexter builds a gift");
  const dexter = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  const watch = (page) => {
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      // Ignore the dev server's HMR socket noise; fail on real app errors.
      if (m.type() === "error" && !/webpack-hmr|_next\/webpack|Failed to load resource/.test(m.text())) errors.push(m.text());
    });
  };
  watch(dexter);

  await dexter.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shot(dexter, "home");

  const addFromPage = async (slug, optionLabel) => {
    await dexter.goto(`${BASE}/experiences/${slug}`, { waitUntil: "networkidle" });
    if (optionLabel) await dexter.locator("fieldset label", { hasText: optionLabel }).first().click();
    await dexter.locator("button:visible", { hasText: "Add to gift" }).first().click();
    await dexter.getByRole("dialog", { name: "Your gift" }).waitFor();
  };
  await addFromPage("lakeside-dinner-with-a-view");
  await shot(dexter, "experience-added-drawer");
  await dexter.keyboard.press("Escape");
  await addFromPage("comedy-night-for-two");
  await dexter.keyboard.press("Escape");
  await addFromPage("pottery-wheel-workshop", "For two");
  await shot(dexter, "drawer-three-items");

  await dexter.goto(`${BASE}/gift-box`, { waitUntil: "networkidle" });
  await dexter.getByText("Gift value").waitFor();
  const value = money(await dexter.locator("aside p.font-display").first().textContent());
  assert(value === 240, `gift value is the most expensive experience ($240), got $${value}`);
  await shot(dexter, "gift-box");

  await dexter.getByRole("link", { name: /Choose packaging/ }).click();
  await dexter.waitForURL("**/checkout");
  await dexter.getByRole("button", { name: /E-certificate/ }).click();
  await shot(dexter, "checkout-packaging");
  await dexter.getByRole("button", { name: /Continue/ }).click();

  await dexter.getByLabel("First name", { exact: true }).fill("Dexter");
  await dexter.getByLabel("Last name", { exact: true }).fill("Morgan");
  await dexter.getByLabel("Email", { exact: true }).fill("dexter@example.com");
  await dexter.getByLabel("Phone", { exact: true }).fill("416 555 0101");
  await dexter.getByRole("button", { name: /Continue/ }).click();

  await dexter.getByLabel("Recipient's name").fill("Yashar");
  await dexter.getByLabel("Your message (optional)").fill("Happy birthday, brother! Pick the one that sounds like the best night out.");
  await dexter.getByLabel("Recipient's email").fill("yashar@example.com");
  await shot(dexter, "checkout-recipient");
  await dexter.getByRole("button", { name: /Continue/ }).click();

  await dexter.getByRole("checkbox").check();
  await shot(dexter, "checkout-review");
  await dexter.getByRole("button", { name: /Pay \$240/ }).click();
  await dexter.waitForURL("**/pay/test**");
  await shot(dexter, "test-payment");
  await dexter.getByRole("button", { name: /Pay \$240/ }).click();
  await dexter.waitForURL("**/order/**");
  await dexter.getByText("Your gift is ready").waitFor();
  const formatted = (await dexter.locator("p.font-mono").first().textContent()).trim();
  const code = formatted.replace(/-/g, "");
  assert(/^[0-9A-HJKMNP-TV-Z]{14}$/.test(code), `order issued a 14-character code (${formatted})`);
  await shot(dexter, "order-confirmation");

  await dexter.goto(`${BASE}/certificate/${code}`, { waitUntil: "networkidle" });
  await shot(dexter, "certificate", true);

  /* ----------------------------------------------------------- Yashar */
  console.log("Yashar redeems the gift");
  const yashar = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
  watch(yashar);
  await yashar.goto(`${BASE}/redeem`, { waitUntil: "networkidle" });
  await yashar.getByLabel("Your 14-character gift code").fill(formatted.toLowerCase());
  await shot(yashar, "redeem-enter-code");
  await yashar.getByRole("button", { name: /Continue/ }).click();
  await yashar.waitForURL(`**/redeem/${code}`);
  await yashar.getByText("Pick one of 3").waitFor();
  await shot(yashar, "redeem-dashboard");
  await shot(yashar, "redeem-dashboard-full", true);

  await yashar.locator("article", { hasText: "Comedy Night Out" }).getByRole("link", { name: /Choose this/ }).click();
  await yashar.waitForURL("**/choose/**");
  await yashar.getByLabel("First choice — date").fill(inDays(10));
  await yashar.getByLabel("Last name", { exact: true }).fill("Morgan");
  await yashar.getByLabel("Email", { exact: true }).fill("yashar@example.com");
  await yashar.getByLabel("Phone", { exact: true }).fill("416 555 0102");
  await yashar.getByRole("checkbox").check();
  await shot(yashar, "booking-form", true);
  await yashar.getByRole("button", { name: /Request this booking/ }).click();
  await yashar.waitForURL("**/booking/**");
  await yashar.getByText("Your request is in").waitFor();
  const bookingUrl = yashar.url();
  await shot(yashar, "booking-requested");

  /* ------------------------------------------------------------ Admin */
  console.log("The team confirms the booking");
  const admin = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  watch(admin);
  await admin.goto(`${BASE}/admin/login`);
  await admin.getByLabel("Password").fill(ADMIN_PASSWORD);
  await admin.getByRole("button", { name: /Sign in/ }).click();
  await admin.waitForURL(`${BASE}/admin`);
  await shot(admin, "admin-dashboard");
  await admin.goto(`${BASE}/admin/bookings`);
  const card = admin.locator("div", { hasText: "Comedy Night Out" }).filter({ has: admin.getByRole("button", { name: /Confirm & email/ }) }).last();
  await shot(admin, "admin-bookings");
  await card.getByRole("button", { name: /Confirm & email/ }).click();
  // The confirmed booking leaves the "To confirm" list once the action has been saved.
  await card.waitFor({ state: "detached" });

  let confirmed = false;
  for (let attempt = 0; attempt < 5 && !confirmed; attempt++) {
    await yashar.goto(bookingUrl, { waitUntil: "networkidle" });
    confirmed = await yashar.getByText("You're booked").isVisible();
    if (!confirmed) await yashar.waitForTimeout(1000);
  }
  assert(confirmed, "Yashar sees the booking confirmed");
  await shot(yashar, "booking-confirmed");

  /* ------------------------------------- leftover balance + top-up */
  console.log("Yashar uses the leftover balance for something bigger");
  await yashar.goto(`${BASE}/redeem/${code}`, { waitUntil: "networkidle" });
  const balanceText = await yashar.locator("p.font-display.text-5xl").first().textContent();
  assert(money(balanceText) === 150, `remaining balance is $150 (240 − 90), got ${balanceText}`);
  await yashar.goto(`${BASE}/redeem/${code}/choose/hot-air-balloon-flight`, { waitUntil: "networkidle" });
  await yashar.getByLabel("First choice — date").fill(inDays(20));
  await yashar.getByLabel("Last name", { exact: true }).fill("Morgan");
  await yashar.getByLabel("Email", { exact: true }).fill("yashar@example.com");
  await yashar.getByLabel("Phone", { exact: true }).fill("416 555 0102");
  await yashar.getByRole("checkbox").check();
  await yashar.getByRole("button", { name: /Pay the difference/ }).click();
  await yashar.waitForURL("**/pay/test**");
  await shot(yashar, "top-up-payment");
  await yashar.getByRole("button", { name: /Pay \$195/ }).click();
  await yashar.waitForURL("**/booking/**");
  await yashar.getByText("Your request is in").waitFor();
  await shot(yashar, "top-up-booking-requested");

  await admin.goto(`${BASE}/admin/emails`);
  await shot(admin, "admin-emails");
  await admin.locator("a", { hasText: "sent you a Cadeau" }).first().click();
  await admin.waitForURL("**/admin/emails/**");
  await shot(admin, "email-certificate-preview");

  assert(errors.length === 0, `no browser errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  console.log(`\nAll good. Screenshots in ${OUT}/`);
} finally {
  await browser.close();
}
