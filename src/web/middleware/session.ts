import { and, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { slackUser, webSession } from "../../db/schema";
import type { Env } from "../../index";

export type Session = {
	user_id: string;
	name: string;
	avatar_url: string;
	is_admin: number;
	role: string | null;
	calendar_token: string | null;
};

type Variables = { session: Session | null };

export const sessionMiddleware = createMiddleware<{
	Bindings: Env;
	Variables: Variables;
}>(async (c, next) => {
	const token = getCookie(c, "session");
	if (token) {
		const now = Math.floor(Date.now() / 1000);
		const db = drizzle(c.env.DB);
		const rows = await db
			.select({
				user_id: slackUser.userId,
				name: slackUser.name,
				avatar_url: slackUser.avatarUrl,
				is_admin: slackUser.isAdmin,
				role: slackUser.role,
				calendar_token: slackUser.calendarToken,
			})
			.from(webSession)
			.innerJoin(slackUser, eq(webSession.userId, slackUser.userId))
			.where(and(eq(webSession.id, token), gt(webSession.expiresAt, now)));

		c.set("session", rows.length > 0 ? rows[0] : null);
	} else {
		c.set("session", null);
	}
	await next();
});

export function requireSession() {
	return createMiddleware<{ Bindings: Env; Variables: Variables }>(
		async (c, next) => {
			if (!c.get("session")) return c.json({ error: "Unauthorized" }, 401);
			await next();
		},
	);
}

export function requireAdmin() {
	return createMiddleware<{ Bindings: Env; Variables: Variables }>(
		async (c, next) => {
			const session = c.get("session");
			if (!session) return c.json({ error: "Unauthorized" }, 401);
			if (!session.is_admin) return c.json({ error: "Forbidden" }, 403);
			await next();
		},
	);
}
