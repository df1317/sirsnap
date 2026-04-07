import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export function PunchCard({ userId }: { userId?: string } = {}) {
	const [attendanceDates, setAttendanceDates] = useState<
		{ scheduled_at: number }[]
	>([]);

	useEffect(() => {
		api.getPunchcard(userId).then((res) => {
			setAttendanceDates(res);
		});
	}, [userId]);

	const counts = useMemo(() => {
		const map = new Map<string, number>();

		for (const m of attendanceDates) {
			const d = new Date(m.scheduled_at * 1000);
			const dayOfWeek = d.getDay();

			// Find the first occurrence of this dayOfWeek in the year
			const firstOfYear = new Date(d.getFullYear(), 0, 1);
			let offset = dayOfWeek - firstOfYear.getDay();
			if (offset < 0) offset += 7;

			const firstDayOfWeekDate = new Date(d.getFullYear(), 0, 1 + offset);

			// Use UTC to safely calculate week differences
			const utcCurrent = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
			const utcFirst = Date.UTC(
				firstDayOfWeekDate.getFullYear(),
				firstDayOfWeekDate.getMonth(),
				firstDayOfWeekDate.getDate(),
			);

			// Calculate exactly which week of the year this is for this specific day of the week
			const weekIndex = Math.round((utcCurrent - utcFirst) / (7 * 86400000));

			const key = `${weekIndex}-${dayOfWeek}`;
			map.set(key, (map.get(key) || 0) + 1);
		}
		return map;
	}, [attendanceDates]);

	const getPunchStyle = (count: number) => {
		if (count < 1) return { backgroundColor: "oklch(0.95 0.02 289.59)", width: "4px", height: "4px" };
		if (count < 2) return { backgroundColor: "oklch(0.80 0.08 289.59)", width: "6px", height: "6px" };
		if (count < 4) return { backgroundColor: "oklch(0.70 0.12 289.59)", width: "8px", height: "8px" };
		if (count < 8) return { backgroundColor: "oklch(0.60 0.16 289.59)", width: "10px", height: "10px" };
		return { backgroundColor: "oklch(0.50 0.20 289.59)", width: "12px", height: "12px" };
	};

	const getDayName = (dayIndex: number) => {
		return [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		][dayIndex];
	};

	// Calculate some cool stats
	const stats = useMemo(() => {
		if (attendanceDates.length === 0) return { streak: 0, busiestDay: "—", thisMonth: 0 };

		// Sort dates to calculate streak (ignoring time)
		const sortedDays = [...attendanceDates]
			.map(a => {
				const d = new Date(a.scheduled_at * 1000);
				return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
			})
			.sort((a, b) => b - a); // newest first

		// Unique days only
		const uniqueDays = [...new Set(sortedDays)];

		let streak = 0;
		const today = new Date();
		const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		const yesterdayTime = todayTime - 86400000;

		// Check if streak is active (attended today or yesterday)
		if (uniqueDays[0] === todayTime || uniqueDays[0] === yesterdayTime) {
			streak = 1;
			let currentCheck = uniqueDays[0];
			for (let i = 1; i < uniqueDays.length; i++) {
				if (uniqueDays[i] === currentCheck - 86400000) {
					streak++;
					currentCheck = uniqueDays[i];
				} else {
					break;
				}
			}
		}

		// Find busiest day of week
		const dayCounts = [0, 0, 0, 0, 0, 0, 0];
		for (const a of attendanceDates) {
			const d = new Date(a.scheduled_at * 1000);
			dayCounts[d.getDay()]++;
		}
		let maxDay = 0;
		let maxCount = dayCounts[0];
		for (let i = 1; i < 7; i++) {
			if (dayCounts[i] > maxCount) {
				maxCount = dayCounts[i];
				maxDay = i;
			}
		}

		// Calculate this month's attendance
		const currentMonth = today.getMonth();
		const currentYear = today.getFullYear();
		const thisMonth = attendanceDates.filter(a => {
			const d = new Date(a.scheduled_at * 1000);
			return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
		}).length;

		return {
			streak,
			busiestDay: maxCount > 0 ? getDayName(maxDay) : "—",
			thisMonth
		};
	}, [attendanceDates, getDayName]);

	return (
		<div className="flex flex-col gap-6 rounded-lg border bg-card p-6 text-card-foreground">
			<div className="flex items-end justify-between">
				<h3 className="font-semibold text-[13px] text-muted-foreground uppercase tracking-wider">
					Punch Card
				</h3>
				<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
					<span>Less</span>
					<div className="flex size-3 items-center justify-center">
						<div className="aspect-square rounded-full" style={getPunchStyle(0)} />
					</div>
					<div className="flex size-3 items-center justify-center">
						<div className="aspect-square rounded-full" style={getPunchStyle(1)} />
					</div>
					<div className="flex size-3 items-center justify-center">
						<div className="aspect-square rounded-full" style={getPunchStyle(2)} />
					</div>
					<div className="flex size-3 items-center justify-center">
						<div className="aspect-square rounded-full" style={getPunchStyle(4)} />
					</div>
					<div className="flex size-3 items-center justify-center">
						<div className="aspect-square rounded-full" style={getPunchStyle(8)} />
					</div>
					<span>More</span>
				</div>
			</div>

			<div className="flex flex-col gap-8 lg:flex-row">
				<div className="flex flex-1 flex-col gap-4 overflow-hidden">
					<div 
						className="grid gap-1"
						style={{ gridTemplateColumns: "repeat(auto-fill, minmax(12px, 1fr))" }}
					>
						{Array.from({ length: 364 }).map((_, i) => {
							const weekIndex = Math.floor(i / 7);
							const dayOfWeek = i % 7;
							const count = counts.get(`${weekIndex}-${dayOfWeek}`) || 0;
							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: it's a fixed grid
									key={i}
									className="flex aspect-square items-center justify-center"
									title={`${count} attendance${count === 1 ? "" : "s"} on ${getDayName(dayOfWeek)}s during week ${weekIndex + 1}`}
								>
									<div
										className="rounded-full transition-all duration-300"
										style={getPunchStyle(count)}
									/>
								</div>
							);
						})}
					</div>
				</div>

				<div className="flex shrink-0 flex-col justify-center gap-4 border-t pt-8 lg:w-48 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
					<div className="flex flex-row justify-between gap-4 text-sm lg:flex-col">
						<div className="space-y-1">
							<span className="block font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Total Attendances
							</span>
							<div className="font-mono font-semibold text-2xl">
								{attendanceDates.length}
							</div>
						</div>

						<div className="space-y-1">
							<span className="block font-medium text-muted-foreground text-xs uppercase tracking-wider">
								This Month
							</span>
							<div className="font-mono font-semibold text-2xl">
								{stats.thisMonth}
							</div>
						</div>
						
						<div className="space-y-1">
							<span className="block font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Busiest Day
							</span>
							<div className="font-medium text-lg">
								{stats.busiestDay}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
