import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { SlackAPIClient } from "slack-web-api-client";
import { slackUser } from "../../db/schema";

export async function syncAllUsers(
	db: D1Database,
	adminToken: string,
): Promise<void> {
	const client = new SlackAPIClient(adminToken);
	let cursor: string | undefined;
	const users: {
		id: string;
		name: string;
		avatar: string;
		is_admin: boolean;
	}[] = [];

	do {
		// biome-ignore lint/suspicious/noExplicitAny: need to use any here for now
		const res: any = await client.users.list({ limit: 200, cursor });
		// biome-ignore lint/suspicious/noExplicitAny: need to use any here for now
		const members: any[] = res.members ?? [];
		for (const m of members) {
			if (m.deleted || m.is_bot || m.id === "USLACKBOT") continue;
			users.push({
				id: m.id,
				name:
					m.real_name ||
					m.profile?.real_name ||
					m.profile?.display_name ||
					m.name ||
					"",
				avatar: m.profile?.image_72 ?? "",
				is_admin: m.is_admin ?? false,
			});
		}
		cursor = res.response_metadata?.next_cursor || undefined;
	} while (cursor);

	const now = Math.floor(Date.now() / 1000);
	const chunkSize = 10;
	const drizzleDb = drizzle(db);
	for (let i = 0; i < users.length; i += chunkSize) {
		const chunk = users.slice(i, i + chunkSize);
		for (const u of chunk) {
			await drizzleDb
				.insert(slackUser)
				.values({
					userId: u.id,
					name: u.name,
					avatarUrl: u.avatar,
					isAdmin: u.is_admin ? 1 : 0,
					lastSynced: now,
					calendarToken: sql`hex(randomblob(16))`,
				})
				.onConflictDoUpdate({
					target: slackUser.userId,
					set: {
						name: u.name,
						avatarUrl: u.avatar,
						isAdmin: u.is_admin ? 1 : 0,
						lastSynced: now,
						calendarToken: sql`COALESCE(slack_user.calendar_token, hex(randomblob(16)))`,
					},
				})
				.run();
		}
	}
}
