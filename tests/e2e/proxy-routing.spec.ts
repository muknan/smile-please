import { expect, test } from "@playwright/test";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "../../proxy";

test("remote auth proxy only runs for protected route families", () => {
  for (const url of ["/", "/about", "/care", "/care/dentists", "/learn", "/contact"]) {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), url).toBe(false);
  }

  for (const url of ["/account", "/account/export", "/admin", "/admin/articles", "/dentist/availability"]) {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), url).toBe(true);
  }
});
